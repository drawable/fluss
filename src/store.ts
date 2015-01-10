/**
 * Created by Stephan on 29.12.2014.
 */

"use strict";

import Tools = require("./tools");
import Stream = require("./stream")

export function isStore(thing):boolean {
    return thing instanceof RecordStore || thing instanceof ArrayStore || thing instanceof ImmutableRecord || thing instanceof ImmutableArray;
}


export interface OUpdateInfo<T> {
    path?:string;
    item:T;
    rootItem?:T;
    value:any;
    store:IStore
}

function createUpdateInfo<T>(item:T, value:any, store:IStore, path?:string, rootItem?:T):OUpdateInfo<T> {

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

export interface IStore {
    item(value:any):any;

    newItems:Stream.IStream;
    removedItems:Stream.IStream;
    updates:Stream.IStream;
    allChanges:Stream.IStream;
    isDisposing:Stream.IStream;

    dispose();

    immutable:IStore;
    isImmutable:boolean;
}

export interface IRecordStore extends IStore {
    addItem(name:string, initial?:any);
    removeItem(name:string);
    keys:string[];

    [n:string]:any;
}


class Store implements IStore {
    public _addItemsStreams:Stream.IStream[];
    public _removeItemsStreams:Stream.IStream[];
    public _updateStreams:Stream.IStream[];
    public _disposingStreams:Stream.IStream[];

    constructor() {
        this._addItemsStreams = [];
        this._removeItemsStreams = [];
        this._updateStreams = [];
        this._disposingStreams = [];
    }

    get isImmutable():boolean {
        return false;
    }

    removeStream(list, stream) {
        var i = list.indexOf(stream);
        if (i !== -1) {
            list.splice(i, 1);
        }
    }

    get newItems():Stream.IStream {
        var that = this;
        var s = Stream.createStream("addProperty");
        this._addItemsStreams.push(s);

        s.onClose(function() {
            that.removeStream(that._addItemsStreams, s);
        });
        return s;
    }

    get removedItems():Stream.IStream {
        var that = this;
        var s = Stream.createStream("removeProperty");
        this._removeItemsStreams.push(s);
        s.onClose(function() {
            that.removeStream(that._removeItemsStreams, s);
        });

        s.until(this.isDisposing);
        return s;
    }

    get updates():Stream.IStream {
        var that = this;
        var s = Stream.createStream("updateProperty");
        this._updateStreams.push(s);
        s.onClose(function() {
            that.removeStream(that._updateStreams, s);
        });
        return s;
    }

    get allChanges():Stream.IStream {
        return this.updates.combine(this.newItems).combine(this.removedItems);
    }


    get isDisposing():Stream.IStream {
        var that = this;
        var s = Stream.createStream("disposing");
        this._disposingStreams.push(s);
        return s;
    }

    private disposeStreams(streamList:Stream.IStream[]) {
        streamList.forEach(function(stream) {
            stream.dispose();
        });

        streamList = [];
    }

    dispose() {
        this._disposingStreams.forEach(function(stream) {
            stream.push(true);
        });

        this.disposeStreams(this._removeItemsStreams);
        this.disposeStreams(this._updateStreams);
        this.disposeStreams(this._addItemsStreams);
        this.disposeStreams(this._disposingStreams);
    }

    get immutable():IStore {
        return null;
    }

    item(value:any):any {
        return value;
    }
}


class ImmutableStore extends Store {

}



class RecordStore extends Store implements IRecordStore {

    private _data;
    private _subStreams:{};
    private _immutable:IStore;

    [n:string]:any;

    constructor(initial?:any) {
        super();
        this._data = {};
        this._subStreams = {};

        if (initial) {
            for (var prop in initial) {
                if (initial.hasOwnProperty(prop)) {
                    this.addItem(prop, initial[prop]);
                }
            }
        }
    }

    private checkNameAllowed(name:string):boolean {
        return true;
    }

    private setupSubStream(name, value) {
        this.disposeSubStream(name);
        if (isStore(value)) {
            var subStream;
            var that = this;
            subStream = value.updates;
            subStream.forEach(function(update) {
                var info = createUpdateInfo<string>(update.item,
                                                    update.value,
                                                    update.store,
                                                    update.path ? name + "." + update.path : name + "." + update.item,
                                                    name);
                that._updateStreams.forEach(function(stream) {
                    stream.push(info);
                })
            });

            this._subStreams[name] = subStream;
        }
    }

    private disposeSubStream(name) {
        var subStream = this._subStreams[name];
        if (subStream) {
            subStream.dispose();
        }
    }

    addItem(name:string, initial?:any) {
        if (!this.checkNameAllowed(name)) {
            throw new Error("Name '" + name + "' not allowed for property of object store.");
        }

        var that = this;

        Object.defineProperty(this, name, {
            configurable: true,
            get: function():any {
                return that._data[name];
            },

            set: function(value:any) {
                that._data[name] = value;
                var updateInfo = createUpdateInfo(name, value, that);

                that.setupSubStream(name, value);

                that._updateStreams.forEach(function(stream) {
                    stream.push(updateInfo);
                });
            }
        });

        this._data[name] = initial;

        this.setupSubStream(name, initial);

        if (this._addItemsStreams) {
            this._addItemsStreams.forEach(function(stream) {
                stream.push(createUpdateInfo(name, initial, that));
            });
        }
    }

    removeItem(name:string) {
        if (this._data.hasOwnProperty(name)) {
            delete this[name];
            delete this._data[name];
            var that = this;

            this.disposeSubStream(name);
            this._removeItemsStreams.forEach(function(stream) {
                stream.push(createUpdateInfo(name, null, that));
            });
        } else {
            throw new Error("Unknown property '" + name + "'.");
        }
    }

    get immutable():IStore {
        if (!this._immutable) {
            this._immutable = new ImmutableRecord(this);
        }

        return this._immutable;
    }

    get keys():string[] {
        var r = [];
        for (var k in this._data) {
            r.push(k);
        }

        return r;
    }

    dispose() {
        var that = this;
        this.keys.forEach(function(key) {
            if(isStore(that[key])) {
                that[key].dispose();
            }
            delete that[key];
        });
        this._data = null;

        super.dispose();
    }
}

export interface IImmutableRecordStore extends IStore {
    keys:string[];
    [n:string]:any;
}


class ImmutableRecord extends ImmutableStore implements IImmutableRecordStore {

    [n:string]:any;

    constructor(private _parent:IRecordStore) {
        super();
        var that = this;

        _parent.keys.forEach(function(key) {
            that.addItem(key);
        });

        _parent.newItems.forEach(function(update) {
            that.addItem(update.item);
        }).until(_parent.isDisposing);

        _parent.removedItems.forEach(function(update) {
            that.removeItem(update.item);
        }).until(_parent.isDisposing);
    }

    get isImmutable():boolean {
        return true;
    }

    get immutable():IStore {
        return this;
    }

    private addItem(name:string) {
        var that = this;
        Object.defineProperty(this, name, {
            configurable: true,
            get: function():any {
                if (isStore(that._parent[name])) {
                    return that._parent[name].immutable;
                }
                return that._parent[name];
            },

            set: function(value:any) {
            }
        });
    }

    private removeItem(name:string) {
        delete this[name];
    }

    get keys():string[] {
        return this._parent.keys;
    }

    private subscribeParentStream(parentStream:Stream.IStream):Stream.IStream {
        var stream = Stream.createStream();

        parentStream.forEach(function(update) {
            stream.push(update);
        }).until(this._parent.isDisposing);

        var that = this;
        this._updateStreams.push(stream);
        stream.onClose(function() {
            that.removeStream(that._updateStreams, stream);
        });

        return stream;
    }

    get updates():Stream.IStream {
        return this.subscribeParentStream(this._parent.updates);
    }

    get newItems():Stream.IStream {
        return this.subscribeParentStream(this._parent.newItems);
    }

    get removedItems():Stream.IStream {
        return this.subscribeParentStream(this._parent.removedItems);
    }

    get isDisposing():Stream.IStream {
        return this.subscribeParentStream(this._parent.isDisposing);
    }
}

function buildDeep(value:any):any {
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

    function buildArray(value):IArrayStore {
        var store = new ArrayStore();

        value.forEach(function(item) {
            store.push(getItem(item));
        })

        return store;
    }

    function buildRecord(values):IRecordStore {
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

export function record(initial?:any):IRecordStore {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new RecordStore();
    }
}

export interface IArrayStore extends IStore {
    toString():string;
    toLocaleString():string;
    forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any);
    every(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;
    some(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;
    indexOf(value:any):number;
    lastIndexOf(searchElement: any, fromIndex?: number): number;
    join(separator?: string):string;
    map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any):IArrayStore;
    filter(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): IArrayStore;
    reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any):any;
    sort(compareFn?: (a: any, b: any) => number);
    reverse();
    concat(array:IArrayStore):IArrayStore;
    concat(array:any[]):IArrayStore;
    concat(array:any):IArrayStore;
    concatInplace(array:IArrayStore);
    concatInplace(array:any[]);
    concatInplace(array:any);
    push(...values:any[]);
    unshift(...values:any[]);
    pop():any;
    shift():any;
    splice(start:number, deleteCount:number, ...values:any[]):any[];
    insert(atIndex:number, ...values:any[]);
    remove(atIndex:number, count:number):any[];

    length:number;

    [n:number]:any;
}

export interface IImmutableArrayStore extends IStore {
    toString():string;
    toLocaleString():string;
    forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any);
    every(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;
    some(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;
    indexOf(value:any):number;
    lastIndexOf(searchElement: any, fromIndex?: number): number;
    join(separator?: string):string;
    map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any):any[];
    filter(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): any[];
    reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any):any;

    length:number;

    [n:number]:any;
}


class ArrayStore extends Store implements IArrayStore {
    private _data:any[];
    private _maxProps:number;
    private _substreams;
    private _immutable:IImmutableArrayStore;
    private _synced;

    [n:number]:any;

    constructor(initial?:any[], adder?:Stream.IStream, remover?:Stream.IStream, updater?:Stream.IStream) {
        super();
        this._substreams = {};
        this._data = initial || [];
        this._maxProps = 0;
        this.updateProperties();
        this._synced = true;

        var that = this;

        if (adder) {
            adder.forEach(function (update) {
                that.splice(update.item, 0, update.value);
            }).until(this.isDisposing);
        }

        if (remover) {
            remover.forEach(function(update) {
                that.splice(update.item, 1);
            }).until(this.isDisposing);
        }

        if (updater) {
            updater.forEach(function(update) {
                that[update.item] = update.value;
            }).until(this.isDisposing);
        }
    }

    toString():string {
        return this._data.toString();
    }

    toLocaleString():string {
        return this._data.toLocaleString();
    }

    forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any) {
        this._data.forEach(callbackfn, thisArg);
    }

    every(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean {
        return this._data.every(callbackfn, thisArg);
    }

    some(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean {
        return this._data.some(callbackfn, thisArg);
    }

    indexOf(value:any):number {
        if (isStore(value) && value.isImmutable) {
            return this._data.indexOf(value["_parent"]);
        } else {
            return this._data.indexOf(value);
        }
    }

    lastIndexOf(searchElement: any, fromIndex?: number): number {
        return this._data.lastIndexOf(searchElement, fromIndex)
    }

    join(separator?: string):string {
        return this._data.join(separator);
    }

    map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any):IArrayStore {
        var mapped = this._data.map(callbackfn, thisArg);

        var adder = Stream.createStream();
        var remover = Stream.createStream();
        var updater = Stream.createStream();
        var mappedStore = new ArrayStore(mapped, adder, remover, updater);
        var that = this;

        this.updates.forEach(function(update) {
            updater.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
        });

        this.newItems.forEach(function(update) {
            adder.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
        });

        this.removedItems.forEach(function(update) {
            remover.push(createUpdateInfo(update.rootItem, update.value, update.store));        // The value does not matter here, save the call to the callback
        });

        return mappedStore;
    }

    filter(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): IArrayStore {
        var that = this;
        var indexMap = [];
        var filtered = [];

        function map(forIndex, toIndex) {
            indexMap[forIndex] = toIndex;

            if (toIndex !== -1) {
                for (var i = forIndex + 1; i < indexMap.length; i++) {
                    if (indexMap[i] !== -1) {
                        indexMap[i] += 1;
                    }
                }
            }
        }

        function addMap(fromIndex, toIndex) {
            indexMap.splice(fromIndex, 0, toIndex);

            if (toIndex !== -1) {
                for (var i = fromIndex + 1; i < indexMap.length; i++) {
                    if (indexMap[i] !== -1) {
                        indexMap[i] += 1;
                    }
                }
            }
        }

        function unmap(forIndex) {
            var downshift = isMapped(forIndex);
            indexMap[forIndex] = -1;
            if (downshift) {
                for (var i = forIndex + 1; i < indexMap.length; i++) {
                    if (indexMap[i] !== -1) {
                        indexMap[i] -= 1;
                    }
                }
            }
        }

        function removeMap(forIndex) {
            var downshift = isMapped(forIndex);
            indexMap.splice(forIndex, 1);

            if (downshift) {
                for (var i = forIndex; i < indexMap.length; i++) {
                    if (indexMap[i] !== -1) {
                        indexMap[i] -= 1;
                    }
                }
            }
        }

        function mapIndex(fromIndex):number {
            return indexMap[fromIndex];
        }

        function isMapped(index):boolean {
            return index < indexMap.length && indexMap[index] !== -1;
        }

        function getClosestLeftMap(forIndex):number {

            var i = forIndex;

            while ((i >= indexMap.length || indexMap[i] === -1) && i > -2) {
                i--;
            }

            if (i < 0) return -1;
            return mapIndex(i);
        }

        this._data.forEach(function(value, index) {
            if (callbackfn(value, index, that._data)) {
                addMap(index, filtered.length);
                filtered.push(value);
            } else {
                addMap(index, -1);
            }
        });

        var adder = Stream.createStream();
        var remover = Stream.createStream();
        var updater = Stream.createStream();
        var filteredStore = new ArrayStore(filtered, adder, remover, updater);

        this.newItems.forEach(function(update) {
            if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                if (isMapped(update.rootItem)) {
                    adder.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                } else {
                    adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                }
                addMap(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
            } else {
                addMap(update.rootItem, -1);
            }
        });

        this.removedItems.forEach(function(update) {
            if (isMapped(update.rootItem)) {
                remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
            }
            removeMap(update.rootItem);
        });

        this.updates.forEach(function(update) {
            if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                if (isMapped(update.rootItem)) {
                    updater.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store))
                } else {
                    adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                    map(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                }
            } else {
                if (isMapped(update.rootItem)) {
                    remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                    unmap(update.rootItem);
                } else {
                    map(update.rootItem, -1);
                }
            }
        });

        return filteredStore;
    }

    reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any):any {
        return this._data.reduce(callbackfn, initialValue);
    }

    sort(compareFn?: (a: any, b: any) => number) {
        var copy = this._data.map(function(item) { return item });
        copy.sort(compareFn);
        var that = this;
        copy.forEach(function(value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        })
    }

    reverse() {
        var copy = this._data.map(function(item) {
            return item;
        });
        copy.reverse();

        var that = this;
        copy.forEach(function(value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        })
    }

    concat(array:IArrayStore):IArrayStore;
    concat(array:any[]):IArrayStore;
    concat(array:any):IArrayStore {
        var newArray;
        if (array instanceof ArrayStore) {
            newArray = this._data.concat(array["_data"]);
        } else {
            newArray = this._data.concat(array);
        }
        return new ArrayStore(newArray);
    }

    concatInplace(array:IArrayStore);
    concatInplace(array:any[]);
    concatInplace(array:any) {
        if (array instanceof ArrayStore) {
            this.splice.apply(this, [this.length, 0].concat(array["_data"]));
        } else {
            this.splice.apply(this, [this.length, 0].concat(array));
        }
    }

    get length():number {
        return this._data.length;
    }



    private setupSubStreams(item, value) {
        var that = this;
        if (isStore(value)) {
            var substream = this._substreams[Tools.oid(value)];
            if (substream) {
                substream.updates.dispose();
            }

            substream = {
                updates: value.updates
            };
            substream.updates.forEach(function(update) {
                var updateInfo = createUpdateInfo<string>(update.item,
                                                          update.value,
                                                          that,
                                                          update.path ? item + "." + update.path : item + "." + update.item,
                                                          item);
                that._updateStreams.forEach(function(stream) {
                    stream.push(updateInfo);
                })
            });
            this._substreams[Tools.oid(value)] = substream;
        }

    }

    /**
     * Call after removal!
     * @param value
     */
    private disposeSubstream(value) {
        if (isStore(value) &&  this._data.indexOf(value) === -1) {
            var subStream = this._substreams[Tools.oid(value)];
            if (subStream) {
                subStream.updates.dispose();
                delete this._substreams[Tools.oid(value)];
            }
        }
    }

    private updateProperties() {
        var that = this;
        var i;

        // We reset the stream every time because using shift, unshift, splice etc. the indexes of the values change constantly
        for (i = 0; i < this._data.length; i++) {
            that.setupSubStreams(i, this._data[i]);
        }

        for (i = this._maxProps; i < this._data.length; i++) {
            (function(index) {
                Object.defineProperty(that, "" + index, {
                    configurable: true,
                    get: function():any {
                        return that._data[index];
                    },

                    set: function(value:any) {
                        var old = that._data[index];
                        if (value !== old) {
                            that._data[index] = value;
                            that.disposeSubstream(old);
                            that.setupSubStreams(index, value);
                            that._updateStreams.forEach(function(stream) {
                                stream.push(createUpdateInfo<number>(index, that._data[index], that, null));
                            })
                        }
                    }
                })
            })(i);
        }

        this._maxProps = this._data.length;
    }

    push(...values:any[]) {
        var index = this._data.length;
        var that = this;

        values.forEach(function(value) {
            that._data.push(value);
            that._addItemsStreams.forEach(function(stream) {
                stream.push(createUpdateInfo<number>(index, that._data[index], that));
            });
            index++;
        });

        this.updateProperties();
    }

    unshift(...values:any[]) {
        var that = this;

        var l = values.length;

        while(l--) {
            (function() {
                this._data.unshift(values[0]);
                this._newItemStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo<number>(0, that._data[0], that));
                })

            })();
        }
        this.updateProperties();
    }

    pop():any {
        var r = this._data.pop();
        var that = this;

        this.disposeSubstream(r);

        this._removeItemsStreams.forEach(function(stream) {
            stream.push(createUpdateInfo<number>(that._data.length, null, that));
        });

        return r;
    }

    shift():any {
        var r = this._data.shift();
        var that = this;

        this.disposeSubstream(r);

        this._removeItemsStreams.forEach(function(stream) {
            stream.push(createUpdateInfo<number>(0, null, that));
        });

        return r;
    }

    splice(start:number, deleteCount:number, ...values:any[]):any[] {
        var removed = this._data.splice.apply(this._data, [start, deleteCount].concat(values));

        var index = start;
        var that = this;

        if (that._removeItemsStreams.length) {
            removed.forEach(function(value) {
                that.disposeSubstream(value);
                that._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo<number>(index, value, that));
                });
                index++;
            });
        }

        index = start;
        values.forEach(function() {
            that._addItemsStreams.forEach(function(stream) {
                stream.push(createUpdateInfo<number>(index, that._data[index], that));
            });
            index++;
        });

        /* Removed. This should not be necessary and it simplifies the reactive array
        // Index is now at the first item after the last inserted value. So if deleteCount != values.length
        // the items after the insert/remove moved around
        if (deleteCount !== values.length) {
            //var distance = values.length - deleteCount;
            for (index; index < this._data.length; index++) {
                that._updateStreams.forEach(function(stream) {
                    stream.push(createUpdateInfo<number>(index, that._data[index], that));
                })
            }
        }
*/
        this.updateProperties();
        return removed;
    }

    insert(atIndex:number, ...values:any[]) {
        this.splice.apply(this, [atIndex, 0].concat(values));
    }

    remove(atIndex:number, count:number = 1):any[] {
        return this.splice(atIndex, count);
    }

    dispose() {
        for (var i = 0; i < this.length; i++) {
            if (isStore(this[i])) {
                this[i].dispose();
            }

            delete this[i];
        }
        this._data = null;

        super.dispose();
    }

    get immutable():IImmutableArrayStore {
        if (!this._immutable) {
            this._immutable = new ImmutableArray(this);
        }

        return this._immutable;
    }

    item(value:any):any {
        var i = this.indexOf(value);
        if (i !== -1) {
            return this[i];
        }

        return null;
    }
}


class ImmutableArray extends ImmutableStore implements IImmutableArrayStore {

    private _maxProps:number;

    constructor(private _parent:IArrayStore) {
        super();

        var that = this;
        _parent.newItems.forEach(function(update) {
            that.updateProperties();
        }).until(_parent.isDisposing);

        // We do nothing when removing items. The getter will return undefined.
        /*
        _array.removedItems().forEach(function(update) {

        }).until(_array.disposing());
        */

        this._maxProps = 0;
        this.updateProperties();
    }

    private updateProperties() {
        var that = this;
        var i;

        for (i = this._maxProps; i < this._parent.length; i++) {
            (function(index) {
                Object.defineProperty(that, "" + index, {
                    configurable: true,
                    get: function():any {
                        if (isStore(that._parent[index])) {
                            return that._parent[index].immutable;
                        }
                        return that._parent[index];
                    },

                    set: function(value:any) {
                    }
                })
            })(i);
        }

        this._maxProps = this._parent.length;
    }

    toString():string {
        return this._parent.toString();
    }

    toLocaleString():string {
        return this._parent.toString();
    }

    forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any) {
        return this._parent.forEach(callbackfn);
    }

    every(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean {
        return this._parent.every(callbackfn);
    }

    some(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean {
        return this._parent.forEach(callbackfn);
    }

    indexOf(value:any):number {
        return this._parent.indexOf(value);
    }

    lastIndexOf(searchElement: any, fromIndex?: number): number {
        return this._parent.lastIndexOf(searchElement, fromIndex);
    }

    join(separator?: string):string {
        return this._parent.join(separator);
    }

    map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any):any[] {
        //This is dirty but anything else would be inperformant just because typescript does not have protected scope
        return this._parent["_data"].map(callbackfn);
    }

    filter(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): any[] {
        //This is dirty but anything else would be inperformant just because typescript does not have protected scope
        return this._parent["_data"].filter(callbackfn);
    }

    reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any):any {
        return this._parent.reduce(callbackfn, initialValue);
    }

    get length():number {
        return this._parent.length;
    }

    [n:number]:any;

    private subscribeParentStream(parentStream:Stream.IStream):Stream.IStream {
        var stream = Stream.createStream();

        parentStream.forEach(function(update) {
            stream.push(update);
        }).until(this._parent.isDisposing);

        var that = this;
        this._updateStreams.push(stream);
        stream.onClose(function() {
            that.removeStream(that._updateStreams, stream);
        });

        return stream;
    }

    get updates():Stream.IStream {
        return this.subscribeParentStream(this._parent.updates);
    }

    get newItems():Stream.IStream {
        return this.subscribeParentStream(this._parent.newItems);
    }

    get removedItems():Stream.IStream {
        return this.subscribeParentStream(this._parent.removedItems);
    }

    get disposing():Stream.IStream {
        return this.subscribeParentStream(this._parent.isDisposing);
    }

    get immutable():IStore {
        return this;
    }
}

export function array(initial?:any[]):IArrayStore {
    if (initial) {
        return buildDeep(initial);
    } else {
        return new ArrayStore()
    }
}
