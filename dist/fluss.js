(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
* Created by Stephan.Smola on 28.10.2014.
*/
"use strict";
var Dispatcher = require("./dispatcher");

(function (ACTIONS) {
    ACTIONS[ACTIONS["__ANY__"] = 0] = "__ANY__";
    ACTIONS[ACTIONS["UNDO"] = 1] = "UNDO";
})(exports.ACTIONS || (exports.ACTIONS = {}));
var ACTIONS = exports.ACTIONS;

exports.firstAction = 1000;

/**
* Generic action trigger that can be fed by passing the action id and parameters.
* Can be used in situations where actions are triggered based on a configuration.
*
* Explicit Functions are recommended for all actions, because they make coding easier
* and code more readable
*
* @param action
* @param args
*/
function triggerAction(action) {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
    }
    Dispatcher.getDispatcher().dispatchAction.apply(Dispatcher.getDispatcher(), [action].concat(args));
}
exports.triggerAction = triggerAction;

function undo() {
    Dispatcher.getDispatcher().dispatchAction(1 /* UNDO */);
}
exports.undo = undo;
//# sourceMappingURL=baseActions.js.map

},{"./dispatcher":undefined}],2:[function(require,module,exports){
/**
* Created by Stephan.Smola on 28.10.2014.
*/
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Errors = require("./errors");
var EventChannel = require("./eventChannel");
var Actions = require("./baseActions");




/**
* Create a memento object.
* @param instance
* @param data
* @param redo
* @param undo      Optionally you can provide an action for undoing, if that is simpler than storing data
* @returns {{data: any, redo: IAction, instance: IUndoable}}
*/
function createMemento(instance, data) {
    return {
        action: -1,
        data: data,
        redo: null,
        undo: null,
        instance: instance
    };
}
exports.createMemento = createMemento;

/**
* Create a redo object.
* @param action
* @param data
* @returns {{action: number, data: any}}
*/
function createRedo(action, data) {
    return {
        action: action,
        data: data
    };
}
exports.createRedo = createRedo;

function createUndoAction(action) {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
    }
    return {
        action: -1,
        data: null,
        redo: null,
        undo: {
            action: action,
            data: args
        },
        instance: null
    };
}
exports.createUndoAction = createUndoAction;


/**
* Events that are raised by the undo manager.
*/
(function (EVENTS) {
    EVENTS[EVENTS["UNDO"] = 0] = "UNDO";
    EVENTS[EVENTS["REDO"] = 1] = "REDO";
    EVENTS[EVENTS["MEMENTO_STORED"] = 2] = "MEMENTO_STORED";
    EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
})(exports.EVENTS || (exports.EVENTS = {}));
var EVENTS = exports.EVENTS;



var __ANY_ACTION___ = 0;

/**
* Implementation of a dispatcher as described by the FLUX pattern.
*/
var Dispatcher = (function () {
    function Dispatcher() {
        this._handlers = {};
        this._dispatching = false;
        this._undoing = false;
        this._disabled = {};
    }
    Dispatcher.prototype.destroy = function () {
        this._handlers = {};
        this._dispatching = false;
        this._undoing = false;
        this._disabled = {};
    };

    Object.defineProperty(Dispatcher.prototype, "undoing", {
        get: function () {
            return this._undoing;
        },
        enumerable: true,
        configurable: true
    });

    /**
    * The actual dispatch
    * @param doMemento
    * @param type
    * @param args
    */
    Dispatcher.prototype.dispatch = function (doMemento, type, args) {
        try  {
            var mementos = [];
            var that = this;

            var doit = function (__type, dispatch, trueType) {
                if (that._handlers[__type]) {
                    that._handlers[__type].forEach(function (d) {
                        if (doMemento && d[1]) {
                            var memento = d[1].apply(that, [trueType || __type].concat(args));
                            if (memento) {
                                if (Object.prototype.toString.call(memento) === "[object Array]") {
                                    Array.prototype.push.apply(mementos, memento);
                                } else {
                                    mementos.push(memento);
                                }
                            }
                        }
                        dispatch(d[0], args);
                    });
                }
            };

            doit(type, function (handler, args) {
                handler.apply(this, args);
            });

            doit(__ANY_ACTION___, function (handler, args) {
                handler.apply(this, [type, args]);
            }, type);

            if (mementos.length) {
                exports.getUndoManager().storeMementos(mementos, type, exports.createRedo(type, args));
            }
        } catch (e) {
            var msg = "Internal error. If this happens please check if it was a user error \n" + "that can be either prevented or gracefully handled.\n\n";
            msg += "Handled action: " + type + "\n";
            msg += "Create memento: " + (doMemento ? "yes\n" : "no\n");

            var argStr = "";

            try  {
                argStr = JSON.stringify(args, null, 2);
            } catch (e) {
                argStr = "It's a circular structure :-(";
            }

            msg += "Arguments     : " + argStr + "\n";
            msg += "Mementos      : " + (mementos ? JSON.stringify(mementos, null, 2) : "none") + "\n";
            msg += "Exception     : " + e.message + "\n";
            msg += "Stack trace   :\n" + e.stack + "\n";

            console.log(msg);

            Errors.framework(e.message, e, that);
        }
    };

    /**
    * Dispatch an undo action. This is basically the same as dispatching a regular
    * action, but the memento will not be created.
    * @param type
    * @param args
    */
    Dispatcher.prototype.dispatchUndoAction = function (action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if (!this._disabled[action]) {
            this._undoing = true;
            try  {
                this.dispatch(false, action, args);
            } finally {
                this._undoing = false;
            }
        }
    };

    /**
    * Dispatch, i.e. broadcast an action to anyone that's interested.
    * @param type
    * @param data
    */
    Dispatcher.prototype.dispatchAction = function (action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if (!this._disabled[action]) {
            this.dispatch(true, action, args);
        }
    };

    /**
    * Subscribe to an action.
    * @param action
    * @param handler
    * @param mementoProvider
    */
    Dispatcher.prototype.subscribeAction = function (action, handler, mementoProvider) {
        if (!this._handlers[action]) {
            this._handlers[action] = [];
        }

        if (this._handlers[action].indexOf(handler) === -1) {
            this._handlers[action].push([handler, mementoProvider]);
        }
    };

    /**
    * Unsubscribe an action handler. This removes a potential mementoProvider also.
    * @param action
    * @param handler
    */
    Dispatcher.prototype.unsubscribeAction = function (action, handler) {
        if (this._handlers[action]) {
            for (var i = 0; i < this._handlers[action].length; i++) {
                if (this._handlers[action][i][0] === handler) {
                    this._handlers[action].splice(i, 1);
                    return;
                }
            }
        }
    };

    Dispatcher.prototype.disableAction = function (action) {
        this._disabled[action] = true;
    };

    Dispatcher.prototype.enableAction = function (action) {
        if (this._disabled[action]) {
            delete this._disabled[action];
        }
    };
    return Dispatcher;
})();

var dispatcher = new Dispatcher();

function getDispatcher() {
    return dispatcher;
}
exports.getDispatcher = getDispatcher;

function dispatch(action) {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
    }
    dispatcher.dispatchAction.apply(dispatcher, [action].concat(args));
}
exports.dispatch = dispatch;

function subscribeAction(action, handler, mementoProvider) {
    dispatcher.subscribeAction(action, handler, mementoProvider);
}
exports.subscribeAction = subscribeAction;

function unsubscribeAction(action, handler) {
    dispatcher.unsubscribeAction(action, handler);
}
exports.unsubscribeAction = unsubscribeAction;

function disableAction(action) {
    dispatcher.disableAction(action);
}
exports.disableAction = disableAction;

function enableAction(action) {
    dispatcher.enableAction(action);
}
exports.enableAction = enableAction;

/**
* Resets everything. No previously subscribed handler will be called.
*/
function reset() {
    dispatcher.destroy();
    dispatcher = new Dispatcher();
}
exports.reset = reset;

/**
* Undo manager implementations. It utilises two stacks (undo, redo) to provide the
* necessary means to undo and redo actions.
*/
var UndoManager = (function (_super) {
    __extends(UndoManager, _super);
    function UndoManager() {
        _super.call(this, "UndoManager");
        this.clear();

        exports.getDispatcher().subscribeAction(1 /* UNDO */, this.undo.bind(this));
    }
    /**
    * Store a memento. This is put on a stack that is used for undo
    * @param mementos
    * @param action        the action that created the memento
    * @param redo          the data that can be used to recreate the action
    */
    UndoManager.prototype.storeMementos = function (mementos, action, redo) {
        if (mementos) {
            mementos.forEach(function (m) {
                if (m) {
                    m.redo = redo;
                    m.action = action;
                }
            });

            this.mementos.push(mementos);
            this.redos = [];
            this.emit(2 /* MEMENTO_STORED */, mementos);
        }
    };

    /**
    * Undo. Pop the latest memento from the stack and restore the according object. This pushes the redo-info
    * from the memento onto the redo stack to use in redo.
    */
    UndoManager.prototype.undo = function () {
        var us = this.mementos.pop();
        if (us) {
            var redos = [];
            us.forEach(function (u, i) {
                if (u.undo) {
                    exports.getDispatcher().dispatchUndoAction.apply(exports.getDispatcher(), [u.undo.action].concat(u.undo.data));
                } else {
                    u.instance.restoreFromMemento(u);
                }

                if (!i) {
                    redos.push(u.redo);
                }
            });

            this.redos.push(redos);
            this.emit(0 /* UNDO */, us);
        }
    };

    /**
    * Redo. Pop the latest redo action from the stack and dispatch it. This does not store any undo data,
    * as the dispatcher will do that when dispatching the action.
    */
    UndoManager.prototype.redo = function () {
        var rs = this.redos.pop();
        if (rs) {
            rs.forEach(function (r) {
                exports.getDispatcher().dispatchAction.apply(exports.getDispatcher(), [r.action].concat(r.data));
            });
            this.emit(1 /* REDO */, rs);
        }
    };

    /**
    * Clear all stacks
    */
    UndoManager.prototype.clear = function () {
        this.mementos = [];
        this.redos = [];
        this.emit(3 /* CLEAR */);
    };

    UndoManager.prototype.getMementos = function () {
        return this.mementos;
    };
    return UndoManager;
})(EventChannel.ChanneledEmitter);

/**
* Singleton.
* @type {UndoManager}
*/
var um = new UndoManager();

/**
* Get the undo manager. Returns the single instance.
* @returns {UndoManager}
*/
function getUndoManager() {
    return um;
}
exports.getUndoManager = getUndoManager;
//# sourceMappingURL=dispatcher.js.map

},{"./baseActions":undefined,"./errors":undefined,"./eventChannel":undefined}],3:[function(require,module,exports){
/**
* Created by Stephan.Smola on 28.10.2014.
*/
"use strict";


/**
* An event-emitter
*/
var Emitter = (function () {
    function Emitter() {
    }
    Emitter.prototype.subscribe = function (event, handler) {
        if (!this._eventHandlers) {
            this._eventHandlers = {};
        }

        if (!this._eventHandlers[event]) {
            this._eventHandlers[event] = [];
        }

        this._eventHandlers[event].push(handler);
    };

    Emitter.prototype.unsubscribe = function (event, handler) {
        if (!this._eventHandlers) {
            return;
        }
        if (this._eventHandlers[event]) {
            this._eventHandlers[event].splice(this._eventHandlers[event].indexOf(handler), 1);
        }
    };

    Object.defineProperty(Emitter.prototype, "eventHandlers", {
        get: function () {
            return this._eventHandlers;
        },
        enumerable: true,
        configurable: true
    });

    Emitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var that = this;
        if (this._eventHandlers && this._eventHandlers[event]) {
            this._eventHandlers[event].forEach(function (handler) {
                handler.apply(that, args);
            });
        }
    };

    Emitter.prototype.relay = function (emitter, subscribingEvent, emittingEvent) {
        var that = this;
        emitter.subscribe(subscribingEvent, function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            that.emit.apply(that, [emittingEvent].concat(args));
        });
    };
    return Emitter;
})();
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map

},{}],4:[function(require,module,exports){
/**
* Created by Stephan.Smola on 30.10.2014.
*/
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EventChannel = require("./eventChannel");

(function (EVENTS) {
    EVENTS[EVENTS["ERROR"] = 0] = "ERROR";
    EVENTS[EVENTS["FATAL"] = 1] = "FATAL";
    EVENTS[EVENTS["FRAMEWORK"] = 2] = "FRAMEWORK";
    EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
})(exports.EVENTS || (exports.EVENTS = {}));
var EVENTS = exports.EVENTS;

var ErrorHandler = (function (_super) {
    __extends(ErrorHandler, _super);
    function ErrorHandler() {
        _super.call(this, "ERROR");
        /*
        if (window) {
        window.onerror = function(error, url, line) {
        this.fatal(error + "\nin: " + url + "\nline: " + line, window);
        }
        }
        */
    }
    ErrorHandler.prototype.error = function (message, that) {
        this.emit(0 /* ERROR */, message, that);
    };

    ErrorHandler.prototype.fatal = function (message, that) {
        this.emit(1 /* FATAL */, message, that);
    };

    ErrorHandler.prototype.framework = function (message, exception, that) {
        throw exception;
    };
    return ErrorHandler;
})(EventChannel.ChanneledEmitter);

var errorHandler = new ErrorHandler();
function getErrorHandler() {
    return errorHandler;
}
exports.getErrorHandler = getErrorHandler;

function error(message, that) {
    return errorHandler.error(message, that);
}
exports.error = error;

function fatal(message, that) {
    return errorHandler.fatal(message, that);
}
exports.fatal = fatal;

function framework(message, exceotion, that) {
    return errorHandler.framework(message, exceotion, that);
}
exports.framework = framework;
//# sourceMappingURL=errors.js.map

},{"./eventChannel":undefined}],5:[function(require,module,exports){
/**
* Created by Stephan.Smola on 28.10.2014.
*/
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Emitter = require("./emitter");
var Stream = require("./stream");

var EventChannel = (function () {
    function EventChannel() {
        this._eventHandlers = {};
    }
    EventChannel.prototype.subscribe = function (emitter, event, handler) {
        if (!this._eventHandlers[emitter]) {
            this._eventHandlers[emitter] = {};
        }

        if (!this._eventHandlers[emitter][event]) {
            this._eventHandlers[emitter][event] = [];
        }

        this._eventHandlers[emitter][event].push(handler);
    };

    EventChannel.prototype.unsubscribe = function (emitter, event, handler) {
        if (this._eventHandlers[emitter]) {
            if (this._eventHandlers[emitter][event]) {
                this._eventHandlers[emitter][event].splice(this._eventHandlers[emitter][event].indexOf(handler), 1);
            }
        }
    };

    EventChannel.prototype.channelEmit = function (emitter, emitterID, event, args) {
        if (this._eventHandlers && this._eventHandlers[emitterID] && this._eventHandlers[emitterID][event]) {
            this._eventHandlers[emitterID][event].forEach(function (handler) {
                handler.apply(emitter, args);
            });
        }
    };

    EventChannel.prototype.unsubscribeAll = function (emitterID) {
        delete this._eventHandlers[emitterID];
    };
    return EventChannel;
})();

var eventChannel = new EventChannel();

//export var channel:IEventChannel = eventChannel;
function getChannel() {
    return eventChannel;
}
exports.getChannel = getChannel;

function subscribe(emitter, event, handler) {
    eventChannel.subscribe(emitter, event, handler);
}
exports.subscribe = subscribe;

function unsubscribe(emitter, event, handler) {
    eventChannel.unsubscribe(emitter, event, handler);
}
exports.unsubscribe = unsubscribe;

function channelEmit(emitterID, event) {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 2); _i++) {
        args[_i] = arguments[_i + 2];
    }
    eventChannel.channelEmit(null, emitterID, event, args);
}
exports.channelEmit = channelEmit;

function unsubscribeAll(emitterID) {
    eventChannel.unsubscribeAll(emitterID);
}
exports.unsubscribeAll = unsubscribeAll;

var emitterIDs = [];


var ChanneledEmitter = (function (_super) {
    __extends(ChanneledEmitter, _super);
    function ChanneledEmitter(emitterID) {
        _super.call(this);
        this.emitterID = emitterID;

        if (emitterIDs.indexOf(emitterID) !== -1) {
            throw new Error("Duplicate emitterID. This is not supported");
        }
    }
    ChanneledEmitter.prototype.subscribe = function (event, handler) {
        _super.prototype.subscribe.call(this, event, handler);
        //console.log("Consider using the EventChannel instead of subscribing directly to the " + this.emitterID);
    };

    ChanneledEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        // No super call because passing rest parameters to a super method is kind of awkward and hacky
        // https://typescript.codeplex.com/discussions/544797
        var that = this;
        if (this.eventHandlers && this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(function (handler) {
                handler.apply(that, args);
            });
        }

        eventChannel.channelEmit(this, this.emitterID, event, args);
    };
    return ChanneledEmitter;
})(Emitter.Emitter);
exports.ChanneledEmitter = ChanneledEmitter;

var EventStream = (function (_super) {
    __extends(EventStream, _super);
    function EventStream(name, _emitterID, _event) {
        _super.call(this, name);
        this._emitterID = _emitterID;
        this._event = _event;
        this._handler = this.handleEvent.bind(this);
        exports.subscribe(this._emitterID, _event, this._handler);
    }
    EventStream.prototype.handleEvent = function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        this.push({
            emitter: this._emitterID,
            event: this._event,
            args: args
        });
    };

    EventStream.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        exports.unsubscribe(this._emitterID, this._event, this._handler);
    };
    return EventStream;
})(Stream.Stream);

/**
* Creates a stream for a channeled event. If  mor than one event is given, a combined
* stream for all events is created
*
* @param name
* @param emitterID
* @param events
* @returns {null}
*/
function createEventStream(emitterID) {
    var events = [];
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        events[_i] = arguments[_i + 1];
    }
    var stream = null;

    events.forEach(function (event) {
        var eStream = new EventStream(emitterID + "-" + event, emitterID, event);
        if (stream) {
            stream = stream.combine(eStream);
        } else {
            stream = eStream;
        }
    });

    return stream;
}
exports.createEventStream = createEventStream;
//# sourceMappingURL=eventChannel.js.map

},{"./emitter":undefined,"./stream":undefined}],6:[function(require,module,exports){
/**
* Created by Stephan on 04.01.2015.
*/
"use strict";
//# sourceMappingURL=index.js.map

},{}],7:[function(require,module,exports){
/**
* Created by stephan on 01.11.14.
*/
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Dispatcher = require("./dispatcher");
var EventChannel = require("./eventChannel");
var BaseActions = require("./baseActions");





/**
* Base implementation for a plugin. Does absolutely nothing.
*/
var BasePlugin = (function () {
    function BasePlugin() {
    }
    BasePlugin.prototype.run = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.afterFinish = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.afterAbort = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.getMemento = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        return null;
    };

    BasePlugin.prototype.restoreFromMemento = function (container, memento) {
    };

    BasePlugin.prototype.hold = function () {
    };

    BasePlugin.prototype.release = function (action) {
    };

    BasePlugin.prototype.abort = function (action) {
    };
    return BasePlugin;
})();
exports.BasePlugin = BasePlugin;

/**
* Base implementation for a plugin container.
*/
var PluginContainer = (function (_super) {
    __extends(PluginContainer, _super);
    function PluginContainer(emitterId) {
        _super.call(this, emitterId);
        this._plugins = {};
        this._anyPlugins = [];
        this._protocols = {};
        this._runningPlugins = {};
        this._mementos = {};
    }
    /**
    * http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    * @param config
    */
    PluginContainer.prototype.configure = function (config) {
        function construct(constructor, args) {
            function F() {
                constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        }

        var that = this;
        config.forEach(function (action) {
            action.plugins.forEach(function (plugin) {
                if (plugin.plugin) {
                    that.wrap(action.action, construct(plugin.plugin, plugin.parameters));
                } else {
                    that.wrap(action.action, new plugin());
                }
            });
        });
    };

    PluginContainer.prototype.destroy = function () {
        for (var action in this._plugins) {
            if (this._plugins.hasOwnProperty(action)) {
                var l = this._plugins[action].length;

                while (l--) {
                    this.detach(action, this._plugins[action][l]);
                }
            }
        }
        this._anyPlugins = [];
        this._runningPlugins = {};
        //TODO: Find a way to unsubscribe from the Dispatcher
    };

    PluginContainer.prototype.pluginDone = function (action, abort) {
    };

    PluginContainer.prototype.abortAction = function (action) {
        if (this._runningPlugins[action] && this._runningPlugins[action].length) {
            var plg = this._runningPlugins[action][this._runningPlugins[action].length - 1];

            if (plg) {
                plg.abort(action);
            }
        }

        this._runningPlugins[action] = null;
    };

    PluginContainer.prototype.abort = function (action) {
        if (typeof action === "undefined") {
            for (var actionKey in this._protocols) {
                if (this._protocols.hasOwnProperty(actionKey)) {
                    this.abortAction(actionKey);
                }
            }
        } else {
            if (this._protocols[action]) {
                this.abortAction(action);
            }
        }
    };

    /**
    * This handles an action sent by the dispatcher and delegates it to the plugins.
    * Plugins are "wrapped" around each other. They build kind of brackets defined by two of
    * their methods: run - opens the brackets
    *                finish/abort - closes the brackets.
    *
    * We'll talk about finish from now on. That can be replaced by abort everywhere. The first plugin to abort
    * forces all succeeding plugins to abort as well.
    *
    * So wrapping in the order A->B->C leads to these brackets:
    *
    *  runC-runB-runA-finishA-finishB-finishC
    *
    * finish is only called when the plugin calls the done-callback that is provided to its run-method.
    *
    * So to correctly execute this "chain" we need to wait for the plugins to call their done-callbacks before
    * we can proceed. Because the plugins may call their done-callback outside their run-method, e.g. triggered by
    * user interaction, we need to keep track of what the plugins did using a protocol.
    *
    * That protocol looks like this:
    *
    *  {
    *    i: { done: A function that calls either finish or abort on the i-th plugin,
    *         abort: did the plugin abort?
    *
    *    i+1: ...
    *  }
    *
    * this protocol is initialized by null entries for all plugins. Then the run-methods for all plugins are called, giving them a done
    * callback, that fills the protocol.
    *
    * After every run-method we check if we're at the innermost plugin (A in the example above, the one that first wrapped the action).
    * If we are, we work through the protocol as long as there are valid entries. Then we wait for the next done-callback to be called.
    *
    * @param action
    * @param args
    */
    PluginContainer.prototype.doHandleAction = function (plugins, action, args) {
        if (this._runningPlugins[action] && this._runningPlugins[action].length) {
            throw new Error("ERROR calling action " + action + ". Same action cannot be called inside itself!");
        }

        var that = this;

        var composeArgs = function (plugin, action) {
            return [that, action].concat(args);
        };

        this._mementos[action] = [];
        this._runningPlugins[action] = [];
        this._protocols[action] = [];
        plugins.forEach(function (plugin) {
            that._protocols[action].push(0);
            that._runningPlugins[action].push(plugin);
        });

        var aborted = false;
        plugins.forEach(function (plugin, i) {
            (function (index) {
                var done = function (abort, doneAction) {
                    index = that.getPluginsForAction(doneAction).indexOf(plugin);
                    that._protocols[doneAction][index] = {
                        plugin: plugin,
                        done: function (abort) {
                            if (abort) {
                                plugin.afterAbort.apply(plugin, composeArgs(plugin, doneAction));
                            } else {
                                plugin.afterFinish.apply(plugin, composeArgs(plugin, doneAction));
                            }
                        },
                        abort: abort
                    };

                    var last = that._protocols[doneAction].length;
                    while (last--) {
                        if (that._protocols[doneAction][last]) {
                            abort |= that._protocols[doneAction][last].abort;
                            that._protocols[doneAction][last].done(abort);
                            that._protocols[doneAction].pop();

                            if (that._runningPlugins[doneAction]) {
                                that._runningPlugins[doneAction].pop();
                            }
                        } else {
                            break;
                        }
                    }
                    if (!that._runningPlugins[doneAction] || !that._runningPlugins[doneAction].length) {
                        that.finalizeAction(doneAction, abort, that.getPluginsForAction(doneAction), that._mementos[doneAction], args);
                    }
                };

                var holds = false;
                var dones = {};

                plugin["hold"] = function () {
                    holds = true;
                };

                plugin["abort"] = function (abortAction) {
                    var act = typeof abortAction === "undefined" ? action : abortAction;
                    dones[act] = true;
                    done(true, act);
                    aborted = true;
                };

                plugin["release"] = function (releaseAction) {
                    var act = typeof releaseAction === "undefined" ? action : releaseAction;
                    if (dones[act]) {
                        throw new Error("Plugin released twice for action " + act + "! Possibly called release after abort or vice versa.");
                    } else {
                        done(false, act);
                        dones[act] = true;
                    }
                };

                if (!aborted) {
                    var memento = plugin.getMemento.apply(plugin, composeArgs(plugin, action));
                    if (memento) {
                        memento.instance = {
                            restoreFromMemento: function (mem) {
                                plugin.restoreFromMemento(that, mem);
                            }
                        };
                        that._mementos[action].push(memento);
                    }

                    // If we aborted: Clean up: All Plugins that where started until now (outer) will be aborted.
                    // Others that would have been started afterwards (inner) won't be called at all. (see if-statement
                    // above this comment)
                    plugin.run.apply(plugin, composeArgs(plugin, action));
                    if (aborted) {
                        var last = (that._protocols[action] && that._protocols[action].length) || 0;
                        while (last--) {
                            if (that._protocols[action][last]) {
                                that._protocols[action][last].done(true);
                                that._protocols[action].pop();
                            } else {
                                //Here we do not exit because we want to abort the whole stack
                            }
                        }
                        that.finalizeAction(action, true, that.getPluginsForAction(action), null, args);
                    } else {
                        if (!holds && !dones[action])
                            done(false, action);
                    }
                }
            })(i);
        });
    };

    PluginContainer.prototype.getPluginsForAction = function (action) {
        if (this._plugins[action] && this._plugins[action].length) {
            return this._plugins[action];
        } else if (this._anyPlugins && this._anyPlugins.length) {
            return this._anyPlugins;
        } else
            return [];
    };

    PluginContainer.prototype.handleAction = function (action, args) {
        try  {
            this.doHandleAction(this.getPluginsForAction(action), action, args);
        } catch (e) {
            this.abort();
            throw e;
        }
    };

    PluginContainer.prototype.finalizeAction = function (action, abort, plugins, mementos, args) {
        if (!abort) {
            if (mementos && mementos.length && !Dispatcher.getDispatcher().undoing) {
                Dispatcher.getUndoManager().storeMementos(mementos, action, Dispatcher.createRedo(action, args));
            }
        }
        this._mementos[action] = null;
        this._runningPlugins[action] = null;
        this._protocols[action] = null;
    };

    PluginContainer.prototype.provideMementos = function (action, plugins, args) {
        if (plugins) {
            var ret = [];
            var that = this;
            plugins.forEach(function (plugin) {
                var memento = plugin.getMemento.apply(plugin, [that, action].concat(args));
                if (memento) {
                    memento.instance = {
                        restoreFromMemento: function (mem) {
                            plugin.restoreFromMemento(that, mem);
                        }
                    };

                    ret.push(memento);
                }
            });

            if (ret.length) {
                Dispatcher.getUndoManager().storeMementos(ret, action, Dispatcher.createRedo(action, args));
            }
        }
        return null;
    };

    /**
    * This wraps the handler around the existing handlers the action, making the given handler the first to be called
    * for that action.
    *
    * If the ANY-Action is given
    *   * The handler is wrapped for every action there already is another handler
    *   * The handler is wrapped around all other any-handler, and these are called for all actions without regular handlers
    *
    * If a regular action is given and any-handlers exist the given handler is wrapped around all any-handlers for the
    * given action.
    *
    * @param action
    * @param handler
    */
    PluginContainer.prototype.wrap = function (action, handler) {
        if (action === 0 /* __ANY__ */) {
            if (this._anyPlugins.length === 0) {
                var that = this;
                Dispatcher.subscribeAction(0 /* __ANY__ */, function () {
                    var args = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        args[_i] = arguments[_i + 0];
                    }
                    var act = args.shift();
                    if (that._plugins[act]) {
                        return;
                    }
                    that.handleAction(act, args);
                }, function (type) {
                    var args = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        args[_i] = arguments[_i + 1];
                    }
                    return null;
                    /*
                    if (that._plugins[type]) {
                    return;
                    }
                    return that.provideMementos(type, args);
                    */
                });
            }

            for (var a in this._plugins) {
                if (this._plugins.hasOwnProperty(a)) {
                    this.doWrap(a, handler);
                }
            }
            this._anyPlugins.unshift(handler);
        } else {
            if (!this._plugins[action] && this._anyPlugins.length) {
                var l = this._anyPlugins.length;
                while (l--) {
                    this.doWrap(action, this._anyPlugins[l]);
                }
            }
            this.doWrap(action, handler);
        }
    };

    PluginContainer.prototype.doWrap = function (action, handler) {
        if (!this._plugins[action]) {
            this._plugins[action] = [];
            var that = this;
            Dispatcher.subscribeAction(action, function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                that.handleAction(action, args);
            }, function (type) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                return null;
            });
        }

        if (this._plugins[action].indexOf(handler) !== -1) {
            throw new Error("Plugin instances can only be used once per action!");
        }

        this._plugins[action].unshift(handler);
    };

    PluginContainer.prototype.detach = function (action, handler) {
        if (action === 0 /* __ANY__ */) {
            this._anyPlugins.splice(this._anyPlugins.indexOf(handler), 1);
            for (var a in this._plugins) {
                if (this._plugins.hasOwnProperty(a)) {
                    this._plugins[a].splice(this._plugins[a].indexOf(handler), 1);
                }
            }
        } else {
            if (this._plugins[action]) {
                this._plugins[action].splice(this._plugins[action].indexOf(handler), 1);
            }
        }
        //TODO: Do we need to unsubscribe when no plugins are there anymore? Think not.
    };
    return PluginContainer;
})(EventChannel.ChanneledEmitter);
exports.PluginContainer = PluginContainer;
//# sourceMappingURL=plugins.js.map

},{"./baseActions":undefined,"./dispatcher":undefined,"./eventChannel":undefined}],8:[function(require,module,exports){
/**
* Created by Stephan on 29.12.2014.
*/
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Tools = require("./tools");
var Stream = require("./stream");

function isStore(thing) {
    return thing instanceof RecordStore || thing instanceof ArrayStore || thing instanceof ImmutableRecord || thing instanceof ImmutableArray;
}
exports.isStore = isStore;

function createUpdateInfo(item, value, store, path) {
    var r = {
        item: item,
        value: value,
        store: store
    };

    if (path) {
        r["path"] = path;
    }

    return r;
}

var Store = (function () {
    function Store() {
        this._addItemsStreams = [];
        this._removeItemsStreams = [];
        this._updateStreams = [];
        this._disposingStreams = [];
    }
    Object.defineProperty(Store.prototype, "isImmutable", {
        get: function () {
            return false;
        },
        enumerable: true,
        configurable: true
    });

    Store.prototype.removeStream = function (list, stream) {
        var i = list.indexOf(stream);
        if (i !== -1) {
            list.splice(i, 1);
        }
    };

    Store.prototype.newItems = function () {
        var that = this;
        var s = Stream.createStream("addProperty");
        this._addItemsStreams.push(s);

        s.onClose(function () {
            that.removeStream(that._addItemsStreams, s);
        });
        return s;
    };

    Store.prototype.removedItems = function () {
        var that = this;
        var s = Stream.createStream("removeProperty");
        this._removeItemsStreams.push(s);
        s.onClose(function () {
            that.removeStream(that._removeItemsStreams, s);
        });
        return s;
    };

    Store.prototype.updates = function () {
        var that = this;
        var s = Stream.createStream("updateProperty");
        this._updateStreams.push(s);
        s.onClose(function () {
            that.removeStream(that._updateStreams, s);
        });
        return s;
    };

    Object.defineProperty(Store.prototype, "immutable", {
        get: function () {
            return null;
        },
        enumerable: true,
        configurable: true
    });

    Store.prototype.disposing = function () {
        var that = this;
        var s = Stream.createStream("disposing");
        this._disposingStreams.push(s);

        s.onClose(function () {
            that.removeStream(that._disposingStreams, s);
        });
        return s;
    };

    Store.prototype.disposeStreams = function (streamList) {
        streamList.forEach(function (stream) {
            stream.dispose();
        });
    };

    Store.prototype.dispose = function () {
        this._disposingStreams.forEach(function (stream) {
            stream.push(true);
        });

        this.disposeStreams(this._disposingStreams);
        this.disposeStreams(this._updateStreams);
        this.disposeStreams(this._addItemsStreams);
        this.disposeStreams(this._removeItemsStreams);
    };
    return Store;
})();

var ImmutableStore = (function (_super) {
    __extends(ImmutableStore, _super);
    function ImmutableStore() {
        _super.apply(this, arguments);
    }
    return ImmutableStore;
})(Store);

var RecordStore = (function (_super) {
    __extends(RecordStore, _super);
    function RecordStore(initial) {
        _super.call(this);
        this._data = {};
        this._subStreams = {};

        if (initial) {
            for (var prop in initial) {
                if (initial.hasOwnProperty(prop)) {
                    this.addItem(prop, initial[prop]);
                }
            }
        }
    }
    RecordStore.prototype.checkNameAllowed = function (name) {
        return true;
    };

    RecordStore.prototype.setupSubStream = function (name, value) {
        this.disposeSubStream(name);
        if (exports.isStore(value)) {
            var subStream;
            var that = this;
            subStream = value.updates();
            subStream.forEach(function (update) {
                var info = createUpdateInfo(update.item, update.value, update.store, update.path ? name + "." + update.path : name + "." + update.item);
                that._updateStreams.forEach(function (stream) {
                    stream.push(info);
                });
            });

            this._subStreams[name] = subStream;
        }
    };

    RecordStore.prototype.disposeSubStream = function (name) {
        var subStream = this._subStreams[name];
        if (subStream) {
            subStream.dispose();
        }
    };

    RecordStore.prototype.addItem = function (name, initial) {
        if (!this.checkNameAllowed(name)) {
            throw new Error("Name '" + name + "' not allowed for property of object store.");
        }

        var that = this;

        Object.defineProperty(this, name, {
            configurable: true,
            get: function () {
                return that._data[name];
            },
            set: function (value) {
                that._data[name] = value;
                var updateInfo = createUpdateInfo(name, value, that);

                that.setupSubStream(name, value);

                that._updateStreams.forEach(function (stream) {
                    stream.push(updateInfo);
                });
            }
        });

        this._data[name] = initial;

        this.setupSubStream(name, initial);

        if (this._addItemsStreams) {
            this._addItemsStreams.forEach(function (stream) {
                stream.push(createUpdateInfo(name, initial, that));
            });
        }
    };

    RecordStore.prototype.removeItem = function (name) {
        if (this._data.hasOwnProperty(name)) {
            delete this[name];
            delete this._data[name];
            var that = this;

            this.disposeSubStream(name);
            this._removeItemsStreams.forEach(function (stream) {
                stream.push(createUpdateInfo(name, null, that));
            });
        } else {
            throw new Error("Unknown property '" + name + "'.");
        }
    };

    Object.defineProperty(RecordStore.prototype, "immutable", {
        get: function () {
            if (!this._immutable) {
                this._immutable = new ImmutableRecord(this);
            }

            return this._immutable;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(RecordStore.prototype, "keys", {
        get: function () {
            var r = [];
            for (var k in this._data) {
                r.push(k);
            }

            return r;
        },
        enumerable: true,
        configurable: true
    });

    RecordStore.prototype.dispose = function () {
        var that = this;
        this.keys.forEach(function (key) {
            if (exports.isStore(that[key])) {
                that[key].dispose();
            }
            delete that[key];
        });
        this._data = null;

        _super.prototype.dispose.call(this);
    };
    return RecordStore;
})(Store);

var ImmutableRecord = (function (_super) {
    __extends(ImmutableRecord, _super);
    function ImmutableRecord(_parent) {
        _super.call(this);
        this._parent = _parent;
        var that = this;

        _parent.keys.forEach(function (key) {
            that.addItem(key);
        });

        _parent.newItems().forEach(function (update) {
            that.addItem(update.item);
        }).until(_parent.disposing());

        _parent.removedItems().forEach(function (update) {
            that.removeItem(update.item);
        }).until(_parent.disposing());
    }
    Object.defineProperty(ImmutableRecord.prototype, "isImmutable", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(ImmutableRecord.prototype, "immutable", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });

    ImmutableRecord.prototype.addItem = function (name) {
        var that = this;
        Object.defineProperty(this, name, {
            configurable: true,
            get: function () {
                if (exports.isStore(that._parent[name])) {
                    return that._parent[name].immutable;
                }
                return that._parent[name];
            },
            set: function (value) {
            }
        });
    };

    ImmutableRecord.prototype.removeItem = function (name) {
        delete this[name];
    };

    Object.defineProperty(ImmutableRecord.prototype, "keys", {
        get: function () {
            return this._parent.keys;
        },
        enumerable: true,
        configurable: true
    });

    ImmutableRecord.prototype.subscribeParentStream = function (parentStream) {
        var stream = Stream.createStream();

        parentStream.forEach(function (update) {
            stream.push(update);
        }).until(this._parent.disposing());

        var that = this;
        this._updateStreams.push(stream);
        stream.onClose(function () {
            that.removeStream(that._updateStreams, stream);
        });

        return stream;
    };

    ImmutableRecord.prototype.updates = function () {
        return this.subscribeParentStream(this._parent.updates());
    };

    ImmutableRecord.prototype.newItems = function () {
        return this.subscribeParentStream(this._parent.newItems());
    };

    ImmutableRecord.prototype.removedItems = function () {
        return this.subscribeParentStream(this._parent.removedItems());
    };

    ImmutableRecord.prototype.disposing = function () {
        return this.subscribeParentStream(this._parent.disposing());
    };
    return ImmutableRecord;
})(ImmutableStore);

function buildDeep(value) {
    function getItem(value) {
        var v;
        if (typeof value === "object") {
            if (Tools.isArray(value)) {
                v = buildArray(value);
            } else {
                v = buildRecord(value);
            }
        } else {
            v = value;
        }

        return v;
    }

    function buildArray(value) {
        var store = new ArrayStore();

        value.forEach(function (item) {
            store.push(getItem(item));
        });

        return store;
    }

    function buildRecord(values) {
        var store = new RecordStore();
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                store.addItem(key, getItem(values[key]));
            }
        }

        return store;
    }

    if (typeof value === "object") {
        if (Tools.isArray(value)) {
            return buildArray(value);
        } else {
            return buildRecord(value);
        }
    } else {
        return null;
    }
}

function record(initial) {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new RecordStore();
    }
}
exports.record = record;

var ArrayStore = (function (_super) {
    __extends(ArrayStore, _super);
    function ArrayStore(initial) {
        _super.call(this);
        this._data = initial || [];
        this._maxProps = 0;
        this.updateProperties();
        this._substreams = {};
    }
    ArrayStore.prototype.toString = function () {
        return this._data.toString();
    };

    ArrayStore.prototype.toLocaleString = function () {
        return this._data.toLocaleString();
    };

    ArrayStore.prototype.forEach = function (callbackfn, thisArg) {
        this._data.forEach(callbackfn, thisArg);
    };

    ArrayStore.prototype.every = function (callbackfn, thisArg) {
        return this._data.every(callbackfn, thisArg);
    };

    ArrayStore.prototype.some = function (callbackfn, thisArg) {
        return this._data.some(callbackfn, thisArg);
    };

    ArrayStore.prototype.indexOf = function (value) {
        if (exports.isStore(value) && value.isImmutable) {
            return this._data.indexOf(value["_parent"]);
        } else {
            return this._data.indexOf(value);
        }
    };

    ArrayStore.prototype.lastIndexOf = function (searchElement, fromIndex) {
        return this._data.lastIndexOf(searchElement, fromIndex);
    };

    ArrayStore.prototype.join = function (separator) {
        return this._data.join(separator);
    };

    ArrayStore.prototype.map = function (callbackfn, thisArg) {
        var mapped = this._data.map(callbackfn, thisArg);
        return new ArrayStore(mapped);
    };

    ArrayStore.prototype.filter = function (callbackfn, thisArg) {
        var filtered = this._data.filter(callbackfn, thisArg);
        return new ArrayStore(filtered);
    };

    ArrayStore.prototype.reduce = function (callbackfn, initialValue) {
        return this._data.reduce(callbackfn, initialValue);
    };

    ArrayStore.prototype.sort = function (compareFn) {
        var copy = this._data.map(function (item) {
            return item;
        });
        copy.sort(compareFn);
        var that = this;
        copy.forEach(function (value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        });
    };

    ArrayStore.prototype.reverse = function () {
        var copy = this._data.map(function (item) {
            return item;
        });
        copy.reverse();

        var that = this;
        copy.forEach(function (value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        });
    };

    ArrayStore.prototype.concat = function (array) {
        var newArray;
        if (array instanceof ArrayStore) {
            newArray = this._data.concat(array["_data"]);
        } else {
            newArray = this._data.concat(array);
        }
        return new ArrayStore(newArray);
    };

    ArrayStore.prototype.concatInplace = function (array) {
        if (array instanceof ArrayStore) {
            this.splice.apply(this, [this.length, 0].concat(array["_data"]));
        } else {
            this.splice.apply(this, [this.length, 0].concat(array));
        }
    };

    Object.defineProperty(ArrayStore.prototype, "length", {
        get: function () {
            return this._data.length;
        },
        enumerable: true,
        configurable: true
    });

    ArrayStore.prototype.setupSubStreams = function (item, value) {
        var that = this;
        if (exports.isStore(value)) {
            var substream = this._substreams[Tools.oid(value)];
            if (substream) {
                substream.updates.dispose();
            }

            substream = {
                updates: value.updates()
            };
            substream.updates.forEach(function (update) {
                var updateInfo = createUpdateInfo(update.item, update.value, that, update.path ? item + "." + update.path : item + "." + update.item);
                that._updateStreams.forEach(function (stream) {
                    stream.push(updateInfo);
                });
            });
            this._substreams[Tools.oid(value)] = substream;
        }
    };

    /**
    * Call after removal!
    * @param value
    */
    ArrayStore.prototype.disposeSubstream = function (value) {
        if (exports.isStore(value) && this._data.indexOf(value) === -1) {
            var subStream = this._substreams[Tools.oid(value)];
            if (subStream) {
                subStream.updates.dispose();
                delete this._substreams[Tools.oid(value)];
            }
        }
    };

    ArrayStore.prototype.updateProperties = function () {
        var that = this;
        var i;

        for (i = 0; i < this._data.length; i++) {
            that.setupSubStreams(i, this._data[i]);
        }

        for (i = this._maxProps; i < this._data.length; i++) {
            (function (index) {
                Object.defineProperty(that, "" + index, {
                    configurable: true,
                    get: function () {
                        return that._data[index];
                    },
                    set: function (value) {
                        var old = that._data[index];
                        if (value !== old) {
                            that._data[index] = value;
                            that.disposeSubstream(old);
                            that.setupSubStreams(index, value);
                            that._updateStreams.forEach(function (stream) {
                                stream.push(createUpdateInfo(index, that._data[index], that));
                            });
                        }
                    }
                });
            })(i);
        }

        this._maxProps = this._data.length;
    };

    ArrayStore.prototype.push = function () {
        var values = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            values[_i] = arguments[_i + 0];
        }
        var index = this._data.length;
        var that = this;

        values.forEach(function (value) {
            that._data.push(value);
            that._addItemsStreams.forEach(function (stream) {
                stream.push(createUpdateInfo(index, that._data[index], that));
            });
            index++;
        });

        this.updateProperties();
    };

    ArrayStore.prototype.unshift = function () {
        var values = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            values[_i] = arguments[_i + 0];
        }
        var that = this;

        var l = values.length;

        while (l--) {
            (function () {
                this._data.unshift(values[0]);
                this._newItemStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(0, that._data[0], that));
                });
            })();
        }
        this.updateProperties();
    };

    ArrayStore.prototype.pop = function () {
        var r = this._data.pop();
        var that = this;

        this.disposeSubstream(r);

        this._removeItemsStreams.forEach(function (stream) {
            stream.push(createUpdateInfo(that._data.length, null, that));
        });

        return r;
    };

    ArrayStore.prototype.shift = function () {
        var r = this._data.shift();
        var that = this;

        this.disposeSubstream(r);

        this._removeItemsStreams.forEach(function (stream) {
            stream.push(createUpdateInfo(0, null, that));
        });

        return r;
    };

    ArrayStore.prototype.splice = function (start, deleteCount) {
        var values = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            values[_i] = arguments[_i + 2];
        }
        var removed = this._data.splice.apply(this._data, [start, deleteCount].concat(values));

        var index = start;
        var that = this;

        if (that._removeItemsStreams.length) {
            removed.forEach(function (value) {
                that.disposeSubstream(value);
                that._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(index, value, that));
                });
                index++;
            });
        }

        index = start;
        values.forEach(function () {
            that._addItemsStreams.forEach(function (stream) {
                stream.push(createUpdateInfo(index, that._data[index], that));
            });
            index++;
        });

        // Index is now at the first item after the last inserted value. So if deleteCount != values.length
        // the items after the insert/remove moved around
        if (deleteCount !== values.length) {
            for (index; index < this._data.length; index++) {
                that._updateStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(index, that._data[index], that));
                });
            }
        }

        this.updateProperties();
        return removed;
    };

    ArrayStore.prototype.insert = function (atIndex) {
        var values = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            values[_i] = arguments[_i + 1];
        }
        this.splice.apply(this, [atIndex, 0].concat(values));
    };

    ArrayStore.prototype.remove = function (atIndex, count) {
        if (typeof count === "undefined") { count = 1; }
        return this.splice(atIndex, count);
    };

    ArrayStore.prototype.dispose = function () {
        for (var i = 0; i < this.length; i++) {
            if (exports.isStore(this[i])) {
                this[i].dispose();
            }

            delete this[i];
        }
        this._data = null;

        _super.prototype.dispose.call(this);
    };

    Object.defineProperty(ArrayStore.prototype, "immutable", {
        get: function () {
            if (!this._immutable) {
                this._immutable = new ImmutableArray(this);
            }

            return this._immutable;
        },
        enumerable: true,
        configurable: true
    });
    return ArrayStore;
})(Store);

var ImmutableArray = (function (_super) {
    __extends(ImmutableArray, _super);
    function ImmutableArray(_parent) {
        _super.call(this);
        this._parent = _parent;

        var that = this;
        _parent.newItems().forEach(function (update) {
            that.updateProperties();
        }).until(_parent.disposing());

        // We do nothing when removing items. The getter will return undefined.
        /*
        _array.removedItems().forEach(function(update) {
        
        }).until(_array.disposing());
        */
        this._maxProps = 0;
        this.updateProperties();
    }
    ImmutableArray.prototype.updateProperties = function () {
        var that = this;
        var i;

        for (i = this._maxProps; i < this._parent.length; i++) {
            (function (index) {
                Object.defineProperty(that, "" + index, {
                    configurable: true,
                    get: function () {
                        if (exports.isStore(that._parent[index])) {
                            return that._parent[index].immutable;
                        }
                        return that._parent[index];
                    },
                    set: function (value) {
                    }
                });
            })(i);
        }

        this._maxProps = this._parent.length;
    };

    ImmutableArray.prototype.toString = function () {
        return this._parent.toString();
    };

    ImmutableArray.prototype.toLocaleString = function () {
        return this._parent.toString();
    };

    ImmutableArray.prototype.forEach = function (callbackfn, thisArg) {
        return this._parent.forEach(callbackfn);
    };

    ImmutableArray.prototype.every = function (callbackfn, thisArg) {
        return this._parent.every(callbackfn);
    };

    ImmutableArray.prototype.some = function (callbackfn, thisArg) {
        return this._parent.forEach(callbackfn);
    };

    ImmutableArray.prototype.indexOf = function (value) {
        return this._parent.indexOf(value);
    };

    ImmutableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
        return this._parent.lastIndexOf(searchElement, fromIndex);
    };

    ImmutableArray.prototype.join = function (separator) {
        return this._parent.join(separator);
    };

    ImmutableArray.prototype.map = function (callbackfn, thisArg) {
        //This is dirty but anything else would be inperformant just because typescript does not have protected scope
        return this._parent["_data"].map(callbackfn);
    };

    ImmutableArray.prototype.filter = function (callbackfn, thisArg) {
        //This is dirty but anything else would be inperformant just because typescript does not have protected scope
        return this._parent["_data"].filter(callbackfn);
    };

    ImmutableArray.prototype.reduce = function (callbackfn, initialValue) {
        return this._parent.reduce(callbackfn, initialValue);
    };

    Object.defineProperty(ImmutableArray.prototype, "length", {
        get: function () {
            return this._parent.length;
        },
        enumerable: true,
        configurable: true
    });

    ImmutableArray.prototype.subscribeParentStream = function (parentStream) {
        var stream = Stream.createStream();

        parentStream.forEach(function (update) {
            stream.push(update);
        }).until(this._parent.disposing());

        var that = this;
        this._updateStreams.push(stream);
        stream.onClose(function () {
            that.removeStream(that._updateStreams, stream);
        });

        return stream;
    };

    ImmutableArray.prototype.updates = function () {
        return this.subscribeParentStream(this._parent.updates());
    };

    ImmutableArray.prototype.newItems = function () {
        return this.subscribeParentStream(this._parent.newItems());
    };

    ImmutableArray.prototype.removedItems = function () {
        return this.subscribeParentStream(this._parent.removedItems());
    };

    ImmutableArray.prototype.disposing = function () {
        return this.subscribeParentStream(this._parent.disposing());
    };

    Object.defineProperty(ImmutableArray.prototype, "immutable", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    return ImmutableArray;
})(ImmutableStore);

function array(initial) {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new ArrayStore();
    }
}
exports.array = array;
//# sourceMappingURL=store.js.map

},{"./stream":undefined,"./tools":undefined}],9:[function(require,module,exports){
/**
* Created by Stephan on 27.12.2014.
*
* A simple implementation of a collection stream that supports reactive patterns.
*
*/
"use strict";
/**
* Base implementation of the collection stream
*/
var Stream = (function () {
    function Stream(_name) {
        this._name = _name;
        this._buffer = [];
        this._methods = [];
        this._errorMethods = [];
        this._closeMethods = [];
        this._closed = false;
        this._length = 0;
        this._maxLength = 0;
    }
    Object.defineProperty(Stream.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Stream.prototype, "length", {
        get: function () {
            return this._length;
        },
        enumerable: true,
        configurable: true
    });

    Stream.prototype.callCloseMethods = function () {
        var that = this;
        this._closeMethods.forEach(function (m) {
            m.call(that);
        });
    };

    Stream.prototype.close = function () {
        if (!this._closed) {
            this._closed = true;
            this.callCloseMethods();
            this.dispose();
        }
    };

    Stream.prototype.dispose = function () {
        this.close();
        this._methods = [];
        this._buffer = [];
        this._closeMethods = [];
        this._errorMethods = [];
    };

    Stream.prototype.times = function (maxLength) {
        this._maxLength = maxLength;
        return this;
    };

    Stream.prototype.until = function (stream) {
        var that = this;
        if (stream) {
            stream.forEach(function () {
                that.close();
            });
        }

        return this;
    };

    Object.defineProperty(Stream.prototype, "closed", {
        get: function () {
            return this._closed;
        },
        enumerable: true,
        configurable: true
    });

    Stream.prototype.addToBuffer = function (value) {
        this._buffer.unshift(value);
    };

    Stream.prototype.processBuffer = function (buffer, methods, baseIndex) {
        if (this._closed)
            return null;
        if (!methods.length)
            return null;

        var l = buffer.length;
        var that = this;
        var errors = [];

        while (l--) {
            var value = buffer.pop();
            methods.forEach(function (m, i) {
                try  {
                    m.call(that, value, i + baseIndex);
                } catch (e) {
                    errors.push(e);
                }
            });
        }

        return errors;
    };

    Stream.prototype.processBuffers = function () {
        var errors = this.processBuffer(this._buffer, this._methods, this._length - this._buffer.length);
        if (errors && errors.length) {
            if (this._errorMethods.length) {
                this.processBuffer(errors, this._errorMethods, 0);
            } else {
                errors.forEach(function (e) {
                    throw e;
                });
            }
        }
    };

    Stream.prototype.addMethod = function (method) {
        var firstMethod = this._methods.length === 0;
        this._methods.push(method);

        if (firstMethod) {
            this.processBuffers();
        }
    };

    Stream.prototype.addErrorMethod = function (method) {
        this._errorMethods.push(method);
    };

    Stream.prototype.addCloseMethod = function (method) {
        if (this.closed) {
            method.call(this);
        } else {
            this._closeMethods.push(method);
        }
    };

    Stream.prototype.push = function (value) {
        if (!this._closed) {
            this.addToBuffer(value);
            this._length++;
            this.processBuffers();

            if (this._length === this._maxLength) {
                this.close();
            }
        }
    };

    Stream.prototype.pushError = function (error) {
        // If we can't handle the error ourselves we throw it again. That will give preceding streams the chance to handle these
        if (!this._errorMethods || !this._errorMethods.length) {
            throw error;
        }
        this.processBuffer([error], this._errorMethods, 0);
    };

    Stream.prototype.forEach = function (method) {
        this.addMethod(method);
        return this;
    };

    Stream.prototype.addMethodToNextStream = function (nextStream, method, onClose) {
        var that = this;
        this.addMethod(function (value, index) {
            try  {
                method.call(that, value, index);
            } catch (e) {
                nextStream.pushError(e);
            }
        });

        if (!onClose) {
            this.onClose(function () {
                nextStream.close();
            });
        } else {
            this.onClose(onClose);
        }
    };

    Stream.prototype.filter = function (method) {
        var nextStream = new Stream(this._name + ".filter");
        var that = this;

        if (typeof method === "function") {
            this.addMethodToNextStream(nextStream, function (value, index) {
                if (method.call(that, value, index)) {
                    nextStream.push(value);
                }
            });
        } else {
            this.addMethodToNextStream(nextStream, function (value) {
                if (method == value) {
                    nextStream.push(value);
                }
            });
        }

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.map = function (method) {
        var nextStream = new Stream(this._name + ".map");

        var that = this;
        if (typeof method === "function") {
            this.addMethodToNextStream(nextStream, function (value, index) {
                nextStream.push(method.call(that, value, index));
            });
        } else {
            this.addMethodToNextStream(nextStream, function (value) {
                nextStream.push(method);
            });
        }

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.scan = function (method, seed) {
        var nextStream = new Stream(this._name + ".scan");
        var that = this;
        var scanned = seed;
        this.addMethodToNextStream(nextStream, function (value) {
            scanned = method.call(that, scanned, value);
            nextStream.push(scanned);
        });

        nextStream.push(scanned);

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.reduce = function (method, seed) {
        var nextStream = new Stream(this._name + ".reduce");
        var that = this;
        var reduced = seed;
        this.addMethodToNextStream(nextStream, function (value) {
            reduced = method.call(that, reduced, value);
        }, function () {
            nextStream.push(reduced);
            nextStream.close();
        });

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.concat = function (stream) {
        var nextStream = new Stream(this._name + ".concat");
        var buffer = null;

        // When this is already closed, we only care for the other stream
        if (!this._closed) {
            buffer = [];
        } else {
            if (stream.closed) {
                nextStream.close();
            }
        }

        // We need to buffer, because this may not be the first
        // method attached to the stream. Otherwise any data that
        // is pushed to stream before the original is closed would
        // be lost for the concat.
        stream.forEach(function (value) {
            if (buffer) {
                buffer.push(value);
            } else {
                nextStream.push(value);
            }
        });

        stream.onClose(function () {
            if (!buffer) {
                nextStream.close();
            }
        });

        this.addMethodToNextStream(nextStream, function (value) {
            nextStream.push(value);
        }, function () {
            if (buffer) {
                buffer.forEach(function (value) {
                    nextStream.push(value);
                });
            }
            if (stream.closed) {
                nextStream.close();
            }

            buffer = null;
        });

        if (this._closed && stream.closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.concatAll = function () {
        var nextStream = new Stream(this._name + ".concatAll");
        var queue = [];
        var cursor = null;

        function nextInQueue() {
            var l = queue.length;

            while (l--) {
                cursor = queue[l];
                update();
                if (cursor.done) {
                    queue.pop();
                } else {
                    update();
                    break;
                }
            }
        }

        function update() {
            if (cursor) {
                var l = cursor.data.length;
                while (l--) {
                    nextStream.push(cursor.data.pop());
                }
            }
        }

        function concatStream(stream) {
            var subBuffer = {
                data: [],
                done: false
            };
            queue.unshift(subBuffer);

            stream.forEach(function (value) {
                subBuffer.data.unshift(value);
                update();
            });

            stream.onClose(function () {
                subBuffer.done = true;
                nextInQueue();
            });

            if (queue.length === 1) {
                cursor = subBuffer;
            }
        }

        this.forEach(function (subStream) {
            concatStream(subStream);
        });

        this.onClose(function () {
            nextStream.close();
        });

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.combine = function (stream) {
        var that = this;
        var nextStream = new Stream(this._name + ".combine");

        this.forEach(function (value) {
            nextStream.push(value);
        });

        stream.forEach(function (value) {
            nextStream.push(value);
        });

        this.onClose(function () {
            if (stream.closed) {
                nextStream.close();
            }
        });

        stream.onClose(function () {
            if (that._closed) {
                nextStream.close();
            }
        });

        if (this._closed && stream.closed) {
            nextStream.close();
        }

        return nextStream;
    };

    Stream.prototype.onClose = function (method) {
        this.addCloseMethod(method);
        return this;
    };

    Stream.prototype.onError = function (method) {
        this.addErrorMethod(method);
        return this;
    };
    return Stream;
})();
exports.Stream = Stream;

function createStream(name) {
    return new Stream(name || "stream");
}
exports.createStream = createStream;
//# sourceMappingURL=stream.js.map

},{}],10:[function(require,module,exports){
/**
* Created by Stephan.Smola on 30.10.2014.
*/
"use strict";
function elementPositionAndSize(element) {
    var rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
}
exports.elementPositionAndSize = elementPositionAndSize;

var pfx = [
    { id: "webkit", camelCase: true },
    { id: "MS", camelCase: true },
    { id: "o", camelCase: true },
    { id: "", camelCase: false }];

/**
* Add event listener for prefixed events. As the camel casing of the event listeners is different
* across browsers you need to specifiy the type camelcased starting with a capital letter. The function
* then takes care of the browser specifics.
*
* @param element
* @param type
* @param callback
*/
function addPrefixedEventListener(element, type, callback) {
    for (var p = 0; p < pfx.length; p++) {
        if (!pfx[p].camelCase)
            type = type.toLowerCase();

        element.addEventListener(pfx[p].id + type, callback, false);
    }
}
exports.addPrefixedEventListener = addPrefixedEventListener;

/**
* Convenience method for calling callbacks
* @param cb    The callback function to call
*/
function callCallback(cb) {
    var any = [];
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        any[_i] = arguments[_i + 1];
    }
    if (cb) {
        if (typeof (cb) == "function") {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return cb.apply(this, args);
        } else {
            throw new Error("Callback is not a function!");
        }
    }
}
exports.callCallback = callCallback;

function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(function (baseCtor) {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
exports.applyMixins = applyMixins;

function isArray(thing) {
    return Object.prototype.toString.call(thing) === '[object Array]';
}
exports.isArray = isArray;

var OID_PROP = "__ID__";
var oids = 10000;

function oid(obj) {
    if (obj) {
        if (!obj.hasOwnProperty(OID_PROP)) {
            obj[OID_PROP] = oids++;
        }

        return obj[OID_PROP];
    }
}
exports.oid = oid;
//# sourceMappingURL=tools.js.map

},{}]},{},[1,2,3,4,5,6,7,8,9,10]);
