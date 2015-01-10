/**
 * Created by Stephan on 10.01.2015.
 */

"use strict";

import Stream = require("./stream");

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