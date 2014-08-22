module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    config: {
      build: 'build',
      styles: 'scss',
      templates: 'www/templates',
      android_bin: 'platforms/android',
      src: 'www/js',
      app: 'www',
      res: 'resources',
      versionCode: '3'
    },
    jshint: {
      options: {
        '-W030': false, // W030: Expected an assignment or function call and instead saw an expression.
        'debug': true // debugger
      },
      beforeconcat: ['<%= config.src %>/**/*.js']
    },
    htmlhint: {
      build: {
        options: {
          'tag-pair': true,
          'tagname-lowercase': true,
          'attr-lowercase': true,
          'spec-char-escape': true,
          'id-unique': true,
          'style-disabled': true
        },
        src: ['<%= config.templates %>/*.html']
      }
    },
    sass: {
      build: {
        options: {
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: '<%= config.styles %>',
          src: ['*.scss'],
          dest: '<%= config.app %>/css',
          ext: '.css'
        }]
      }
    },
    shell: {
      clean: {
        command: [
          'rm -rf <%= config.build %>/*',
          'cordova platform remove android',
          'cordova platform add android',
          'cp <%= config.res %>/icons/android/icon-36-ldpi.png <%= config.android_bin %>/res/drawable-ldpi/icon.png',
          'cp <%= config.res %>/icons/android/icon-48-mdpi.png <%= config.android_bin %>/res/drawable-mdpi/icon.png',
          'cp <%= config.res %>/icons/android/icon-72-hdpi.png <%= config.android_bin %>/res/drawable-hdpi/icon.png',
          'cp <%= config.res %>/icons/android/icon-96-xhdpi.png <%= config.android_bin %>/res/drawable-xhdpi/icon.png',
          'cp <%= config.res %>/icons/android/icon-96-xhdpi.png <%= config.android_bin %>/res/drawable/icon.png',
          'cp <%= config.res %>/screens/android/screen-320-ldpi.png <%= config.android_bin %>/res/drawable-ldpi/screen.png',
          'cp <%= config.res %>/screens/android/screen-320-mdpi.png <%= config.android_bin %>/res/drawable-mdpi/screen.png',
          'cp <%= config.res %>/screens/android/screen-480-hdpi.png <%= config.android_bin %>/res/drawable-hdpi/screen.png',
          'cp <%= config.res %>/screens/android/screen-720-xhdpi.png <%= config.android_bin %>/res/drawable-xhdpi/screen.png',
          'cp <%= config.res %>/screens/android/screen-720-xhdpi.png <%= config.android_bin %>/res/drawable/screen.png',
          "sed -i 's/android:versionCode=\"1\"/android:versionCode=\"<%= config.versionCode %>\"/g' <%= config.android_bin %>/AndroidManifest.xml",
          'ionic build android',
          'cordova build --release android',
          'jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore news.keystore <%= config.android_bin %>/ant-build/PINews-release-unsigned.apk news -storepass 100265',
          'zipalign -v 4 <%= config.android_bin %>/ant-build/PINews-release-unsigned.apk <%= config.build %>/pi-news-<%= config.versionCode %>.apk'
        ].join('&&'),
        options: { stdout: true }
      }
    },
    watch: {
      options: {
        livereload: true,
        spawn: false
      },
      scripts: {
        files: ['<%= config.src %>/**/*.js'],
        tasks: ['default'],
      },
      css: {
        files: ['<%= config.styles %>/*.scss'],
        tasks: ['sass']
      },
      html: {
        files: ['<%= config.templates %>/*.html'],
        tasks: ['default']
      }
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.registerTask('default', ['jshint', 'htmlhint', 'sass']);
  grunt.registerTask('dev', ['default', 'watch']);
  grunt.registerTask('build', ['default', 'shell']);
};