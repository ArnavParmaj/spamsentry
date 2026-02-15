# SpamSentry 🛡️

AI-powered spam detection application with a neo-brutalist design aesthetic.

## 🚀 Features

- **Real-time Spam Detection**: Analyze messages using ML-powered API
- **User Authentication**: Secure login/signup via Supabase
- **Scan History**: Track and review all your scans
- **Neo-Brutalist UI**: Bold, modern interface design
- **Cross-platform**: Works on desktop and mobile

## 📁 Project Structure

```
SpamDetection/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/     # Login, Signup, Scanner, Dashboard
│   │   └── lib/       # Supabase client
│   └── .env.example   # Environment template
│
└── ml_service/        # FastAPI ML service
    ├── main.py        # Prediction endpoint
    └── requirements.txt
```

## 🛠️ Tech Stack

### Frontend

- **React** + **TypeScript**
- **Vite** (build tool)
- **Supabase** (auth & database)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **Axios** (API calls)

### Backend

- **FastAPI** (Python web framework)
- **Uvicorn** (ASGI server)
- **Scikit-learn** (ML - future integration)

## 📦 Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### Backend Setup

```bash
cd ml_service
pip install -r requirements.txt
python main.py
```

## 🔐 Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**⚠️ NEVER commit your `.env` file!**

## 🗄️ Database Setup

1. Go to your Supabase project
2. Run the SQL in `frontend/database_schema.sql`
3. This creates the `history` table with RLS policies

## 🚀 Running the App

1. **Start Frontend**:

   ```bash
   cd frontend && npm run dev
   # Runs on http://localhost:5174
   ```

2. **Start ML API**:

   ```bash
   cd ml_service && python main.py
   # Runs on http://localhost:8000
   ```

3. **Access the app** at http://localhost:5174

## 🧪 Testing

1. Create an account or login
2. Navigate to Scanner
3. Test with spam text: "URGENT! Click here to claim your FREE prize!"
4. Check Dashboard for history

## 📝 API Documentation

FastAPI auto-generates docs at: http://localhost:8000/docs

### Endpoint: POST /api/predict

**Request:**

```json
{
  "text": "Your message here"
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

## 🎨 Design

- **Style**: Neo-brutalism
- **Colors**: Yellow (#FCFF00), Blue (#0051FF), Pink (#FF00F5)
- **Fonts**: Space Grotesk, Lexend Mega, IBM Plex Mono

## 🔮 Future Enhancements

- [ ] Train & integrate real ML model
- [ ] Add batch scanning
- [ ] Export scan history
- [ ] Email notifications
- [ ] Mobile app

## 📄 License

MIT

## 👤 Author

Arnav Parmaj

---

**Built with ❤️ using React, FastAPI, and Supabase**
