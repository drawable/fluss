/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var gulp = require('gulp');
var browserify = require('browserify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require("gulp-rename");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var del = require("del");

var directories = {
        readme: {
            src: "./README.md"
        },

    sources: {
        src: "./src/**/*.es6",
        dest: "./src"
    },

    tests: {
        src: "./test/**/*.es6",
        dest: "./test"
    },

    "module": "build",

    "module-sources": {
        src: "./src/**/*.*",
        dest: "./build/src"
    },

    "module-dist": {
        src: "./dist/**/*.*",
        dest: "./build/"
    }

};

function src(domain) {
    return directories[domain].src;
}

function dest(domain) {
    return directories[domain].dest;
}


/*********************************************************************
 *                            DEVELOPMENT
 *********************************************************************/


gulp.task("compile-sources-inplace", function() {
    return gulp.src(src("sources"))
            .pipe(sourcemaps.init())
            .pipe(babel())
            .pipe(rename(function(path) {
                    path.extname = ".js";
            }))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest(dest("sources")));
});

gulp.task("compile-tests", function() {
    return gulp.src(src("tests"))
            .pipe(sourcemaps.init())
            .pipe(babel())
            .pipe(rename(function(path) {
                path.extname = ".js";
            }))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest(dest("tests")));
});


/*********************************************************************
 *                            NPM-Module
 *********************************************************************/

gulp.task("module-clean", function(done) {
    del(directories.module, done);
});

gulp.task("module-copy-src", ["module-clean", "compile-sources-inplace"], function() {
    return gulp.src(src("module-sources"))
           .pipe(gulp.dest(dest("module-sources")));
});


gulp.task("module-copy-dist", function() {
    return gulp.src([src("module-dist"), src("readme")])
        .pipe(gulp.dest(dest("module-dist")));
});

var getBundleName = function () {
    var version = require('./package.json').version;
    var name = require('./package.json').name;
    return name + "." + version;
};



gulp.task('module-single-file', function() {

    var bundler = browserify({
        entries: ['./build/src/Fluss.js'],
        debug: true
    });

    var bundle = function() {
        return bundler
            .bundle()
            .pipe(source(getBundleName() + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            // Add transformation tasks to the pipeline here.
           // .pipe(uglify())
            .pipe(sourcemaps.write('./', { sourceRoot: "../../"}))
            .pipe(gulp.dest('./build/'));
    };

    return bundle();
});

gulp.task("module-build", ["module-copy-src", "module-copy-dist"], function() {
});
