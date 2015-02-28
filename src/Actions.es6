/**
 * Created by Stephan on 22.02.2015.
 */

let index = 0;

export function enumerate(actions) {
    Object.keys(actions).forEach((key) => actions[key] = index++);
    return actions;
}

export const IDs = {"__ANY__": -1000,
                    "UNDO": -2000,
                    "-1000": "__ANY__",
                    "-2000": "UNDO" };

