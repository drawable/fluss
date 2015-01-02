/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var gulp = require('gulp');
var typescript = require('gulp-tsc');
var browserify = require('browserify');
var source = require('vinyl-source-stream');


gulp.task("compile-tsc", function() {
    gulp.src(["./src/**/*.ts"])
        .pipe(typescript({ module: "commonjs",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./src"));
});

gulp.task("bundle-todos1", function() {
    return browserify("./examples/Todos_1/application.js")
        .bundle()
        .pipe(source("todo1bundle.js"))
        .pipe(gulp.dest("./examples/Todos_1"))
});