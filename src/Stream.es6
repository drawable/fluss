/**
 * Created by Stephan on 22.02.2015.
 */

let _private = (obj, func, ...args) => func.apply(obj, args);


function callCloseMethods() {
    this._closeMethods.forEach((m) => m.call(this));
}

function addToBuffer(value) {
    this._buffer.unshift(value);
}


function processBuffer(buffer, methods, baseIndex) {
    if (this._closed) return null;
    if (!methods.length) return null;

    var l = buffer.length;
    var errors = [];

    while (l--) {
        var values = buffer.pop();
        methods.forEach((m, i) => {
            try {
                m.apply(this, values.concat(i + baseIndex));
            } catch (e) {
                errors.push(e);
            }
        });
    }

    return errors;
}

function processErrors(buffer, methods, baseIndex) {
    if (this._closed) return null;
    if (!methods.length) return null;

    var l = buffer.length;

    while (l--) {
        var values = buffer.pop();
        methods.forEach((m) => {
            try {
                m.call(this, values);
            } catch(e) {
                e.message = "One of the error handling methods of " + this.name + " produces an error itself:\n" + e.message;
                throw e;
            }
        });
    }
}

function processBuffers() {
    var errors = _private(this, processBuffer, this._buffer, this._methods, this._length - this._buffer.length);
    if (errors && errors.length) {
        if (this._errorMethods.length) {
            _private(this, processErrors, errors, this._errorMethods, 0);
        } else {
            if (errors.length === 1) {
                throw errors[0];
            } else {
                throw new Error("Errors occurred");
            }
        }
    }
}


function addMethod(method) {
    if (this.closed) return;
    var firstMethod = this._methods.length === 0;
    this._methods.push(method);

    if (firstMethod) {
        _private(this, processBuffers);
    }
}

function removeMethod(method) {
    if (this._methods) {
        let i = this._methods.indexOf(method);
        this._methods.splice(i, 1);
    }
}

function addErrorMethod(method) {
    this._errorMethods.push(method);
}

function addCloseMethod(method) {
    if (this.closed) {
        method.call(this);
    } else {
        this._closeMethods.push(method);
    }
}

function registerNextStream(nextStream) {
    if (this.closed) return;
    this._nextStreams.push(nextStream);
    nextStream.onClose(() => {
        if (this._nextStreams) {
            var i = this._nextStreams.indexOf(nextStream);
            if (i !== -1) {
                this._nextStreams.splice(i, 1);
            }
        }
    })
}

function addMethodToNextStream(nextStream, method, onClose) {
    var that = this;

    var fn = function (value, index) {
        try {
            method.call(that, value, index);
        } catch (e) {
            nextStream.pushError(e);
        }
    };

    _private(this, addMethod, fn);
    nextStream.onClose(() => _private(this, removeMethod,fn));
    _private(this, registerNextStream, nextStream);

    if (!onClose) {
        this.onClose(() => nextStream.close());
    } else {
        this.onClose(onClose);
    }
}


/**
 * An implementation of a collection stream for reactive progremming
 */
export class Stream {

    constructor(name) {
        this._name = name;
        this._buffer = [];
        this._methods = [];
        this._errorMethods = [];
        this._closeMethods = [];
        this._closed = false;
        this._length = 0;
        this._nextStreams = [];
        this._queued = false;
    }

    /**
     * Name of the stream. Mostly for nicer debugging output.
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Number of values processed by the stream. This will update as soon
     * as a new value arrives in the stream.
     */
    get length() {
        return this._length;
    }

    /**
     * Closes the stream. Closed streams do nothing. This disposes the stream automatically.
     */
    close() {
        if (!this._closed) {
            this._closed = true;
            _private(this, callCloseMethods);
            this._methods = null;
            this._buffer = null;
            this._closeMethods = null;
            this._errorMethods = null;
            this._nextStreams = null;
        }
    }

    /**
     * Reset stream: buffers cleared, all subscribers removed, reopend if closed.
     */
    reset() {
        this.close();
        this._closed = false;
        this._length = 0;
        this._methods = [];
        this._buffer = [];
        this._closeMethods = [];
        this._errorMethods = [];
        this._nextStreams = [];
    }

    /**
     * Creates a new stream that processes all values the original processes but closes automatically after the given
     * amount of values is processed.
     * Calling this on closed streams has no effect, i.e. it does not restart the stream.
     * @param maxItems
     */
    times(maxLength) {
        var nextStream = new Stream("times");

        var count = 0;
        this.forEach((...values) => {
            count++;
            if (count <= maxLength) {
                nextStream.push.apply(nextStream, values);

                if (count == maxLength) {
                    nextStream.close();
                }
            }
        });

        return nextStream;
    }

    /**
     * Creates a new stream that processes all values the original processes but closes automatically after the given
     * stream processes.
     * Calling this on closed streams has no effect, i.e. it does not restart the stream.
     * @param stream
     */
    until(stream) {
        var nextStream = relay(this, "until");
        stream.forEach(() => nextStream.close() );
        return nextStream;
    }

    /**
     * Indicates whether the stream is closed.
     */
    get closed() {
        return this._closed;
    }

    /**
     * Push a new value to the stream. This triggers all sub streams and processing methods.
     * Pushing, in contrary to a true array does not buffer the value. If you need the value
     * after processing by the stream you must buffer it yourself.
     * @param values
     */
    push(...values) {
        if (!this._closed) {
            _private(this, addToBuffer, values);
            this._length++;
            this._queued = true;
            if (!this._processing) {
                this._processing = true;
                while (this._queued) {
                    this._queued = false;
                    _private(this, processBuffers);
                }
                this._processing = false;
            }
        }
    }

    /**
     * Pushes an error to the stream and triggers all errors processing methods or raises it up
     * the stream chain until it hits the first error handling method.
     * @param error
     */
    pushError(...error) {
        // If we can't handle the error ourselves we throw it again. That will give preceding streams the chance to handle these
        if (!this._errorMethods || !this._errorMethods.length) {
            throw error;
        }
        _private(this, processBuffer, [error], this._errorMethods, 0);
    }

    /**
     * For each processed value call the method. Returns the stream it is called on. Can be used multiple times on one stream.
     * Methods will be processed in the order they are registered using forEach
     * @param method
     */
    forEach(method) {
        _private(this, addMethod, method);
        return this;
    }


    /**
     * Returns a stream that processes every value the original stream processes, but it does not preload. I.e. if
     * no one listens to the new streams the values will just 'vanish'.
     * TODO: This makes the original volatile as well, as it now has a method that observes...
     */
    volatile() {
        let nextStream = new Stream(this._name + ".volatile");

        _private(this, addMethodToNextStream, nextStream,
            value => { if (nextStream._methods.length) nextStream.push(value) } ) ;

        return nextStream;
    }


    /**
     * Return a new stream that processes the values that only meet the given criterium.
     *
     * This criterium can either be:
     * * A function(value, index?) that return true if the value should be kept
     * * A constant that defines what value the stream value must have in order to keep it.
     *
     * @param method {Function|Number|String|Boolean}
     */
    filter(method) {
        let nextStream = new Stream(this._name + ".filter");

        if (typeof  method === "function") {
            _private(this, addMethodToNextStream, nextStream, (value, index) => {
                if (method.call(this, value, index)) {
                    nextStream.push(value);
                }});
        } else {
            _private(this, addMethodToNextStream, nextStream, (value) => {
                if (method == value) {
                    nextStream.push(value);
                }
            });
        }

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    }

    /**
     * Return a new stream that processes values that are calcualted from the original values
     * by the given function(value, index?) or a constant.
     *
     * @param method
     */
    map(method) {
        let nextStream = new Stream(this._name + ".map");

        if (typeof method === "function") {
            _private(this, addMethodToNextStream, nextStream,
                (value, index) => nextStream.push(method.call(this, value, index)));
        } else {
            _private(this, addMethodToNextStream, nextStream,
                                       () => nextStream.push(method));
        }

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    }

    /**
     *
     * @param method
     * @param seed
     */
    scan(method, seed) {
        let nextStream = new Stream(this._name + ".scan");
        let scanned = seed;
        _private(this, addMethodToNextStream, nextStream, (value) => {
            scanned = method.call(this, scanned, value);
            nextStream.push(scanned);
        });

        nextStream.push(scanned);

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    }

    /**
     *
     * @param method
     * @param seed
     */
    reduce(method, seed) {
        let nextStream = new Stream(this._name + ".reduce");
        let reduced = seed;
        _private(this, addMethodToNextStream, nextStream,
            (value) => reduced = method.call(this, reduced, value),
            () => {
                nextStream.push(reduced);
                nextStream.close();
            });

        if (this._closed) {
            nextStream.close();
        }

        _private(this, registerNextStream, nextStream);
        return nextStream;
    }

    /**
     * Returns a new stream that is the concatenation of the original stream and a given one. Until the original
     * stream closes the new stream processes the original values. After closing the original stream it processes
     * the values of the given stream. Any values that are processed by the given stream before the original stream
     * is closed are buffered for later use.
     * @param stream
     */
    concat(stream) {
        let nextStream = new Stream(this._name + ".concat");
        let buffer = null;

        // When this is already closed, we only care for the other stream
        if (!this._closed) {
            buffer = [];
        } else {
            if (stream.closed) {
                nextStream.close();
            }
        }

        // We need to buffer, because this may not be the first
        // method attached to the stream. Otherwise any data that
        // is pushed to stream before the original is closed would
        // be lost for the concat.
        stream.forEach((value) => {
            if (buffer) {
                buffer.push(value);
            } else {
                nextStream.push(value);
            }
        });

        stream.onClose(() => {
            if (!buffer) {
                nextStream.close();
            }
        });

        _private(this, addMethodToNextStream, nextStream, function (value) {
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
    }

    /**
     *
     */
    concatAll(){
        let nextStream = new Stream(this._name + ".concatAll");
        let queue = [];
        let cursor = null;

        function nextInQueue() {
            let l = queue.length;

            while (l--) {
                cursor = queue[l];
                update();
                if (cursor.done) {
                    queue.pop();
                } else {
                    update();
                    break;
                }
            }
        }

        function update() {
            if (cursor) {
                let l = cursor.data.length;
                while (l--) {
                    nextStream.push(cursor.data.pop());
                }
            }
        }

        function concatStream(stream) {
            let subBuffer = {
                data: [],
                done: false
            };
            queue.unshift(subBuffer);

            stream.forEach((value) => {
                subBuffer.data.unshift(value);
                update();
            });

            stream.onClose(() => {
                subBuffer.done = true;
                nextInQueue();
            });

            if (queue.length === 1) {
                cursor = subBuffer;
            }
        }

        this.forEach((subStream) => concatStream(subStream));
        this.onClose(() => nextStream.close());

        if (this._closed) {
            nextStream.close();
        }

        _private(this, registerNextStream, nextStream);

        return nextStream;
    }

    /**
     * Creates a new stream that processes values from the orignal stream and the given stream in the order they appear.
     * @param stream
     */
    combine(stream) {
        let nextStream = new Stream(this._name + ".combine");

        this.forEach((value) => nextStream.push(value));

        stream.forEach((value) => nextStream.push(value));

        this.onClose(() => {
            if (stream.closed) {
                nextStream.close();
            }
        });

        stream.onClose(() => {
            if (this._closed) {
                nextStream.close();
            }
        });

        if (this._closed && stream.closed) {
            nextStream.close();
        }

        _private(this, registerNextStream, nextStream);

        return nextStream;
    }

    /**
     * Used on a stream of streams this returns a new stream that processes all items of all incoming streams
     * in the order the items occur in any of the streams.
     */
    combineAll() {
        let nextStream = new Stream("combineAll");

        this.forEach((stream) => {
            stream.forEach((item) => nextStream.push(item));
        });

        this.onClose(() => nextStream.close());

        _private(this, registerNextStream, nextStream);

        return nextStream;
    }

    /**
     * Add a method that is triggered when the stream is closed. If the stream is already closed this method
     * will be called immediately
     * @param method
     */
    onClose(method) {
        _private(this, addCloseMethod, method);
        return this;
    }

    /**
     * For each occurring error define a method that is called. Can be called multiple times. Returns the original stream.
     * The existence of at least one of these methods prevents the error to bubble up the stream chain.
     * @param method
     */
    onError(method) {
        _private(this, addErrorMethod, method);
        return this;
    }

    /**
     * Returns a new stream that only processes values of the original stream that are at least delay apart. All other
     * values are discarded.
     * @param milliseconds
     */
    throttle(milliseconds) {
        let nextStream = new Stream("throttled");

        let go = true;
        this.forEach((value) => {
            if (go) {
                nextStream.push(value);
                go = false;
                setTimeout(function() {
                    go = true;
                }, milliseconds);
            }
        });

        _private(this, registerNextStream, nextStream);

        return nextStream;
    }

    /**
     * Returns a new stream that only processes values of the original stream after the given time has passed without
     * a processed value. Only the last processed value is then processed by the debounced stream.
     * @param milliseconds
     */
    debounce(milliseconds) {
        let nextStream = new Stream("debounced");

        let debouncedValue = null;
        let timeout;

        function reset() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (debouncedValue) {
                    nextStream.push(debouncedValue);
                    debouncedValue = null;
                }
            }, milliseconds);
        }

        this.forEach((value) => {
            debouncedValue = value;
            reset();
        });

        _private(this, registerNextStream, nextStream);

        return nextStream;
    }

    /**
     * Returns a new stream that buffers all values processed by the original stream until a given stream
     * processes any value. When that happens the stream processes the buffered values as an array and begins
     * buffering again with an empty buffer.
     * @param until {Stream}
     */
    buffer(until) {
        let nextStream = new Stream("buffered");

        let buffer = [];

        this.forEach((value) => buffer.push(value));

        until.forEach(() => {
            nextStream.push(buffer);
            buffer = [];
        });

        _private(this, registerNextStream, nextStream);

        return nextStream;

    }
}


/**
 * Create a new stream. The name is mostly for debugging purposes and can be omitted.
 * It defaults to 'stream' then.
 * @param name {String}
 * @returns {Stream}
 */
export function create(name) {
    return new Stream(name || "stream");
}

/**
 * Creates a relay of a stream. I.e. a stream that processes all values the
 * sourceStream processes. This can be used for breaking the auto-close-chain
 * for example.
 * @param sourceStream
 * @param name
 */
export function relay(sourceStream, name) {
    var s = new Stream(name || "stream");
    sourceStream.forEach((...values) => {
        s.push.apply(s, values);
    });

    return s;
}
