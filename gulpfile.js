/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var fs = require('fs')
var gulp = require('gulp');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var del = require("del");


gulp.task("compile-tsc", function() {
    var tsResult = gulp.src(["./src/**/*.ts", "./test/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./"));
});

gulp.task("copy-dist", function() {
   return gulp.src("./dist/**/*")
       .pipe(gulp.dest("./build"));
});

gulp.task("build-amd", ["copy-dist"], function() {
    var tsResult = gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/amd/fluss"))
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "amd",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./build/amd/fluss"));
});

gulp.task("build-lib", function() {
    return gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/lib"));
});

gulp.task("build-commonjs", function() {
    var tsResult = gulp.src(["./src/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./build/lib"));
});


gulp.task("build-index-commonjs", ["build-commonjs"], function() {
    var tsResult = gulp.src(["./build/index.ts"])
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(gulp.dest("./build"));
});

gulp.task("build-index-amd", ["build-amd"], function() {
    var tsResult = gulp.src(["./build/amd/fluss.ts"])
        .pipe(typescript({
            module: "amd",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(gulp.dest("./build/amd"));
});


gulp.task("clean", function(cb) {
    del(["./build/**/*"], cb);
});

gulp.task("build", ["copy-dist", "build-lib", "build-amd", "build-commonjs", "build-index-commonjs", "build-index-amd"], function() {
});
