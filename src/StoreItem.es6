/**
 * Created by Stephan on 09.04.2015.
 */


import * as StreamProvider from './StreamProvider';

export default class Item {

    constructor() {
        this._immutable = null;
        this._streams = StreamProvider.create();
    }

    get isStore() {
        return true;
    }

    get updates() {
        return this._streams.newStream("updates");
    }

    get isDisposing() {
        return this._streams.newStream("disposing");
    }

    dispose() {
        this._streams.push("disposing", true);
        this._streams.dispose();
        this._streams = null;
    }

    get value() {

    }

    set value(value) {

    }

    get immutable() {
        if (!this._immutable) {
            this._immutable = new ImmutableItem(this);
        }

        return this._immutable;
    }
}

class ImmutableItem {

    constructor(parent) {
        this._parent = parent;
    }

    get value() {
        return this._parent.value;
    }

    get immutable() {
        return this;
    }
}