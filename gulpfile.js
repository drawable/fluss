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

gulp.task("compile-tsc-amd", function() {
    gulp.src(["./src/**/*.ts"])
        .pipe(typescript({ module: "amd",
            target: "ES5",
            sourcemap: true,
            outDir: "./"
        }))
        .pipe(gulp.dest("./amd/fluss"));
});

gulp.task("bundle-todos1", function() {
    return browserify("./examples/Todos_1/application.js")
        .bundle()
        .pipe(source("todo1bundle.js"))
        .pipe(gulp.dest("./examples/Todos_1"))
});

gulp.task("bundle", function() {
    var files = fs.readdirSync("src")
        .filter(function(file) {
            return file.match(/.*\.js$/)
        })
        .map(function(file) {
            return "./src/" + file;
        });

   return browserify(files)
       .bundle()
       .pipe(source("fluss.js"))
       .pipe(gulp.dest("./dist"));
});

gulp.task("minify", ["bundle"], function() {
   return gulp.src("./dist/fluss.js")
       .pipe(uglify())
       .pipe(rename({
           suffix: ".min"
       }))
       .pipe(gulp.dest("./dist"))
});