/**
 * Created by Stephan on 23.06.2015.
 */

import Item from './StoreItem';

export default class RecordItem extends Item {

    constructor(record, itemName) {
        super();
        this._record = record;
        this._itemName = itemName;

        this._streams.relay(this._record.updates.filter((update) => update.item === this._itemName ), "updates");
        this._record.removedItems
            .filter(update => update.item === this._itemName)
            .forEach(() => this.dispose());
    }

    get value() {
        return this._record[this._itemName];
    }

    set value(value) {
        this._record[this._itemName] = value;
    }

    dispose() {
        super.dispose();
        this._record = null;
        this._itemName = null;
    }
}