#!/bin/bash
# Watch3D — local server (macOS: double-click this file)
cd "$(dirname "$0")"
PORT=8080
echo "Watch3D: http://localhost:$PORT/"
( sleep 1; open "http://localhost:$PORT/" ) &
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server $PORT
else
  echo "python3 が見つかりません / python3 not found."
  echo "npx serve . などで起動してください / Try: npx serve ."
  read -n 1
fi
