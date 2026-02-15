from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

# Initialize FastAPI
app = FastAPI(
    title="SpamSentry ML API",
    description="Machine Learning API for spam detection",
    version="1.0.0"
)

# Configure CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with ["http://localhost:5174"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class TextRequest(BaseModel):
    text: str

# Response model
class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    is_spam: bool

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "SpamSentry ML API",
        "version": "1.0.0"
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: TextRequest):
    """
    Predict if text is spam or ham (not spam).
    
    Currently using dummy logic for testing.
    Will be replaced with actual ML model later.
    """
    text = request.text
    
    # Print to console for debugging
    print(f"Received text: {text[:100]}...")  # Print first 100 chars
    
    # Dummy prediction logic
    # Check for spam keywords (temporary until real model is loaded)
    spam_keywords = ['urgent', 'click here', 'winner', 'free', 'offer', 'prize', 
                     'suspended', 'verify', 'account', 'immediately', 'click']
    
    text_lower = text.lower()
    spam_score = sum(1 for keyword in spam_keywords if keyword in text_lower)
    
    # Simple heuristic: if 2+ spam keywords, classify as spam
    is_spam = spam_score >= 2
    
    # Generate confidence (add some randomness for realism)
    if is_spam:
        confidence = min(0.95, 0.7 + (spam_score * 0.1) + random.uniform(0, 0.1))
        prediction = "SPAM"
    else:
        confidence = min(0.95, 0.6 + random.uniform(0.1, 0.3))
        prediction = "HAM"
    
    response = PredictionResponse(
        prediction=prediction,
        confidence=round(confidence, 2),
        is_spam=is_spam
    )
    
    print(f"Prediction: {response.prediction} (confidence: {response.confidence})")
    
    return response

@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
