@echo off
REM 贪吃蛇游戏Windows启动脚本
REM 支持直接打开HTML文件或启动本地服务器

echo 贪吃蛇游戏启动器
echo =================
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Node.js 已安装
) else (
    echo ❌ Node.js 未安装
    echo 请先安装Node.js或直接打开index.html文件
    echo.
    set /p choice=是否要直接打开index.html文件？(y/n):
    if /i "%choice%"=="y" (
        start index.html
    )
    pause
    exit /b 1
)

:menu
cls
echo 贪吃蛇游戏启动器
echo =================
echo.
echo 请选择启动方式：
echo 1. 启动本地服务器 (推荐，支持完整功能)
echo 2. 直接打开HTML文件
echo 3. 检查文件完整性
echo 4. 退出
echo.

set /p option=请输入选项 (1-4):

if "%option%"=="1" goto server
if "%option%"=="2" goto html
if "%option%"=="3" goto check
if "%option%"=="4" goto exit
echo 无效选项，请重新输入
pause
goto menu

:server
echo 正在启动本地服务器...
echo.
node test-server.js
pause
goto menu

:html
echo 正在打开HTML文件...
start index.html
pause
goto menu

:check
echo 检查文件完整性...
echo.
set missing=0

if exist "index.html" (
    echo ✅ index.html 存在
) else (
    echo ❌ index.html 缺失
    set /a missing+=1
)

if exist "style.css" (
    echo ✅ style.css 存在
) else (
    echo ❌ style.css 缺失
    set /a missing+=1
)

if exist "game.js" (
    echo ✅ game.js 存在
) else (
    echo ❌ game.js 缺失
    set /a missing+=1
)

if exist "README.md" (
    echo ✅ README.md 存在
) else (
    echo ❌ README.md 缺失
    set /a missing+=1
)

echo.
if %missing% equ 0 (
    echo ✅ 所有文件完整！
) else (
    echo ❌ 有 %missing% 个文件缺失
)
pause
goto menu

:exit
echo 再见！
pause
exit /b 0