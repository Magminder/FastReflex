/**
 * Created by Alex Manko on 17.10.2015.
 */

var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    browserSync = require('browser-sync'),
    insert = require('gulp-insert'),
    reload = browserSync.reload;

var testServerConfig = {
    server: {
        baseDir: './test'
    },
    tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "Test"
};

var src = function() {
    return browserify('./src/lib.js')
        .bundle()
        .pipe(source('lib.js'))
        .pipe(insert.transform(function(contents, file) {
            return contents
                .replace('\n', '\n/* jshint ignore:end */\n', 1);
        }))
        .pipe(insert.prepend('/* jshint ignore:start */\n'));
};

gulp.task('lint', function() {
    return src()
        .pipe(streamify(jshint()))
        .pipe(jshint.reporter('default'));
});

gulp.task('minify', function() {
    return src()
        .pipe(gulp.dest('./build'))
        .pipe(streamify(uglify()))
        .pipe(rename('lib.min.js'))
        .pipe(gulp.dest('./build'))
        .pipe(reload({stream: true}));
});

gulp.task('test', function() {
    browserSync(testServerConfig);
});

gulp.task('watch', function(){
    watch('src/**', ['lint', 'minify']);

    watch('test/**', function() {
        reload({stream: true});
    });
});

gulp.task('default', function() {
    gulp.start('lint', 'minify', 'test');

    gulp.watch('src/**', ['lint', 'minify']);

    gulp.watch('test/**', function() {
        reload();
    });
});