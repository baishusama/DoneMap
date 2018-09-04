// TS with Gulp more on https://zhongsp.gitbooks.io/typescript-handbook/doc/handbook/tutorials/Gulp.html
// Browsersync with Gulp more on http://www.browsersync.cn/docs/gulp/
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var watchify = require('watchify');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var paths = {
    pages: ['src/*.html'],
    data: ['src/*.json'],
    libs: ['src/lib/*.js']
};
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

gulp.task('copy-html', function() {
    return gulp.src(paths.pages).pipe(gulp.dest('dist'));
});

gulp.task('copy-json', function() {
    return gulp.src(paths.data).pipe(gulp.dest('dist'));
});

gulp.task('copy-lib', function() {
    return gulp.src(paths.libs).pipe(gulp.dest('dist/lib'));
});

// SASS
gulp.task('sass', function() {
    return gulp
        .src('src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('dist/css'))
        .pipe(reload({ stream: true }));
});

// 静态服务器
gulp.task('serve', ['copy-html', 'copy-json', 'copy-lib', 'sass'], function() {
    browserSync.init({
        server: {
            baseDir: './dist'
        }
    });

    gulp.watch('src/scss/*.scss', ['sass']); // 最后也会 reload
    gulp.watch(['dist/index.html', 'dist/bundle.js']).on('change', reload);
});

// // 代理
// gulp.task('browser-sync', function() {
//     browserSync.init({
//         proxy: "你的域名或IP"
//     });
// });

var watchedBrowserify = watchify(
    browserify({
        basedir: '.',
        debug: true,
        entries: ['src/main.ts'],
        cache: {},
        packageCache: {}
    }).plugin(tsify)
);

function bundle() {
    return watchedBrowserify
        .transform('babelify', {
            presets: ['es2015'],
            extensions: ['.ts']
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
}

gulp.task('default', ['copy-html', 'copy-json', 'copy-lib'], bundle);
watchedBrowserify.on('update', bundle);
watchedBrowserify.on('log', gutil.log);

// var ts = require('gulp-typescript');
// var tsProject = ts.createProject('tsconfig.json');
// gulp.task('default', function() {
//     return tsProject
//         .src()
//         .pipe(tsProject())
//         .js.pipe(gulp.dest('dist'));
// });
