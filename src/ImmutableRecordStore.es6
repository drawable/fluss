/**
 * Created by Stephan on 24.02.2015.
 */

import * as Store from './StoreBase'
import * as Stream from './Stream';

let _private = (obj, func, ...args) => func.apply(obj, args);

function addItem(name) {
    var that = this;
    Object.defineProperty(this, name, {
        configurable: true,
        get: function () {
            if (Store.isStore(that._parent[name])) {
                return that._parent[name].immutable;
            }
            return that._parent[name];
        },

        set: function (value) {
        }
    });
}


function removeItem(name) {
    delete this[name];
}

export default class ImmutableRecord extends Store.ImmutableStore {

    constructor(parent) {
        super();
        this._parent = parent;
        var that = this;

        parent.keys.forEach((key) => _private(that, addItem, key));

        parent.newItems.forEach(function (update) {
            _private(that, addItem, update.item);
        }).until(parent.isDisposing);

        parent.removedItems.forEach(function (update) {
            _private(that, removeItem, update.item);
        }).until(parent.isDisposing);

        this._streams.relay(parent.updates, "updates");
        this._streams.relay(parent.removedItems, "removedItems");
        this._streams.relay(parent.newItems, "newItems");
        this._streams.relay(parent.isDisposing, "isDisposing");
    }

    get immutable() {
        return this;
    }

    get keys() {
        return this._parent.keys;
    }
}