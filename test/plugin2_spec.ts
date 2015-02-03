/// <reference path="../types/mocha.d.ts" />
/// <reference path="../types/chai.d.ts" />
/// <reference path="../types/sinon.d.ts" />
/// <reference path="../build/fluss.d.ts" />
/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import chai = require("chai");
import sinon = require("sinon");
var expect = chai.expect;


declare function require(module:string):any;
var Fluss:any = require("../build/index");


class App extends Fluss.Plugins.NewContainer {

    constructor() {
        super();

    }
}

var calls = [];
function addCall(action, info) {
    calls.push({action: action, info: info});
}

function clearCalls() {
    calls = [];
}

function getCallSignature() {
    return calls.map(function(call) {
        return "(" + call.action + ":" + call.info + ")";
    }).join("");
}


class SimplePlugin extends Fluss.Plugins.BasePlugin {

    constructor(public _name) {
        super();
    }

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
    }

    afterFinish(container:any, action:number) {
        addCall(action, "f" + "-" + this._name);
    }

    afterAbort(containter:any, action:number) {
        addCall(action, "a" + "-" + this._name);
    }

}

class PluginNeverdone extends SimplePlugin {

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        this.hold();
    }
}

class PluginWait500 extends SimplePlugin {

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        this.hold();
        var that = this;
        setTimeout(function() {
            that.release();
        }, 500)
    }
}

class PluginWaitForever extends SimplePlugin {

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        this.hold();
    }
}

class PluginWaitForeverForOneAction extends SimplePlugin {

    constructor(name: string, public actionToHold) {
        super(name);
    }

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        if (action === this.actionToHold) {
            this.hold();
        }
    }
}


class AbortingPlugin extends  SimplePlugin {

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        this.abort();
    }

}

class DispatchingPlugin extends SimplePlugin {

    public firsAction:number;

    constructor(name, public callingAction) {
        super(name);

    }

    run(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
        if (action != this.callingAction) {
            this.firsAction = action;
            var that = this;
            setTimeout(function() {
                Fluss.Dispatcher.dispatch(that.callingAction, text);

            }, 500);
            this.hold();
        } else {
            this.release(action);
            this.release(this.firsAction);
        }
    }
}


var JSApp = Fluss.Plugins.createContainer({
    info: 10
});

var PureJSPlugin = Fluss.Plugins.createPlugin({

    _name: "JS",

    constructor: function(name) {
        if (name) {
            this._name = name;
        }
    },

    run: function(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + "-" + text);
    },

    afterFinish: function(container:any, action:number) {
        addCall(action, "f" + "-" + this._name);
    },

    afterAbort: function(containter:any, action:number) {
        addCall(action, "a" + "-" + this._name);
    }
});

var PureJSPlugin2 = Fluss.Plugins.createPlugin({

    _name: "JS",

    constructor: function(name) {
        if (name) {
            this._name = name;
        }
    },

    run: function(container:any, action:number, text:string) {
        addCall(action, "r" + "-" + this._name + container.info + "-" + text);
    },

    afterFinish: function(container:any, action:number) {
        addCall(action, "f" + "-" + this._name + container.info);
    },

    afterAbort: function(containter:any, action:number) {
        addCall(action, "a" + "-" + this._name + containter.info);
    }
});


describe("Plugins2", function() {

    var app:App;

    beforeEach(function () {
        Fluss.Dispatcher.reset();
        app = new App();
        clearCalls();
    });

    afterEach(function() {
        if (app) {
            app.destroy();
        }
    });

    it("provide a means to extend a container with functionality that is triggered by actions", function() {
        var plgA = new SimplePlugin("A");

        app.wrap(1, plgA);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "Y");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-A-Y)(1:f-A)");
    });

    it("can be created easily in plain JavaScript - 1", function() {
        var plgA = new PureJSPlugin();

        app.wrap(1, plgA);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "Y");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-JS-Y)(1:f-JS)");
    });

    it("can be created easily in plain JavaScript - 2", function() {
        var plgA = new PureJSPlugin2("XY");
        var jsApp:any = new JSApp();

        jsApp.wrap(1, plgA);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "Y");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-XY10-Y)(1:f-XY10)");

        jsApp.destroy();
    });

    it("can be wrapped so that several plugins handle the same action", function() {
        var plgA = new SimplePlugin("A");
        var plgB = new SimplePlugin("B");


        app.wrap(1, plgB);
        app.wrap(1, plgA);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-A-X)(1:r-B-X)(1:f-B)(1:f-A)");
    });


    it("can be wrapped multiple times so that several plugins handle the same action", function() {
        var plgC = new SimplePlugin("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");
    });

    it("wait for 'inner' plugins to complete before they complete themselves - 1", function() {
        var plgC = new PluginNeverdone("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)");
    });

    it("wait for 'inner' plugins to complete before they complete themselves - 2", function() {
        var plgC = new SimplePlugin("C");
        var plgD = new PluginNeverdone("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)");
    });


    it("wait for 'inner' plugins to complete before they complete themselves - 3", function() {
        var clock; clock = sinon.useFakeTimers();

        var plgC = new PluginWait500("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        clock.tick(1000);
        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");
        clock.restore();
    });


    it("wait for 'inner' plugins to complete before they complete themselves - 4", function() {

        var clock = sinon.useFakeTimers();
        var plgC = new SimplePlugin("C");
        var plgD = new PluginWait500("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        clock.tick(1000);
        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");

        clock.restore()
    });

    it("can be aborted", function() {
        var plgA = new AbortingPlugin("A");

        app.wrap(1, plgA);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "Y");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-A-Y)(1:a-A)");
    });

    it("can abort the building up of the plugin chain by aborting", function () {
        var plgC = new AbortingPlugin("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgE);
        app.wrap(1, plgD);
        app.wrap(1, plgC);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-C-X)(1:a-C)");

    });

    it("can abort the call chain set up by wrapping", function() {
        var plgC = new AbortingPlugin("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:a-C)(1:a-D)(1:a-E)");
    });

    it("can abort the call chain set up by wrapping even in between the chain", function() {
        var plgC = new SimplePlugin("C");
        var plgD = new AbortingPlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);  // This will never be called because plgD will abort the processing
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");

        var cs = getCallSignature();
        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:a-D)(1:a-E)");
    });


    it("can be aborted from the outside by aborting the container", function() {
        var plgC = new SimplePlugin("C");
        var plgD = new PluginWaitForever("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        Fluss.Dispatcher.getDispatcher().dispatchAction(1, "X");
        app.abort();
        var cs = getCallSignature();
        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:a-D)(1:a-E)");
    });

    it("can handle any action", function() {
        var anyA = new SimplePlugin("A");

        app.wrap(Fluss.BaseActions.ACTIONS.__ANY__, anyA);

        Fluss.Dispatcher.dispatch(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");
    });

    it("can wrap a specific action and any-plugins are still called", function() {
        var anyA = new SimplePlugin("A");
        var specB = new SimplePlugin("B");

        app.wrap(Fluss.BaseActions.ACTIONS.__ANY__, anyA);
        app.wrap(1, specB);

        Fluss.Dispatcher.dispatch(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");

        clearCalls();
        Fluss.Dispatcher.dispatch(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)");
    });

    it("can handle any action wrapped around a specific action", function() {
        var anyA = new SimplePlugin("A");
        var specB = new SimplePlugin("B");
        var anyC = new SimplePlugin("C");

        app.wrap(Fluss.BaseActions.ACTIONS.__ANY__, anyA);
        app.wrap(1, specB);

        Fluss.Dispatcher.dispatch(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");

        clearCalls();
        Fluss.Dispatcher.dispatch(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)");

        app.wrap(Fluss.BaseActions.ACTIONS.__ANY__, anyC);
        clearCalls();
        Fluss.Dispatcher.dispatch(42, "X");
        cs = getCallSignature();
        expect(cs).to.equal("(42:r-C-X)(42:r-A-X)(42:f-A)(42:f-C)");

        clearCalls();
        Fluss.Dispatcher.dispatch(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-C-Z)(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)(1:f-C)");
    });

    it("can handle actions within actions they are handling themselves", function() {
        var clock = sinon.useFakeTimers();

        var callA = new DispatchingPlugin("A", 2);
        var simpleB = new SimplePlugin("B");

        app.wrap(1, callA);     // Index 1
        app.wrap(1, simpleB);   // Index 0
        app.wrap(2, callA);

        Fluss.Dispatcher.dispatch(1, "W");

        clock.tick(5000);

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-B-W)(1:r-A-W)(2:r-A-W)(2:f-A)(1:f-A)(1:f-B)");

        clock.restore()
    });

    it("can handle actions within actions they are handling themselves - 2", function() {
        var clock = sinon.useFakeTimers();

        var waitA = new PluginWaitForeverForOneAction("A", 1);
        var simpleB = new SimplePlugin("B");

        app.wrap(1, waitA);     // Index 1
        app.wrap(1, simpleB);   // Index 0
        app.wrap(2, waitA);

        Fluss.Dispatcher.dispatch(1, "W");
        Fluss.Dispatcher.dispatch(2, "X");
        app.abort(1);
        Fluss.Dispatcher.dispatch(2, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-B-W)(1:r-A-W)(2:r-A-X)(2:f-A)(1:a-A)(1:a-B)(2:r-A-X)(2:f-A)");

        clock.restore()

    });
});
