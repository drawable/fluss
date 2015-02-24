/**
 * Created by Stephan on 24.02.2015.
 */

"use strict";

import * as Tools from './Tools';
import * as StoreBase from './StoreBase'
import ArrayStore from './ArrayStore';
import RecordStore from './RecordStore';
import ImmutableArrayStore from './ImmutableArrayStore';
import ImmutableRecordStore from './ImmutableArrayStore';



function buildDeep(value) {
    function getItem(value) {
        var v;
        if (typeof value === "object") {
            if (Tools.isArray(value)) {
                v = buildArray(value);
            } else {
                v = buildRecord(value);
            }
        } else {
            v = value;
        }
        return v;
    }

    function buildArray(value) {
        var store = new ArrayStore();
        value.forEach((item) => store.push(getItem(item)));
        return store;
    }

    function buildRecord(values) {
        var store = new RecordStore();
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                store.addItem(key, getItem(values[key]));
            }
        }

        return store;
    }

    if (typeof value === "object") {
        if (Tools.isArray(value)) {
            return buildArray(value);
        } else {
            return buildRecord(value);
        }
    } else {
        return null;
    }
}


/**
 * Create a new record. If an initial value is given it will have the enumerable properties of that value. You can
 * create nested stores by providing a complex object as an initial value.
 * @param initial
 * @returns {*}
 */
export function record(initial) {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new RecordStore();
    }
}

/**
 * Create an array store. If an initial value is provided it will initialize the array
 * with it. The initial value can be a JavaScript array of either simple values or plain objects.
 * If the array has plain objects a nested store will be created.
 * @param initial
 * @returns {*}
 */
export function array(initial) {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new ArrayStore()
    }
}

export const isStore = StoreBase.isStore;