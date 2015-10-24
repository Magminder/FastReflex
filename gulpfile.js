/**
 * Created by Alex Manko on 17.10.2015.
 */

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    browserSync = require('browser-sync'),
    rigger = require('gulp-rigger'),
    reload = browserSync.reload;

var testServerConfig = {
    server: {
        baseDir: './test'
    },
    //tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "Test"
};

var src = function() {
    return gulp.src('./src/lib.js')
        .pipe(rigger());
};

gulp.task('lint', function() {
    src()
        .pipe(streamify(jshint()))
        .pipe(jshint.reporter('default'));
});

gulp.task('minify', function() {
    src()
        .pipe(gulp.dest('./build'))
        .pipe(rename('lib.js'))
        .pipe(gulp.dest('./test/lib'))
        .pipe(streamify(uglify()))
        .pipe(rename('lib.min.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('prepareTest', function() {
    src()
        .pipe(gulp.dest('./test/lib'));
});

gulp.task('test', function() {
    browserSync(testServerConfig);
});

gulp.task('default', function() {
    gulp.start('lint', 'minify', 'prepareTest', 'test');

    gulp.watch('src/**', ['lint', 'minify', 'prepareTest']);

    gulp.watch('test/**', function() {
        reload();
    });
});