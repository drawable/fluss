/**
 * Created by Stephan on 24.02.2015.
 */

"use strict";

import * as Tools from './Tools';
import * as Stream from './Stream';
import * as Store from './StoreBase';
import ImmutableArrayStore from './ImmutableArrayStore';

let _private = (obj, func, ...args) => func.apply(obj, args);

function setupSubStreams(item, value) {
    if (Store.isStore(value)) {
        _private(this, disposeSubstream, value);
        let subStream = {};

        let doSubStream = (streamId) => {
            subStream[streamId] = value[streamId];
            subStream[streamId].forEach((update) => {
                let info = Store.createUpdateInfo(update.item,
                    update.value,
                    this,
                    update.path ? item + "." + update.path : item + "." + update.item,
                    item);
                this._streams.push(streamId, info);
            });
        };

        doSubStream("updates");
        doSubStream("newItems");
        doSubStream("removedItems");
        this._substreams[Tools.oid(value)] = subStream;
    }
}

/**
 * Call after removal!
 * @param value
 */
function disposeSubstream(value) {
    if (Store.isStore(value) &&  this._data.indexOf(value) === -1) {
        var subStream = this._substreams[Tools.oid(value)];
        if (subStream) {
            subStream.updates.close();
            subStream.newItems.close();
            subStream.removedItems.close();
            delete this._substreams[Tools.oid(value)];
        }
    }
}

function updateProperties() {
    var i;

    // We reset the stream every time because using shift, unshift, splice etc. the indexes of the values change constantly
    for (i = 0; i < this._data.length; i++) {
        _private(this, setupSubStreams, i, this._data[i]);
    }

    let define = (index) => {
        Object.defineProperty(this, "" + index, {
            configurable: true,
            get: () => this._data[index],

            set: (value) => {
                var old = this._data[index];
                if (value !== old) {
                    this._data[index] = value;
                    _private(this, disposeSubstream, old);
                    _private(this, setupSubStreams, index, value);
                    this._streams.push("updates", Store.createUpdateInfo(index, this._data[index], this, null))
                }
            }
        })
    };
    for (i = this._maxProps; i < this._data.length; i++) {
        define(i);
    }
    this._maxProps = this._data.length;
}


export default class ArrayStore extends Store.Store {

    constructor(initial, adder, remover, updater) {
        super();
        this._maxProps = 0;
        this._substreams = {};
        this._data = initial || [];
        this._maxProps = 0;
        this._immutable = null;

        _private(this, updateProperties);

        if (adder) {
            adder.forEach((update) => this.splice(update.item, 0, update.value))
                 .until(this.isDisposing);
        }

        if (remover) {
            remover.forEach((update) => this.splice(update.item, 1))
                   .until(this.isDisposing);
        }

        if (updater) {
            updater.forEach((update) => this[update.item] = update.value)
                   .until(this.isDisposing);
        }
    }

    /**
    * Returns the standard string representation of an array.
    */
    toString() {
        return this._data.toString();
    }

    /**
     * Returns the localized standard string representation of an array.
     */
    toLocaleString() {
        return this._data.toLocaleString();
    }

    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    forEach(callbackfn, thisArg) {
        this._data.forEach(callbackfn, thisArg);
    }

    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(callbackfn, thisArg) {
        return this._data.every(callbackfn, thisArg);
    }

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn, thisArg) {
        return this._data.some(callbackfn, thisArg);
    }

    /**
     * Returns the index of the first occurrence of a value in an array. If this is used with an immutable proxy of a substore
     * it will return the index of the actual substore.
     *
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(value, fromIndex) {
        if (Store.isStore(value) && value.isImmutable) {
            return this._data.indexOf(value["_parent"], fromIndex);
        } else {
            return this._data.indexOf(value, fromIndex);
        }
    }

    /**
     * Returns the index of the last occurrence of a specified value in an array. f this is used with an immutable proxy of a substore
     * it will return the index of the actual substore.
     *
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement, fromIndex) {
        return this._data.lastIndexOf(searchElement, fromIndex)
    }

    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator) {
        return this._data.join(separator);
    }

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map(callbackfn, thisArg) {
        var mapped = this._data.map(callbackfn, thisArg);

        var adder = Stream.create();
        var remover = Stream.create();
        var updater = Stream.create();
        var mappedStore = new ArrayStore(mapped, adder, remover, updater);
        var that = this;

        this.updates.forEach(function (update) {
            updater.push(Store.createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
        });

        this.newItems.forEach(function (update) {
            adder.push(Store.createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
        });

        this.removedItems.forEach(function (update) {
            remover.push(Store.createUpdateInfo(update.rootItem, update.value, update.store));        // The value does not matter here, save the call to the callback
        });

        return mappedStore;
    }

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
    filter(callbackfn, noUpdates, thisArg) {
        var that = this;
        var adder, remover, updater, filteredStore;

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

        function mapIndex(fromIndex) {
            return indexMap[fromIndex];
        }

        function isMapped(index) {
            return index < indexMap.length && indexMap[index] !== -1;
        }

        function getClosestLeftMap(forIndex) {
            var i = forIndex;
            while ((i >= indexMap.length || indexMap[i] === -1) && i > -2) {
                i--;
            }
            if (i < 0) return -1;
            return mapIndex(i);
        }

        this._data.forEach(function (value, index) {
            if (callbackfn(value, index, that._data)) {
                addMap(index, filtered.length);
                filtered.push(value);
            } else {
                addMap(index, -1);
            }
        });


        if (!noUpdates) {
            adder = Stream.create();
            remover = Stream.create();
            updater = Stream.create();

            this.newItems.forEach(function (update) {
                if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                    if (isMapped(update.rootItem)) {
                        adder.push(Store.createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                    } else {
                        adder.push(Store.createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                    }
                    addMap(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                } else {
                    addMap(update.rootItem, -1);
                }
            });

            this.removedItems.forEach(function (update) {
                if (isMapped(update.rootItem)) {
                    remover.push(Store.createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                }
                removeMap(update.rootItem);
            });

            this.updates.forEach(function (update) {
                if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                    if (isMapped(update.rootItem)) {
                        updater.push(Store.createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store))
                    } else {
                        adder.push(Store.createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                        map(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                    }
                } else {
                    if (isMapped(update.rootItem)) {
                        remover.push(Store.createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
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

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce(callbackfn, currentValue, currentIndex, array, initialValue) {
        return this._data.reduce(callbackfn, initialValue);
    }

    /**
     * Sorts an array.
     * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
     */
    sort(compareFn) {
        var copy = this._data.map(function (item) {
            return item
        });
        copy.sort(compareFn);
        var that = this;
        copy.forEach(function (value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        })
    }

    /**
     * Reverses the elements in an Array.
     */
    reverse() {
        var copy = this._data.map(function (item) {
            return item;
        });
        copy.reverse();

        var that = this;
        copy.forEach(function (value, index) {
            if (value !== that._data[index]) {
                that[index] = value;
            }
        })
    }

    /**
     * Combines two arrays.
     * @param array The array to concat
     */
    concat(array) {
        var newArray;
        if (array instanceof ArrayStore) {
            newArray = this._data.concat(array["_data"]);
        } else {
            newArray = this._data.concat(array);
        }
        return new ArrayStore(newArray);
    }

    /**
     * Combines two arrays. This does not create a new array store. It appends the values of the given array to the
     * array store
     * @param array The array to concat
     */
    concatInplace(array) {
        if (array instanceof ArrayStore) {
            this.splice.apply(this, [this.length, 0].concat(array["_data"]));
        } else {
            this.splice.apply(this, [this.length, 0].concat(array));
        }
    }

    get length() {
        return this._data.length;
    }

    /**
     * Add one or more values to the end of the array.
     * @param values
     */
    push(...values) {
        var index = this._data.length;
        var that = this;

        values.forEach(function (value) {
            that._data.push(value);
            that._streams.push("newItems", Store.createUpdateInfo(index, that._data[index], that))
            index++;
        });

        _private(this, updateProperties);
    }

    /**
     * Insert one or more items to the beginning of the array. The first velue will be the first in the array, the second
     * the second and so on.
     * @param values
     */
    unshift(...values) {
        var that = this;

        var l = values.length;

        while (l--) {
            that._data.unshift(values[0]);
            that._streams.push("newItems", Store.createUpdateInfo(0, that._data[0], that))
        }
        _private(this, updateProperties);
    }

    /**
     * Remove the last item from the array
     */
    pop() {
        var r = this._data.pop();
        var that = this;

        _private(this, disposeSubstream, r);
        this._streams.push("removedItems", Store.createUpdateInfo(that._data.length, r, that))
        return r;
    }

    /**
     * Remove the first item of the array. The second item will become the first.
     */
    shift() {
        var r = this._data.shift();
        var that = this;

        _private(this, disposeSubstream, r);
        this._streams.push("removedItems", Store.createUpdateInfo(0, r, that))
        return r;
    }

    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    splice(start, deleteCount, ...values) {
        var removed = this._data.splice.apply(this._data, [start, deleteCount].concat(values));

        var index = start;
        var that = this;

        removed.forEach((value) => {
            _private(that, disposeSubstream, value);
            this._streams.push("removedItems", Store.createUpdateInfo(index, value, that))
            index++;
        });

        index = start;
        values.forEach(() => {
            that._streams.push("newItems", Store.createUpdateInfo(index, that._data[index], that));
            index++;
        });

        _private(this, updateProperties);
        return removed;
    }

    /**
     * Insert a new item at the specified position.
     * @param atIndex
     * @param values
     */
    insert(atIndex, ...values) {
        this.splice.apply(this, [atIndex, 0].concat(values));
    }

    /**
     * Remove and return an item from the specified position.
     * @param atIndex
     * @param count
     */
    remove(atIndex, count = 1) {
        return this.splice(atIndex, count);
    }

    /**
     * Free memory.
     */
    dispose() {
        for (var i = 0; i < this.length; i++) {
            if (Store.isStore(this[i])) {
                this[i].dispose();
            }

            delete this[i];
        }
        this._data = null;

        super.dispose();
    }

    /**
     * Return the immutable proxy of the store
     * @returns {}
     */
    get immutable() {
        if (!this._immutable) {
            this._immutable = new ImmutableArrayStore(this);
        }

        return this._immutable;
    }

    /**
     *
     * @param value
     * @returns {*}
     */
    item(value) {
        var i = this.indexOf(value);
        if (i !== -1) {
            return this[i];
        }

        return null;
    }
}