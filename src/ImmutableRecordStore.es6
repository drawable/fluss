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
                let i = that._parent[name].immutable;
                if (i === null) {
                    console.log("WARNING: item " + name + " is a Store but does not provide an immutable. Consider providing an immutable.");
                    return that._parent[name];
                }
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

        parent.newItemsPrio.filter(({store}) => store === parent).forEach(function (update) {
            _private(that, addItem, update.item);
        }).until(parent.isDisposing);

        parent.removedItems.filter(({store}) => store === parent).forEach(function (update) {
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

    _get(name) {
        return this._parent._get(name);
    }

    hasItem(name) {
        return this._parent.hasItem(name);
    }

    item(name) {
        let item = this._parent.item(name);
        return item.immutable;
    }

    get keys() {
        return this._parent.keys;
    }
}