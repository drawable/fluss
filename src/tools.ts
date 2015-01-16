/**
 * Created by Stephan.Smola on 30.10.2014.
 */

"use strict";


module Fluss {
    export module Tools {
        /**
         * Determine the screen position and size of an element in the DOM
         * @param element
         * @returns {{x: number, y: number, w: number, h: number}}
         */
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
         * across browsers you need to specify the type camelcased starting with a capital letter. The function
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



        /**
         * Check if something is an array.
         * @param thing
         * @returns {boolean}
         */
        export function isArray(thing:any):boolean {
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
        export function oid(obj:any) {
            if (obj) {
                if (!obj.hasOwnProperty(OID_PROP)) {
                    obj[OID_PROP] = oids++
                }

                return obj[OID_PROP];
            }
        }



        function applyMixins(derivedCtor:any, baseCtors:any[]) {
            baseCtors.forEach(baseCtor => {
                Object.getOwnPropertyNames(baseCtor).forEach(name => {
                    derivedCtor.prototype[name] = baseCtor[name];
                })
            });
        }


        /**
         * Use this to subclass a typescript class using plain JavaScript. Spec is an object
         * containing properties and methods of the new class. Methods in spec will override
         * methods in baseClass.
         *
         * You will NOT be able to make super calls in the subclass.
         *
         * @param spec
         * @param baseClass
         * @returns {any}
         */
        export function subclass(spec, baseClass):any {
            var constructor;
            if (spec.hasOwnProperty("constructor")) {
                constructor = spec["constructor"];
            } else {
                constructor = function() {
                    baseClass.prototype.constructor.apply(this, arguments);
                };
            }

            constructor.prototype = Object.create(baseClass.prototype);
            applyMixins(constructor, [spec]);

            return constructor;
        }

    }

}


declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Tools = Fluss.Tools;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Tools;
    });
}