/**
 * Created by Stephan on 22.02.2015.
 */

import Domain from '../src/Domain';
import Plugin from '../src/Plugin';
import * as Actions from '../src/Actions'
import {expect} from 'chai';
let sinon = require('sinon');


let calls = [];
function addCall(action, info) {
    calls.push({action: action, info: info});
}

function clearCalls() {
    calls = [];
}

function getCallSignature() {
    return calls.map(function (call) {
        return "(" + call.action + ":" + call.info + ")";
    }).join("");
}


class SimplePlugin extends Plugin {

    constructor(name) {
        super();
        this.name = name;
    }

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
    }

    afterFinish(container, action) {
        addCall(action, "f" + "-" + this.name);
    }

    afterAbort(containter, action) {
        addCall(action, "a" + "-" + this.name);
    }
}

class ErrorPlugin extends Plugin {
    run() {
        throw new Error("TestError");
    }
}

class PluginNeverdone extends SimplePlugin {

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
        this.hold();
    }
}

class PluginWait500 extends SimplePlugin {

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
        this.hold();
        var that = this;
        setTimeout(function () {
            that.release();
        }, 500)
    }
}


class PluginWaitForever extends SimplePlugin {

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
        this.hold();
    }
}

class PluginWaitForeverForOneAction extends SimplePlugin {

    constructor(name, actionToHold) {
        super(name);
        this.actionToHold = actionToHold;
    }

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
        if (action === this.actionToHold) {
            this.hold();
        }
    }
}


class AbortingPlugin extends SimplePlugin {

    run(container, action, text) {
        addCall(action, "r" + "-" + this.name + "-" + text);
        this.abort();
    }
}


class App extends Domain {
    constructor() {
        super();
        this.value1 = 0;
        this.value2 = 0;
    }
}

class Setter extends Plugin {

    constructor(propName, inc = 0) {
        this.propName = propName;
        this.inc = inc;
    }

    run(app, action, value) {
        app[this.propName] = value + this.inc;
    }

    getMemento(app, action, value) {
        return app[this.propName];
    }

    undo(app, memento) {
        app[this.propName] = memento;
    }
}


describe("Domain", function () {

    let app;

    beforeEach(function () {
        app = new App();
        clearCalls();
    });

    afterEach(function () {
        if (app) {
            app.dispose();
        }
    });

    it("can be created", function () {
        expect(() => new Domain()).not.to.throw;
    });

    it("provide a means to extend a container with functionality that is triggered by actions", function () {
        var plgA = new SimplePlugin("A");

        app.wrap(1, plgA);
        app.execute(1, "Y");
        var cs = getCallSignature();
        expect(cs).to.equal("(1:r-A-Y)(1:f-A)");
    });

    it("can use a simple function to implement an action", function () {
        var localCalls = [];
        app.wrap(1, (v1, v2) => {
            localCalls.push({v1: v1, v2: v2})
        });


        app.execute(1, "A", 12);

        expect(localCalls.length).to.equal(1);
        expect(localCalls[0].v1).to.equal("A");
        expect(localCalls[0].v2).to.equal(12);
    });

    it("provides simple functions to execute specific actions", () => {
        var localCalls = [];
        app.wrap(1, (v1, v2) => {
            localCalls.push({v1: v1, v2: v2})
        });


        let ac = app.action(1);

        ac("A", 12);

        expect(localCalls.length).to.equal(1);
        expect(localCalls[0].v1).to.equal("A");
        expect(localCalls[0].v2).to.equal(12);
    });

    it("can be wrapped so that several plugins handle the same action", function () {
        var finished = -100;

        var plgA = new SimplePlugin("A");
        var plgB = new SimplePlugin("B");

        app.finishedAction.forEach((action) =>  {
            finished = action
        });

        app.wrap(1, plgB);
        app.wrap(1, plgA);

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-A-X)(1:r-B-X)(1:f-B)(1:f-A)");
        expect(finished).to.equal(1);
    });

    it("handles errors in plugins gracefully", () => {
       var plg = new ErrorPlugin();

        app.wrap(1, plg);
        app.execute(1);
        app.execute(1);
    });

    it("can be wrapped multiple times so that several plugins handle the same action", function () {
        var plgC = new SimplePlugin("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");

        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");
    });

    it("wait for 'inner' plugins to complete before they complete themselves - 1", function () {
        var finished = -100;
        var plgC = new PluginNeverdone("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");

        app.finishedAction.forEach((action) =>  {
            finished = action
        });

        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)");
        expect(finished).to.equal(-100);
    });

    it("wait for 'inner' plugins to complete before they complete themselves - 2", function () {
        var finished = -100;
        var plgC = new SimplePlugin("C");
        var plgD = new PluginNeverdone("D");
        var plgE = new SimplePlugin("E");

        app.finishedAction.forEach((action) =>  {
            finished = action
        });

        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)");
        expect(finished).to.equal(-100);
    });


    it("wait for 'inner' plugins to complete before they complete themselves - 3", function () {
        var clock;
        clock = sinon.useFakeTimers();

        var plgC = new PluginWait500("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        clock.tick(1000);
        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");
        clock.restore();
    });


    it("wait for 'inner' plugins to complete before they complete themselves - 4", function () {

        var clock = sinon.useFakeTimers();
        var plgC = new SimplePlugin("C");
        var plgD = new PluginWait500("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        clock.tick(1000);
        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:f-D)(1:f-E)");

        clock.restore()
    });

    it("can be aborted", function () {
        var plgA = new AbortingPlugin("A");

        app.wrap(1, plgA);

        app.execute(1, "Y");

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

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-C-X)(1:a-C)");

    });

    it("can abort the call chain set up by wrapping", function () {
        var plgC = new AbortingPlugin("C");
        var plgD = new SimplePlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        var cs = getCallSignature();

        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:a-C)(1:a-D)(1:a-E)");
    });

    it("can abort the call chain set up by wrapping even in between the chain", function () {
        var plgC = new SimplePlugin("C");
        var plgD = new AbortingPlugin("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);  // This will never be called because plgD will abort the processing
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");

        var cs = getCallSignature();
        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:a-D)(1:a-E)");
    });


    it("can be aborted from the outside by aborting the container", function () {
        var plgC = new SimplePlugin("C");
        var plgD = new PluginWaitForever("D");
        var plgE = new SimplePlugin("E");


        app.wrap(1, plgC);
        app.wrap(1, plgD);
        app.wrap(1, plgE);

        app.execute(1, "X");
        app.abort();
        var cs = getCallSignature();
        expect(cs).to.equal("(1:r-E-X)(1:r-D-X)(1:r-C-X)(1:f-C)(1:a-D)(1:a-E)");
    });

    it("can handle any action", function () {
        var anyA = new SimplePlugin("A");

        app.wrap(Actions.IDs.__ANY__, anyA);

        app.execute(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");
    });

    it("can wrap a specific action and any-plugins are still called", function () {
        var anyA = new SimplePlugin("A");
        var specB = new SimplePlugin("B");

        app.wrap(Actions.IDs.__ANY__, anyA);
        app.wrap(1, specB);

        app.execute(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");

        clearCalls();
        app.execute(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)");
    });

    it("can handle any action wrapped around a specific action", function () {
        var anyA = new SimplePlugin("A");
        var specB = new SimplePlugin("B");
        var anyC = new SimplePlugin("C");

        app.wrap(Actions.IDs.__ANY__, anyA);
        app.wrap(1, specB);

        app.execute(42, "X");
        var cs = getCallSignature();
        expect(cs).to.equal("(42:r-A-X)(42:f-A)");

        clearCalls();
        app.execute(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)");

        app.wrap(Actions.IDs.__ANY__, anyC);
        clearCalls();
        app.execute(42, "X");
        cs = getCallSignature();
        expect(cs).to.equal("(42:r-C-X)(42:r-A-X)(42:f-A)(42:f-C)");

        clearCalls();
        app.execute(1, "Z");
        cs = getCallSignature();
        expect(cs).to.equal("(1:r-C-Z)(1:r-B-Z)(1:r-A-Z)(1:f-A)(1:f-B)(1:f-C)");
    });

    it("provides mementos for undoing actions - 1", function() {
        let setter1 = new Setter("value1");

        let initial = app.value1;

        app.wrap(1, setter1);
        app.execute(1, initial + 10);
        expect(app.value1).to.equal(initial + 10);

        app.undo();
        expect(app.value1).to.equal(initial);

        app.execute(1, initial + 10);
        expect(app.value1).to.equal(initial + 10);
        app.execute(1, initial + 11);
        expect(app.value1).to.equal(initial + 11);
        app.execute(1, initial + 12);
        expect(app.value1).to.equal(initial + 12);

        app.undo();
        expect(app.value1).to.equal(initial + 11);
        app.execute(Actions.IDs.UNDO);
        expect(app.value1).to.equal(initial + 10);
        app.undo();
        expect(app.value1).to.equal(initial);
    });

    it("provides mementos for undoing actions - 2", function() {
        let setter1 = new Setter("value1");
        let setter2 = new Setter("value2");

        let initial1 = app.value1 = 10;
        let initial2 = app.value2 = 13;

        app.wrap(1, setter1);
        app.wrap(1, setter2);

        app.execute(1, initial1 + 10);
        expect(app.value1).to.equal(initial1 + 10);
        expect(app.value2).to.equal(initial1 + 10);

        app.undo();
        expect(app.value1).to.equal(initial1);
        expect(app.value2).to.equal(initial2);
    });

    it("provides mementos for undoing actions - 3", function() {
        let setter1 = new Setter("value1", 5);
        let setter2 = new Setter("value1");

        let initial = app.value1 = 10;

        app.wrap(1, setter1);
        app.wrap(1, setter2);

        app.execute(1, initial + 10);
        expect(app.value1).to.equal(initial + 15);

        app.undo();
        expect(app.value1).to.equal(initial);
    })
});