
# Sentinel-AI Self-Hosted FastAPI MVP

This project runs a self-hosted pipeline for:
- NER (spaCy + regex) for sensitive tokens (PHI/PII/financial).
- Rule-based redaction.
- Local generation using `google/flan-t5-small` (no external API keys).

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

2. Install requirements:
```bash
pip install -r requirements.txt
```

3. Download spaCy model:
```bash
python -m spacy download en_core_web_sm
```

4. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. Test:
```bash
curl -X POST "http://127.0.0.1:8000/analyze" -H "Content-Type: application/json" -d '{"prompt":"Patient Ramesh Kumar MRN 123456, card 4111 1111 1111 1111, email ramesh@example.com"}'
```

Notes:
- The first run will download the `flan-t5-small` weights (~200-300MB).
- For production or heavy load, use GPU or a hosted inference solution.
