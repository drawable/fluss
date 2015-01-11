/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

require.config({
    baseUrl: "./",

    paths: {
        "libs": "" + "bower_components",
        "fluss": "" + "fluss"
    }
});

define(["libs/domready/ready", "fluss/store"], function(ready, store) {

    ready(function() {
        var array = store.array([1, 2, 3, 4]);

        array.newItems.forEach(function(update) {
            console.log(update.value, "is new!")
        });

        array.push(10);
    });

});