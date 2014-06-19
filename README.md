P&I News
========

Debug in browser
------------------

    $grunt dev

Debug on device
------------------

    $ionic platform rm android
    $ionic platform add android
    $ionic run android


Create a new build
------------------

**gruntfile.js**
Increment config.versionCode by 1

    $grunt build

APK file created in /build/*.apk