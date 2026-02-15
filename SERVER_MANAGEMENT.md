# Server Management Guide

## 🚀 Starting the App

### Quick Start (Recommended)

```bash
cd /Users/arnavparmaj/College/Mini_Project/SpamDetection
./start.sh
```

This starts both servers automatically!

### Manual Start

```bash
# Terminal 1 - Frontend
cd /Users/arnavparmaj/College/Mini_Project/SpamDetection/frontend
npm run dev

# Terminal 2 - Backend
cd /Users/arnavparmaj/College/Mini_Project/SpamDetection/ml_service
python3 main.py
```

## 🛑 Stopping the App

### Quick Stop (Recommended)

```bash
cd /Users/arnavparmaj/College/Mini_Project/SpamDetection
./stop.sh
```

This stops ALL running servers!

### Manual Stop

Press `Ctrl+C` in each terminal window

### Force Stop (If stuck)

```bash
# Kill all Vite servers
pkill -f vite

# Kill all Python API servers
pkill -f "python3 main.py"
```

## 🔄 Restarting

```bash
# Stop everything
./stop.sh

# Wait 2 seconds
sleep 2

# Start everything
./start.sh
```

## 📊 Check Running Servers

```bash
# Check if Frontend is running
lsof -i :5174

# Check if ML API is running
lsof -i :8000

# See all node/python processes
ps aux | grep -E "(vite|python3 main)"
```

## 🎯 Your Current Running Servers

Based on your terminal history, you have:

- Frontend (old): Port 5173 (running for 1h19m) - **Can be stopped**
- Frontend (current): Port 5174 (running for 1h7m) - **Main app**
- Backend: Port 8000 (running for 52m) - **Main API**

### Recommended: Clean Up Old Servers

```bash
# Stop old frontend on port 5173
lsof -ti:5173 | xargs kill

# Or use the stop script to clean everything
./stop.sh
```

## 💡 Best Practices

1. **Use the scripts**: `start.sh` and `stop.sh` are easier than managing terminals
2. **One instance only**: Don't run multiple frontend/backend instances
3. **Check ports**: If startup fails, check if ports are already in use
4. **Development**: Keep servers running while coding, restart only when needed
5. **Before Git commit**: Not necessary to stop servers

## 🐛 Troubleshooting

### "Address already in use"

```bash
# Kill process on specific port
lsof -ti:5174 | xargs kill  # Frontend
lsof -ti:8000 | xargs kill  # Backend
```

### Scripts don't work

```bash
# Make them executable
chmod +x start.sh stop.sh
```

### Can't find processes

```bash
# Use the force stop method
./stop.sh
# Then check with:
ps aux | grep -E "(vite|python3 main)"
```
