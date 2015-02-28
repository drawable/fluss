/**
 * Created by Stephan on 24.02.2015.
 */

import * as Store from './StoreBase'
import * as Stream from './Stream';

let _private = (obj, func, ...args) => func.apply(obj, args);


function updateProperties() {
    var that = this;
    var i;

    function define(index) {
        Object.defineProperty(that, "" + index, {
            configurable: true,
            get: function () {
                if (Store.isStore(that._parent[index])) {
                    return that._parent[index].immutable;
                }
                return that._parent[index];
            },

            set: function (value) {
            }
        })
    }

    for (i = this._maxProps; i < this._parent.length; i++) {
        define(i);
    }

    this._maxProps = this._parent.length;
}

export default class ImmutableArray extends Store.ImmutableStore {

    constructor(parent) {
        super();
        this._parent = parent;
        this._maxProps = 0;

        var that = this;
        parent.newItems.forEach(function (update) {
            _private(that, updateProperties);
        }).until(parent.isDisposing);

        // We do nothing when removing items. The getter will return undefined.

        this._maxProps = 0;
        _private(this, updateProperties);

        this._streams.relay(parent.updates, "updates");
        this._streams.relay(parent.removedItems, "removedItems");
        this._streams.relay(parent.newItems, "newItems");
        this._streams.relay(parent.isDisposing, "isDisposing");
    }


    toString() {
        return this._parent.toString();
    }

    toLocaleString() {
        return this._parent.toString();
    }

    forEach(callbackfn, thisArg) {
        return this._parent.forEach(callbackfn);
    }

    every(callbackfn, thisArg) {
        return this._parent.every(callbackfn);
    }

    some(callbackfn, thisArg) {
        return this._parent.forEach(callbackfn);
    }

    indexOf(value) {
        return this._parent.indexOf(value);
    }

    lastIndexOf(searchElement, fromIndex) {
        return this._parent.lastIndexOf(searchElement, fromIndex);
    }

    join(separator) {
        return this._parent.join(separator);
    }

    map(callbackfn, index, array, thisArg) {
        return this._parent._data.map(callbackfn);
    }

    filter(callbackfn, thisArg) {
        return this._parent._data.filter(callbackfn);
    }

    reduce(callbackfn, initialValue) {
        return this._parent.reduce(callbackfn, initialValue);
    }

    get length() {
        return this._parent.length;
    }
}