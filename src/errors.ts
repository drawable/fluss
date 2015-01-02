/**
 * Created by Stephan.Smola on 30.10.2014.
 */

"use strict";

import EventChannel = require("eventChannel");

export interface IErrorHandler {
    error(message:string, that?:any);
    fatal(message:string, that?:any);
    framework(message:string, exception:any, that?:any);
}

export enum EVENTS { ERROR, FATAL, FRAMEWORK, CLEAR }


class ErrorHandler extends EventChannel.ChanneledEmitter implements IErrorHandler {

    constructor() {
        super("ERROR");

        /*
         if (window) {
         window.onerror = function(error, url, line) {
         this.fatal(error + "\nin: " + url + "\nline: " + line, window);
         }
         }
         */
    }

    public error(message:string, that?:any) {
        this.emit(EVENTS.ERROR, message, that);
    }

    public fatal(message:string, that?:any) {
        this.emit(EVENTS.FATAL, message, that);
    }

    public framework(message:string, exception:any, that?:any) {
        throw exception;
    }

}


var errorHandler:IErrorHandler = new ErrorHandler();
export function getErrorHandler():IErrorHandler {
    return errorHandler;
}

export function error(message:string, that?:any) {
    return errorHandler.error(message, that);
}

export function fatal(message:string, that?:any) {
    return errorHandler.fatal(message, that);
}

export function framework(message:string, exceotion:any, that?:any) {
    return errorHandler.framework(message, exceotion, that);
}

