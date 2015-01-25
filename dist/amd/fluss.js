/**
 * Created by Stephan on 16.01.2015.
 */

"use strict";


define(["tools", "stream", "store", "reactMixins", "errors", "baseActions", "dispatcher", "plugins"], function(
    Tools, Stream, Store, ReactMixins, Errors, BaseActions, Dispatcher, Plugins) {
    return {
        Tools: Tools,
        Stream: Stream,
        Store: Store,
        ReactMixins: ReactMixins,
        Errors: Errors,
        BaseActions: BaseActions,
        Dispatcher: Dispatcher,
        Plugins: Plugins
    }
});
