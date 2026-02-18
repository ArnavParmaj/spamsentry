#!/bin/bash

# SpamSentry - Start All Servers (with Python venv)
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/ml_service/.venv"
# Use Python 3.12 (compatible with all dependencies). Falls back to python3 if not found.
PYTHON_BIN="$(which python3.12 2>/dev/null || which python3)"

echo "🚀 Starting SpamSentry..."
echo ""

# ── 1. Python virtual environment ─────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "🐍 Creating Python virtual environment ($(${PYTHON_BIN} --version))..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
    echo "   ✓ venv created at ml_service/.venv"
else
    echo "🐍 Using existing virtual environment at ml_service/.venv"
fi

echo "📦 Installing/updating Python dependencies..."
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/ml_service/requirements.txt"
echo "   ✓ Dependencies ready"
echo ""

# ── 2. Frontend (React + Vite) ────────────────────────────────────────────────
echo "🖥️  Starting Frontend on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Give Vite a moment to bind
sleep 2

# ── 3. ML Backend (FastAPI + uvicorn inside venv) ─────────────────────────────
echo "🤖 Starting ML API on http://localhost:8000..."
cd "$ROOT_DIR/ml_service"
"$VENV_DIR/bin/python" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

sleep 2

# ── 4. Save PIDs ──────────────────────────────────────────────────────────────
echo "$FRONTEND_PID" > "$ROOT_DIR/.pids"
echo "$BACKEND_PID"  >> "$ROOT_DIR/.pids"

echo ""
echo "✅ SpamSentry is running!"
echo "   Frontend : http://localhost:5173"
echo "   ML API   : http://localhost:8000"
echo "   API Docs : http://localhost:8000/docs"
echo ""
echo "📄 Logs:"
echo "   Frontend : $ROOT_DIR/frontend.log"
echo "   Backend  : $ROOT_DIR/backend.log"
echo ""
echo "To stop all servers, run: ./stop.sh"
