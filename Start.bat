@echo off
title barkhod
cd /d "%~dp0"
echo.
echo http://localhost:25565
echo.
echo CTRL+C for stop
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  if exist "%~dp0server.py" (
    start "" "http://localhost:25565/?fresh=%RANDOM%%RANDOM%"
    python -u "%~dp0server.py"
    goto :end
  ) else (
    echo server.py not found, using python http.server fallback...
    start "" "http://localhost:25565/?fresh=%RANDOM%%RANDOM%"
    python -u -m http.server 25565
    goto :end
  )
)

where py >nul 2>nul
if %errorlevel%==0 (
  if exist "%~dp0server.py" (
    start "" "http://localhost:25565/?fresh=%RANDOM%%RANDOM%"
    py -u "%~dp0server.py"
    goto :end
  ) else (
    echo server.py not found, using python http.server fallback...
    start "" "http://localhost:25565/?fresh=%RANDOM%%RANDOM%"
    py -u -m http.server 25565
    goto :end
  )
)

echo Python not found. Trying PowerShell fallback...
start "" "http://localhost:25565/"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l=New-Object System.Net.HttpListener;$l.Prefixes.Add('http://localhost:25565/');$l.Start();Write-Host 'Serving barkhod on http://localhost:25565 ...';$types=@{'.html'='text/html';'.css'='text/css';'.js'='application/javascript';'.json'='application/json';'.svg'='image/svg+xml';'.png'='image/png';'.jpg'='image/jpeg';'.webp'='image/webp';'.otf'='font/otf';'.ico'='image/x-icon'};while($l.IsListening){$c=$l.GetContext();$p=Join-Path (Get-Location) ($c.Request.Url.LocalPath.TrimStart('/') -replace '/','\');if(Test-Path $p -PathType Container){$p=Join-Path $p 'index.html'};$c.Response.Headers.Add('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');$c.Response.Headers.Add('Pragma','no-cache');if(Test-Path $p){$ext=[IO.Path]::GetExtension($p).ToLower();if($types.ContainsKey($ext)){$c.Response.ContentType=$types[$ext]};$b=[IO.File]::ReadAllBytes($p);$c.Response.ContentLength64=$b.Length;$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404}$c.Response.Close()}"
:end
pause
