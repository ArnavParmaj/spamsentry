#!/bin/bash

# SpamSentry - Start All Servers
# This script starts both the frontend and backend servers

echo "🚀 Starting SpamSentry..."

# Start Frontend (React + Vite)
echo "📦 Starting Frontend on http://localhost:5174..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait a moment
sleep 2

# Start Backend (FastAPI)
echo "🤖 Starting ML API on http://localhost:8000..."
cd ../ml_service
python3 main.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

echo ""
echo "✅ SpamSentry is running!"
echo "   Frontend: http://localhost:5174"
echo "   ML API:   http://localhost:8000"
echo ""
echo "📝 Process IDs saved to .pids file"
echo "   Frontend: $FRONTEND_PID"
echo "   Backend:  $BACKEND_PID"
echo ""
echo "To stop the servers, run: ./stop.sh"
echo "Or press Ctrl+C to stop this script (servers will keep running)"

# Save PIDs to file for stop script
cd ..
echo "$FRONTEND_PID" > .pids
echo "$BACKEND_PID" >> .pids

# Wait for user interrupt
wait
