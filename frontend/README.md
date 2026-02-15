# SpamSentry Frontend

A React + TypeScript frontend for the SpamSentry spam detection application, built with Vite and Supabase.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Custom CSS with Neo-Brutalist design system
- **Authentication & Database**: Supabase
- **Animation**: Framer Motion
- **Icons**: Lucide React + Material Icons
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: Get your Supabase credentials from your [Supabase Dashboard](https://app.supabase.com)

### 3. Set Up Supabase Database

Create the following table in your Supabase project:

```sql
CREATE TABLE history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  result TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  is_spam BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own history
CREATE POLICY "Users can view their own history"
  ON history FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own history
CREATE POLICY "Users can insert their own history"
  ON history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own history
CREATE POLICY "Users can delete their own history"
  ON history FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts    # Supabase initialization
│   ├── pages/
│   │   ├── Login.tsx            # Login page with auth
│   │   ├── Signup.tsx           # Signup page with auth
│   │   ├── Scanner.tsx          # Main scanner interface
│   │   └── Dashboard.tsx        # Scan history dashboard
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles (neo-brutalist)
├── .env                         # Environment variables
└── package.json
```

## Features

### Authentication

- ✅ Email/Password signup and login
- ✅ Google OAuth integration
- ✅ Protected routes
- ✅ Automatic redirect on auth state change

### Scanner

- ✅ Text input with character counter
- ✅ Integration with Python ML API (via axios)
- ✅ Real-time analysis results
- ✅ Save scans to Supabase history
- ✅ Neo-brutalist UI design

### Dashboard

- ✅ View all scan history
- ✅ Filter by user
- ✅ Delete individual scans
- ✅ Display spam confidence scores

## Next Steps

1. **Set up Python ML API**: Create the backend ML service that Scanner will call
2. **Configure Supabase**: Add your project URL and anon key to `.env`
3. **Enable Google Auth** (optional): Configure OAuth in Supabase dashboard
4. **Deploy**: Build and deploy to your hosting platform

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Notes

- The Scanner component expects a Python ML API at `http://localhost:5000/api/predict`
- Update the API endpoint in `Scanner.tsx` when your ML service is ready
- The app uses Supabase Row Level Security to ensure users can only see their own history
