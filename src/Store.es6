/**
 * Created by Stephan on 24.02.2015.
 */

import * as Tools from './Tools';
import * as StoreBase from './StoreBase'
import MArrayStore from './ArrayStore';
import MRecordStore from './RecordStore';
import MStackedRecordStore from './StackedRecordStore';
import ImmutableArrayStore from './ImmutableArrayStore';
import ImmutableRecordStore from './ImmutableArrayStore';

function buildDeep(value) {
    function getItem(value) {
        var v;
        if (value === null) {
            return value;
        }
        if (typeof value === "object") {
            if (StoreBase.isStore(value)) {
                return value;
            } else if (Tools.isArray(value)) {
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
        var store = new MArrayStore();
        value.forEach((item) => store.push(getItem(item)));
        return store;
    }

    function buildRecord(values) {
        var store = new MRecordStore();
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
        return new MArrayStore()
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
        return new MRecordStore();
    }
}

export function stackedRecord(parent, initial) {
    if (Tools.isArray(initial)) {
        throw new TypeError("Object expected for initial values of a stacked record. Provide a {...}")
    }

    return new MStackedRecordStore(parent, initial);
}


export const isStore = StoreBase.isStore;


export class Store extends StoreBase.Store {

}

export const RecordStore = MRecordStore;
export const ArrayStore = MArrayStore;
export const StackedRecordStore = MStackedRecordStore;

export const createUpdateInfo = StoreBase.createUpdateInfo;