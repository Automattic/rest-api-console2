var gulp       = require('gulp'),
    jade       = require('gulp-jade'),
    sass       = require('gulp-sass'),
    concat     = require('gulp-concat'),
    rename     = require('gulp-rename'),
    tar        = require('gulp-tar'),
    gzip       = require('gulp-gzip'),
    browserify = require('browserify'),
    source     = require('vinyl-source-stream'),
    package    = require('./package.json'),
    exec       = require('child_process').exec,
    build      = 'dev';

try {
  var config = require('./config.json');
} catch (variable) {
  console.error("Missing config.json, read README.md for instructions.");
  var config = {};
}

config.version = package.version;

var public = 'build/wpcom-console/public';

gulp.task("default", ["public", "html", "js", "css"], function() {
  gulp.src(public + "/**")
    .pipe(tar('wpcom-console.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('build'));
});

gulp.task("public", function() {
  return gulp.src('./public/**')
    .pipe(gulp.dest(public));
});

gulp.task("config", function(cb) {
  exec('git describe --always --tag --long --dirty', function(err, stdout, stderr) {
    config.build = stdout.trim();
    cb(err);
  });
});

gulp.task("html", ["config"], function() {
  return gulp.src('./templates/views/app.jade')
    .pipe(jade({locals:config}))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(public));
});

gulp.task("js", function() {
  return browserify('./lib/app.js')
    .transform({global:true}, "uglifyify")
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest(public));
});

gulp.task("css", function() {
  return gulp.src('templates/sass/*.scss')
    .pipe(sass())
    .pipe(concat('style.css'))
    .pipe(gulp.dest(public));
});