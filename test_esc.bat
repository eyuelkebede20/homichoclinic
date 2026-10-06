@echo off
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
echo 123456789%ESC%[1GWorld
