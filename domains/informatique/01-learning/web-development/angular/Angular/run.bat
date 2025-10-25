@echo off

REM Script de raccourci pour les scripts Windows
REM Usage: run.bat [script-name] [arguments]

set SCRIPT_DIR=scripts\windows
set SCRIPT_NAME=%1

if "%SCRIPT_NAME%"=="" set SCRIPT_NAME=help

if "%SCRIPT_NAME%"=="dev" goto dev
if "%SCRIPT_NAME%"=="development" goto dev
if "%SCRIPT_NAME%"=="test" goto test
if "%SCRIPT_NAME%"=="testing" goto test
if "%SCRIPT_NAME%"=="build" goto build
if "%SCRIPT_NAME%"=="building" goto build
if "%SCRIPT_NAME%"=="deploy" goto deploy
if "%SCRIPT_NAME%"=="deployment" goto deploy
if "%SCRIPT_NAME%"=="config" goto config
if "%SCRIPT_NAME%"=="configuration" goto config
if "%SCRIPT_NAME%"=="backup" goto backup
if "%SCRIPT_NAME%"=="security" goto security
if "%SCRIPT_NAME%"=="docs" goto docs
if "%SCRIPT_NAME%"=="documentation" goto docs
if "%SCRIPT_NAME%"=="monitoring" goto monitoring
if "%SCRIPT_NAME%"=="maintenance" goto maintenance
if "%SCRIPT_NAME%"=="help" goto help
if "%SCRIPT_NAME%"=="--help" goto help
if "%SCRIPT_NAME%"=="-h" goto help
goto unknown

:dev
call "%SCRIPT_DIR%\dev.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:test
call "%SCRIPT_DIR%\test.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:build
call "%SCRIPT_DIR%\build.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:deploy
call "%SCRIPT_DIR%\deploy.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:config
call "%SCRIPT_DIR%\config.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:backup
call "%SCRIPT_DIR%\backup.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:security
call "%SCRIPT_DIR%\security.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:docs
call "%SCRIPT_DIR%\docs.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:monitoring
call "%SCRIPT_DIR%\monitoring.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:maintenance
call "%SCRIPT_DIR%\maintenance.bat" %2 %3 %4 %5 %6 %7 %8 %9
goto end

:help
echo Usage: %~nx0 [script-name] [arguments]
echo.
echo Available scripts:
echo   dev          Development environment
echo   test         Run tests
echo   build        Build application
echo   deploy       Deploy application
echo   config       Configure environment
echo   backup       Backup data
echo   security     Security checks
echo   docs         Generate documentation
echo   monitoring   System monitoring
echo   maintenance  Maintenance tasks
echo.
echo Examples:
echo   %~nx0 dev
echo   %~nx0 test all
echo   %~nx0 deploy production
goto end

:unknown
echo Unknown script: %SCRIPT_NAME%
echo Use '%~nx0 help' to see available scripts
exit /b 1

:end
