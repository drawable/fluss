/**
 * Created by Stephan.Smola on 28.10.2014.
 */

"use strict";

import Errors = require("./errors");
import EventChannel = require("./eventChannel");
import Actions = require("./baseActions");

/**
 * Undoable. Base class for objects that can be restored from data.
 */
export interface IUndoable {
    restoreFromMemento(memento:IMemento);
    storeToMemento():IMemento;
}

/**
 * RedoAction. Stores information necessary to redo an action. That is basically the info
 * that got passed through the dispatcher.
 */
export interface IAction {
    action:number;
    data:any;
}

/**
 * Memento. Stores state of an object.
 */
export interface IMemento {
    action:number;
    data:any;
    redo:IAction;
    undo:IAction;
    instance:IUndoable;
}

/**
 * Create a memento object.
 * @param instance
 * @param data
 * @param redo
 * @param undo      Optionally you can provide an action for undoing, if that is simpler than storing data
 * @returns {{data: any, redo: IAction, instance: IUndoable}}
 */
export function createMemento(instance:IUndoable, data:any):IMemento {
    return {
        action: -1,
        data:data,
        redo:null,
        undo:null,
        instance:instance
    }
}

/**
 * Create a redo object.
 * @param action
 * @param data
 * @returns {{action: number, data: any}}
 */
export function createRedo(action:number, data?:any):IAction {
    return {
        action:action,
        data:data
    }
}


export function createUndoAction(action:number, ...args:any[]):IMemento {
    return {
        action: -1,
        data: null,
        redo: null,
        undo: {
            action:action,
            data:args
        },
        instance: null
    }
}

/**
 * Undomanager. Provides means to undo and redo steps.
 */
export interface IUndoManager {
    storeMementos(memento:IMemento[], action:number, redo:IAction);
    undo();
    redo();
    clear();
    getMementos():IMemento[][];
}

/**
 * Events that are raised by the undo manager.
 */
export enum EVENTS {
    UNDO,
    REDO,
    MEMENTO_STORED,
    CLEAR,
}




/**
 * Definition of an action handler
 */
export interface FActionHandler {
    (action:number, ...args:any[]);
}

export interface FMementoProvider {
    (action:number, ...args:any[]):IMemento[];
}

/**
 * Dispatcher interface. Used for the FLUX pattern.
 */
export interface IDispatcher {

    dispatchAction(action:number, ...args:any[]);
    dispatchUndoAction(action:number, ...args:any[]);
    subscribeAction(action:number, handler:FActionHandler, mementoProvider?:FMementoProvider);
    unsubscribeAction(action:number, actionHandler:FActionHandler);
    disableAction(action:number);
    enableAction(action:number);

    undoing:boolean;
}



var __ANY_ACTION___ = 0;

/**
 * Implementation of a dispatcher as described by the FLUX pattern.
 */
class Dispatcher implements IDispatcher {

    private _disabled:Object;
    private _handlers:Object;
    private _dispatching:boolean;
    private _undoing:boolean;

    constructor() {
        this._handlers = {};
        this._dispatching = false;
        this._undoing = false;
        this._disabled = {};
    }

    public destroy() {
        this._handlers = {};
        this._dispatching = false;
        this._undoing = false;
        this._disabled = {};
    }

    public get undoing():boolean {
        return this._undoing;
    }

    /**
     * The actual dispatch
     * @param doMemento
     * @param type
     * @param args
     */
    private dispatch(doMemento:boolean, type: number, args:any[]) {
        try {
            var mementos = [];
            var that = this;

            var doit = function(__type, dispatch, trueType?:number) {
                if (that._handlers[__type]) {
                    that._handlers[__type].forEach(function(d) {
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
                    })
                }
            };

            doit(type, function(handler, args) {
                handler.apply(this, args);
            });

            doit(__ANY_ACTION___, function(handler, args) {
                handler.apply(this, [type, args]);
            }, type);

            if (mementos.length) {
                getUndoManager().storeMementos(mementos, type, createRedo(type, args));
            }
        } catch (e) {
            var msg = "Internal error. If this happens please check if it was a user error \n" +
                "that can be either prevented or gracefully handled.\n\n"
            msg += "Handled action: " + type + "\n";
            msg += "Create memento: " + (doMemento ? "yes\n" : "no\n");

            var argStr = "";

            try{
                argStr = JSON.stringify(args, null, 2)
            } catch(e) {
                argStr = "It's a circular structure :-("
            }

            msg += "Arguments     : " + argStr + "\n";
            msg += "Mementos      : " + (mementos ? JSON.stringify(mementos, null, 2) : "none") + "\n";
            msg += "Exception     : " + e.message + "\n";
            msg += "Stack trace   :\n" + e.stack + "\n";

            console.log(msg);



            Errors.framework(e.message, e, that);
        }
    }

    /**
     * Dispatch an undo action. This is basically the same as dispatching a regular
     * action, but the memento will not be created.
     * @param type
     * @param args
     */
    public dispatchUndoAction(action:number, ...args:any[]) {
        if (!this._disabled[action]) {
            this._undoing = true;
            try {
                this.dispatch(false, action, args);
            } finally {
                this._undoing = false;
            }
        }
    }

    /**
     * Dispatch, i.e. broadcast an action to anyone that's interested.
     * @param type
     * @param data
     */
    public dispatchAction(action:number, ...args:any[]) {
        if (!this._disabled[action]) {
            this.dispatch(true, action, args);
        }
    }

    /**
     * Subscribe to an action.
     * @param action
     * @param handler
     * @param mementoProvider
     */
    subscribeAction(action:number, handler:FActionHandler, mementoProvider?:FMementoProvider) {
        if (!this._handlers[action]) {
            this._handlers[action] = [];
        }

        if (this._handlers[action].indexOf(handler) === -1) {
            this._handlers[action].push([handler, mementoProvider]);
        }
    }

    /**
     * Unsubscribe an action handler. This removes a potential mementoProvider also.
     * @param action
     * @param handler
     */
    unsubscribeAction(action:number, handler:FActionHandler) {
        if (this._handlers[action]) {
            for (var i = 0; i < this._handlers[action].length; i++) {
                if (this._handlers[action][i][0] === handler) {
                    this._handlers[action].splice(i, 1);
                    return;
                }

            }
        }
    }


    disableAction(action:number) {
        this._disabled[action] = true;
    }

    enableAction(action:number) {
        if (this._disabled[action]) {
            delete this._disabled[action];
        }
    }

}


var dispatcher = new Dispatcher();


export function getDispatcher():IDispatcher {
    return dispatcher;
}

export function dispatch(action:number, ...args:any[]) {
    dispatcher.dispatchAction.apply(dispatcher, [action].concat(args));
}

export function subscribeAction(action:number, handler:FActionHandler, mementoProvider?:FMementoProvider) {
    dispatcher.subscribeAction(action, handler, mementoProvider);
}

export function unsubscribeAction(action:number, handler:FActionHandler) {
    dispatcher.unsubscribeAction(action, handler);
}

export function disableAction(action:number) {
    dispatcher.disableAction(action);
}

export function enableAction(action:number) {
    dispatcher.enableAction(action)
}

/**
 * Resets everything. No previously subscribed handler will be called.
 */
export function reset() {
    dispatcher.destroy();
    dispatcher = new Dispatcher();
}

/**
 * Undo manager implementations. It utilises two stacks (undo, redo) to provide the
 * necessary means to undo and redo actions.
 */
class UndoManager extends EventChannel.ChanneledEmitter implements IUndoManager {

    private mementos:IMemento[][];
    private redos:IAction[][];

    constructor() {
        super("UndoManager");
        this.clear();

        getDispatcher().subscribeAction(Actions.ACTIONS.UNDO, this.undo.bind(this));
    }

    /**
     * Store a memento. This is put on a stack that is used for undo
     * @param mementos
     * @param action        the action that created the memento
     * @param redo          the data that can be used to recreate the action
     */
    public storeMementos(mementos:IMemento[], action:number, redo:IAction) {

        if (mementos) {
            mementos.forEach(function (m) {
                if (m) {
                    m.redo = redo;
                    m.action = action;
                }
            });

            this.mementos.push(mementos);
            this.redos = [];
            this.emit(EVENTS.MEMENTO_STORED, mementos);
        }
    }

    /**
     * Undo. Pop the latest memento from the stack and restore the according object. This pushes the redo-info
     * from the memento onto the redo stack to use in redo.
     */
    public undo() {
        var us = this.mementos.pop();
        if (us) {
            var redos = [];
            us.forEach(function (u, i) {
                if (u.undo) {
                    getDispatcher().dispatchUndoAction.apply(getDispatcher(), [u.undo.action].concat(u.undo.data))
                } else {
                    u.instance.restoreFromMemento(u);
                }

                if (!i) {
                    redos.push(u.redo);
                }
            });

            this.redos.push(redos);
            this.emit(EVENTS.UNDO, us);
        }
    }

    /**
     * Redo. Pop the latest redo action from the stack and dispatch it. This does not store any undo data,
     * as the dispatcher will do that when dispatching the action.
     */
    public redo() {
        var rs = this.redos.pop();
        if (rs) {
            rs.forEach(function(r) {
                getDispatcher().dispatchAction.apply(getDispatcher(), [r.action].concat(r.data));
            });
            this.emit(EVENTS.REDO, rs);
        }
    }

    /**
     * Clear all stacks
     */
    public clear() {
        this.mementos = [];
        this.redos = [];
        this.emit(EVENTS.CLEAR);
    }

    public getMementos():IMemento[][] {
        return this.mementos;
    }
}

/**
 * Singleton.
 * @type {UndoManager}
 */
var um = new UndoManager();

/**
 * Get the undo manager. Returns the single instance.
 * @returns {UndoManager}
 */
export function getUndoManager():IUndoManager {
    return um;
}
