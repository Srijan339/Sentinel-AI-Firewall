
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import spacy
import re
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

load_dotenv()
app = FastAPI(title="Sentinel-AI Self-Hosted MVP")

# Load spaCy model (ensure en_core_web_sm is installed)
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    raise RuntimeError("spaCy model not found. Run: python -m spacy download en_core_web_sm") from e

# Regex patterns
CARD_RE = re.compile(r'\b(?:\d[ -]*?){13,19}\b')
PAN_RE = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b')
AADHAAR_RE = re.compile(r'\b\d{12}\b')
PHONE_RE = re.compile(r'\b(?:\+91[\-\s]?|0)?[6-9]\d{9}\b')
EMAIL_RE = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
SSN_RE = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

patterns = [
    ("CARD", CARD_RE),
    ("PAN", PAN_RE),
    ("AADHAAR", AADHAAR_RE),
    ("PHONE", PHONE_RE),
    ("EMAIL", EMAIL_RE),
    ("SSN", SSN_RE)
]

def find_entities(text):
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
    for s,e,l,v in ents:
        key = (s,e,l,v)
        if key not in seen:
            seen.add(key)
            clean.append((s,e,l,v))
    return sorted(clean, key=lambda x: x[0])

def redact_text(text, ents):
    s = text
    for i,(start,end,label,val) in enumerate(sorted(ents, key=lambda x:x[0], reverse=True)):
        placeholder = f"[{label}_{i}]"
        s = s[:start] + placeholder + s[end:]
    return s

# Load local flan-t5-small generator (with fallback for stability)
_model_loaded = False
tokenizer = None
model = None

try:
    print("Loading transformers model...")
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
    model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")
    _model_loaded = True
    print("Model loaded successfully")
except Exception as e:
    print(f"Warning: Failed to load model: {e}. Using mock responses.")
    _model_loaded = False

def generate_local(prompt):
    if not _model_loaded:
        # Return safe mock response for testing
        return f"[MOCK RESPONSE] This is a safe response based on the redacted input."
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True)
        outputs = model.generate(
            **inputs, max_new_tokens=150, do_sample=False
        )
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as e:
        return f"[SAFE RESPONSE] Error: {str(e)}"

class Prompt(BaseModel):
    prompt: str

@app.post("/analyze")
def analyze(p: Prompt):
    text = p.prompt
    ents = find_entities(text)

    labels = [e[2] for e in ents]
    if any(l in ("CARD","PAN","AADHAAR","SSN") for l in labels):
        risk = "HIGH"
    elif any(l in ("PHONE","EMAIL") for l in labels):
        risk = "MEDIUM"
    else:
        risk = "LOW"

    redacted = redact_text(text, ents) if risk != "LOW" else text

    system_prompt = (
        "You are a strict security assistant. "
        "Never reveal personal data. Only provide safe, generic guidance. "
        f"User Input (Redacted): {redacted}"
    )
    safe_output = generate_local(system_prompt)

    # double-check and mask any original tokens in output
    for (_,_,_,val) in ents:
        if val in safe_output:
            safe_output = safe_output.replace(val,"[REDACTED]")

    return {
        "original": text,
        "risk": risk,
        "redacted_prompt": redacted,
        "entities": [{"start": s, "end": e, "label": l, "text": t} for s,e,l,t in ents],
        "safe_response": safe_output
    }
