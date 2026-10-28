$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$ini = Join-Path $root ".mysql\my.ini"
$port = 3307

function Test-Port([int]$p) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect("127.0.0.1", $p)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-Path $ini)) {
  Write-Error "Local MySQL config not found at $ini. See README.md for setup."
  exit 1
}

if (Test-Port $port) {
  Write-Host "MySQL is already listening on port $port."
  exit 0
}

$mysqld = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
if (-not (Test-Path $mysqld)) {
  $command = Get-Command mysqld -ErrorAction SilentlyContinue
  if ($command) {
    $mysqld = $command.Source
  } else {
    Write-Error "mysqld.exe was not found. Install MySQL Server 8.0 or add it to PATH."
    exit 1
  }
}

Write-Host "Starting project MySQL on port $port..."
Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$ini`"" -WindowStyle Hidden

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Port $port) {
    Write-Host "MySQL is ready on 127.0.0.1:$port."
    exit 0
  }
}

Write-Error "MySQL did not start within 30 seconds. Check $ini and the .mysql\data folder."
exit 1
