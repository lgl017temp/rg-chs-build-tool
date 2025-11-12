set path=".\node-v24.8.0-win-x64"
set JAVA_HOME="%~dp0jdk-17.0.2\"

call npm run extractTrans

call npm run genPo

call npm run genMo

call npm run replaceTransMobile

call npm run modifyVersion

call npm run modifyVersionUUID

call npm run extractAssets

mkdir .\out\assets\fonts
copy .\resource\other\floating_bitmap.fnt .\out\assets\fonts
mkdir .\out\assets\images
copy .\resource\other\realmgrinderui_new.png .\out\assets\images
copy .\resource\other\realmgrinderui2_new.png .\out\assets\images

mkdir .\out\android
call npm run repackApk

call npm run alignApk

call npm run signApk

echo copyToDist
rmdir /s /q .\dist\phone
mkdir .\dist\phone
copy .\out\android\realmgrinder_signed.apk .\dist\phone

pause 