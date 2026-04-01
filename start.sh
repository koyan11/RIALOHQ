#!/bin/bash
# Rialo dApp — Start both frontend and backend

echo "🚀 Starting Rialo dApp..."

# Start backend
echo "📡 Starting backend (port 3001)..."
cd backend && npm install && npm start &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "🌐 Starting frontend (port 3000)..."
cd ../frontend && npm install && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Rialo dApp is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
