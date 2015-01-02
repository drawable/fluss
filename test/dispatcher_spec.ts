/// <reference path="../types/mocha.d.ts" />
/// <reference path="../types/chai.d.ts" />
/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import chai = require("chai");
var expect = chai.expect;

import Dispatcher = require("../src/dispatcher");

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
        Dispatcher.reset();
    });

    it("provides a means to transport actions through the application", function() {
        Dispatcher.subscribeAction(1, handler("A", 1));
        Dispatcher.subscribeAction(1, handler("B", 1));

        Dispatcher.dispatch(1);

        expect(getCallSignature()).to.equal("A:1-B:1");
    });

    it("lets you stop handling actions", function() {
        var A = handler("A", 1);
        var B = handler("B", 1);
        Dispatcher.subscribeAction(1, A);
        Dispatcher.subscribeAction(1, B);

        Dispatcher.dispatch(1);
        expect(getCallSignature()).to.equal("A:1-B:1");

        Dispatcher.unsubscribeAction(1, A);
        Dispatcher.dispatch(1);
        expect(getCallSignature()).to.equal("A:1-B:1-B:1");
    });

    it("lets you use arbitrary parameters when calling actions", function() {
        Dispatcher.subscribeAction(1, handler("A", 1));
        Dispatcher.subscribeAction(1, handler("B", 1));

        Dispatcher.dispatch(1, "X");
        expect(getCallSignature()).to.equal("A:1=X-B:1=X");

        resetCalls();
        Dispatcher.dispatch(1, "Y", 1, "Z");
        expect(getCallSignature()).to.equal("A:1=Y,1,Z-B:1=Y,1,Z");
    });

    it("can disable actions", function() {
        Dispatcher.subscribeAction(1, handler("X", 1));
        Dispatcher.subscribeAction(1, handler("Y", 1));
        Dispatcher.subscribeAction(2, handler("X", 2));

        Dispatcher.dispatch(1);
        Dispatcher.dispatch(2);

        expect(getCallSignature()).to.equal("X:1-Y:1-X:2");

        Dispatcher.disableAction(1);
        Dispatcher.dispatch(1);
        Dispatcher.dispatch(2);

        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2");

        Dispatcher.disableAction(2);
        Dispatcher.dispatch(1);
        Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2");

        Dispatcher.enableAction(1);
        Dispatcher.dispatch(1);
        Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2-X:1-Y:1");

        Dispatcher.enableAction(2);
        Dispatcher.dispatch(1);
        Dispatcher.dispatch(2);
        expect(getCallSignature()).to.equal("X:1-Y:1-X:2-X:2-X:1-Y:1-X:1-Y:1-X:2");
    });


});
