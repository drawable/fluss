/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var gulp = require('gulp');
var typescript = require('gulp-tsc');

gulp.task("compile-tsc", function() {
    gulp.src(["./src/**/*.ts"])
        .pipe(typescript({ module: "commonjs",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./src"));
});