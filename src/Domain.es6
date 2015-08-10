/**
 * Created by Stephan on 22.02.2015.
 */


import * as Stream from './Stream';
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

    if (this._createMementos) {
        let memento = plugin.getMemento([this, forAction].concat(args));
        if (typeof memento !== "undefined" && memento != null) {
            this._mementos.unshift({plugin, memento});
        }
    }

    plugin.run([this, forAction].concat(args))
}

/**
 * Wraps a plugin for an action. This defines the control flow for the plugins.
 * @see   PluginCarrier
 * @param action
 * @param plugin
 */
function dowrap(action, plugin) {
    let carrier = new PluginCarrier(plugin);

    if (!this._plugins) {
        throw new Error("Domain not properly initialized. Did you call 'super()' in the constuctor?")
    }

    if (this._plugins[action]) {
        let inner = this._plugins[action];
        carrier.ran.combine(carrier.holding).forEach((params) => {
            if (this._createMementos) {
                let memento = inner.getMemento(params);
                if (typeof memento !== "undefined" && memento != null) {
                    this._mementos.unshift({plugin: inner, memento});
                }
            }
            inner.run(params);
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

    this._streams.relay(carrier.errors, "errors");

    this._plugins[action] = carrier;
    this._streams.push("addedPlugin", {action, carrier});
}


/**
 * A domain groups all the actions and their behaviour (using plugins) into one object. It is created for a special
 * domain of the application. That can be frontend and backend or more finely partitioned aspects of functional concern
 * within the application.
 */
export default class Domain {

    constructor() {
        this._undoStack = [];
        this._handlers = {};
        this._plugins = {};
        this._stack = [];
        this._mementos = null;
        this._anyPlugins = [];
        this._streams = StreamProvider.create();
        this._createMementos = true;

        this._execution = Stream.create();

        this._execution.forEach((action, ...args) => {
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
        });

        this.errors.forEach(() => this._mementos = null);
        this.finishedAction.forEach(() => {
          if (this._mementos && this._mementos.length)
            this._undoStack.push(this._mementos);
        });
    }

    /**
     * Free memory
     */
    dispose() {
        this._plugins = null;
        this._stack = null;
        this._mementos = null;
        this._anyPlugins = null;
        this._handlers = null;
        this._undoStack = null;
        this._streams.dispose();
        this._streams = null;

        this._execution.close();
        this._execution = null;
    }

    /**
     * Stream that processes whenever a plugin is added to the domain
     * @returns {*}
     */
    get addedPlugin() {
        return this._streams.newStream("addedPlugin");
    }

    /**
     * Stream that processes whenever an action leads to an error.
     * @returns {*}
     */
    get errors() {
        return this._streams.newStream("errors");
    }

    /**
     * Stream that processes whenever an action is started
     * @returns {*}
     */
    get startedAction() {
        return this._streams.newStream("startedAction");
    }

    /**
     * Stream that processes whenever an action is finished
     * @returns {*}
     */
    get finishedAction() {
        return this._streams.newStream("finishedAction");
    }

    /**
     * Stream that processes whenever an action is aborted
     * @returns {*}
     */
    get abortedAction() {
        return this._streams.newStream("abortedAction");
    }


    /**
     * Tests if the domain provides at least one plugin that executes the given
     * action. This does NOT test for "any"-plugins, only for plugins specific
     * to this action.
     *
     * @param action
     * @returns {boolean}
     */
    providesAction(action) {
        return !!this._handlers[action]
    }


    /**
     * Returns a function that executes the given action on the domain this method is called on.
     * @param action
     * @returns {function(this:Domain)}
     */
    action(action) {
        return this.execute.bind(this, action);
    }


    /**
     * Abort the currently running action
     * @param action
     */
    abort(action) {
        if (this._stack.length) {
            this._stack.pop().abort(this, action);
        }
        this._stack = [];
        this._mementos = null;
    }

    /**
     * Add a new plugin for an action. This wraps the existing plugins for that action meaning
     * It is started before the others and it ends after the others.
     * @param action
     * @param plugin
     */
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

    /**
     * Execute an action
     * @param action
     * @param args
     */
    execute(action, ...args) {
        this._execution.push(action, ...args);
    }

    disableMementos() {
        this._createMementos = false;
    }

    enableMementos() {
        this._createMementos = true;
    }

    /**
     * Undo whatever is on the undostack
     */
    undo() {
        let mementos = this._undoStack.pop();
        if (mementos) {
            mementos.forEach(({plugin, memento}) => plugin.undo(this, memento));
        }
    }
}