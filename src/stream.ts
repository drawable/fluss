/**
 * Created by Stephan on 27.12.2014.
 *
 * A simple implementation of a collection stream that supports reactive patterns.
 *
 */

"use strict";

export interface FPredicate {
    (value:any, index?:number);
}

export interface FErrorPredicate {
    (error:any);
}

export interface IStream {

    /**
     * Names are mostly for debugging purposes
     */
    name:string;

    /**
     * Indicates whether the stream is closed.
     */
    closed:boolean;

    /**
     * Number of values processed by the stream. This will update as soon
     * as a new value arrives in the stream.
     */
    length:number;

    /**
     * Closes the stream. Closed streams do nothing. This disposes the stream automatically.
     */
    close();

    /**
     * Disposes a stream. This closes the stream automatically
     */
    dispose();

    /**
     * Push a new value to the stream. This triggers all sub streams and processing methods.
     * Pushing, in contrary to a true array does not buffer the value. If you need the value
     * after processing by the stream you must buffer it yourself.
     * @param value
     */
    push(value:any);

    /**
     * Pushes an error to the stream and triggers all errors processing methods or raises it up
     * the stream chain until it hits the first error handling method.
     * @param error
     */
    pushError(error:any);

    /**
     * Add a method that is triggered when the stream is closed. If the stream is already closed this method
     * will be called immediately
     * @param method
     */
    onClose(method:Function):IStream;

    /**
     * Automatically close the stream after the given amount of values processed. Subsequent call will reset that limit.
     * Calling this on closed streams has no effect, i.e. it does not restart the stresm.
     * @param maxItems
     */
    times(maxItems:number):IStream;

    /**
     * This closes the stream when a given stream processes a value. Consider using times(1) on that given stream, when it is solely
     * created for closing.
     * @param stream
     */
    until(stream:IStream):IStream;

    /**
     * Return a new stream that processes the values that only meet the given criterium.
     *
     * This criterium can either be:
     * * A function(value, index?) that return true if the value should be kept
     * * A constant that defines what value the stream value must have in order to keep it.
     *
     * @param criterium
     */
    filter(criterium:any):IStream;

    /**
     * For each processed value call the method. Returns the stream it is called on. Can be called multiple times.
     * @param method
     */
    forEach(method:FPredicate):IStream;

    /**
     * Return a new stream that processes values that are calcualted from the original values
     * by the given function(value, index?) or a constant.
     *
     * @param method
     */
    map(method:any):IStream;

    /**
     *
     * @param method
     * @param seed
     */
    scan(method:FPredicate, seed:any):IStream;

    /**
     *
     * @param method
     * @param seed
     */
    reduce(method:FPredicate, seed:any):IStream;

    /**
     * Returns a new stream that is the concatenation of the original stream and a given one. Until the original
     * stream closes the new stream processes the original values. After closing the original stream it processes
     * the values of the given stream. Any values that are processed by the given stream before the original stream
     * is closed are buffered for later use.
     * @param stream
     */
    concat(stream:IStream):IStream;

    /**
     *
     */
    concatAll():IStream;

    /**
     * Creates a new stream that processes values from the orignal stream and the given stream in the order they appear.
     * @param stream
     */
    combine(stream:IStream):IStream;

    /**
     * For each occurring error define a method that is called. Can be called multiple times. Returns the original stream.
     * The existence of at least one of these methods prevents the error to bubble up the stream chain.
     * @param method
     */
    onError(method:FErrorPredicate):IStream;
}

/**
 * Base implementation of the collection stream
 */
export class Stream implements IStream {

    private _buffer:any[];
    private _methods:Function[];
    private _errorMethods:Function[];
    private _closeMethods:Function[];
    private _closed:boolean;
    private _length:number;
    private _maxLength:number;

    constructor(private _name:string) {
        this._buffer = [];
        this._methods = [];
        this._errorMethods = [];
        this._closeMethods = [];
        this._closed = false;
        this._length = 0;
        this._maxLength = 0;
    }

    get name():string {
        return this._name;
    }

    get length():number {
        return this._length;
    }

    private callCloseMethods() {
        var that = this;
        this._closeMethods.forEach(function (m) {
            m.call(that);
        });
    }

    close() {
        if (!this._closed) {
            this._closed = true;
            this.callCloseMethods();
            this.dispose();
        }
    }

    dispose() {
        this.close();
        this._methods = [];
        this._buffer = [];
        this._closeMethods = [];
        this._errorMethods = [];
    }

    times(maxLength:number):IStream {
        this._maxLength = maxLength;
        return this;
    }

    until(stream:IStream):IStream {
        var that = this;
        if (stream) {
            stream.forEach(function () {
                that.close();
            })
        }

        return this;
    }

    get closed():boolean {
        return this._closed;
    }

    private addToBuffer(value:any) {
        this._buffer.unshift(value);
    }

    private processBuffer(buffer:any[], methods:Function[], baseIndex:number):any[] {
        if (this._closed) return null;
        if (!methods.length) return null;

        var l = buffer.length;
        var that = this;
        var errors = [];

        while (l--) {
            var value = buffer.pop();
            methods.forEach(function (m, i) {
                try {
                    m.call(that, value, i + baseIndex);
                } catch (e) {
                    errors.push(e);
                }
            });
        }

        return errors;
    }

    private processBuffers() {
        var errors = this.processBuffer(this._buffer, this._methods, this._length - this._buffer.length);
        if (errors && errors.length) {
            if (this._errorMethods.length) {
                this.processBuffer(errors, this._errorMethods, 0);
            } else {
                errors.forEach(function(e) {
                    throw e;
                })
            }
        }
    }

    private addMethod(method:Function) {
        var firstMethod = this._methods.length === 0;
        this._methods.push(method);

        if (firstMethod) {
            this.processBuffers();
        }
    }

    private addErrorMethod(method:Function) {
        this._errorMethods.push(method);
    }

    private addCloseMethod(method:Function) {
        if (this.closed) {
            method.call(this);
        } else {
            this._closeMethods.push(method);
        }
    }

    push(value:any) {
        if (!this._closed) {
            this.addToBuffer(value);
            this._length++;
            this.processBuffers();

            if (this._length === this._maxLength) {
                this.close();
            }
        }
    }

    pushError(error:any) {
        // If we can't handle the error ourselves we throw it again. That will give preceding streams the chance to handle these
        if (!this._errorMethods || !this._errorMethods.length) {
            throw error;
        }
        this.processBuffer([error], this._errorMethods, 0);
    }

    forEach(method:FPredicate):IStream {
        this.addMethod(method);
        return this;
    }


    private addMethodToNextStream(nextStream, method, onClose?) {
        var that = this;
        this.addMethod(function (value, index) {
            try {
                method.call(that, value, index);
            } catch (e) {
                nextStream.pushError(e);
            }
        });

        if (!onClose) {
            this.onClose(function () {
                nextStream.close();
            });
        } else {
            this.onClose(onClose);
        }
    }

    filter(method:any):IStream {
        var nextStream = new Stream(this._name + ".filter");
        var that = this;

        if (typeof  method === "function") {
            this.addMethodToNextStream(nextStream, function (value, index) {
                if (method.call(that, value, index)) {
                    nextStream.push(value);
                }
            });
        } else {
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
    }

    map(method:any):IStream {
        var nextStream = new Stream(this._name + ".map");

        var that = this;
        if (typeof method === "function") {
            this.addMethodToNextStream(nextStream, function (value, index) {
                nextStream.push(method.call(that, value, index));
            });
        } else {
            this.addMethodToNextStream(nextStream, function (value) {
                nextStream.push(method);
            });
        }

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    }

    scan(method:FPredicate, seed:any):IStream {
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
    }

    reduce(method:FPredicate, seed:any):IStream {
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

        return nextStream;
    }

    concat(stream:IStream):IStream {
        var nextStream = new Stream(this._name + ".concat");
        var buffer = null;

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
        stream.forEach(function (value) {
            if (buffer) {
                buffer.push(value);
            } else {
                nextStream.push(value);
            }
        });

        stream.onClose(function() {
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
    }

    concatAll():IStream {
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
                } else {
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

            stream.forEach(function(value) {
                subBuffer.data.unshift(value);
                update();
            });

            stream.onClose(function() {
                subBuffer.done = true;
                nextInQueue();
            });

            if (queue.length === 1) {
                cursor = subBuffer;
            }
        }

        this.forEach(function(subStream) {
            concatStream(subStream);
        });

        this.onClose(function() {
            nextStream.close();
        });

        if (this._closed) {
            nextStream.close();
        }

        return nextStream;
    }

    combine(stream:IStream):IStream {
        var that = this;
        var nextStream = new Stream(this._name + ".combine");

        this.forEach(function(value) {
            nextStream.push(value);
        });

        stream.forEach(function(value) {
            nextStream.push(value);
        });

        this.onClose(function() {
            if (stream.closed) {
                nextStream.close();
            }
        });

        stream.onClose(function() {
           if (that._closed) {
               nextStream.close();
           }
        });

        if (this._closed && stream.closed) {
            nextStream.close();
        }

        return nextStream;
    }

    onClose(method:Function):IStream {
        this.addCloseMethod(method);
        return this;
    }

    onError(method:FErrorPredicate):IStream {
        this.addErrorMethod(method);
        return this;
    }
}

export function createStream(name?:string):IStream {
    return new Stream(name || "stream");
}