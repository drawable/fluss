/**
 * Created by Stephan on 16.01.2015.
 */

"use strict";


define(["tools", "emitter", "stream", "store", "reactMixins", "eventChannel", "errors", "baseActions", "dispatcher", "plugins"], function(
    Tools, Emitter, Stream, Store, ReactMixins, EventChannel, Errors, BaseActions, Dispatcher, Plugins) {
    return {
        Tools: Tools,
        Emitter: Emitter,
        Stream: Stream,
        Store: Store,
        ReactMixins: ReactMixins,
        EventChannel: EventChannel,
        Errors: Errors,
        BaseActions: BaseActions,
        Dispatcher: Dispatcher,
        Plugins: Plugins
    }
});
