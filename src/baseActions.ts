/// <reference path="./dispatcher.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */

"use strict";

module Fluss {

    export module BaseActions {
        export enum ACTIONS  {
            __ANY__ = -1000,
            UNDO = -2000,
        }

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
        export function triggerAction(action:number, ...args:any[]) {
            Dispatcher.getDispatcher().dispatchAction.apply(Dispatcher.getDispatcher(),[action].concat(args));
        }


        export function undo() {
            Dispatcher.getDispatcher().dispatchAction(ACTIONS.UNDO);
        }
    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.BaseActions = Fluss.BaseActions;
}
