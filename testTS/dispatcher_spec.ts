/// <reference path="../types/mocha.d.ts" />
/// <reference path="../types/chai.d.ts" />
/// <reference path="../build/fluss.d.ts" />

/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import chai = require("chai");
var expect = chai.expect;

declare function require(module:string):any;
var Fluss:any = require("../build/index");


var calledActions = [];

function resetCalls() {
    calledActions = [];
}

function getCallSignature() {
    return calledActions.map(function(a) {
        var r = a.name + ":" + a.action;
        if (a.args && a.args.length) {
            r += "=" + a.args.join(",");
        }
        return r;
    }).join("-");
}

var handler = function(name:string, action:number) {
    return function(...args:any[]) {
        calledActions.push({name:name, action:action, args:args});
    }
};

describe("Dispatcher", function() {

    beforeEach(function() {
        resetCalls();
        Fluss.Dispatcher.reset();
    });

    it("provides a means to transport actions through the application", function() {
        Fluss.Dispatcher.subscribeAction(1, handler("A", 1));
        Fluss.Dispatcher.subscribeAction(1, handler("B", 1));

        Fluss.Dispatcher.dispatch(1);

        expect(getCallSignature()).to.equal("A:1-B:1");
    });

    it("lets you stop handling actions", function() {
        var A = handler("A", 1);
        var B = handler("B", 1);
        Fluss.Dispatcher.subscribeAction(1, A);
        Fluss.Dispatcher.subscribeAction(1, B);

        Fluss.Dispatcher.dispatch(1);
        expect(getCallSignature()).to.equal("A:1-B:1");

        Fluss.Dispatcher.unsubscribeAction(1, A);
        Fluss.Dispatcher.dispatch(1);
        expect(getCallSignature()).to.equal("A:1-B:1-B:1");
    });

    it("lets you use arbitrary parameters when calling actions", function() {
        Fluss.Dispatcher.subscribeAction(1, handler("A", 1));
        Fluss.Dispatcher.subscribeAction(1, handler("B", 1));

        Fluss.Dispatcher.dispatch(1, "X");
        expect(getCallSignature()).to.equal("A:1=X-B:1=X");

        resetCalls();
        Fluss.Dispatcher.dispatch(1, "Y", 1, "Z");
        expect(getCallSignature()).to.equal("A:1=Y,1,Z-B:1=Y,1,Z");
    });

    it("can disable actions", function() {
        Fluss.Dispatcher.subscribeAction(1, handler("X", 1));
        Fluss.Dispatcher.subscribeAction(1, handler("Y", 1));
        Fluss.Dispatcher.subscribeAction(2, handler("X", 2));

        Fluss.Dispatcher.dispatch(1);
        Fluss.Dispatcher.dispatch(2);

        expect(getCallSignature()).to.equal("X:1-Y:1-X:2");

        Fluss.Dispatcher.disableAction(1);
        Fluss.Dispatcher.dispatch(1);
        Fluss.Dispatcher.dispatch(2);

        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2");

        Fluss.Dispatcher.disableAction(2);
        Fluss.Dispatcher.dispatch(1);
        Fluss.Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2");

        Fluss.Dispatcher.enableAction(1);
        Fluss.Dispatcher.dispatch(1);
        Fluss.Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2-X:1-Y:1");

        Fluss.Dispatcher.enableAction(2);
        Fluss.Dispatcher.dispatch(1);
        Fluss.Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2-X:1-Y:1-X:1-Y:1-X:2");
    });


});
