/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var fs = require('fs')
var gulp = require('gulp');
var typescript = require('gulp-tsc');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");


gulp.task("compile-tsc", function() {
    gulp.src(["./src/**/*.ts", "./test/**/*.ts"])
        .pipe(typescript({ module: "commonjs",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./"));
});

gulp.task("build-amd", function() {
    return gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/amd/fluss"))
        .pipe(typescript({ module: "amd",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./build/amd/fluss"));
});

gulp.task("build-commonjs", function() {
    return gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/commonjs/fluss"))
        .pipe(typescript({ module: "commonjs",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./build/commonjs/fluss"));
});

gulp.task("build", ["build-amd", "build-commonjs"], function() {
    gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/lib"));

    gulp.src("README.md")
        .pipe(gulp.dest("./build"));

    gulp.src("LICENSE")
        .pipe(gulp.dest("./build"));
});

gulp.task("testbeds", ["build-amd", "build-commonjs"], function() {

});