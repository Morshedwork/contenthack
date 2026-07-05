@echo off
setlocal
set BUN=%APPDATA%\npm\node_modules\bun\bin\bun.exe
set GBRAIN=%USERPROFILE%\gbrain\src\cli.ts
"%BUN%" run "%GBRAIN%" serve %*
