/**
 * Created by Stephan on 24.02.2015.
 */

"use strict";

/**
 * Check if something is an array.
 * @param thing
 * @returns {boolean}
 */
export function isArray(thing) {
    return Object.prototype.toString.call(thing) === '[object Array]'
}



var OID_PROP = "__ID__";
var oids = 10000;

/**
 * Create and return a unique id on a JavaScript object. This adds a new property
 * __ID__ to that object. Ids are numbers.
 *
 * The ID is created the first time this function is called for that object and then
 * will simply be returned on all subsequent calls.
 *
 * @param obj
 * @returns {any}
 */
export function oid(obj) {
    if (obj) {
        if (!obj.hasOwnProperty(OID_PROP)) {
            obj[OID_PROP] = oids++
        }

        return obj[OID_PROP];
    }
}