/// <reference path="./tools.ts" />
/// <reference path="./stream.ts" />

/**
 * Created by Stephan on 29.12.2014.
 */

"use strict";

module Fluss {

    /**
     * Stores provide a means to store application state. Stores are reactive in the way that the provide
     * streams for updates, new items, removed items and when they are being disposed.
     *
     * There are three types of stores
     *
     *  * Value: A single value
     *  * Record: A set of values, comparable to an plain Javascript object
     *  * Array: A list of values, comparable to a Javascript array.
     *
     * Stores can be nested, e.g. an array can hold values or records. Streams will bubble up through the nested hierarchy
     * so when a record that is contained in an array has an item updated, the update stream of the array will process.
     *
     * Every store provides an immutable proxy, that provides the same data and streams but cannot be used to change the
     * data of the store.
     *
     */
    export module Store {
        /**
         * Test if something is a store.
         * @param thing
         * @returns {boolean}
         */
        export function isStore(thing):boolean {
            return thing instanceof RecordStore     || thing instanceof ArrayStore      || thing instanceof Item ||
                   thing instanceof ImmutableRecord || thing instanceof ImmutableArray  || thing instanceof ImmutableItem;
        }


        /**
         * The update information that will be provided by the reactive stream on the store
         * for new items, removed items and changed items.
         */
        export interface OUpdateInfo<T> {

            /**
             * In nested stores this is the path to the item.
             * Every index/name along the way is separated by a .
             */
            path?:string;

            /**
             * Identifier of the item. It is either a string for record stores
             * or a number for array stores
             */
            item:T;

            /**
             * In nested stores this will be the actual item that triggered
             * the change. So if you have a store
             *
             *   s = {
             *     a: [ { x: 1 } ]
             *   }
             *
             * and you change x the rootItem will be 'x' for a stream at a or s.
             */
            rootItem?:T;

            /**
             * The value of that item. This is either the new value when the item was updated,
             * or the initial value when the item was newly created. If the item was removed this
             * is null. Do not try to deduct that the item was removed just because value is null, though.
             * Subscribe to removedItems of a store explicitly, instead.
             */
            value:any;

            /**
             * The store of the item that triggered the change
             */
            store:IStore
        }

        export function createUpdateInfo<T>(item:T, value:any, store:IStore, path?:string, rootItem?:T):OUpdateInfo<T> {

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


        /**
         * A store is an object that holds data and provides reactive streams to
         * observe updates, new items, removed items and the disposal of that store.
         * A store can be immutable, i.e. you cannot add, remove or change items.
         */
        export interface IStore {
            item(value:any):any;

            /**
             * Reactive stream that processes whenever an item is added to the store.
             * Every get access creates a new stream.
             */
            newItems:Stream.IStream;

            /**
             * Reactive stream that processes whenever an item is removed to the store.
             * Every get access creates a new stream.
             */
            removedItems:Stream.IStream;

            /**
             * Reactive stream that processes whenever an items value is changed.
             * Every get access creates a new stream.
             */
            updates:Stream.IStream;

            /**
             * Reactive stream that processes whenever an item is added, removed or changed.
             * Every get access creates a new stream.
             */
            allChanges:Stream.IStream;

            /**
             * Reactive stream that processes when the store is disposed.
             * Every get access creates a new stream.
             */
            isDisposing:Stream.IStream;

            /**
             * Dispose the store. That frees all the data and closes all streams that where
             * created for that store. Before all that the isDisposing-streams will process.
             */
            dispose();

            /**
             * Get the immutable proxy for that store. This will return the same instance for every
             * get access. This instance is created on the first get access.
             */
            immutable:IStore;

            /**
             * Tell whether the store is immutable
             */
            isImmutable:boolean;
        }


        /**
         * An item is a single value that provides reactive streams to
         * observe updates.
         */
        export interface IItem extends IStore {
            /**
             * Get the value
             */
            get():any;

            /**
             * Set the value
             * @param value
             */
            set(value:any);
        }


        /**
         * A record store holds values like a plain JavaScript object. Adding new properties using the index accessor []
         * will break it's behaviour. Use the provided methods instead.
         */
        export interface IRecordStore extends IStore {

            /**
             * Add a new property
             * @param name
             * @param initial
             */
            addItem(name:string, initial?:any);

            /**
             * Remove a property
             * @param name
             */
            removeItem(name:string);

            /**
             * All property names
             */
            keys:string[];

            [n:string]:any;
        }


        export class Store implements IStore {
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


        /**
         * Base class for immutable stores.
         */
        class ImmutableStore extends Store {
            get isImmutable():boolean {
                return true;
            }
        }


        export class Item extends Store implements IItem {

            private _value:any;
            private _subStreamU:Fluss.Stream.IStream;
            private _subStreamN:Fluss.Stream.IStream;
            private _subStreamR:Fluss.Stream.IStream;

            constructor(initial?:any) {
                super();
                if (typeof initial !== "undefined") {
                    this.set(initial);
                }
            }

            private disposeSubStreams() {
                if (this._subStreamU) {
                    this._subStreamU.dispose();
                }
                if (this._subStreamN) {
                    this._subStreamN.dispose();
                }
                if (this._subStreamR) {
                    this._subStreamR.dispose();
                }
            }

            private setupSubStreams() {

                function createSubInfo(update) {
                    return createUpdateInfo<string>(update.item,
                        update.value,
                        update.store,
                        update.path ? "(item)" + "." + update.path : "(item)" + "." + update.item,
                        "(item)");
                }

                var that = this;
                this.disposeSubStreams();
                if (isStore(this._value)) {
                    this._subStreamU = this._value.updates;
                    this._value.updates.forEach(function(update) {
                        var info = createSubInfo(update);
                        that._updateStreams.forEach(function(stream) {
                            stream.push(info);
                        })
                    });
                    this._subStreamN = this._value.newItems;
                    this._value.newItems.forEach(function(update) {
                        var info = createSubInfo(update);
                        that._addItemsStreams.forEach(function(stream) {
                            stream.push(info);
                        })
                    });
                    this._subStreamR = this._value.updates;
                    this._value.removedItems.forEach(function(update) {
                        var info = createSubInfo(update);
                        that._removeItemsStreams.forEach(function(stream) {
                            stream.push(info);
                        })
                    })
                }
            }

            set(value:any) {
                var that = this;
                this._value = value;
                if (this._updateStreams) {
                    var info = createUpdateInfo(null, this._value, this);
                    that.setupSubStreams();
                    this._updateStreams.forEach(function(stream) {
                        stream.push(info);
                    })
                }
            }

            get():any {
                return this._value;
            }

            get immutable():IStore {
                return new ImmutableItem(this);
            }

            item():any {
                if (isStore(this._value)) {
                    return this._value;
                }
                return this;
            }
        }

        class ImmutableItem extends ImmutableStore implements IItem {

            constructor(private _parent:IItem) {
                super();
            }

            set() {

            }

            get():any {
                var v = this._parent["_value"];
                if (isStore(v)) {
                    return v.immutable;
                }

                return this._parent.get();
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

            item():any {
                return this;
            }
        }

        /**
         * Create a new item store. If it is given an object or an array it will create a substore hierarchy.
         * @param initial
         * @returns {Fluss.Store.Item}
         */
        export function item(initial:any):IItem {
            if (isStore(initial)) {
                return new Item(initial);
            } else {
                return new Item(buildDeep(initial) || initial);
            }
        }



        export class RecordStore extends Store implements IRecordStore {

            private _data;
            private _subStreams:{};
            private _immutable:IStore;
            private _locked:boolean;

            [n:string]:any;

            constructor(initial?:any, locked?:boolean) {
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

                this._locked = locked || false;
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

            _get(name:string) {
                return this._data[name];
            }

            _set(name:string, value:any) {
                this._data[name] = value;
                var updateInfo = createUpdateInfo(name, value, this);

                this.setupSubStream(name, value);

                this._updateStreams.forEach(function(stream) {
                    stream.push(updateInfo);
                });
            }

            addItem(name:string, initial?:any) {
                if (this._locked) {
                    throw new Error("This record is locked. You cannot add new items to it.")
                }
                if (!this.checkNameAllowed(name)) {
                    throw new Error("Name '" + name + "' not allowed for property of object store.");
                }

                var that = this;


                if (!Object.getPrototypeOf(this).hasOwnProperty(name)) {
                    Object.defineProperty(this, name, {
                        configurable: true,
                        get: function():any {
                            return that._get(name);
                        },

                        set: function(value:any) {
                            return that._set(name, value);
                        }
                    });
                }

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
                if (Object.getOwnPropertyNames) {
                    return Object.getOwnPropertyNames(this._data);
                }

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


        /**
         * The immutable type of the record store. It prevents
         * all changes to the record.
         */
        export interface IImmutableRecordStore extends IStore {
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

        /**
         * Recursively build a nested store.
         * @param value
         * @returns {*}
         */
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
                });

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

        /**
         * Create a new record. If an initial value is given it will have the enumerable properties of that value. You can
         * create nested stores by providing a complex object as an initial value.
         * @param initial
         * @returns {*}
         */
        export function record(initial?:any):IRecordStore {
            if (initial) {
                return buildDeep(initial);
            } else {
                return new RecordStore();
            }
        }


        /**
         * An Array store holds data in an array. It behaves much like a regular JavaScript array but provides streams for
         * updates, newItems, removedItems and when it's disposed. Functions that return a new array in JavaScript return an
         * array store.
         */
        export interface IArrayStore extends IStore {

            /**
             * Returns the standard string representation of an array.
             */
            toString():string;
            toLocaleString():string;

            /**
             * Performs the specified action for each element in an array.
             * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
             * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
             */
            forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any);

            /**
             * Determines whether all the members of an array satisfy the specified test.
             * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
             * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
             */
            every(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;

            /**
             * Determines whether the specified callback function returns true for any element of an array.
             * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
             * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
             */
            some(callbackfn: (value: any, index: number, array: any[]) => boolean, thisArg?: any): boolean;

            /**
             * Returns the index of the first occurrence of a value in an array. If this is used with an immutable proxy of a substore
             * it will return the index of the actual substore.
             *
             * @param searchElement The value to locate in the array.
             * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
             */
            indexOf(value:any, fromIndex?:number):number;

            /**
             * Returns the index of the last occurrence of a specified value in an array. f this is used with an immutable proxy of a substore
             * it will return the index of the actual substore.
             *
             * @param searchElement The value to locate in the array.
             * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
             */
            lastIndexOf(searchElement: any, fromIndex?: number): number;

            /**
             * Adds all the elements of an array separated by the specified separator string.
             * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
             */
            join(separator?: string):string;

            /**
             * Calls a defined callback function on each element of an array, and returns an array that contains the results.
             * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
             * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
             */
            map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any):IArrayStore;

            /**
             * Returns the elements of an array that meet the condition specified in a callback function.
             * The returned ArrayStore will update automatically when the base ArrayStore updates. This is guaranteed to work correctly when
             * callbackfn only uses the value to determine whether to keep it or not. Using index or even the array, filter functions can be
             * created that will lead to undefined results. In these cases or when you don't need that behaviour you can disable it by
             * setting noUpdates.
             *
             * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
             * @param noUpdates Disable the automatic update of the filtered store
             * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
             */
            filter(callbackfn: (value: any, index: number, array: any[]) => boolean, noUpdates?:boolean, thisArg?: any): IArrayStore;

            /**
             * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
             * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
             * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
             */
            reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any):any;

            /**
             * Sorts an array.
             * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
             */
            sort(compareFn?: (a: any, b: any) => number);

            /**
             * Reverses the elements in an Array.
             */
            reverse();

            /**
             * Combines two arrays.
             * @param array The array to concat
             */
            concat(array:IArrayStore):IArrayStore;

            /**
             * Combines two arrays.
             * @param array The array to concat
             */
            concat(array:any[]):IArrayStore;

            /**
             * Combines two arrays.
             * @param array The array to concat
             */
            concat(array:any):IArrayStore;

            /**
             * Combines two arrays. This does not create a new array store. It appends the values of the given array to the
             * array store
             * @param array The array to concat
             */
            concatInplace(array:IArrayStore);

            /**
             * Combines two arrays. This does not create a new array store. It appends the values of the given array to the
             * array store
             * @param array The array to concat
             */
            concatInplace(array:any[]);

            /**
             * Combines two arrays. This does not create a new array store. It appends the values of the given array to the
             * array store
             * @param array The array to concat
             */
            concatInplace(array:any);

            /**
             * Add one or more values to the end of the array.
             * @param values
             */
            push(...values:any[]);

            /**
             * Insert one or more items to the beginning of the array. The first velue will be the first in the array, the second
             * the second and so on.
             * @param values
             */
            unshift(...values:any[]);

            /**
             * Remove the last item from the array
             */
            pop():any;

            /**
             * Remove the first item of the array. The second item will become the first.
             */
            shift():any;

            /**
             * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
             * @param start The zero-based location in the array from which to start removing elements.
             * @param deleteCount The number of elements to remove.
             * @param items Elements to insert into the array in place of the deleted elements.
             */
            splice(start:number, deleteCount:number, ...values:any[]):any[];

            /**
             * Insert a new item at the specified position.
             * @param atIndex
             * @param values
             */
            insert(atIndex:number, ...values:any[]);

            /**
             * Remove and return an item from the specified position.
             * @param atIndex
             * @param count
             */
            remove(atIndex:number, count:number):any[];

            /**
             * Gets the length of the array. This is a number one higher than the highest element defined in an array.
             */
            length:number;

            [n:number]:any;
        }

        /**
         * The immutable array store. It behaves much like a regular JavaScript array but provides streams for
         * updates, newItems, removedItems and when it's disposed, that are just pass throughs of the respective
         * streams of the original mutable store. Functions that return a new array in JavaScript return an
         * array here, not an array store as in the mutable version.
         */
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


        export class ArrayStore extends Store implements IArrayStore {
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

            indexOf(value:any, fromIndex?:number):number {
                if (isStore(value) && value.isImmutable) {
                    return this._data.indexOf(value["_parent"], fromIndex);
                } else {
                    return this._data.indexOf(value, fromIndex);
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

            filter(callbackfn: (value: any, index: number, array: any[]) => boolean, noUpdates:boolean, thisArg?: any): IArrayStore {
                var that = this;
                var adder:Stream.IStream;
                var remover:Stream.IStream;
                var updater:Stream.IStream;
                var filteredStore:IArrayStore;

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


                if (!noUpdates) {
                    adder = Stream.createStream();
                    remover = Stream.createStream();
                    updater = Stream.createStream();

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
                }

                filteredStore = new ArrayStore(filtered, adder, remover, updater);

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

                function define(index) {
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
                }

                for (i = this._maxProps; i < this._data.length; i++) {
                    define(i);
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
                    that._data.unshift(values[0]);
                    that._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo<number>(0, that._data[0], that));
                    })
                }
                this.updateProperties();
            }

            pop():any {
                var r = this._data.pop();
                var that = this;

                this.disposeSubstream(r);

                this._removeItemsStreams.forEach(function(stream) {
                    stream.push(createUpdateInfo<number>(that._data.length, r, that));
                });

                return r;
            }

            shift():any {
                var r = this._data.shift();
                var that = this;

                this.disposeSubstream(r);

                this._removeItemsStreams.forEach(function(stream) {
                    stream.push(createUpdateInfo<number>(0, r, that));
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

                function define(index) {
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
                }

                for (i = this._maxProps; i < this._parent.length; i++) {
                    define(i);
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


        /**
         * Create an array store. If an initial value is provided it will initialize the array
         * with it. The initial value can be a JavaScript array of either simple values or plain objects.
         * It the array has plain objects a nested store will be created.
         * @param initial
         * @returns {*}
         */
        export function array(initial?:any[]):IArrayStore {
            if (initial) {
                return buildDeep(initial);
            } else {
                return new ArrayStore()
            }
        }
    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Store = Fluss.Store;
}
