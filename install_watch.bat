@echo off
setlocal
call "%~dp0deploy\install-watcher.bat" %*
exit /b %errorlevel%
