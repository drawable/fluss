/**
 * Created by Stephan on 16.01.2015.
 */

"use strict";

define(function(require) {
    return {
        Tools: require("./tools"),
        Emitter: require("./emitter"),
        Stream: require("./stream"),
        Store: require("./store"),
        ReactMixins: require("./reactMixins"),
        EventChannel: require("./eventChannel"),
        Errors: require("./errors"),
        BaseActions: require("./baseActions"),
        Dispatcher: require("./dispatcher"),
        Plugins: require("./plugins")
    }
});