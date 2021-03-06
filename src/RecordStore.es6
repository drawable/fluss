/**
 * Created by Stephan on 24.02.2015.
 */

import * as Store from './StoreBase';
import RecordItem from './RecordItem';
import ImmutableRecord from './ImmutableRecordStore';

let _private = (obj, func, ...args) => func.apply(obj, args);

function checkNameAllowed(name) {
    return true;
}


function setupSubStream(name, value) {
    _private(this, disposeSubStream, name);
    if (Store.isStore(value)) {
        if (value === this) {
            throw new Error("You try to set the value of a record field to the record itself. Cyclic dependencies are not supported!")
        }

        let subStream = {};

        let doSubStream = (streamId) => {
            subStream[streamId] = value[streamId];
            subStream[streamId].forEach((update) => {
                let info = Store.createUpdateInfo(update.item,
                    update.value,
                    update.store,
                    update.path ? name + "." + update.path : name + "." + update.item,
                    name);
                this._streams.push(streamId, info);
            });
        };

        doSubStream("updates");
        doSubStream("newItems");
        doSubStream("removedItems");

        this._subStreams[name] = subStream;
    }
}

function disposeSubStream(name) {
    var subStream = this._subStreams[name];
    if (subStream) {
        subStream.updates.close();
        subStream.newItems.close();
        subStream.removedItems.close();
        delete this._subStreams[name];
    }
}


export default class RecordStore extends Store.Store {

    constructor(initial, locked) {
        super();
        this._data = {};
        this._items = {};
        this._subStreams = {};
        this._immutable = null;

        if (initial) {
            for (var prop in initial) {
                if (initial.hasOwnProperty(prop)) {
                    this.addItem(prop, initial[prop]);
                }
            }
        }

        this._locked = locked || false;
    }

    _get(name) {
        return this._data[name];
    }

    _set(name, value) {
        this._data[name] = value;
        var updateInfo = Store.createUpdateInfo(name, value, this);
        _private(this, setupSubStream, name, value);
        this._streams.push("updates", updateInfo);
    }

    get newItemsPrio() {
        return this._streams.newStream("newItemsPrio");
    }

    hasItem(name) {
        return (this._data.hasOwnProperty(name));
    }

    addItem(name, initial) {
        if (this._locked) {
            throw new Error("This record is locked. You cannot add new items to it.")
        }
        if (!_private(this, checkNameAllowed, name)) {
            throw new Error("Name '" + name + "' not allowed for property of object store.");
        }

        var that = this;


        if (!Object.getPrototypeOf(this).hasOwnProperty(name)) {
            Object.defineProperty(this, name, {
                configurable: true,
                get: function () {
                    return that._get(name);
                },

                set: function (value) {
                    return that._set(name, value);
                }
            });
        }

        this._data[name] = initial;
        _private(this, setupSubStream, name, initial);
        this._streams.push("newItemsPrio", Store.createUpdateInfo(name, initial, that))
        this._streams.push("newItems", Store.createUpdateInfo(name, initial, that))
    }

    removeItem(name) {
        if (this._data.hasOwnProperty(name)) {
            delete this[name];
            delete this._data[name];
            var that = this;

            _private(this, disposeSubStream, name);
            this._streams.push("removedItems", Store.createUpdateInfo(name, null, that))
        } else {
            throw new Error("Unknown property '" + name + "'.");
        }
    }

    item(name) {
        if (this._data.hasOwnProperty(name)) {
            if (!this._items.hasOwnProperty(name)) {
                this._items[name] = new RecordItem(this, name);
            }
            return this._items[name];
        }
        throw new Error("Unknown property '" + name + "'.");
    }

    get immutable() {
        if (!this._immutable) {
            this._immutable = new ImmutableRecord(this);
        }

        return this._immutable;
    }

    get keys() {
        if (Object.keys) {
            return Object.keys(this._data);
        }

        var r = [];
        for (var k in this._data) {
            r.push(k);
        }

        return r;
    }

    clear() {
        this.keys.forEach(name => this.removeItem(name));
    }

    dispose() {
        var that = this;
        this.keys.forEach(function (key) {
            if (Store.isStore(that[key])) {
                that[key].dispose();
            }
            delete that[key];
        });
        this._data = null;

        super.dispose();
    }
}