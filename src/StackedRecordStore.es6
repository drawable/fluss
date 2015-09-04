/**
 * Created by Stephan on 23.06.2015.
 */


import RecordStore from './RecordStore';
import RecordItem from './RecordItem';

let _private = (obj, func, ...args) => func.apply(obj, args);

function disposeSubStream(name) {
    var subStream = this._subStreams[name];
    if (subStream) {
        subStream.updates.close();
        subStream.newItems.close();
        subStream.removedItems.close();
        delete this._subStreams[name];
    }
}

export default class StackedRecordStore extends RecordStore {

    constructor(parent, initial) {
        super(initial);
        this._parent = parent;

        this._streams.relay(parent.updates.filter(({rootItem}) => !this._data.hasOwnProperty(rootItem)), "updates");
        this._streams.relay(parent.removedItems.filter(({rootItem}) => !this._data.hasOwnProperty(rootItem)), "removedItems");
        this._streams.relay(parent.newItems.filter(({rootItem}) => !this._data.hasOwnProperty(rootItem)), "newItems");
        this._streams.relay(parent.isDisposing.filter(({rootItem}) => !this._data.hasOwnProperty(rootItem)), "isDisposing");

        parent.keys.forEach(name => this._setupParentItem(name));

        parent.newItems.filter(({store}) => store === parent).forEach(({item}) => this._setupParentItem(item));
        parent.removedItems.filter(({store}) => store === parent).forEach(({item}) => this._removeParentItem(item));
    }

    _removeParentItem(name) {
        var that = this;

        if(Object.getPrototypeOf(this).hasOwnProperty(name)) {
            Object.removeProperty(name);
        }
    }

    _setupParentItem(name) {
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
    }

    _get(name) {
        if (this._data.hasOwnProperty(name)) {
            return this._data[name];
        }

        else return this._parent._get(name);
    }

    _set(name, value) {
        if (this._data.hasOwnProperty(name)) {
            return super._set(name, value)
        }

        else return this._parent._set(name, value);
    }


    get keys() {
        var keys = super.keys;
        return keys.concat(this._parent.keys);
    }

    removeItem(name) {
        if (this._parent.hasItem(name)) {
            delete this._data[name];
            _private(this, disposeSubStream, name);
        } else {
            super.removeItem(name);
        }
    }

    hasItem(name) {
        return (this._data.hasOwnProperty(name) || this._parent.hasItem(name));
    }

    item(name) {
        if (this.hasItem(name)) {
            if (!this._items.hasOwnProperty(name)) {
                this._items[name] = new RecordItem(this, name);
            }
            return this._items[name];
        } else {
            return this._parent.item(name);
        }
    }
}