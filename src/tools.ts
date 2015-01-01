/**
 * Created by Stephan.Smola on 30.10.2014.
 */

"use strict";

export function elementPositionAndSize(element) {
    var rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
}


var pfx = [
                { id: "webkit", camelCase: true},
                { id: "MS", camelCase: true},
                { id: "o", camelCase: true},
                { id: "", camelCase: false} ]

/**
 * Add event listener for prefixed events. As the camel casing of the event listeners is different
 * across browsers you need to specifiy the type camelcased starting with a capital letter. The function
 * then takes care of the browser specifics.
 *
 * @param element
 * @param type
 * @param callback
 */
export function addPrefixedEventListener(element:Element, type, callback) {
    for (var p = 0; p < pfx.length; p++) {
        if (!pfx[p].camelCase) type = type.toLowerCase();

        element.addEventListener(pfx[p].id+type, callback, false);
    }
}


/**
 * Convenience method for calling callbacks
 * @param cb    The callback function to call
 */
export function callCallback(cb, ...any) {
    if (cb) {
        if (typeof(cb) == "function") {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return  cb.apply(this, args);
        } else {
            throw new Error("Callback is not a function!");
        }
    }
}


export function applyMixins(derivedCtor:any, baseCtors:any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        })
    });
}

export function isArray(thing:any):boolean {
    return Object.prototype.toString.call(thing) === '[object Array]'
}

var OID_PROP = "__ID__";
var oids = 10000;

export function oid(obj:any) {
    if (obj) {
        if (!obj.hasOwnProperty(OID_PROP)) {
            obj[OID_PROP] = oids++
        }

        return obj[OID_PROP];
    }
}