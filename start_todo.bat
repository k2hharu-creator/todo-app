@echo off
setlocal
title TaskFlow Control Center

echo [TaskFlow] 시스템을 가동합니다...
cd /d %~dp0

:: 1. 라이브러리 체크
if not exist "node_modules" (
    echo [정보] 초기 환경 설정을 진행합니다...
    call npm install --silent
)

:: 2. 백엔드 서버 실행 (별도 창)
echo [정보] 백엔드 서버를 시작합니다...
start "TaskFlow-SERVER" /min cmd /c "cd backend && npm start"

:: 3. 프론트엔드 클라이언트 실행 (현재 창)
echo [정보] 프론트엔드 클라이언트를 시작합니다...
echo [정보] 브라우저 창이 열리면 사용해 주세요. (새로고침 가능)
echo [정보] 이 창을 닫으면 프로그램이 종료됩니다.

cd frontend
call npm start

:: 프로그램 종료 시 백엔드도 같이 종료되도록 시도
taskkill /FI "WINDOWTITLE eq TaskFlow-SERVER*" /F >nul 2>&1
