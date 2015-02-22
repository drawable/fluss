/// <reference path="./stream.ts" />
/**
 * Created by Stephan on 10.01.2015.
 */

"use strict";

module Fluss {

    export module ReactMixins {
        export var componentLifecycle = {

            _willUnmount:null,

            componentDidMount: function() {
                this._willUnmount = Stream.createStream("component-unmount");
            },

            componentWillUnmount: function() {
                this._willUnmount.push(true);
                this._willUnmount.dispose();
            }
        };
    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.ReactMixins = Fluss.ReactMixins;
}
