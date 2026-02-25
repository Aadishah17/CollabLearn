$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
node src/index.js *>&1 | Out-File -FilePath "server_crash.log"
