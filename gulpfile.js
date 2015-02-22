/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var gulp = require('gulp');
var typescript = require('gulp-typescript');
var typedoc = require("gulp-typedoc");
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var del = require("del");
var concat = require("gulp-concat-sourcemap");
var modify = require("gulp-modify");
var path = require("path");
var requirejs = require("gulp-requirejs");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");


var directories = {
    sources: "./src/**/*.ts",
    tests: "./test/**/*.ts",
    build: "./build",
    libs: "./build/lib/",

    // Order does matter. Can we automate this? The TS-Files have the reference-paths
    libFiles: [
        "tools.js",
        "stream.js",
        "store.js",
        "reactMixins.js",
        //"errors.js",
        "baseActions.js",
        "dispatcher.js",
        //"plugins2.js",
        "plugins.js"
    ]
};


gulp.task("copy-dist", function() {
    gulp.src(directories.sources)
        .pipe(gulp.dest(directories.build + "/src"));

    return gulp.src(["./dist/**/*", "README.md", "LICENSE"])
        .pipe(gulp.dest(directories.build));
});


/*********************************************************************
 *                            BROWSER
 *********************************************************************/


gulp.task("browser-debug", ["copy-dist"], function() {
    return gulp.src(
        directories.libFiles.map(function(file) {
            return directories.build + "/amd/" + file;
        }))
        .pipe(modify({
            fileModifier: function(flie, content) {
                return content.replace(/(define\("[^"]+",\sfunction\(\)\{\}\);)/g, "//$1")
            }
        }))
        .pipe(concat("fluss.js"))
        .pipe(modify({
            fileModifier: function(flile, content)  {
                return "!function() {\n"
                    + content.replace(/this\.__extends/g, "__extends")
                    + "\nwindow.Fluss = Fluss;\n }();"
            }
        }))
        .pipe(gulp.dest(directories.build + "/browser"));
});

gulp.task("browser", ["browser-debug"], function() {
    gulp.src(directories.build + "/browser/fluss.js")
        .pipe(uglify())
        .pipe(rename("fluss.min.js"))
        .pipe(gulp.dest(directories.build + "/browser"))
});



/*********************************************************************
 *                            AMD
 *********************************************************************/


gulp.task("module-amd", ["copy-dist"], function() {
    var tsResult = gulp.src(directories.sources)
        .pipe(typescript({
            module: "amd",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(gulp.dest(directories.build + "/amd"));
});

gulp.task("optimize-amd", ["module-amd"], function() {
        gulp.src(
                directories.libFiles.map(function(file) {
                    return directories.build + "/amd/" + file;
                }))
        .pipe(modify({
            fileModifier: function(flie, content) {
                return content.replace(/(define\("[^"]+",\sfunction\(\)\{\}\);)/g, "//$1")
            }
        }))
        .pipe(concat("index.js"))
        .pipe(modify({
            fileModifier: function(flile, content)  {
                return "define([], function() {\n"
                + content.replace(/this\.__extends/g, "__extends")
                + "\nreturn Fluss;\n });"
            }
        }))
        .pipe(gulp.dest(directories.build + "/amd"))
   //     .pipe(uglify())
   //        .pipe(rename("index.min.js"))
        .pipe(gulp.dest(directories.build + "/amd"));
});

gulp.task("amd", ["module-amd", "optimize-amd"], function() {

});


/*********************************************************************
 *                            CommonJS
 *********************************************************************/

gulp.task("index-commonjs", ["module-commonjs"], function() {
    gulp.src(directories.libFiles.map(function(file) {
        return directories.libs + file;
    }))
        .pipe(concat('index.js'))
        .pipe(gulp.dest(directories.build));
});

gulp.task("module-commonjs", function() {
    var tsResult = gulp.src(directories.sources)
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(gulp.dest(directories.build + "/lib"));
});

gulp.task("commonjs", ["module-commonjs", "index-commonjs"], function() {

});

/*********************************************************************
 *                            Docs
 *********************************************************************/

gulp.task("doc", function() {
    return gulp.src(directories.sources)
        .pipe(typedoc({
            module: "commonjs",
            out: "./doc",
            name: "fluss",
            target: "es5"
        }))
});


/*********************************************************************
 *                            Build
 *********************************************************************/

gulp.task("clean", function(cb) {
    del(["./build/**/*"], cb);
});


gulp.task("build", ["copy-dist", "amd", "commonjs", "browser"], function() {

    gulp.src(directories.build + "/index.js")
        .pipe(uglify())
        .pipe(rename("index.min.js"))
        .pipe(gulp.dest(directories.build))

});



/*********************************************************************
 *                            Development
 *********************************************************************/

gulp.task("compile-source", function() {
    var tsResult = gulp.src(directories.sources)
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
    var tsResult = gulp.src(directories.tests)
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

