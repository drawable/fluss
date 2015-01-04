/**
 * Created by Stephan.Smola on 28.10.2014.
 */

"use strict";

import Emitter = require("./emitter");
import Stream = require("./stream");

export interface  IEventChannel {
    subscribe(emitter:string, event:any, handler:Emitter.FEventHandler)
}


interface EEvents {

}


class EventChannel implements IEventChannel {

    private _eventHandlers;

    constructor() {
        this._eventHandlers = {};
    }

    public subscribe(emitter:string, event:any, handler:Emitter.FEventHandler) {
        if (!this._eventHandlers[emitter]) {
            this._eventHandlers[emitter] = {}
        }

        if (!this._eventHandlers[emitter][event]) {
            this._eventHandlers[emitter][event] = []
        }

        this._eventHandlers[emitter][event].push(handler);
    }

    public unsubscribe(emitter:string, event:string, handler:Emitter.FEventHandler) {
        if (this._eventHandlers[emitter]) {
            if (this._eventHandlers[emitter][event]) {
                this._eventHandlers[emitter][event].splice(this._eventHandlers[emitter][event].indexOf(handler), 1);
            }
        }
    }

    public channelEmit(emitter:ChanneledEmitter, emitterID:string, event:string, args?:any[]) {
        if (this._eventHandlers && this._eventHandlers[emitterID] && this._eventHandlers[emitterID][event]) {
            this._eventHandlers[emitterID][event].forEach(function(handler) {
                handler.apply(emitter, args);
            })
        }
    }

    public unsubscribeAll(emitterID:string) {
        delete this._eventHandlers[emitterID];
    }
}

var eventChannel = new EventChannel();
//export var channel:IEventChannel = eventChannel;

export function getChannel():IEventChannel {
    return eventChannel;
}

export function subscribe(emitter:string, event:any, handler:Emitter.FEventHandler) {
    eventChannel.subscribe(emitter, event, handler);
}

export function unsubscribe(emitter:string, event:any, handler:Emitter.FEventHandler) {
    eventChannel.unsubscribe(emitter, event, handler);
}

export function channelEmit(emitterID:string, event:any, ...args:any[]) {
    eventChannel.channelEmit(null, emitterID, event, args);
}

export function unsubscribeAll(emitterID:string) {
    eventChannel.unsubscribeAll(emitterID);
}

var emitterIDs = [];


/**
 * Event-Emitter interface. This simply reexports the regular IEmitter interface to
 * avoid importing app/Core/emitter just for that interface when you have the EventChannel already imported.
 */
export interface IEmitter extends Emitter.IEmitter {

}

export class ChanneledEmitter extends Emitter.Emitter {

    private emitterID:string;

    constructor(_emitterID?:string) {
        super();

        if (_emitterID) {
            this.emitterID = _emitterID;
        } else {
            this.emitterID = "Emitter" + emitterIDs.length;
        }

        if (emitterIDs.indexOf(this.emitterID) !== -1) {
            throw new Error("Duplicate emitterID. This is not supported");
        }
    }

    public subscribe(event:any, handler:Emitter.FEventHandler) {
        super.subscribe(event, handler);
        //console.log("Consider using the EventChannel instead of subscribing directly to the " + this.emitterID);
    }

    public emit(event:any, ...args:any[]) {

        // No super call because passing rest parameters to a super method is kind of awkward and hacky
        // https://typescript.codeplex.com/discussions/544797
        var that = this;
        if (this.eventHandlers && this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(function(handler) {
                handler.apply(that, args);
            })
        }

        eventChannel.channelEmit(this, this.emitterID, event, args);
    }
}

class EventStream extends Stream.Stream {

    private _handler:Emitter.FEventHandler;

    constructor(name:string, private _emitterID:string, private _event:any) {
        super(name);
        this._handler = this.handleEvent.bind(this);
        subscribe(this._emitterID, _event, this._handler);
    }

    private handleEvent(...args:any[]) {
        this.push({
            emitter: this._emitterID,
            event: this._event,
            args: args
        })
    }

    dispose() {
        super.dispose();
        unsubscribe(this._emitterID, this._event, this._handler);
    }
}

/**
 * Creates a stream for a channeled event. If  mor than one event is given, a combined
 * stream for all events is created
 *
 * @param name
 * @param emitterID
 * @param events
 * @returns {null}
 */
export function createEventStream(emitterID:string, ...events:any[]):Stream.IStream {
    var stream = null;

    events.forEach(function(event) {
        var eStream = new EventStream(emitterID + "-" + event, emitterID, event);
        if (stream) {
            stream = stream.combine(eStream)
        } else {
            stream = eStream;
        }
    });

    return stream;
}

