
from fastapi import FastAPI
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import spacy
import re
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from typing import List, Tuple

load_dotenv()
app = FastAPI(title="Sentinel-AI Self-Hosted MVP")

# Load spaCy model (ensure en_core_web_sm is installed)
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    raise RuntimeError("spaCy model not found. Run: python -m spacy download en_core_web_sm") from e

# Regex patterns for common PII
CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
AADHAAR_RE = re.compile(r"\b\d{12}\b")
PHONE_RE = re.compile(r"\b(?:\+91[\-\s]?|0)?[6-9]\d{9}\b")
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

patterns = [
    ("CARD", CARD_RE),
    ("PAN", PAN_RE),
    ("AADHAAR", AADHAAR_RE),
    ("PHONE", PHONE_RE),
    ("EMAIL", EMAIL_RE),
    ("SSN", SSN_RE),
]


def find_entities(text: str) -> List[Tuple[int, int, str, str]]:
    ents = []
    # regex detections
    for label, pattern in patterns:
        for m in pattern.finditer(text):
            ents.append((m.start(), m.end(), label, m.group()))
    # spaCy NER
    doc = nlp(text)
    for ent in doc.ents:
        label = "PATIENT_NAME" if ent.label_ == "PERSON" else ent.label_
        ents.append((ent.start_char, ent.end_char, label, ent.text))
    # remove duplicates and sort
    seen = set()
    clean = []
    for s, e, l, v in ents:
        key = (s, e, l, v)
        if key not in seen:
            seen.add(key)
            clean.append((s, e, l, v))
    return sorted(clean, key=lambda x: x[0])


def redact_text(text: str, ents: List[Tuple[int, int, str, str]]) -> str:
    s = text
    for i, (start, end, label, val) in enumerate(sorted(ents, key=lambda x: x[0], reverse=True)):
        placeholder = f"[{label}_{i}]"
        s = s[:start] + placeholder + s[end:]
    return s


# Globals for model
MODEL_NAME = os.getenv("SENTINEL_MODEL", "google/flan-t5-small")
tokenizer = None
model = None
device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")


@app.on_event("startup")
def startup_event():
    global tokenizer, model
    try:
        print(f"Loading model {MODEL_NAME} on device {device}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        model.to(device)
        print("Model loaded successfully")
    except Exception as e:
        # keep tokenizer/model as None and return mock responses later
        print(f"Warning: Failed to load model {MODEL_NAME}: {e}")


def local_generate(prompt: str, max_new_tokens: int = 150) -> str:
    """Generate text using the locally loaded model; falls back to a safe mock response."""
    global tokenizer, model
    if tokenizer is None or model is None:
        return "[MOCK RESPONSE] Local model not available. Install model or check logs."
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(device)
        outputs = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=False)
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as e:
        return f"[SAFE RESPONSE] Error during generation: {str(e)}"


class Prompt(BaseModel):
    prompt: str


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": (model is not None)}


@app.post("/generate")
def generate(p: Prompt):
    """Return model generation for a raw prompt (useful for testing the local model)."""
    out = local_generate(p.prompt)
    return {"prompt": p.prompt, "output": out}


@app.post("/analyze")
def analyze(p: Prompt):
    text = p.prompt
    ents = find_entities(text)

    labels = [e[2] for e in ents]
    if any(l in ("CARD", "PAN", "AADHAAR", "SSN") for l in labels):
        risk = "HIGH"
    elif any(l in ("PHONE", "EMAIL") for l in labels):
        risk = "MEDIUM"
    else:
        risk = "LOW"

    redacted = redact_text(text, ents) if risk != "LOW" else text

    system_prompt = (
        "You are a strict security assistant. "
        "Never reveal personal data. Only provide safe, generic guidance. "
        f"User Input (Redacted): {redacted}"
    )

    safe_output = local_generate(system_prompt)

    # double-check and mask any original tokens in output
    for (_, _, _, val) in ents:
        if val in safe_output:
            safe_output = safe_output.replace(val, "[REDACTED]")

    return {
        "original": text,
        "risk": risk,
        "redacted_prompt": redacted,
        "entities": [{"start": s, "end": e, "label": l, "text": t} for s, e, l, t in ents],
        "safe_response": safe_output,
    }
