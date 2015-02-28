/**
 * Created by Stephan on 24.02.2015.
 */

import * as Tools from './Tools';
import * as StreamProvider from './StreamProvider';

export function createUpdateInfo(item, value, store, path, rootItem) {
    var r = {
        item:item,
        value:value,
        store:store
    };

    if (path) {
        r["path"] = path;
    }

    if (rootItem != null) {
        r["rootItem"] = rootItem;
    } else {
        r["rootItem"] = item;
    }

    return r;
}

export class Store {
    constructor() {
        this._streams = StreamProvider.create();
    }

    get isImmutable() {
        return false;
    }

    get newItems() {
        return this._streams.newStream("newItems");
    }

    get removedItems() {
        return this._streams.newStream("removedItems");
    }

    get updates() {
        return this._streams.newStream("updates");
    }

    get allChanges() {
        return this.updates.combine(this.newItems).combine(this.removedItems);
    }


    get isDisposing() {
        return this._streams.newStream("disposing");
    }


    dispose() {
        this._streams.push("disposing", true);
        this._streams.dispose();
    }

    get immutable() {
        return null;
    }

    item(value) {
        return value;
    }
}


export class ImmutableStore extends Store {
    get isImmutable() {
        return true;
    }
}

/**
 * Test if something is a store.
 * @param thing
 * @returns {boolean}
 */
export function isStore(thing) {
    return thing && typeof thing.newItems !== "undefined";
}