/**
 * Created by Stephan on 22.02.2015.
 */

import * as Stream from './Stream';

/**
 * A streamprovider manages multiple streams for different usages. It is a helper for objects
 * that want to provide streams for different events.
 */
class StreamProvider {
    constructor(namePrefix = "") {
        this._streams = {};
        this._namePrefix = namePrefix;
    }

    /**
     * Clear all data. This closes all streams before removing them
     */
    dispose() {
        Object.keys(this._streams).forEach((key) => {
            this._streams[key].forEach((stream) => stream.close());
        });
        this._streams = {}
    }

    /**
     * Create a new stream for an "event"-type
     * @param type
     */
    newStream(type) {
        var s = Stream.create(this._namePrefix + type);

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
     * @param streamName
     */
    relay(stream, streamName) {
        var that = this;
        stream.forEach((value) =>
            that.push(streamName, value)
        );
    }
}

/**
 * Create a new stream provider
 * @returns {StreamProvider}
 */
export function create() {
    return new StreamProvider();
}