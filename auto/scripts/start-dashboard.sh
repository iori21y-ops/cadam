#!/bin/bash
# ~/cadam/scripts/start-dashboard.sh
# CADAM 대시보드 HTTP 서버 시작

PORT=3000
DIR=~/cadam/output/reports

if lsof -i :$PORT > /dev/null 2>&1; then
  echo "✅ 대시보드 서버 이미 실행 중 (port $PORT)"
else
  cd "$DIR" && nohup python3 -m http.server $PORT > /dev/null 2>&1 &
  sleep 1
  echo "✅ 대시보드 서버 시작됨"
  echo "   로컬:  http://localhost:$PORT/cadam-dashboard.html"
  echo "   외부:  http://100.64.130.22:$PORT/cadam-dashboard.html"
fi
