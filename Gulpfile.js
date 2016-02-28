'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var derequire = require('gulp-derequire');
var changed = require('gulp-changed');

var assign = require('lodash.assign');
var browserSync = require('browser-sync').create();

var SRC = "src/";
var DIST = "dist/";
var BUILD = "build/";
var DEMO = "demo/";

var opts = {
  entries: DEMO + 'index.js',
  standalone: 'Three2D',
  debug: true
};

var b;

var pjson = require('./package.json');

function bundle() {
  return b.bundle()
    // .pipe(source(pjson.name + '.js'))
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(derequire())
  // .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DIST));
}

gulp.task('js', function() {
  b = browserify(opts);
  return bundle();
});

gulp.task('html', function() {
  return gulp.src(DEMO + '*.html')
    .pipe(changed(DIST))
    .pipe(gulp.dest(DIST));
});

gulp.task('html-watch', ['html'], function() {
  return browserSync.reload();
});

gulp.task('watch', ['html'], function () {
  browserSync.init({
    server: "./" + DIST,
    open: false
  });

  b = watchify(browserify(assign({}, watchify.args, opts)));
  b.on('update', function() {
    bundle().on("end", browserSync.reload);
  });
  b.on('log', gutil.log);

  gulp.watch(DEMO + '*.html', ['html-watch'])

  return bundle()
    .pipe(browserSync.stream({ once: true }));
});

gulp.task('default', ['watch']);
