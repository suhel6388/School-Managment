$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$ini = Join-Path $root ".mysql\my.ini"
$envFile = Join-Path $root ".env"
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

if (-not (Test-Port $port)) {
  Write-Host "MySQL is not running on port $port."
  exit 0
}

$mysqladmin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe"
if (-not (Test-Path $mysqladmin)) {
  $command = Get-Command mysqladmin -ErrorAction SilentlyContinue
  if ($command) { $mysqladmin = $command.Source }
}

$url = ""
if (Test-Path $envFile) {
  $line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if ($line) { $url = ($line -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"') }
}

$match = [regex]::Match($url, '^mysql://([^:]+):([^@]+)@([^:]+):(\d+)/')
if ($match.Success -and (Test-Path $mysqladmin)) {
  $user = [System.Uri]::UnescapeDataString($match.Groups[1].Value)
  $pass = [System.Uri]::UnescapeDataString($match.Groups[2].Value)
  $hostName = $match.Groups[3].Value
  $dbPort = $match.Groups[4].Value
  Write-Host "Stopping MySQL on ${hostName}:${dbPort}..."
  & $mysqladmin -h $hostName -P $dbPort -u $user "--password=$pass" shutdown
  if ($LASTEXITCODE -eq 0) {
    Write-Host "MySQL stopped."
    exit 0
  }
}

Write-Host "Could not stop MySQL gracefully; stopping the process that uses $ini."
$process = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -like "mysqld*" -and $_.CommandLine -and $_.CommandLine.Contains("my.ini")
}
if (-not $process) {
  Write-Host "No local MySQL process was found."
  exit 0
}
foreach ($item in $process) {
  Stop-Process -Id $item.ProcessId -Force
  Write-Host "Stopped process $($item.ProcessId)."
}
