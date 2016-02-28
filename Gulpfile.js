'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('merge-stream');

var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var derequire = require('gulp-derequire');
var changed = require('gulp-changed');

var assign = require('lodash.assign');
var browserSync = require('browser-sync').create();

// Contains library files, meant only for consuming.
var SRC = "src/";
// Used for building the demo, otherwise not released to anyone.
var DIST = "dist/";
// Build directory containing development and production versions
// of the app
var BUILD = "build/";
// Contains demo files only
var DEMO = "demo/";

var pjson = require('./package.json');

// Builds development and production versions. This is called
// either manually (`gulp js`) or on change of one of the source
// library files
gulp.task('js', function() {
  var build = browserify(assign({}, {
    entries: SRC + pjson.name + '.js',
    standalone: 'Three2D',
    debug: true
  }));

  function bundle(name) {
    return build.bundle()
      .pipe(source(name))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(derequire())
      .on('error', gutil.log);
  }

  var development = bundle(pjson.name + '.js')
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(BUILD));

  var production = bundle(pjson.name + '.min.js')
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(BUILD));

  return merge(development, production);
});

gulp.task('html', function() {
  return gulp.src(DEMO + '*.html')
    .pipe(changed(DIST))
    .pipe(gulp.dest(DIST));
});

gulp.task('html-watch', ['html'], function() {
  return browserSync.reload();
});

gulp.task('watch', ['html', 'js'], function () {
  browserSync.init({
    server: "./" + DIST,
    open: false
  });

  var demo = watchify(browserify(assign({}, watchify.args, {
    entries: DEMO + 'index.js',
    debug: true
  })));

  function bundle() {
    return demo.bundle()
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(derequire())
      .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(DIST));
  }

  demo.on('update', function() {
    bundle().on('end', browserSync.reload);
  });

  demo.on('log', gutil.log);

  gulp.watch(DEMO + '*.html', ['html-watch'])
  gulp.watch(SRC + '**/*.js', ['js'])

  return bundle()
    .pipe(browserSync.stream({ once: true }));
});

gulp.task('default', ['watch']);
