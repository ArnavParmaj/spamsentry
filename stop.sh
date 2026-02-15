#!/bin/bash

# SpamSentry - Stop All Servers
# This script stops both the frontend and backend servers

echo "🛑 Stopping SpamSentry servers..."

# Method 1: Try to kill using saved PIDs
if [ -f .pids ]; then
    echo "📝 Found .pids file, stopping saved processes..."
    while IFS= read -r pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "   Stopping process $pid"
            kill $pid 2>/dev/null
        fi
    done < .pids
    rm .pids
    echo "   Removed .pids file"
fi

# Method 2: Kill all vite and python main.py processes
echo "🔍 Searching for running servers..."

# Kill Vite dev servers
VITE_PIDS=$(pgrep -f "vite")
if [ -n "$VITE_PIDS" ]; then
    echo "   Stopping Vite servers (PIDs: $VITE_PIDS)"
    echo "$VITE_PIDS" | xargs kill 2>/dev/null
fi

# Kill Python ML API
PYTHON_PIDS=$(pgrep -f "python3 main.py")
if [ -n "$PYTHON_PIDS" ]; then
    echo "   Stopping Python ML API (PIDs: $PYTHON_PIDS)"
    echo "$PYTHON_PIDS" | xargs kill 2>/dev/null
fi

echo "✅ All servers stopped!"
echo ""
echo "To restart, run: ./start.sh"
