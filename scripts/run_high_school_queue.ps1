$ErrorActionPreference = 'Stop'
$root = 'D:\AI\ZCode\english-daily'
$python = (Get-Command python).Source
$build = Join-Path $root 'scripts\build_book_voice_pack.py'
$upload = Join-Path $root 'scripts\upload_voice_pack.py'
$log = Join-Path $root 'audio\queue.log'
$lock = Join-Path $root 'audio\queue.lock'

if (Test-Path $lock) { exit 0 }
Set-Content -Path $lock -Value $PID -Encoding ASCII

function Write-Log($text) {
  $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $text
  Add-Content -Path $log -Value $line -Encoding UTF8
}

try {
  Write-Log 'QUEUE_START'
  foreach ($book in @('h1','h2','h3','h4','h5','h6','h7')) {
    Write-Log ('BUILD_START ' + $book)
    & $python $build --book $book 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -ne 0) { Write-Log ('BUILD_FAILED ' + $book); exit 1 }
    Write-Log ('UPLOAD_START ' + $book)
    & $python $upload --book $book 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -ne 0) { Write-Log ('UPLOAD_FAILED ' + $book); exit 1 }
    Write-Log ('BOOK_DONE ' + $book)
  }
  Write-Log 'ALL_HIGH_SCHOOL_DONE'
}
catch {
  Write-Log ('QUEUE_ERROR ' + $_.Exception.Message)
}
finally {
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
