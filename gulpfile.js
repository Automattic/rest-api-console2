var gulp       = require('gulp'),
    jade       = require('gulp-jade'),
    ejs        = require('gulp-ejs'),
    sass       = require('gulp-sass'),
    concat     = require('gulp-concat'),
    rename     = require('gulp-rename'),
    tar        = require('gulp-tar'),
    gzip       = require('gulp-gzip'),
    browserify = require('browserify'),
    source     = require('vinyl-source-stream'),
    package    = require('./package.json'),
    exec       = require('child_process').exec,
    del        = require('del'),
    build      = 'dev';

var config = {};
try {
  config = require('./config.json');
} catch (err) {
  console.error("Missing config.json, read README.md for instructions.");
}

config.version = package.version;

var public = 'build/dist/wpcom-console/public';

gulp

.task("default", ["package"])

.task("package", ["config", "public", "html", "js", "css", "readme"], function() {
  gulp.src("build/dist/**")
    .pipe(tar('wpcom-console-' + config.build + '.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('build'));
})

.task("public", function() {
  return gulp.src('./public/**')
    .pipe(gulp.dest(public));
})

.task("config", function(cb) {
  exec('git describe --always --tag --long --dirty', function(err, stdout, stderr) {
    config.build = stdout.trim();
    config.resource_version = config.build;
    cb(err);
  });
})

.task("html", ["config"], function() {
  return gulp.src('./templates/views/app.jade')
    .pipe(jade({locals:config, pretty:"  "}))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(public));
})

.task("app", function() {
  return browserify('./lib/app.js')
    .transform({global:true}, "uglifyify")
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest(public));
})

.task("search", function() {
  return browserify('./lib/search.js')
    .transform({global:true}, "uglifyify")
    .bundle()
    .pipe(source('search.js'))
    .pipe(gulp.dest(public));
})

.task("js", ["app", "search"])

.task("css", function() {
  return gulp.src('templates/sass/style.scss')
    .pipe(sass())
    .pipe(concat('style.css'))
    .pipe(gulp.dest(public));
})

.task("readme", ["config"], function() {
  return gulp.src('templates/README.md.ejs')
    .pipe(ejs({build:config}, {ext:''}))
    .pipe(gulp.dest(public));
})

.task("clean", function(cb) {
  return del("build", cb);
});
