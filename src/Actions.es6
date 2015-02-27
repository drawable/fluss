/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

let index = 0;

export function enumerate(...actions) {
    let r = {};

    actions.forEach((action) => {
        r["" + action] = index;
        r[index] = "" + action;
        index++;
    });

    return r;
}

export const IDs = {"__ANY__": -1000,
                    "UNDO": -2000,
                    "-1000": "__ANY__",
                    "-2000": "UNDO" };

