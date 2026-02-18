#!/bin/bash

# SpamSentry - Stop All Servers
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🛑 Stopping SpamSentry servers..."
echo ""

# ── Method 1: Kill using saved PIDs ───────────────────────────────────────────
if [ -f "$ROOT_DIR/.pids" ]; then
    echo "📝 Stopping saved processes..."
    while IFS= read -r pid; do
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            echo "   Killing PID $pid"
            kill "$pid" 2>/dev/null
        fi
    done < "$ROOT_DIR/.pids"
    rm -f "$ROOT_DIR/.pids"
fi

# ── Method 2: Sweep for any stragglers ────────────────────────────────────────
echo "🔍 Sweeping for remaining processes..."

# Kill Vite dev server
VITE_PIDS=$(pgrep -f "vite" 2>/dev/null)
if [ -n "$VITE_PIDS" ]; then
    echo "   Stopping Vite (PIDs: $VITE_PIDS)"
    echo "$VITE_PIDS" | xargs kill 2>/dev/null
fi

# Kill uvicorn (venv or system)
UVICORN_PIDS=$(pgrep -f "uvicorn main:app" 2>/dev/null)
if [ -n "$UVICORN_PIDS" ]; then
    echo "   Stopping uvicorn (PIDs: $UVICORN_PIDS)"
    echo "$UVICORN_PIDS" | xargs kill 2>/dev/null
fi

# Kill any leftover python main.py
PYTHON_PIDS=$(pgrep -f "python.*main.py" 2>/dev/null)
if [ -n "$PYTHON_PIDS" ]; then
    echo "   Stopping Python processes (PIDs: $PYTHON_PIDS)"
    echo "$PYTHON_PIDS" | xargs kill 2>/dev/null
fi

echo ""
echo "✅ All SpamSentry servers stopped."
echo "   To restart, run: ./start.sh"
