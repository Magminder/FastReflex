/**
 * Created by Alex Manko on 17.10.2015.
 */

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var refresh = require('gulp-livereload');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');

var lr = require('tiny-lr');
var server = lr();

gulp.task('lint', function() {
    return browserify('./src/lib.js')
        .bundle()
        .pipe(source('lib.js'))
        .pipe(streamify(jshint()))
        .pipe(jshint.reporter('default'));
});

gulp.task('minify', function() {
    return browserify('./src/lib.js')
        .bundle()
        .pipe(source('lib.js'))
        .pipe(gulp.dest('./build'))
        .pipe(streamify(uglify()))
        .pipe(rename('lib.min.js'))
        .pipe(gulp.dest('./build'))
        .pipe(refresh(server))
});

gulp.task('lr-server', function() {
    server.listen(3000, function(err) {
        if(err) return console.log(err);
    });
});

gulp.task('default', function() {
    gulp.run('lr-server', 'lint', 'minify');

    gulp.watch('src/**', ['lint', 'minify']);
});