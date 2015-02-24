/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";


import * as Stream from './Stream';


/**
 * A streamprovider manages multiple streams for different usages. It is a helper for objects
 * that want to provide streams for different events.
 */
class StreamProvider {
    constructor() {
        this._streams = {};
    }


    /**
     * Create a new stream for an "event"-type
     * @param type
     */
    newStream(type) {
        var s = Stream.createStream(type);

        if (!this._streams[type]) {
            this._streams[type] = [];
        }

        this._streams[type].push(s);

        var that = this;
        s.onClose(function() {
            that._streams[type].splice(that._streams[type].indexOf(s), 0);
        });

        return s;
    }

    /**
     * Push a value to all streams of a specific event type
     * @param streamType
     * @param value
     */
    push(streamType, value) {
        if (this._streams[streamType]) {
            this._streams[streamType].forEach((stream) =>
                stream.push(value)
            )
        }
    }

    /**
     * Push an error to all streams of a specific event type
     * @param streamType
     * @param value
     */
    pushError(streamType, value) {
        if (this._streams[streamType]) {
            this._streams[streamType].forEach((stream) =>
                stream.pushError(value)
            )
        }
    }

    /**
     * Forward all messages from the given stream to all streams of the given ID
     * @param stream
     * @param streamType
     */
    relay(stream, streamType) {
        var that = this;
        stream.forEach((value) =>
            that.push(streamType, value)
        );
    }
}

/**
 * Create a new stream provider
 * @returns {StreamProvider}
 */
export function createStreamProvider() {
    return new StreamProvider();
}