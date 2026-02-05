@echo off
echo Setting up resources... > resource_setup.log
mkdir "android\app\src\main\res\mipmap-mdpi" >> resource_setup.log 2>&1
echo Created directory. >> resource_setup.log
copy "client\src\assets\Collablearn Logo.png" "android\app\src\main\res\mipmap-mdpi\ic_launcher.png" >> resource_setup.log 2>&1
copy "client\src\assets\Collablearn Logo.png" "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png" >> resource_setup.log 2>&1
echo Done. >> resource_setup.log
