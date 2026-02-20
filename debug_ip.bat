@echo off
ipconfig > app_ip_check.txt
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress >> app_ip_check.txt"
netstat -ano | findstr :5001 >> app_ip_check.txt
