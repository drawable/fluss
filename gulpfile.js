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
var concat = require("gulp-concat");
var modify = require("gulp-modify");
var path = require("path");
var rename = require("gulp-rename");




gulp.task("compile-source", function() {
    var tsResult = gulp.src(["./src/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./src"));
});

gulp.task("compile-test", ["compile-source"], function() {
    var tsResult = gulp.src(["./test/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./test"));
});

gulp.task("compile", ["compile-source", "compile-test"], function() {

});

gulp.task("copy-dist", function() {
   gulp.src("./dist/**/*")
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

gulp.task("build-src", function() {
    return gulp.src(["./src/**/*.ts"])
        .pipe(gulp.dest("./build/src"));
});

gulp.task("build-commonjs", function() {
    var tsResult = gulp.src(["./src/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write({ includeContent: true }))
        .pipe(gulp.dest("./build/common"));
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

gulp.task("build-dts-typefiles", function() {
    var tsResult = gulp.src("./src/**/*.ts")
        .pipe(typescript({
            module: "amd",
            target: "ES5",
            declarationFiles: true
        }));

    var reg = new RegExp(".*\\" + path.sep + "([^\\" + path.sep + "]*)\\.d\\.ts$");

    function moduleName(filePath) {
        var m = filePath.match(reg);

        var name = m[1];

        return name[0].toUpperCase() + name.substring(1);
    }

    return tsResult.dts
        .pipe(modify({
            fileModifier: function(file, content) {
                return "declare module " + moduleName(file.path) + "{\n" +
                    content.replace(/import/g, "//import")
                    + "\n}\n"
            }
        }))
        .pipe(gulp.dest("./build/type"));

});

gulp.task("build-dts",["build-dts-typefiles"], function() {
    gulp.src("./build/type/*.d.ts")
        .pipe(concat("./fluss.d.ts"))
        .pipe(modify({
           fileModifier: function(file, content) {
               return "declare module Fluss {\n" +
                        content
                    + "}\n\ndeclare module 'fluss' {\n    export = Fluss\n}"

           }
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task("clean", function(cb) {
    del(["./build/**/*"], cb);
});

gulp.task("amd", ["copy-dist", "build-amd", "build-index-amd"], function() {

});
gulp.task("commonjs", ["copy-dist", "build-commonjs", "build-index-commonjs"], function() {

});

gulp.task("build", ["copy-dist", "build-src", "amd", "commonjs"], function() {
    gulp.src("./build/index.ts")
        .pipe(rename("fluss.ts"))
        .pipe(gulp.dest("./build"));
});
