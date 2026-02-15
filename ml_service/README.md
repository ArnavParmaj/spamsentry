# SpamSentry ML Service

FastAPI-based machine learning service for spam detection.

## Setup

### 1. Create Virtual Environment (Optional but Recommended)

```bash
cd ml_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --port 5000
```

The API will be available at: **http://localhost:5000**

## API Endpoints

### Health Check

```bash
GET /
GET /health
```

### Predict Spam

```bash
POST /api/predict
Content-Type: application/json

{
  "text": "URGENT: Your account will be suspended. Click here now!"
}
```

**Response:**

```json
{
  "prediction": "SPAM",
  "confidence": 0.85,
  "is_spam": true
}
```

## Testing

### Using curl

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you doing today?"}'
```

### Using the Frontend

The React frontend at `http://localhost:5174` will automatically call this API when you click "Analyze" in the Scanner.

## Current Implementation

**Dummy Logic (Keyword-Based)**:

- Checks for spam keywords: 'urgent', 'click here', 'winner', 'free', etc.
- If 2+ keywords found → SPAM
- Otherwise → HAM (not spam)
- Confidence based on keyword count + randomness

## Next Steps

1. Replace dummy logic with actual ML model (scikit-learn, TensorFlow, etc.)
2. Load pre-trained model on startup
3. Add model versioning
4. Add request validation and error handling
5. Add rate limiting for production
