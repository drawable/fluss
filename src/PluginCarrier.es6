/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

import * as StreamProvider from './StreamProvider';


/**
 * Wrapper class for plugins. This defines the events a plugin emits (via streams) during execution:
 *
 * The simple case
 *  -->started
 *      run
 *  -->ran
 *      afterFinish
 *  -->finished
 *
 */
export default class PluginCarrier {

    constructor(plugin) {
        this._plugin = null;
        if (typeof plugin === "function") {
            this._plugin = {
                run: (container, action, ...args) => plugin.apply(this, args),
                getMemento: () => null,
                restoreFromMemento: () => null,
                afterFinish: () => null,
                afterAbort: () => null
            }
        } else {
            this._plugin = plugin;
        }

        this._holds = false;
        this._plugin["hold"] = () => this._holds = true;
        this._plugin["release"] = () => {
            if (this._holds) {
                this._holds = false;
                this._streams.push("released", this._params);
            }
        };

        this._plugin["abort"] = () => this.abort.apply(this, this._params);
        this._streams = StreamProvider.create();
    }

    get started() {
        return this._streams.newStream("started");
    }

    get ran() {
        return this._streams.newStream("ran");
    }

    get finished() {
        return this._streams.newStream("finished");
    }

    get aborted() {
        return this._streams.newStream("aborted");
    }

    get holding() {
        return this._streams.newStream("holding");
    }

    get released() {
        return this._streams.newStream("released");
    }

    get errors() {
        return this._streams.newStream("errors");
    }

    run(params) {
        this._params = params;
        this._holds = false;
        this._aborted = false;

        this._streams.push("started", true);

        try {
            this._plugin.run.apply(this._plugin, params);
        } catch (e) {
            this._streams.push("errors", e);
        }

        if (!this._aborted) {
            if (this._holds) {
                this._streams.push("holding", params);
            } else {
                this._streams.push("ran", params);
            }
        }
    }

    getMemento(params) {
        return this._plugin.getMemento.apply(this._plugin, params)
    }

    restoreFromMemento(container, memento) {
        return this._plugin.restoreFromMemento(container, memento);
    }

    afterAbort(params) {
        return this._plugin.afterAbort.apply(this._plugin, params)
    }

    abort(container, action) {
        this._aborted = true;
        this._streams.push("aborted", this._params);
    }

    afterFinish(params) {
        if (!this._holds) {
            this._plugin.afterFinish.apply(this._plugin, params);
            this._streams.push("finished", params);
        }
    }

    undo(container, memento) {
        this._plugin.undo(container, memento);
    }
}
