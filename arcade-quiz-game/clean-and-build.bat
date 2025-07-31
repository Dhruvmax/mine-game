@echo off
echo Cleaning Next.js cache and build files...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Installing dependencies...
npm install
echo Building project...
npm run build
echo Done!
pause 