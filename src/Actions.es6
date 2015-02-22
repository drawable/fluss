/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

let index = 0;

export function enumerateActions(...actions) {
    let r = {};

    actions.forEach((action) => {
        r["" + action] = index;
        r[index] = "" + action;
        index++;
    });

    return r;
}

export const IDs = enumerateActions("__ANY__", "UNDO");
