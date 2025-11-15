#!/bin/bash

# OwnPod Development Server Starter
# Versucht verschiedene Optionen für einen lokalen Webserver

PORT=8000
echo "Starting OwnPod on http://localhost:$PORT"
echo "=========================================="

# Try Python 3
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server $PORT
    exit 0
fi

# Try Python 2
if command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer $PORT
    exit 0
fi

# Try PHP
if command -v php &> /dev/null; then
    echo "Using PHP..."
    php -S localhost:$PORT
    exit 0
fi

# Try npx http-server
if command -v npx &> /dev/null; then
    echo "Using npx http-server..."
    npx http-server -p $PORT
    exit 0
fi

# No server found
echo "Error: Kein Web-Server gefunden!"
echo ""
echo "Bitte installiere eine der folgenden Optionen:"
echo "  - Python 3: sudo apt install python3"
echo "  - Node.js: sudo apt install nodejs npm"
echo "  - PHP: sudo apt install php"
echo ""
echo "Oder öffne index.html direkt im Browser (einige Features funktionieren möglicherweise nicht)"

exit 1
