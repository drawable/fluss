/**
 * Created by Stephan.Smola on 30.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Tools;
    (function (Tools) {
        /**
         * Determine the screen position and size of an element in the DOM
         * @param element
         * @returns {{x: number, y: number, w: number, h: number}}
         */
        function elementPositionAndSize(element) {
            var rect = element.getBoundingClientRect();
            return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
        }
        Tools.elementPositionAndSize = elementPositionAndSize;
        var pfx = [
            { id: "webkit", camelCase: true },
            { id: "MS", camelCase: true },
            { id: "o", camelCase: true },
            { id: "", camelCase: false }
        ];
        /**
         * Add event listener for prefixed events. As the camel casing of the event listeners is different
         * across browsers you need to specify the type camelcased starting with a capital letter. The function
         * then takes care of the browser specifics.
         *
         * @param element
         * @param type
         * @param callback
         */
        function addPrefixedEventListener(element, type, callback) {
            for (var p = 0; p < pfx.length; p++) {
                if (!pfx[p].camelCase)
                    type = type.toLowerCase();
                element.addEventListener(pfx[p].id + type, callback, false);
            }
        }
        Tools.addPrefixedEventListener = addPrefixedEventListener;
        /**
         * Convenience method for calling callbacks
         * @param cb    The callback function to call
         */
        function callCallback(cb) {
            var any = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                any[_i - 1] = arguments[_i];
            }
            if (cb) {
                if (typeof (cb) == "function") {
                    var args = [];
                    for (var i = 1; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                    return cb.apply(this, args);
                }
                else {
                    throw new Error("Callback is not a function!");
                }
            }
        }
        Tools.callCallback = callCallback;
        /**
         * Check if something is an array.
         * @param thing
         * @returns {boolean}
         */
        function isArray(thing) {
            return Object.prototype.toString.call(thing) === '[object Array]';
        }
        Tools.isArray = isArray;
        var OID_PROP = "__ID__";
        var oids = 10000;
        /**
         * Create and return a unique id on a JavaScript object. This adds a new property
         * __ID__ to that object. Ids are numbers.
         *
         * The ID is created the first time this function is called for that object and then
         * will simply be returned on all subsequent calls.
         *
         * @param obj
         * @returns {any}
         */
        function oid(obj) {
            if (obj) {
                if (!obj.hasOwnProperty(OID_PROP)) {
                    obj[OID_PROP] = oids++;
                }
                return obj[OID_PROP];
            }
        }
        Tools.oid = oid;
        function applyMixins(derivedCtor, baseCtors) {
            baseCtors.forEach(function (baseCtor) {
                Object.getOwnPropertyNames(baseCtor).forEach(function (name) {
                    derivedCtor.prototype[name] = baseCtor[name];
                });
            });
        }
        /**
         * Use this to subclass a typescript class using plain JavaScript. Spec is an object
         * containing properties and methods of the new class. Methods in spec will override
         * methods in baseClass.
         *
         * You will NOT be able to make super calls in the subclass.
         *
         * @param spec
         * @param baseClass
         * @returns {any}
         */
        function subclass(spec, baseClass) {
            var constructor;
            if (spec.hasOwnProperty("constructor")) {
                constructor = function () {
                    baseClass.prototype.constructor.apply(this, arguments);
                    spec["constructor"].apply(this, arguments);
                };
            }
            else {
                constructor = function () {
                    baseClass.prototype.constructor.apply(this, arguments);
                };
            }
            constructor.prototype = Object.create(baseClass.prototype);
            applyMixins(constructor, [spec]);
            return constructor;
        }
        Tools.subclass = subclass;
    })(Tools = Fluss.Tools || (Fluss.Tools = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Tools = Fluss.Tools;
}
if (typeof this["define"] === "function") {
    this["define"]("tools", [], function () {
        return Fluss.Tools;
    });
}

/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Emitter;
    (function (_Emitter) {
        /**
         * An event-emitter
         */
        var Emitter = (function () {
            function Emitter() {
            }
            Emitter.prototype.subscribe = function (event, handler) {
                if (!this._eventHandlers) {
                    this._eventHandlers = {};
                }
                if (!this._eventHandlers[event]) {
                    this._eventHandlers[event] = [];
                }
                this._eventHandlers[event].push(handler);
            };
            Emitter.prototype.unsubscribe = function (event, handler) {
                if (!this._eventHandlers) {
                    return;
                }
                if (this._eventHandlers[event]) {
                    this._eventHandlers[event].splice(this._eventHandlers[event].indexOf(handler), 1);
                }
            };
            Object.defineProperty(Emitter.prototype, "eventHandlers", {
                get: function () {
                    return this._eventHandlers;
                },
                enumerable: true,
                configurable: true
            });
            Emitter.prototype.emit = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var that = this;
                if (this._eventHandlers && this._eventHandlers[event]) {
                    this._eventHandlers[event].forEach(function (handler) {
                        handler.apply(that, args);
                    });
                }
            };
            Emitter.prototype.relay = function (emitter, subscribingEvent, emittingEvent) {
                var that = this;
                emitter.subscribe(subscribingEvent, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    that.emit.apply(that, [emittingEvent].concat(args));
                });
            };
            return Emitter;
        })();
        _Emitter.Emitter = Emitter;
    })(Emitter = Fluss.Emitter || (Fluss.Emitter = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Emitter = Fluss.Emitter;
}
if (typeof this["define"] === "function") {
    this["define"]("emitter", [], function () {
        return Fluss.Emitter;
    });
}

/**
 * Created by Stephan on 27.12.2014.
 *
 * A simple implementation of a collection stream that supports reactive patterns.
 *
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Stream;
    (function (_Stream) {
        /**
         * Base implementation of the collection stream
         */
        var Stream = (function () {
            function Stream(_name) {
                this._name = _name;
                this._buffer = [];
                this._methods = [];
                this._errorMethods = [];
                this._closeMethods = [];
                this._closed = false;
                this._length = 0;
                this._maxLength = 0;
                this._nextStreams = [];
            }
            Object.defineProperty(Stream.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stream.prototype, "length", {
                get: function () {
                    return this._length;
                },
                enumerable: true,
                configurable: true
            });
            Stream.prototype.callCloseMethods = function () {
                var that = this;
                this._closeMethods.forEach(function (m) {
                    m.call(that);
                });
            };
            Stream.prototype.close = function () {
                if (!this._closed) {
                    this._closed = true;
                    this.callCloseMethods();
                    this.dispose();
                }
            };
            Stream.prototype.dispose = function () {
                this.close();
                this._methods = [];
                this._buffer = [];
                this._closeMethods = [];
                this._errorMethods = [];
            };
            Stream.prototype.times = function (maxLength) {
                this._maxLength = maxLength;
                return this;
            };
            Stream.prototype.until = function (stream) {
                var that = this;
                if (stream) {
                    stream.forEach(function () {
                        that.close();
                    });
                }
                return this;
            };
            Object.defineProperty(Stream.prototype, "closed", {
                get: function () {
                    return this._closed;
                },
                enumerable: true,
                configurable: true
            });
            Stream.prototype.addToBuffer = function (value) {
                this._buffer.unshift(value);
            };
            Stream.prototype.processBuffer = function (buffer, methods, baseIndex) {
                if (this._closed)
                    return null;
                if (!methods.length)
                    return null;
                var l = buffer.length;
                var that = this;
                var errors = [];
                while (l--) {
                    var value = buffer.pop();
                    methods.forEach(function (m, i) {
                        try {
                            m.call(that, value, i + baseIndex);
                        }
                        catch (e) {
                            errors.push(e);
                        }
                    });
                }
                return errors;
            };
            Stream.prototype.processBuffers = function () {
                var errors = this.processBuffer(this._buffer, this._methods, this._length - this._buffer.length);
                if (errors && errors.length) {
                    if (this._errorMethods.length) {
                        this.processBuffer(errors, this._errorMethods, 0);
                    }
                    else {
                        errors.forEach(function (e) {
                            throw e;
                        });
                    }
                }
            };
            Stream.prototype.addMethod = function (method) {
                var firstMethod = this._methods.length === 0;
                this._methods.push(method);
                if (firstMethod) {
                    this.processBuffers();
                }
            };
            Stream.prototype.removeMethod = function (method) {
                this._methods.indexOf(method);
            };
            Stream.prototype.addErrorMethod = function (method) {
                this._errorMethods.push(method);
            };
            Stream.prototype.addCloseMethod = function (method) {
                if (this.closed) {
                    method.call(this);
                }
                else {
                    this._closeMethods.push(method);
                }
            };
            Stream.prototype.push = function (value) {
                if (!this._closed) {
                    this.addToBuffer(value);
                    this._length++;
                    this.processBuffers();
                    if (this._length === this._maxLength) {
                        this.close();
                    }
                }
            };
            Stream.prototype.pushError = function (error) {
                // If we can't handle the error ourselves we throw it again. That will give preceding streams the chance to handle these
                if (!this._errorMethods || !this._errorMethods.length) {
                    throw error;
                }
                this.processBuffer([error], this._errorMethods, 0);
            };
            Stream.prototype.forEach = function (method) {
                this.addMethod(method);
                return this;
            };
            Stream.prototype.registerNextStream = function (nextStream) {
                var that = this;
                this._nextStreams.push(nextStream);
                nextStream.onClose(function () {
                    var i = that._nextStreams.indexOf(nextStream);
                    if (i !== -1) {
                        that._nextStreams.splice(i, 1);
                        if (!that._nextStreams.length) {
                            that.close();
                        }
                    }
                });
            };
            Stream.prototype.addMethodToNextStream = function (nextStream, method, onClose) {
                var that = this;
                var fn = function (value, index) {
                    try {
                        method.call(that, value, index);
                    }
                    catch (e) {
                        nextStream.pushError(e);
                    }
                };
                this.addMethod(fn);
                nextStream.onClose(function () {
                    that.removeMethod(fn);
                });
                this.registerNextStream(nextStream);
                if (!onClose) {
                    this.onClose(function () {
                        nextStream.close();
                    });
                }
                else {
                    this.onClose(onClose);
                }
            };
            Stream.prototype.filter = function (method) {
                var nextStream = new Stream(this._name + ".filter");
                var that = this;
                if (typeof method === "function") {
                    this.addMethodToNextStream(nextStream, function (value, index) {
                        if (method.call(that, value, index)) {
                            nextStream.push(value);
                        }
                    });
                }
                else {
                    this.addMethodToNextStream(nextStream, function (value) {
                        if (method == value) {
                            nextStream.push(value);
                        }
                    });
                }
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.map = function (method) {
                var nextStream = new Stream(this._name + ".map");
                var that = this;
                if (typeof method === "function") {
                    this.addMethodToNextStream(nextStream, function (value, index) {
                        nextStream.push(method.call(that, value, index));
                    });
                }
                else {
                    this.addMethodToNextStream(nextStream, function (value) {
                        nextStream.push(method);
                    });
                }
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.scan = function (method, seed) {
                var nextStream = new Stream(this._name + ".scan");
                var that = this;
                var scanned = seed;
                this.addMethodToNextStream(nextStream, function (value) {
                    scanned = method.call(that, scanned, value);
                    nextStream.push(scanned);
                });
                nextStream.push(scanned);
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.reduce = function (method, seed) {
                var nextStream = new Stream(this._name + ".reduce");
                var that = this;
                var reduced = seed;
                this.addMethodToNextStream(nextStream, function (value) {
                    reduced = method.call(that, reduced, value);
                }, function () {
                    nextStream.push(reduced);
                    nextStream.close();
                });
                if (this._closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.concat = function (stream) {
                var nextStream = new Stream(this._name + ".concat");
                var buffer = null;
                // When this is already closed, we only care for the other stream
                if (!this._closed) {
                    buffer = [];
                }
                else {
                    if (stream.closed) {
                        nextStream.close();
                    }
                }
                // We need to buffer, because this may not be the first
                // method attached to the stream. Otherwise any data that
                // is pushed to stream before the original is closed would
                // be lost for the concat.
                stream.forEach(function (value) {
                    if (buffer) {
                        buffer.push(value);
                    }
                    else {
                        nextStream.push(value);
                    }
                });
                stream.onClose(function () {
                    if (!buffer) {
                        nextStream.close();
                    }
                });
                this.addMethodToNextStream(nextStream, function (value) {
                    nextStream.push(value);
                }, function () {
                    if (buffer) {
                        buffer.forEach(function (value) {
                            nextStream.push(value);
                        });
                    }
                    if (stream.closed) {
                        nextStream.close();
                    }
                    buffer = null;
                });
                if (this._closed && stream.closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.concatAll = function () {
                var nextStream = new Stream(this._name + ".concatAll");
                var queue = [];
                var cursor = null;
                function nextInQueue() {
                    var l = queue.length;
                    while (l--) {
                        cursor = queue[l];
                        update();
                        if (cursor.done) {
                            queue.pop();
                        }
                        else {
                            update();
                            break;
                        }
                    }
                }
                function update() {
                    if (cursor) {
                        var l = cursor.data.length;
                        while (l--) {
                            nextStream.push(cursor.data.pop());
                        }
                    }
                }
                function concatStream(stream) {
                    var subBuffer = {
                        data: [],
                        done: false
                    };
                    queue.unshift(subBuffer);
                    stream.forEach(function (value) {
                        subBuffer.data.unshift(value);
                        update();
                    });
                    stream.onClose(function () {
                        subBuffer.done = true;
                        nextInQueue();
                    });
                    if (queue.length === 1) {
                        cursor = subBuffer;
                    }
                }
                this.forEach(function (subStream) {
                    concatStream(subStream);
                });
                this.onClose(function () {
                    nextStream.close();
                });
                if (this._closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.combine = function (stream) {
                var that = this;
                var nextStream = new Stream(this._name + ".combine");
                this.forEach(function (value) {
                    nextStream.push(value);
                });
                stream.forEach(function (value) {
                    nextStream.push(value);
                });
                this.onClose(function () {
                    if (stream.closed) {
                        nextStream.close();
                    }
                });
                stream.onClose(function () {
                    if (that._closed) {
                        nextStream.close();
                    }
                });
                if (this._closed && stream.closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.onClose = function (method) {
                this.addCloseMethod(method);
                return this;
            };
            Stream.prototype.onError = function (method) {
                this.addErrorMethod(method);
                return this;
            };
            Stream.prototype.throttle = function (milliseconds) {
                var nextStream = new Stream("throttled");
                var go = true;
                this.forEach(function (value) {
                    if (go) {
                        nextStream.push(value);
                        go = false;
                        setTimeout(function () {
                            go = true;
                        }, milliseconds);
                    }
                });
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.debounce = function (milliseconds) {
                var nextStream = new Stream("debounced");
                var debouncedValue = null;
                var timeout;
                function reset() {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        if (debouncedValue) {
                            nextStream.push(debouncedValue);
                            debouncedValue = null;
                        }
                    }, milliseconds);
                }
                this.forEach(function (value) {
                    debouncedValue = value;
                    reset();
                });
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.buffer = function (until) {
                var nextStream = new Stream("buffered");
                var buffer = [];
                this.forEach(function (value) {
                    buffer.push(value);
                });
                until.forEach(function () {
                    nextStream.push(buffer);
                    buffer = [];
                });
                this.registerNextStream(nextStream);
                return nextStream;
            };
            return Stream;
        })();
        _Stream.Stream = Stream;
        /**
         * Create a new stream. The name is mostly for debugging purposes and can be omitted. It defaults to 'stream' then.
         * @param name
         * @returns {Stream}
         */
        function createStream(name) {
            return new Stream(name || "stream");
        }
        _Stream.createStream = createStream;
    })(Stream = Fluss.Stream || (Fluss.Stream = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Stream = Fluss.Stream;
}
if (typeof this["define"] === "function") {
    this["define"]("stream", [], function () {
        return Fluss.Stream;
    });
}

/// <reference path="./tools.ts" />
/// <reference path="./stream.ts" />
/**
 * Created by Stephan on 29.12.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Store;
    (function (_Store) {
        /**
         * Test if something is a store.
         * @param thing
         * @returns {boolean}
         */
        function isStore(thing) {
            return thing instanceof RecordStore || thing instanceof ArrayStore || thing instanceof ImmutableRecord || thing instanceof ImmutableArray;
        }
        _Store.isStore = isStore;
        function createUpdateInfo(item, value, store, path, rootItem) {
            var r = {
                item: item,
                value: value,
                store: store
            };
            if (path) {
                r["path"] = path;
            }
            if (rootItem != null) {
                r["rootItem"] = rootItem;
            }
            else {
                r["rootItem"] = item;
            }
            return r;
        }
        var Store = (function () {
            function Store() {
                this._addItemsStreams = [];
                this._removeItemsStreams = [];
                this._updateStreams = [];
                this._disposingStreams = [];
            }
            Object.defineProperty(Store.prototype, "isImmutable", {
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.removeStream = function (list, stream) {
                var i = list.indexOf(stream);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            };
            Object.defineProperty(Store.prototype, "newItems", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("addProperty");
                    this._addItemsStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._addItemsStreams, s);
                    });
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "removedItems", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("removeProperty");
                    this._removeItemsStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._removeItemsStreams, s);
                    });
                    s.until(this.isDisposing);
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "updates", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("updateProperty");
                    this._updateStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._updateStreams, s);
                    });
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "allChanges", {
                get: function () {
                    return this.updates.combine(this.newItems).combine(this.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "isDisposing", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("disposing");
                    this._disposingStreams.push(s);
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.disposeStreams = function (streamList) {
                streamList.forEach(function (stream) {
                    stream.dispose();
                });
                streamList = [];
            };
            Store.prototype.dispose = function () {
                this._disposingStreams.forEach(function (stream) {
                    stream.push(true);
                });
                this.disposeStreams(this._removeItemsStreams);
                this.disposeStreams(this._updateStreams);
                this.disposeStreams(this._addItemsStreams);
                this.disposeStreams(this._disposingStreams);
            };
            Object.defineProperty(Store.prototype, "immutable", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.item = function (value) {
                return value;
            };
            return Store;
        })();
        /**
         * Base class for immutable stores.
         */
        var ImmutableStore = (function (_super) {
            __extends(ImmutableStore, _super);
            function ImmutableStore() {
                _super.apply(this, arguments);
            }
            return ImmutableStore;
        })(Store);
        var RecordStore = (function (_super) {
            __extends(RecordStore, _super);
            function RecordStore(initial) {
                _super.call(this);
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
            RecordStore.prototype.checkNameAllowed = function (name) {
                return true;
            };
            RecordStore.prototype.setupSubStream = function (name, value) {
                this.disposeSubStream(name);
                if (isStore(value)) {
                    var subStream;
                    var that = this;
                    subStream = value.updates;
                    subStream.forEach(function (update) {
                        var info = createUpdateInfo(update.item, update.value, update.store, update.path ? name + "." + update.path : name + "." + update.item, name);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(info);
                        });
                    });
                    this._subStreams[name] = subStream;
                }
            };
            RecordStore.prototype.disposeSubStream = function (name) {
                var subStream = this._subStreams[name];
                if (subStream) {
                    subStream.dispose();
                }
            };
            RecordStore.prototype.addItem = function (name, initial) {
                if (!this.checkNameAllowed(name)) {
                    throw new Error("Name '" + name + "' not allowed for property of object store.");
                }
                var that = this;
                Object.defineProperty(this, name, {
                    configurable: true,
                    get: function () {
                        return that._data[name];
                    },
                    set: function (value) {
                        that._data[name] = value;
                        var updateInfo = createUpdateInfo(name, value, that);
                        that.setupSubStream(name, value);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(updateInfo);
                        });
                    }
                });
                this._data[name] = initial;
                this.setupSubStream(name, initial);
                if (this._addItemsStreams) {
                    this._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(name, initial, that));
                    });
                }
            };
            RecordStore.prototype.removeItem = function (name) {
                if (this._data.hasOwnProperty(name)) {
                    delete this[name];
                    delete this._data[name];
                    var that = this;
                    this.disposeSubStream(name);
                    this._removeItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(name, null, that));
                    });
                }
                else {
                    throw new Error("Unknown property '" + name + "'.");
                }
            };
            Object.defineProperty(RecordStore.prototype, "immutable", {
                get: function () {
                    if (!this._immutable) {
                        this._immutable = new ImmutableRecord(this);
                    }
                    return this._immutable;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RecordStore.prototype, "keys", {
                get: function () {
                    var r = [];
                    for (var k in this._data) {
                        r.push(k);
                    }
                    return r;
                },
                enumerable: true,
                configurable: true
            });
            RecordStore.prototype.dispose = function () {
                var that = this;
                this.keys.forEach(function (key) {
                    if (isStore(that[key])) {
                        that[key].dispose();
                    }
                    delete that[key];
                });
                this._data = null;
                _super.prototype.dispose.call(this);
            };
            return RecordStore;
        })(Store);
        var ImmutableRecord = (function (_super) {
            __extends(ImmutableRecord, _super);
            function ImmutableRecord(_parent) {
                _super.call(this);
                this._parent = _parent;
                var that = this;
                _parent.keys.forEach(function (key) {
                    that.addItem(key);
                });
                _parent.newItems.forEach(function (update) {
                    that.addItem(update.item);
                }).until(_parent.isDisposing);
                _parent.removedItems.forEach(function (update) {
                    that.removeItem(update.item);
                }).until(_parent.isDisposing);
            }
            Object.defineProperty(ImmutableRecord.prototype, "isImmutable", {
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "immutable", {
                get: function () {
                    return this;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableRecord.prototype.addItem = function (name) {
                var that = this;
                Object.defineProperty(this, name, {
                    configurable: true,
                    get: function () {
                        if (isStore(that._parent[name])) {
                            return that._parent[name].immutable;
                        }
                        return that._parent[name];
                    },
                    set: function (value) {
                    }
                });
            };
            ImmutableRecord.prototype.removeItem = function (name) {
                delete this[name];
            };
            Object.defineProperty(ImmutableRecord.prototype, "keys", {
                get: function () {
                    return this._parent.keys;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableRecord.prototype.subscribeParentStream = function (parentStream) {
                var stream = Fluss.Stream.createStream();
                parentStream.forEach(function (update) {
                    stream.push(update);
                }).until(this._parent.isDisposing);
                var that = this;
                this._updateStreams.push(stream);
                stream.onClose(function () {
                    that.removeStream(that._updateStreams, stream);
                });
                return stream;
            };
            Object.defineProperty(ImmutableRecord.prototype, "updates", {
                get: function () {
                    return this.subscribeParentStream(this._parent.updates);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "newItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.newItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "removedItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "isDisposing", {
                get: function () {
                    return this.subscribeParentStream(this._parent.isDisposing);
                },
                enumerable: true,
                configurable: true
            });
            return ImmutableRecord;
        })(ImmutableStore);
        /**
         * Recursively build a nested store.
         * @param value
         * @returns {*}
         */
        function buildDeep(value) {
            function getItem(value) {
                var v;
                if (typeof value === "object") {
                    if (Fluss.Tools.isArray(value)) {
                        v = buildArray(value);
                    }
                    else {
                        v = buildRecord(value);
                    }
                }
                else {
                    v = value;
                }
                return v;
            }
            function buildArray(value) {
                var store = new ArrayStore();
                value.forEach(function (item) {
                    store.push(getItem(item));
                });
                return store;
            }
            function buildRecord(values) {
                var store = new RecordStore();
                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        store.addItem(key, getItem(values[key]));
                    }
                }
                return store;
            }
            if (typeof value === "object") {
                if (Fluss.Tools.isArray(value)) {
                    return buildArray(value);
                }
                else {
                    return buildRecord(value);
                }
            }
            else {
                return null;
            }
        }
        /**
         * Create a new record. If an initial value is given it will have the enumerable properties of that value. You can
         * create nested stores by providing a complex object as an initial value.
         * @param initial
         * @returns {*}
         */
        function record(initial) {
            if (initial) {
                return buildDeep(initial);
            }
            else {
                return new RecordStore();
            }
        }
        _Store.record = record;
        var ArrayStore = (function (_super) {
            __extends(ArrayStore, _super);
            function ArrayStore(initial, adder, remover, updater) {
                _super.call(this);
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
                    remover.forEach(function (update) {
                        that.splice(update.item, 1);
                    }).until(this.isDisposing);
                }
                if (updater) {
                    updater.forEach(function (update) {
                        that[update.item] = update.value;
                    }).until(this.isDisposing);
                }
            }
            ArrayStore.prototype.toString = function () {
                return this._data.toString();
            };
            ArrayStore.prototype.toLocaleString = function () {
                return this._data.toLocaleString();
            };
            ArrayStore.prototype.forEach = function (callbackfn, thisArg) {
                this._data.forEach(callbackfn, thisArg);
            };
            ArrayStore.prototype.every = function (callbackfn, thisArg) {
                return this._data.every(callbackfn, thisArg);
            };
            ArrayStore.prototype.some = function (callbackfn, thisArg) {
                return this._data.some(callbackfn, thisArg);
            };
            ArrayStore.prototype.indexOf = function (value, fromIndex) {
                if (isStore(value) && value.isImmutable) {
                    return this._data.indexOf(value["_parent"], fromIndex);
                }
                else {
                    return this._data.indexOf(value, fromIndex);
                }
            };
            ArrayStore.prototype.lastIndexOf = function (searchElement, fromIndex) {
                return this._data.lastIndexOf(searchElement, fromIndex);
            };
            ArrayStore.prototype.join = function (separator) {
                return this._data.join(separator);
            };
            ArrayStore.prototype.map = function (callbackfn, thisArg) {
                var mapped = this._data.map(callbackfn, thisArg);
                var adder = Fluss.Stream.createStream();
                var remover = Fluss.Stream.createStream();
                var updater = Fluss.Stream.createStream();
                var mappedStore = new ArrayStore(mapped, adder, remover, updater);
                var that = this;
                this.updates.forEach(function (update) {
                    updater.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
                });
                this.newItems.forEach(function (update) {
                    adder.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
                });
                this.removedItems.forEach(function (update) {
                    remover.push(createUpdateInfo(update.rootItem, update.value, update.store)); // The value does not matter here, save the call to the callback
                });
                return mappedStore;
            };
            ArrayStore.prototype.filter = function (callbackfn, noUpdates, thisArg) {
                var that = this;
                var adder;
                var remover;
                var updater;
                var filteredStore;
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
                    if (i < 0)
                        return -1;
                    return mapIndex(i);
                }
                this._data.forEach(function (value, index) {
                    if (callbackfn(value, index, that._data)) {
                        addMap(index, filtered.length);
                        filtered.push(value);
                    }
                    else {
                        addMap(index, -1);
                    }
                });
                if (!noUpdates) {
                    adder = Fluss.Stream.createStream();
                    remover = Fluss.Stream.createStream();
                    updater = Fluss.Stream.createStream();
                    this.newItems.forEach(function (update) {
                        if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                            if (isMapped(update.rootItem)) {
                                adder.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                            }
                            else {
                                adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                            }
                            addMap(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                        }
                        else {
                            addMap(update.rootItem, -1);
                        }
                    });
                    this.removedItems.forEach(function (update) {
                        if (isMapped(update.rootItem)) {
                            remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                        }
                        removeMap(update.rootItem);
                    });
                    this.updates.forEach(function (update) {
                        if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                            if (isMapped(update.rootItem)) {
                                updater.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                            }
                            else {
                                adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                                map(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                            }
                        }
                        else {
                            if (isMapped(update.rootItem)) {
                                remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                                unmap(update.rootItem);
                            }
                            else {
                                map(update.rootItem, -1);
                            }
                        }
                    });
                }
                filteredStore = new ArrayStore(filtered, adder, remover, updater);
                return filteredStore;
            };
            ArrayStore.prototype.reduce = function (callbackfn, initialValue) {
                return this._data.reduce(callbackfn, initialValue);
            };
            ArrayStore.prototype.sort = function (compareFn) {
                var copy = this._data.map(function (item) {
                    return item;
                });
                copy.sort(compareFn);
                var that = this;
                copy.forEach(function (value, index) {
                    if (value !== that._data[index]) {
                        that[index] = value;
                    }
                });
            };
            ArrayStore.prototype.reverse = function () {
                var copy = this._data.map(function (item) {
                    return item;
                });
                copy.reverse();
                var that = this;
                copy.forEach(function (value, index) {
                    if (value !== that._data[index]) {
                        that[index] = value;
                    }
                });
            };
            ArrayStore.prototype.concat = function (array) {
                var newArray;
                if (array instanceof ArrayStore) {
                    newArray = this._data.concat(array["_data"]);
                }
                else {
                    newArray = this._data.concat(array);
                }
                return new ArrayStore(newArray);
            };
            ArrayStore.prototype.concatInplace = function (array) {
                if (array instanceof ArrayStore) {
                    this.splice.apply(this, [this.length, 0].concat(array["_data"]));
                }
                else {
                    this.splice.apply(this, [this.length, 0].concat(array));
                }
            };
            Object.defineProperty(ArrayStore.prototype, "length", {
                get: function () {
                    return this._data.length;
                },
                enumerable: true,
                configurable: true
            });
            ArrayStore.prototype.setupSubStreams = function (item, value) {
                var that = this;
                if (isStore(value)) {
                    var substream = this._substreams[Fluss.Tools.oid(value)];
                    if (substream) {
                        substream.updates.dispose();
                    }
                    substream = {
                        updates: value.updates
                    };
                    substream.updates.forEach(function (update) {
                        var updateInfo = createUpdateInfo(update.item, update.value, that, update.path ? item + "." + update.path : item + "." + update.item, item);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(updateInfo);
                        });
                    });
                    this._substreams[Fluss.Tools.oid(value)] = substream;
                }
            };
            /**
             * Call after removal!
             * @param value
             */
            ArrayStore.prototype.disposeSubstream = function (value) {
                if (isStore(value) && this._data.indexOf(value) === -1) {
                    var subStream = this._substreams[Fluss.Tools.oid(value)];
                    if (subStream) {
                        subStream.updates.dispose();
                        delete this._substreams[Fluss.Tools.oid(value)];
                    }
                }
            };
            ArrayStore.prototype.updateProperties = function () {
                var that = this;
                var i;
                for (i = 0; i < this._data.length; i++) {
                    that.setupSubStreams(i, this._data[i]);
                }
                for (i = this._maxProps; i < this._data.length; i++) {
                    (function (index) {
                        Object.defineProperty(that, "" + index, {
                            configurable: true,
                            get: function () {
                                return that._data[index];
                            },
                            set: function (value) {
                                var old = that._data[index];
                                if (value !== old) {
                                    that._data[index] = value;
                                    that.disposeSubstream(old);
                                    that.setupSubStreams(index, value);
                                    that._updateStreams.forEach(function (stream) {
                                        stream.push(createUpdateInfo(index, that._data[index], that, null));
                                    });
                                }
                            }
                        });
                    })(i);
                }
                this._maxProps = this._data.length;
            };
            ArrayStore.prototype.push = function () {
                var values = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    values[_i - 0] = arguments[_i];
                }
                var index = this._data.length;
                var that = this;
                values.forEach(function (value) {
                    that._data.push(value);
                    that._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(index, that._data[index], that));
                    });
                    index++;
                });
                this.updateProperties();
            };
            ArrayStore.prototype.unshift = function () {
                var values = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    values[_i - 0] = arguments[_i];
                }
                var that = this;
                var l = values.length;
                while (l--) {
                    (function () {
                        this._data.unshift(values[0]);
                        this._newItemStreams.forEach(function (stream) {
                            stream.push(createUpdateInfo(0, that._data[0], that));
                        });
                    })();
                }
                this.updateProperties();
            };
            ArrayStore.prototype.pop = function () {
                var r = this._data.pop();
                var that = this;
                this.disposeSubstream(r);
                this._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(that._data.length, null, that));
                });
                return r;
            };
            ArrayStore.prototype.shift = function () {
                var r = this._data.shift();
                var that = this;
                this.disposeSubstream(r);
                this._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(0, null, that));
                });
                return r;
            };
            ArrayStore.prototype.splice = function (start, deleteCount) {
                var values = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    values[_i - 2] = arguments[_i];
                }
                var removed = this._data.splice.apply(this._data, [start, deleteCount].concat(values));
                var index = start;
                var that = this;
                if (that._removeItemsStreams.length) {
                    removed.forEach(function (value) {
                        that.disposeSubstream(value);
                        that._removeItemsStreams.forEach(function (stream) {
                            stream.push(createUpdateInfo(index, value, that));
                        });
                        index++;
                    });
                }
                index = start;
                values.forEach(function () {
                    that._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(index, that._data[index], that));
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
            };
            ArrayStore.prototype.insert = function (atIndex) {
                var values = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    values[_i - 1] = arguments[_i];
                }
                this.splice.apply(this, [atIndex, 0].concat(values));
            };
            ArrayStore.prototype.remove = function (atIndex, count) {
                if (count === void 0) { count = 1; }
                return this.splice(atIndex, count);
            };
            ArrayStore.prototype.dispose = function () {
                for (var i = 0; i < this.length; i++) {
                    if (isStore(this[i])) {
                        this[i].dispose();
                    }
                    delete this[i];
                }
                this._data = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(ArrayStore.prototype, "immutable", {
                get: function () {
                    if (!this._immutable) {
                        this._immutable = new ImmutableArray(this);
                    }
                    return this._immutable;
                },
                enumerable: true,
                configurable: true
            });
            ArrayStore.prototype.item = function (value) {
                var i = this.indexOf(value);
                if (i !== -1) {
                    return this[i];
                }
                return null;
            };
            return ArrayStore;
        })(Store);
        var ImmutableArray = (function (_super) {
            __extends(ImmutableArray, _super);
            function ImmutableArray(_parent) {
                _super.call(this);
                this._parent = _parent;
                var that = this;
                _parent.newItems.forEach(function (update) {
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
            ImmutableArray.prototype.updateProperties = function () {
                var that = this;
                var i;
                for (i = this._maxProps; i < this._parent.length; i++) {
                    (function (index) {
                        Object.defineProperty(that, "" + index, {
                            configurable: true,
                            get: function () {
                                if (isStore(that._parent[index])) {
                                    return that._parent[index].immutable;
                                }
                                return that._parent[index];
                            },
                            set: function (value) {
                            }
                        });
                    })(i);
                }
                this._maxProps = this._parent.length;
            };
            ImmutableArray.prototype.toString = function () {
                return this._parent.toString();
            };
            ImmutableArray.prototype.toLocaleString = function () {
                return this._parent.toString();
            };
            ImmutableArray.prototype.forEach = function (callbackfn, thisArg) {
                return this._parent.forEach(callbackfn);
            };
            ImmutableArray.prototype.every = function (callbackfn, thisArg) {
                return this._parent.every(callbackfn);
            };
            ImmutableArray.prototype.some = function (callbackfn, thisArg) {
                return this._parent.forEach(callbackfn);
            };
            ImmutableArray.prototype.indexOf = function (value) {
                return this._parent.indexOf(value);
            };
            ImmutableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
                return this._parent.lastIndexOf(searchElement, fromIndex);
            };
            ImmutableArray.prototype.join = function (separator) {
                return this._parent.join(separator);
            };
            ImmutableArray.prototype.map = function (callbackfn, thisArg) {
                //This is dirty but anything else would be inperformant just because typescript does not have protected scope
                return this._parent["_data"].map(callbackfn);
            };
            ImmutableArray.prototype.filter = function (callbackfn, thisArg) {
                //This is dirty but anything else would be inperformant just because typescript does not have protected scope
                return this._parent["_data"].filter(callbackfn);
            };
            ImmutableArray.prototype.reduce = function (callbackfn, initialValue) {
                return this._parent.reduce(callbackfn, initialValue);
            };
            Object.defineProperty(ImmutableArray.prototype, "length", {
                get: function () {
                    return this._parent.length;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableArray.prototype.subscribeParentStream = function (parentStream) {
                var stream = Fluss.Stream.createStream();
                parentStream.forEach(function (update) {
                    stream.push(update);
                }).until(this._parent.isDisposing);
                var that = this;
                this._updateStreams.push(stream);
                stream.onClose(function () {
                    that.removeStream(that._updateStreams, stream);
                });
                return stream;
            };
            Object.defineProperty(ImmutableArray.prototype, "updates", {
                get: function () {
                    return this.subscribeParentStream(this._parent.updates);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "newItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.newItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "removedItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "disposing", {
                get: function () {
                    return this.subscribeParentStream(this._parent.isDisposing);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "immutable", {
                get: function () {
                    return this;
                },
                enumerable: true,
                configurable: true
            });
            return ImmutableArray;
        })(ImmutableStore);
        /**
         * Create an array store. If an initial value is provided it will initialize the array
         * with it. The initial value can be a JavaScript array of either simple values or plain objects.
         * It the array has plain objects a nested store will be created.
         * @param initial
         * @returns {*}
         */
        function array(initial) {
            if (initial) {
                return buildDeep(initial);
            }
            else {
                return new ArrayStore();
            }
        }
        _Store.array = array;
    })(Store = Fluss.Store || (Fluss.Store = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Store = Fluss.Store;
}
if (typeof this["define"] === "function") {
    this["define"]("store", ["stream", "tools"], function () {
        return Fluss.Store;
    });
}

/// <reference path="./stream.ts" />
/**
 * Created by Stephan on 10.01.2015.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var ReactMixins;
    (function (ReactMixins) {
        ReactMixins.componentLifecycle = {
            _willUnmount: null,
            componentDidMount: function () {
                this._willUnmount = Fluss.Stream.createStream("component-unmount");
            },
            componentWillUnmount: function () {
                this._willUnmount.push(true);
                this._willUnmount.dispose();
            }
        };
    })(ReactMixins = Fluss.ReactMixins || (Fluss.ReactMixins = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.ReactMixins = Fluss.ReactMixins;
}
if (typeof this["define"] === "function") {
    this["define"]("reactMixins", ["stream"], function () {
        return Fluss.ReactMixins;
    });
}

/// <reference path="./emitter.ts" />
/// <reference path="./stream.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var EventChannel;
    (function (_EventChannel) {
        var EventChannel = (function () {
            function EventChannel() {
                this._eventHandlers = {};
            }
            EventChannel.prototype.subscribe = function (emitter, event, handler) {
                if (!this._eventHandlers[emitter]) {
                    this._eventHandlers[emitter] = {};
                }
                if (!this._eventHandlers[emitter][event]) {
                    this._eventHandlers[emitter][event] = [];
                }
                this._eventHandlers[emitter][event].push(handler);
            };
            EventChannel.prototype.unsubscribe = function (emitter, event, handler) {
                if (this._eventHandlers[emitter]) {
                    if (this._eventHandlers[emitter][event]) {
                        this._eventHandlers[emitter][event].splice(this._eventHandlers[emitter][event].indexOf(handler), 1);
                    }
                }
            };
            EventChannel.prototype.channelEmit = function (emitter, emitterID, event, args) {
                if (this._eventHandlers && this._eventHandlers[emitterID] && this._eventHandlers[emitterID][event]) {
                    this._eventHandlers[emitterID][event].forEach(function (handler) {
                        handler.apply(emitter, args);
                    });
                }
            };
            EventChannel.prototype.unsubscribeAll = function (emitterID) {
                delete this._eventHandlers[emitterID];
            };
            return EventChannel;
        })();
        var eventChannel = new EventChannel();
        //export var channel:IEventChannel = eventChannel;
        function getChannel() {
            return eventChannel;
        }
        _EventChannel.getChannel = getChannel;
        function subscribe(emitter, event, handler) {
            eventChannel.subscribe(emitter, event, handler);
        }
        _EventChannel.subscribe = subscribe;
        function unsubscribe(emitter, event, handler) {
            eventChannel.unsubscribe(emitter, event, handler);
        }
        _EventChannel.unsubscribe = unsubscribe;
        function channelEmit(emitterID, event) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            eventChannel.channelEmit(null, emitterID, event, args);
        }
        _EventChannel.channelEmit = channelEmit;
        function unsubscribeAll(emitterID) {
            eventChannel.unsubscribeAll(emitterID);
        }
        _EventChannel.unsubscribeAll = unsubscribeAll;
        var emitterIDs = [];
        var ChanneledEmitter = (function (_super) {
            __extends(ChanneledEmitter, _super);
            function ChanneledEmitter(_emitterID) {
                _super.call(this);
                if (_emitterID) {
                    this.emitterID = _emitterID;
                }
                else {
                    this.emitterID = "Emitter" + emitterIDs.length;
                }
                if (emitterIDs.indexOf(this.emitterID) !== -1) {
                    throw new Error("Duplicate emitterID. This is not supported");
                }
            }
            ChanneledEmitter.prototype.subscribe = function (event, handler) {
                _super.prototype.subscribe.call(this, event, handler);
                //console.log("Consider using the EventChannel instead of subscribing directly to the " + this.emitterID);
            };
            ChanneledEmitter.prototype.emit = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                // No super call because passing rest parameters to a super method is kind of awkward and hacky
                // https://typescript.codeplex.com/discussions/544797
                var that = this;
                if (this.eventHandlers && this.eventHandlers[event]) {
                    this.eventHandlers[event].forEach(function (handler) {
                        handler.apply(that, args);
                    });
                }
                eventChannel.channelEmit(this, this.emitterID, event, args);
            };
            return ChanneledEmitter;
        })(Fluss.Emitter.Emitter);
        _EventChannel.ChanneledEmitter = ChanneledEmitter;
        var EventStream = (function (_super) {
            __extends(EventStream, _super);
            function EventStream(name, _emitterID, _event) {
                _super.call(this, name);
                this._emitterID = _emitterID;
                this._event = _event;
                this._handler = this.handleEvent.bind(this);
                subscribe(this._emitterID, _event, this._handler);
            }
            EventStream.prototype.handleEvent = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                this.push({
                    emitter: this._emitterID,
                    event: this._event,
                    args: args
                });
            };
            EventStream.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                unsubscribe(this._emitterID, this._event, this._handler);
            };
            return EventStream;
        })(Fluss.Stream.Stream);
        /**
         * Creates a stream for a channeled event. If  mor than one event is given, a combined
         * stream for all events is created
         *
         * @param name
         * @param emitterID
         * @param events
         * @returns {null}
         */
        function createEventStream(emitterID) {
            var events = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                events[_i - 1] = arguments[_i];
            }
            var stream = null;
            events.forEach(function (event) {
                var eStream = new EventStream(emitterID + "-" + event, emitterID, event);
                if (stream) {
                    stream = stream.combine(eStream);
                }
                else {
                    stream = eStream;
                }
            });
            return stream;
        }
        _EventChannel.createEventStream = createEventStream;
    })(EventChannel = Fluss.EventChannel || (Fluss.EventChannel = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.EventChannel = Fluss.EventChannel;
}
if (typeof this["define"] === "function") {
    this["define"]("eventChannel", ["emitter", "stream"], function () {
        return Fluss.EventChannel;
    });
}

/// <reference path="./eventChannel.ts" />
/**
 * Created by Stephan.Smola on 30.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Errors;
    (function (Errors) {
        (function (EVENTS) {
            EVENTS[EVENTS["ERROR"] = 0] = "ERROR";
            EVENTS[EVENTS["FATAL"] = 1] = "FATAL";
            EVENTS[EVENTS["FRAMEWORK"] = 2] = "FRAMEWORK";
            EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
        })(Errors.EVENTS || (Errors.EVENTS = {}));
        var EVENTS = Errors.EVENTS;
        var ErrorHandler = (function (_super) {
            __extends(ErrorHandler, _super);
            function ErrorHandler() {
                _super.call(this, "ERROR");
                /*
                 if (window) {
                 window.onerror = function(error, url, line) {
                 this.fatal(error + "\nin: " + url + "\nline: " + line, window);
                 }
                 }
                 */
            }
            ErrorHandler.prototype.error = function (message, that) {
                this.emit(0 /* ERROR */, message, that);
            };
            ErrorHandler.prototype.fatal = function (message, that) {
                this.emit(1 /* FATAL */, message, that);
            };
            ErrorHandler.prototype.framework = function (message, exception, that) {
                throw exception;
            };
            return ErrorHandler;
        })(Fluss.EventChannel.ChanneledEmitter);
        var errorHandler = new ErrorHandler();
        function getErrorHandler() {
            return errorHandler;
        }
        Errors.getErrorHandler = getErrorHandler;
        function error(message, that) {
            return errorHandler.error(message, that);
        }
        Errors.error = error;
        function fatal(message, that) {
            return errorHandler.fatal(message, that);
        }
        Errors.fatal = fatal;
        function framework(message, exceotion, that) {
            return errorHandler.framework(message, exceotion, that);
        }
        Errors.framework = framework;
    })(Errors = Fluss.Errors || (Fluss.Errors = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Errors = Fluss.Errors;
}
if (typeof this["define"] === "function") {
    this["define"]("errors", ["eventChannel"], function () {
        return Fluss.Errors;
    });
}

/// <reference path="./dispatcher.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var BaseActions;
    (function (BaseActions) {
        (function (ACTIONS) {
            ACTIONS[ACTIONS["__ANY__"] = -1000] = "__ANY__";
            ACTIONS[ACTIONS["UNDO"] = -2000] = "UNDO";
        })(BaseActions.ACTIONS || (BaseActions.ACTIONS = {}));
        var ACTIONS = BaseActions.ACTIONS;
        /**
         * Generic action trigger that can be fed by passing the action id and parameters.
         * Can be used in situations where actions are triggered based on a configuration.
         *
         * Explicit Functions are recommended for all actions, because they make coding easier
         * and code more readable
         *
         * @param action
         * @param args
         */
        function triggerAction(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            Fluss.Dispatcher.getDispatcher().dispatchAction.apply(Fluss.Dispatcher.getDispatcher(), [action].concat(args));
        }
        BaseActions.triggerAction = triggerAction;
        function undo() {
            Fluss.Dispatcher.getDispatcher().dispatchAction(-2000 /* UNDO */);
        }
        BaseActions.undo = undo;
    })(BaseActions = Fluss.BaseActions || (Fluss.BaseActions = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.BaseActions = Fluss.BaseActions;
}
if (typeof this["define"] === "function") {
    this["define"]("baseActions", ["dispatcher"], function () {
        return Fluss.BaseActions;
    });
}

/// <reference path="./errors.ts" />
/// <reference path="./eventChannel.ts" />
/// <reference path="./baseActions.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    /**
     * The dispatcher provides the means to trigger Actions throughout the system. An action is an ID plus
     * arbitrary arguments. Actions are basically events.
     *
     * If a consumer wants to handle an action it subscribes to it:
     *
     * ```js
     *  Fluss.Dispatcher.subscribeAction(1000, function(actionid, arg1, arg2, arg3) {
     *          // Do stuff
     *  });
     * ```
     *
     * Undo is built in right into the system. When subscribing to an action you can provide a second callback
     * that is used to create a memento.
     *
     * ```js
     *  Fluss.Dispatcher.subscribeAction(1000, function(actionid, arg1, arg2, arg3) {
     *          // Do stuff
     *  }, function(actionid, arg1, arg2, arg3) {
     *          // Create a memento by either using
     *          return Fluss.Dispatcher.createMemento(null, data);
     *          // or
     *          return Fluss.Dispatcher.createUndoAction(undoActionid, undoArg1, undoArg2);
     *  });
     * ```
     *
     * Dispatcher should be regarded as an internal module. Always use [Plugins](fluss.plugins.html) to implement
     * action behaviour.
     *
     * One dispatcher instance is automatically created on startup. Creating a second instance is not recommended. It most
     * probably will break things.
     */
    var Dispatcher;
    (function (_Dispatcher) {
        /**
         * Create a memento object.
         * @param instance
         * @param data
         * @param redo
         * @param undo      Optionally you can provide an action for undoing, if that is simpler than storing data
         * @returns {{data: any, redo: IAction, instance: IUndoable}}
         */
        function createMemento(instance, data) {
            return {
                action: -1,
                data: data,
                redo: null,
                undo: null,
                instance: instance
            };
        }
        _Dispatcher.createMemento = createMemento;
        /**
         * Create a redo object.
         * @param action
         * @param data
         * @returns {{action: number, data: any}}
         */
        function createRedo(action, data) {
            return {
                action: action,
                data: data
            };
        }
        _Dispatcher.createRedo = createRedo;
        function createUndoAction(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return {
                action: -1,
                data: null,
                redo: null,
                undo: {
                    action: action,
                    data: args
                },
                instance: null
            };
        }
        _Dispatcher.createUndoAction = createUndoAction;
        /**
         * Events that are raised by the undo manager.
         */
        (function (EVENTS) {
            EVENTS[EVENTS["UNDO"] = 0] = "UNDO";
            EVENTS[EVENTS["REDO"] = 1] = "REDO";
            EVENTS[EVENTS["MEMENTO_STORED"] = 2] = "MEMENTO_STORED";
            EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
        })(_Dispatcher.EVENTS || (_Dispatcher.EVENTS = {}));
        var EVENTS = _Dispatcher.EVENTS;
        /**
         * Implementation of a dispatcher as described by the FLUX pattern.
         */
        var Dispatcher = (function () {
            function Dispatcher() {
                this._handlers = {};
                this._dispatching = false;
                this._undoing = false;
                this._disabled = {};
            }
            Dispatcher.prototype.destroy = function () {
                this._handlers = {};
                this._dispatching = false;
                this._undoing = false;
                this._disabled = {};
            };
            Object.defineProperty(Dispatcher.prototype, "undoing", {
                get: function () {
                    return this._undoing;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * The actual dispatch
             * @param doMemento
             * @param type
             * @param args
             */
            Dispatcher.prototype.dispatch = function (doMemento, type, args) {
                try {
                    var mementos = [];
                    var that = this;
                    var doit = function (__type, dispatch, trueType) {
                        if (that._handlers[__type]) {
                            that._handlers[__type].forEach(function (d) {
                                if (doMemento && d[1]) {
                                    var memento = d[1].apply(that, [trueType || __type].concat(args));
                                    if (memento) {
                                        if (Object.prototype.toString.call(memento) === "[object Array]") {
                                            Array.prototype.push.apply(mementos, memento);
                                        }
                                        else {
                                            mementos.push(memento);
                                        }
                                    }
                                }
                                dispatch(d[0], args);
                            });
                        }
                    };
                    doit(type, function (handler, args) {
                        handler.apply(this, args);
                    });
                    doit(-1000 /* __ANY__ */, function (handler, args) {
                        handler.apply(this, [type, args]);
                    }, type);
                    if (mementos.length) {
                        getUndoManager().storeMementos(mementos, type, createRedo(type, args));
                    }
                }
                catch (e) {
                    var msg = "Internal error. If this happens please check if it was a user error \n" + "that can be either prevented or gracefully handled.\n\n";
                    msg += "Handled action: " + type + "\n";
                    msg += "Create memento: " + (doMemento ? "yes\n" : "no\n");
                    var argStr = "";
                    try {
                        argStr = JSON.stringify(args, null, 2);
                    }
                    catch (e) {
                        argStr = "It's a circular structure :-(";
                    }
                    msg += "Arguments     : " + argStr + "\n";
                    msg += "Mementos      : " + (mementos ? JSON.stringify(mementos, null, 2) : "none") + "\n";
                    msg += "Exception     : " + e.message + "\n";
                    msg += "Stack trace   :\n" + e.stack + "\n";
                    console.log(msg);
                    Fluss.Errors.framework(e.message, e, that);
                }
            };
            /**
             * Dispatch an undo action. This is basically the same as dispatching a regular
             * action, but the memento will not be created.
             * @param type
             * @param args
             */
            Dispatcher.prototype.dispatchUndoAction = function (action) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this._disabled[action]) {
                    this._undoing = true;
                    try {
                        this.dispatch(false, action, args);
                    }
                    finally {
                        this._undoing = false;
                    }
                }
            };
            /**
             * Dispatch, i.e. broadcast an action to anyone that's interested.
             * @param type
             * @param data
             */
            Dispatcher.prototype.dispatchAction = function (action) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this._disabled[action]) {
                    this.dispatch(true, action, args);
                }
            };
            /**
             * Subscribe to an action.
             * @param action
             * @param handler
             * @param mementoProvider
             */
            Dispatcher.prototype.subscribeAction = function (action, handler, mementoProvider) {
                if (!this._handlers[action]) {
                    this._handlers[action] = [];
                }
                if (this._handlers[action].indexOf(handler) === -1) {
                    this._handlers[action].push([handler, mementoProvider]);
                }
            };
            /**
             * Unsubscribe an action handler. This removes a potential mementoProvider also.
             * @param action
             * @param handler
             */
            Dispatcher.prototype.unsubscribeAction = function (action, handler) {
                if (this._handlers[action]) {
                    for (var i = 0; i < this._handlers[action].length; i++) {
                        if (this._handlers[action][i][0] === handler) {
                            this._handlers[action].splice(i, 1);
                            return;
                        }
                    }
                }
            };
            Dispatcher.prototype.disableAction = function (action) {
                this._disabled[action] = true;
            };
            Dispatcher.prototype.enableAction = function (action) {
                if (this._disabled[action]) {
                    delete this._disabled[action];
                }
            };
            return Dispatcher;
        })();
        var dispatcher = new Dispatcher();
        function getDispatcher() {
            return dispatcher;
        }
        _Dispatcher.getDispatcher = getDispatcher;
        function dispatch(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            dispatcher.dispatchAction.apply(dispatcher, [action].concat(args));
        }
        _Dispatcher.dispatch = dispatch;
        function subscribeAction(action, handler, mementoProvider) {
            dispatcher.subscribeAction(action, handler, mementoProvider);
        }
        _Dispatcher.subscribeAction = subscribeAction;
        function unsubscribeAction(action, handler) {
            dispatcher.unsubscribeAction(action, handler);
        }
        _Dispatcher.unsubscribeAction = unsubscribeAction;
        function disableAction(action) {
            dispatcher.disableAction(action);
        }
        _Dispatcher.disableAction = disableAction;
        function enableAction(action) {
            dispatcher.enableAction(action);
        }
        _Dispatcher.enableAction = enableAction;
        /**
         * Resets everything. No previously subscribed handler will be called.
         */
        function reset() {
            dispatcher.destroy();
            dispatcher = new Dispatcher();
        }
        _Dispatcher.reset = reset;
        /**
         * Undo manager implementations. It utilises two stacks (undo, redo) to provide the
         * necessary means to undo and redo actions.
         */
        var UndoManager = (function (_super) {
            __extends(UndoManager, _super);
            function UndoManager() {
                _super.call(this, "UndoManager");
                this.clear();
                getDispatcher().subscribeAction(-2000 /* UNDO */, this.undo.bind(this));
            }
            /**
             * Store a memento. This is put on a stack that is used for undo
             * @param mementos
             * @param action        the action that created the memento
             * @param redo          the data that can be used to recreate the action
             */
            UndoManager.prototype.storeMementos = function (mementos, action, redo) {
                if (mementos) {
                    mementos.forEach(function (m) {
                        if (m) {
                            m.redo = redo;
                            m.action = action;
                        }
                    });
                    this.mementos.push(mementos);
                    this.redos = [];
                    this.emit(2 /* MEMENTO_STORED */, mementos);
                }
            };
            /**
             * Undo. Pop the latest memento from the stack and restore the according object. This pushes the redo-info
             * from the memento onto the redo stack to use in redo.
             */
            UndoManager.prototype.undo = function () {
                var us = this.mementos.pop();
                if (us) {
                    var redos = [];
                    us.forEach(function (u, i) {
                        if (u.undo) {
                            getDispatcher().dispatchUndoAction.apply(getDispatcher(), [u.undo.action].concat(u.undo.data));
                        }
                        else {
                            u.instance.restoreFromMemento(u);
                        }
                        if (!i) {
                            redos.push(u.redo);
                        }
                    });
                    this.redos.push(redos);
                    this.emit(0 /* UNDO */, us);
                }
            };
            /**
             * Redo. Pop the latest redo action from the stack and dispatch it. This does not store any undo data,
             * as the dispatcher will do that when dispatching the action.
             */
            UndoManager.prototype.redo = function () {
                var rs = this.redos.pop();
                if (rs) {
                    rs.forEach(function (r) {
                        getDispatcher().dispatchAction.apply(getDispatcher(), [r.action].concat(r.data));
                    });
                    this.emit(1 /* REDO */, rs);
                }
            };
            /**
             * Clear all stacks
             */
            UndoManager.prototype.clear = function () {
                this.mementos = [];
                this.redos = [];
                this.emit(3 /* CLEAR */);
            };
            UndoManager.prototype.getMementos = function () {
                return this.mementos;
            };
            return UndoManager;
        })(Fluss.EventChannel.ChanneledEmitter);
        /**
         * Singleton.
         * @type {UndoManager}
         */
        var um = new UndoManager();
        /**
         * Get the undo manager. Returns the single instance.
         * @returns {UndoManager}
         */
        function getUndoManager() {
            return um;
        }
        _Dispatcher.getUndoManager = getUndoManager;
    })(Dispatcher = Fluss.Dispatcher || (Fluss.Dispatcher = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Dispatcher = Fluss.Dispatcher;
}
if (typeof this["define"] === "function") {
    this["define"]("dispatcher", ["errors", "eventChannel", "baseActions"], function () {
        return Fluss.Dispatcher;
    });
}

/// <reference path="./dispatcher.ts" />
/// <reference path="./eventChannel.ts" />
/// <reference path="./baseActions.ts" />
/// <reference path="./tools.ts" />
/**
 * Created by stephan on 01.11.14.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    /**
     * Plugins are the means to implement the behaviour of an action.
     *
     * An action is an ID (number) and a set of arguments specific to the action.
     *
     * A plugin implements behaviour for that action. Plugins are managed by a Container. A container can
     * handle plugins for several actions and several plugins for an action.
     *
     * ```js
     *
     * //Declare your container
     * class MyContainer extends Fluss.Plugins.PluginContainer {
     *      public property:string
     * }
     *
     * // Create a container instance
     * var cont = new MyContainer();
     *
     * // Implement a plugin
     * class MyPlugin extends Fluss.Plugins.BasePlugin {
     *
     *      run(container:MyContainer, action:number, value:string) {
     *          container.property = value;
     *      }
     * }
     *
     * // Attach the plugin to the container for action 1000
     * cont.wrap(1000, new MyPlugin());
     *
     * // Dispatch action 1000 with argument
     * Fluss.Dispatcher.dispatch(1000, "Test");
     *
     * //cont.property === "Test"
     *
     * ```
     *
     * Adding undo functionality is simple. You need to  provide methods to create a memento and to restore state from that
     * memento into your plugin.
     *
     * ```js
     * class MyPlugin extends Fluss.Plugins.BasePlugin {
     *
     *      run(container:MyContainer, action:number, value:string) {
     *          container.property = value;
     *      }
     *
     *      // getMemento is always called with the exact same arguments as run. getMemento will alway be called before
     *      // run is called.
     *      getMemento(container:MyContainer, action:number, value:string):Fluss.Dispatcher.IMemento {
     *          return Fluss.Dispatcher.createMemento(null, container.property.
     *      }
     *
     *      restoreFromMemento(container:MyContainer, memento:Fluss.Dispatcher.IMemento) {
     *          container.property = memento.data;
     *      }
     * }
     *
     * ```
     *
     * Now your plugin knows how to preserve and restore state.
     *
     * ```js
     * // Dispatch action 1000 with argument
     * Fluss.Dispatcher.dispatch(1000, "Test");
     * //cont.property === "Test"
     *
     * Fluss.Dispatcher.dispatch(1000, "Changed");
     * //cont.property === "Changed"
     *
     * Fluss.BaseActions.undo();
     * //cont.property === "Test"
     * ```
     */
    var Plugins;
    (function (Plugins) {
        /**
         * Base implementation for a plugin. Does absolutely nothing.
         */
        var BasePlugin = (function () {
            function BasePlugin() {
            }
            BasePlugin.prototype.run = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.afterFinish = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.afterAbort = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.getMemento = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                return null;
            };
            BasePlugin.prototype.restoreFromMemento = function (container, memento) {
            };
            BasePlugin.prototype.hold = function () {
            };
            BasePlugin.prototype.release = function (action) {
            };
            BasePlugin.prototype.abort = function (action) {
            };
            return BasePlugin;
        })();
        Plugins.BasePlugin = BasePlugin;
        /**
         * Create a Plugin. Use this when you're using plain JavaScript.
         * @param spec
         * @returns {any}
         */
        function createPlugin(spec) {
            return Fluss.Tools.subclass(spec, BasePlugin);
        }
        Plugins.createPlugin = createPlugin;
        /**
         * Base implementation for a plugin container.
         */
        var PluginContainer = (function (_super) {
            __extends(PluginContainer, _super);
            function PluginContainer(emitterId) {
                _super.call(this, emitterId || "Container" + Fluss.Tools.oid(this));
                this._plugins = {};
                this._anyPlugins = [];
                this._protocols = {};
                this._runningPlugins = {};
                this._mementos = {};
            }
            /**
             * http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
             * @param config
             */
            PluginContainer.prototype.configure = function (config) {
                function construct(constructor, args) {
                    function F() {
                        constructor.apply(this, args);
                    }
                    F.prototype = constructor.prototype;
                    return new F();
                }
                var that = this;
                config.forEach(function (action) {
                    action.plugins.forEach(function (plugin) {
                        if (plugin.plugin) {
                            that.wrap(action.action, construct(plugin.plugin, plugin.parameters));
                        }
                        else {
                            that.wrap(action.action, new plugin());
                        }
                    });
                });
            };
            PluginContainer.prototype.destroy = function () {
                for (var action in this._plugins) {
                    if (this._plugins.hasOwnProperty(action)) {
                        var l = this._plugins[action].length;
                        while (l--) {
                            this.detach(action, this._plugins[action][l]);
                        }
                    }
                }
                this._anyPlugins = [];
                this._runningPlugins = {};
                //TODO: Find a way to unsubscribe from the Dispatcher
            };
            PluginContainer.prototype.pluginDone = function (action, abort) {
            };
            PluginContainer.prototype.abortAction = function (action) {
                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    var plg = this._runningPlugins[action][this._runningPlugins[action].length - 1];
                    if (plg) {
                        plg.abort(action);
                    }
                }
                this._runningPlugins[action] = null;
            };
            PluginContainer.prototype.abort = function (action) {
                if (typeof action === "undefined") {
                    for (var actionKey in this._protocols) {
                        if (this._protocols.hasOwnProperty(actionKey)) {
                            this.abortAction(actionKey);
                        }
                    }
                }
                else {
                    if (this._protocols[action]) {
                        this.abortAction(action);
                    }
                }
            };
            /**
             * This handles an action sent by the dispatcher and delegates it to the plugins.
             * Plugins are "wrapped" around each other. They build kind of brackets defined by two of
             * their methods: run - opens the brackets
             *                finish/abort - closes the brackets.
             *
             * We'll talk about finish from now on. That can be replaced by abort everywhere. The first plugin to abort
             * forces all succeeding plugins to abort as well.
             *
             * So wrapping in the order A->B->C leads to these brackets:
             *
             *  runC-runB-runA-finishA-finishB-finishC
             *
             * finish is only called when the plugin calls the done-callback that is provided to its run-method.
             *
             * So to correctly execute this "chain" we need to wait for the plugins to call their done-callbacks before
             * we can proceed. Because the plugins may call their done-callback outside their run-method, e.g. triggered by
             * user interaction, we need to keep track of what the plugins did using a protocol.
             *
             * That protocol looks like this:
             *
             *  ```js
             *  {
             *    i: { done: A function that calls either finish or abort on the i-th plugin,
             *         abort: did the plugin abort?
             *
             *    i+1: ...
             *  }
             *  ```
             *
             * this protocol is initialized by null entries for all plugins. Then the run-methods for all plugins are called, giving them a done
             * callback, that fills the protocol.
             *
             * After every run-method we check if we're at the innermost plugin (A in the example above, the one that first wrapped the action).
             * If we are, we work through the protocol as long as there are valid entries. Then we wait for the next done-callback to be called.
             *
             * @param action
             * @param args
             */
            PluginContainer.prototype.doHandleAction = function (plugins, action, args) {
                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    throw new Error("ERROR calling action " + action + ". Same action cannot be called inside itself!");
                }
                var that = this;
                var composeArgs = function (plugin, action) {
                    return [that, action].concat(args);
                };
                this._mementos[action] = [];
                this._runningPlugins[action] = [];
                this._protocols[action] = [];
                plugins.forEach(function (plugin) {
                    that._protocols[action].push(0);
                    that._runningPlugins[action].push(plugin);
                });
                var aborted = false;
                plugins.forEach(function (plugin, i) {
                    (function (index) {
                        var done = function (abort, doneAction) {
                            index = that.getPluginsForAction(doneAction).indexOf(plugin);
                            that._protocols[doneAction][index] = {
                                plugin: plugin,
                                done: function (abort) {
                                    if (abort) {
                                        plugin.afterAbort.apply(plugin, composeArgs(plugin, doneAction));
                                    }
                                    else {
                                        plugin.afterFinish.apply(plugin, composeArgs(plugin, doneAction));
                                    }
                                },
                                abort: abort
                            };
                            var last = that._protocols[doneAction].length;
                            while (last--) {
                                if (that._protocols[doneAction][last]) {
                                    abort |= that._protocols[doneAction][last].abort;
                                    that._protocols[doneAction][last].done(abort);
                                    that._protocols[doneAction].pop();
                                    if (that._runningPlugins[doneAction]) {
                                        that._runningPlugins[doneAction].pop();
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            if (!that._runningPlugins[doneAction] || !that._runningPlugins[doneAction].length) {
                                that.finalizeAction(doneAction, abort, that.getPluginsForAction(doneAction), that._mementos[doneAction], args);
                            }
                        };
                        var holds = false;
                        var dones = {};
                        plugin["hold"] = function () {
                            holds = true;
                        };
                        plugin["abort"] = function (abortAction) {
                            var act = typeof abortAction === "undefined" ? action : abortAction;
                            dones[act] = true;
                            done(true, act);
                            aborted = true;
                        };
                        plugin["release"] = function (releaseAction) {
                            var act = typeof releaseAction === "undefined" ? action : releaseAction;
                            if (dones[act]) {
                                throw new Error("Plugin released twice for action " + act + "! Possibly called release after abort or vice versa.");
                            }
                            else {
                                done(false, act);
                                dones[act] = true;
                            }
                        };
                        if (!aborted) {
                            var memento = plugin.getMemento.apply(plugin, composeArgs(plugin, action));
                            if (memento) {
                                memento.instance = {
                                    restoreFromMemento: function (mem) {
                                        plugin.restoreFromMemento(that, mem);
                                    }
                                };
                                that._mementos[action].push(memento);
                            }
                            // If we aborted: Clean up: All Plugins that where started until now (outer) will be aborted.
                            // Others that would have been started afterwards (inner) won't be called at all. (see if-statement
                            // above this comment)
                            plugin.run.apply(plugin, composeArgs(plugin, action));
                            if (aborted) {
                                var last = (that._protocols[action] && that._protocols[action].length) || 0;
                                while (last--) {
                                    if (that._protocols[action][last]) {
                                        that._protocols[action][last].done(true);
                                        that._protocols[action].pop();
                                    }
                                    else {
                                    }
                                }
                                that.finalizeAction(action, true, that.getPluginsForAction(action), null, args);
                            }
                            else {
                                if (!holds && !dones[action])
                                    done(false, action);
                            }
                        }
                    })(i);
                });
            };
            PluginContainer.prototype.getPluginsForAction = function (action) {
                if (this._plugins[action] && this._plugins[action].length) {
                    return this._plugins[action];
                }
                else if (this._anyPlugins && this._anyPlugins.length) {
                    return this._anyPlugins;
                }
                else
                    return [];
            };
            PluginContainer.prototype.handleAction = function (action, args) {
                try {
                    this.doHandleAction(this.getPluginsForAction(action), action, args);
                }
                catch (e) {
                    this.abort();
                    throw e;
                }
            };
            PluginContainer.prototype.finalizeAction = function (action, abort, plugins, mementos, args) {
                if (!abort) {
                    if (mementos && mementos.length && !Fluss.Dispatcher.getDispatcher().undoing) {
                        Fluss.Dispatcher.getUndoManager().storeMementos(mementos, action, Fluss.Dispatcher.createRedo(action, args));
                    }
                }
                this._mementos[action] = null;
                this._runningPlugins[action] = null;
                this._protocols[action] = null;
            };
            PluginContainer.prototype.provideMementos = function (action, plugins, args) {
                if (plugins) {
                    var ret = [];
                    var that = this;
                    plugins.forEach(function (plugin) {
                        var memento = plugin.getMemento.apply(plugin, [that, action].concat(args));
                        if (memento) {
                            memento.instance = {
                                restoreFromMemento: function (mem) {
                                    plugin.restoreFromMemento(that, mem);
                                }
                            };
                            ret.push(memento);
                        }
                    });
                    if (ret.length) {
                        Fluss.Dispatcher.getUndoManager().storeMementos(ret, action, Fluss.Dispatcher.createRedo(action, args));
                    }
                }
                return null;
            };
            /**
             * This wraps the handler around the existing handlers the action, making the given handler the first to be called
             * for that action.
             *
             * If the ANY-Action is given
             *   * The handler is wrapped for every action there already is another handler
             *   * The handler is wrapped around all other any-handler, and these are called for all actions without regular handlers
             *
             * If a regular action is given and any-handlers exist the given handler is wrapped around all any-handlers for the
             * given action.
             *
             * @param action
             * @param handler
             */
            PluginContainer.prototype.wrap = function (action, handler) {
                if (action === -1000 /* __ANY__ */) {
                    if (this._anyPlugins.length === 0) {
                        var that = this;
                        Fluss.Dispatcher.subscribeAction(-1000 /* __ANY__ */, function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i - 0] = arguments[_i];
                            }
                            var act = args.shift();
                            if (that._plugins[act]) {
                                return;
                            }
                            that.handleAction(act, args);
                        }, function (type) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            return null; // Whe handle the mementos ourselves
                            /*
                             if (that._plugins[type]) {
                             return;
                             }
                             return that.provideMementos(type, args);
                             */
                        });
                    }
                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this.doWrap(a, handler);
                        }
                    }
                    this._anyPlugins.unshift(handler);
                }
                else {
                    if (!this._plugins[action] && this._anyPlugins.length) {
                        var l = this._anyPlugins.length;
                        while (l--) {
                            this.doWrap(action, this._anyPlugins[l]);
                        }
                    }
                    this.doWrap(action, handler);
                }
            };
            PluginContainer.prototype.doWrap = function (action, handler) {
                if (!this._plugins[action]) {
                    this._plugins[action] = [];
                    var that = this;
                    Fluss.Dispatcher.subscribeAction(action, function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i - 0] = arguments[_i];
                        }
                        that.handleAction(action, args);
                    }, function (type) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        return null; //return that.provideMementos(action, args);
                    });
                }
                if (this._plugins[action].indexOf(handler) !== -1) {
                    throw new Error("Plugin instances can only be used once per action!");
                }
                this._plugins[action].unshift(handler);
            };
            PluginContainer.prototype.detach = function (action, handler) {
                if (action === -1000 /* __ANY__ */) {
                    this._anyPlugins.splice(this._anyPlugins.indexOf(handler), 1);
                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this._plugins[a].splice(this._plugins[a].indexOf(handler), 1);
                        }
                    }
                }
                else {
                    if (this._plugins[action]) {
                        this._plugins[action].splice(this._plugins[action].indexOf(handler), 1);
                    }
                }
            };
            return PluginContainer;
        })(Fluss.EventChannel.ChanneledEmitter);
        Plugins.PluginContainer = PluginContainer;
        function createContainer(spec) {
            return Fluss.Tools.subclass(spec, PluginContainer);
        }
        Plugins.createContainer = createContainer;
    })(Plugins = Fluss.Plugins || (Fluss.Plugins = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Plugins = Fluss.Plugins;
}
if (typeof this["define"] === "function") {
    this["define"]("plugins", ["dispatcher", "eventChannel", "baseActions", "tools"], function () {
        return Fluss.Plugins;
    });
}
