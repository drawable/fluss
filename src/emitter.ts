/**
 * Created by Stephan.Smola on 28.10.2014.
 */

"use strict"

module Fluss {
    export module Emitter {
        /**
         * Function type for event handler
         */
        export interface FEventHandler {
            (...args:any[]):void;
        }

        /**
         * Dictionary type for event handlers by event-name
         */
        export interface IHandlerList {
            [index:string]:FEventHandler[]
        }

        export interface IEmitter {
            subscribe(event:any, handler:FEventHandler);
            unsubscribe(event:any, handler:FEventHandler);
            relay(emitter:IEmitter, subscribingEvent:any, emittingEvent:any);
        }

        /**
         * An event-emitter
         */
        export class Emitter implements IEmitter {

            private _eventHandlers:IHandlerList;

            public subscribe(event:any, handler:FEventHandler) {
                if (!this._eventHandlers) {
                    this._eventHandlers = {}
                }

                if (!this._eventHandlers[event]) {
                    this._eventHandlers[event] = []
                }

                this._eventHandlers[event].push(handler);
            }

            public unsubscribe(event:any, handler:FEventHandler) {
                if (!this._eventHandlers) {
                    return;
                }
                if (this._eventHandlers[event]) {
                    this._eventHandlers[event].splice(this._eventHandlers[event].indexOf(handler), 1);
                }
            }

            public get eventHandlers():IHandlerList {
                return this._eventHandlers;
            }

            public emit(event:any, ...args:any[]) {
                var that = this;
                if (this._eventHandlers && this._eventHandlers[event]) {
                    this._eventHandlers[event].forEach(function(handler) {
                        handler.apply(that, args);
                    })
                }
            }

            public relay(emitter:IEmitter, subscribingEvent:any, emittingEvent:any) {
                var that = this;
                emitter.subscribe(subscribingEvent, function(...args:any[]) {
                    that.emit.apply(that, [emittingEvent].concat(args));
                })
            }
        }
    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Emitter = Fluss.Emitter;
}
if (typeof this["define"] === "function") {
    this["define"]("emitter", [], function () {
        return Fluss.Emitter;
    });
}

