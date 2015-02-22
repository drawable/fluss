/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

import * as Actions from './Actions';
import PluginCarrier from './PluginCarrier';
import * as StreamProvider from './StreamProvider';

let _private = (obj, func, ...args) => func.apply(obj, args);


function wrapAnyPluginsForAction(action) {
    if (!this._plugins[action]) {
        this._anyPlugins.forEach((plg) => this.dowrap(action, plg))
    }
}

function subscribe(action, handler) {
    if (!this._handlers[action]) {
        this._handlers[action] = handler;
    }
}

function dowrap(action, plugin) {
    let plg = new PluginCarrier(plugin);
    var that = this;

    if (this._plugins[action]) {
        var next = this._plugins[action];
        plg.done.combine(plg.holding).forEach((params) => next.run(params));

        next.finished.forEach((params) => {
            this._stack.pop();
            plg.afterFinish(params);
        });
        next.aborted.forEach((params) => plg.abort.apply(plg, params));
    } else {
        // First plugin for that action
        plg.done.forEach((params) => plg.afterFinish(params));

        _private(this, subscribe, action, (args) => {
                if (this._stack && this._stack.length) {
                    this._streams.push("errors", new Error("Nested action calls are not supported."));
                    this.abort(action);
                    return;
                }

                this._stack = [];
                // We have to reread the first plugin when executing the action because other plugins might have
                // been wrapped in the meantime. Don't use plg here.
                var plugin = this._plugins[action];

                if (plugin && action !== Actions.IDs.__ANY__) {
                    let memento = plugin.getMemento([this, action].concat(args));
                    plugin.run([this, action].concat(args));
                }
                else if (this._anyPlugins.length) {
                    var act = args.shift();
                    if (!this._plugins[act]) {
                        this._plugins[Actions.IDs.__ANY__].run([this, act].concat(args));
                    }
                }
            }
            ,
            null
        )
        ;
    }

    this._streams.relay(plg.errors, "errors");

    plg.released.forEach(function (params) {
        plg.afterFinish(params);
    });

    plg.aborted.forEach(function (params) {
        plg.afterAbort(params);
    });

    plg.started.forEach(function () {
        that._stack.push(plg);
    });

    this._plugins[action] = plg;

    plg.done.forEach(function (params) {
        plg.afterFinish(params);
    }).until(that.addedPlugin.filter(function (a) {
        return a === action;
    }));

    plg.finished.combine(plg.aborted).forEach(function (params) {
        console.log("Done", JSON.stringify(params))
        that._stack = [];
    }).until(that.addedPlugin.filter(function (a) {
        return a === action;
    }));

    this._streams.push("addedPlugin", action);
}


export default class Domain {

    constructor() {
        this._handlers = {};
        this._plugins = {};
        this._stack = [];
        this._anyPlugins = [];
        this._streams = StreamProvider.createStreamProvider();
    }

    destroy() {
        this._plugins = null;
    }

    get addedPlugin() {
        return this._streams.newStream("addedPlugin");
    }

    get errors() {
        return this._streams.newStream("errors");
    }

    get startedAction() {
        return this._streams.newStream("startedAction");
    }

    get finishedAction() {
        return this._streams.newStream("finishedAction");
    }

    get abortedAction() {
        return this._streams.newStream("abortedAction");
    }

    abort(action) {
        if (this._stack.length) {
            this._stack.pop().abort(this, action);
        }
        this._stack = [];
    }

    wrap(action, plugin) {
        if (action === Actions.IDs.__ANY__) {
            this._anyPlugins.push(plugin);
            _private(this, dowrap, action, plugin);

            for (var a in this._plugins) {
                if (this._plugins.hasOwnProperty(a) && (a != Actions.IDs.__ANY__)) {
                    _private(this, dowrap, a, plugin);
                }
            }
        } else {
            _private(this, wrapAnyPluginsForAction, action);
            _private(this, dowrap, action, plugin);
        }
    }

    execute(action, ...args) {
        if (this._handlers[action]) {
            this._handlers[action](args);
        } else if (this._handlers[Actions.IDs.__ANY__]) {
            this._handlers[Actions.IDs.__ANY__](args);
        }
    }
}