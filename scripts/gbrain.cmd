@echo off
setlocal
set BUN=%APPDATA%\npm\node_modules\bun\bin\bun.exe
set GBRAIN=%USERPROFILE%\gbrain\src\cli.ts
set PATH=%APPDATA%\npm;%USERPROFILE%\.bun\bin;%PATH%
"%BUN%" run "%GBRAIN%" %*
