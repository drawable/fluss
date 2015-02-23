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
        this._anyPlugins.forEach((plg) => _private(this, dowrap,action, plg))
    }
}

function subscribe(action, handler) {
    if (!this._handlers[action]) {
        this._handlers[action] = handler;
    }
}

function executeAction(args, forAction) {
    if (this._stack && this._stack.length) {
        this._streams.push("errors", new Error("Nested action calls are not supported."));
        this.abort(forAction);
        return;
    }

    this._stack = [];
    this._mementos = [];
    // We have to reread the first plugin when executing the action because other plugins might have
    // been wrapped in the meantime. Don't use plg here.
    let plugin = this._plugins[forAction];

    if (plugin && forAction !== Actions.IDs.__ANY__) {
    } else if (this._anyPlugins.length && !this._plugins[forAction]) {
        plugin = this._plugins[Actions.IDs.__ANY__]
    }

    let memento = plugin.getMemento([this, forAction].concat(args));
    plugin.run([this, forAction].concat(args));
    this._mementos.push({plugin, memento})
}

/**
 * Wraps a plugin for an action. This defines the control flow for the plugins.
 * @see   PluginCarrier
 * @param action
 * @param plugin
 */
function dowrap(action, plugin) {
    let carrier = new PluginCarrier(plugin);

    if (this._plugins[action]) {
        let inner = this._plugins[action];
        carrier.ran.combine(carrier.holding).forEach((params) => {
            let memento = inner.getMemento(params);
            inner.run(params);
            this._mementos.push({plugin: inner, memento});
        });

        inner.finished.forEach((params) => carrier.afterFinish(params));
        inner.aborted.forEach((params) => carrier.abort(this, params));
    } else {
        carrier.ran.forEach((params) => carrier.afterFinish(params));
        _private(this, subscribe, action, (args, forAction) => _private(this, executeAction, args, forAction), null);
    }

    carrier.started.forEach((params) => this._stack.push(carrier));
    carrier.finished.forEach(() => this._stack.pop());
    carrier.released.forEach((params) => carrier.afterFinish(params));
    carrier.aborted.forEach((params) => carrier.afterAbort(params));

    carrier.finished.forEach((params) => {
        let action = params[1];
        if (carrier === this._plugins[action]) {
            this._streams.push("finishedAction", action);
        }
    });

    carrier.aborted.forEach((params) => {
        let action = params[1];
        if (carrier === this._plugins[action]) {
            this._streams.push("abortedAction", action);
        }
    });

    this._plugins[action] = carrier;
    this._streams.push("addedPlugin", {action, carrier});
}


export default class Domain {

    constructor() {
        this._undoStack = [];
        this._handlers = {};
        this._plugins = {};
        this._stack = [];
        this._mementos = null;
        this._anyPlugins = [];
        this._streams = StreamProvider.createStreamProvider();

        this.errors.forEach(() => this._mementos = null);
        this.finishedAction.forEach(() => this._undoStack.push(this._mementos));
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
        this._mementos = null;
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
        if (action === Actions.IDs.UNDO) {
            this.undo();
        } else if (this._handlers[action]) {
            this._streams.push("startedAction", action);
            this._handlers[action](args, action);
        } else if (this._handlers[Actions.IDs.__ANY__]) {
            this._streams.push("startedAction", action);
            this._handlers[Actions.IDs.__ANY__](args, action);
        }
        this._mementos = null;
    }

    undo() {
        let mementos = this._undoStack.pop();
        if (mementos) {
            mementos.forEach(({plugin, memento}) => plugin.undo(this, memento));
        }
    }
}