from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import joblib
import os

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SpamSentry ML API",
    description="Machine Learning API for spam detection (Email / URL / SMS)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model registry ─────────────────────────────────────────────────────────────
MODEL_FILES = {
    "email": ("email_vectorizer.pkl", "email_model.pkl"),
    "url":   ("url_vectorizer.pkl",   "url_model.pkl"),
    "sms":   ("sms_vectorizer.pkl",   "sms_model.pkl"),
}

models: dict = {}   # { "email": {"vectorizer": ..., "model": ...}, ... }


def load_models():
    """Load all available models at startup."""
    for key, (vec_file, mdl_file) in MODEL_FILES.items():
        vec_path = os.path.join(MODELS_DIR, vec_file)
        mdl_path = os.path.join(MODELS_DIR, mdl_file)
        if os.path.exists(vec_path) and os.path.exists(mdl_path):
            try:
                models[key] = {
                    "vectorizer": joblib.load(vec_path),
                    "model":      joblib.load(mdl_path),
                }
                print(f"[SpamSentry] ✓ Loaded {key} model")
            except Exception as e:
                print(f"[SpamSentry] ✗ Failed to load {key} model: {e}")
        else:
            print(f"[SpamSentry] ⚠  {key} model files not found — skipping")


@app.on_event("startup")
async def startup_event():
    load_models()
    if not models:
        print("[SpamSentry] WARNING: No models loaded. Place .pkl files in ml_service/models/")


# ── Schemas ────────────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str
    model_type: Literal["email", "url", "sms"] = "sms"


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    is_spam: bool
    model_type: str


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "SpamSentry ML API",
        "version": "2.0.0",
        "loaded_models": list(models.keys()),
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "loaded_models": list(models.keys())}


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: TextRequest):
    """
    Predict if text is spam or ham using the selected model type.
    model_type: 'email' | 'url' | 'sms'
    """
    model_key = request.model_type.lower()

    if model_key not in models:
        raise HTTPException(
            status_code=503,
            detail=f"Model '{model_key}' is not loaded. "
                   f"Ensure {model_key}_model.pkl and {model_key}_vectorizer.pkl "
                   f"exist in ml_service/models/",
        )

    text = request.text
    print(f"[SpamSentry] Analyzing ({model_key}): {text[:80]}...")

    vectorizer = models[model_key]["vectorizer"]
    model      = models[model_key]["model"]

    # Vectorize and predict
    X = vectorizer.transform([text])
    prediction_label = model.predict(X)[0]

    # Confidence — use predict_proba if available, else decision_function
    try:
        proba = model.predict_proba(X)[0]
        confidence = float(max(proba))
    except AttributeError:
        try:
            score = model.decision_function(X)[0]
            # Sigmoid-like normalisation for SVM decision scores
            import math
            confidence = float(1 / (1 + math.exp(-abs(score))))
        except Exception:
            confidence = 0.85  # fallback

    # Normalise label
    label_str = str(prediction_label).strip().upper()
    is_spam = label_str in ("SPAM", "1", "TRUE", "YES")
    prediction_str = "SPAM" if is_spam else "HAM"

    response = PredictionResponse(
        prediction=prediction_str,
        confidence=round(confidence, 4),
        is_spam=is_spam,
        model_type=model_key,
    )
    print(f"[SpamSentry] Result: {response.prediction} ({response.confidence:.1%}) via {model_key}")
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
