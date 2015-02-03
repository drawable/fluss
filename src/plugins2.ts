/// <reference path="./stream.ts" />
/// <reference path="./dispatcher.ts" />
/// <reference path="./plugins.ts" />
/**
 * Created by Stephan on 31.01.2015.
 */

"use strict";


module Fluss {

    export module Plugins {

        class PluginCarrier{

            private _holds:boolean;
            private _aborted:boolean;
            private _streams: Fluss.Stream.IStreamProvider;
            private _params: any[];

            constructor(private _plugin:Fluss.Plugins.IActionPlugin) {
                var that = this;
                this._holds = false;
                this._plugin["hold"] = function() {
                    that._holds = true;
                };

                this._plugin["release"] = function() {
                    if (that._holds) {
                        that._holds = false;
                        that._streams.push("released", that._params);
                    }
                };

                this._plugin["abort"] = function() {
                    that.abort.apply(that, that._params);
                };

                this._streams = Fluss.Stream.createStreamProvider();
            }

            get started():Fluss.Stream.IStream {
                return this._streams.newStream("started");
            }

            get done():Fluss.Stream.IStream {
                return this._streams.newStream("done");
            }

            get finished():Fluss.Stream.IStream {
                return this._streams.newStream("finished");
            }

            get aborted():Fluss.Stream.IStream {
                return this._streams.newStream("aborted");
            }

            get holding():Fluss.Stream.IStream {
                return this._streams.newStream("holding");
            }

            get released():Fluss.Stream.IStream {
                return this._streams.newStream("released");
            }

            run(params:any[]) {
                this._params = params;
                this._holds = false;
                this._aborted = false;

                this._streams.push("started", true);

                this._plugin.run.apply(this._plugin, params);

                if (!this._aborted) {
                    if (this._holds) {
                        this._streams.push("holding", params);
                    } else {
                        this._streams.push("done", params);
                    }
                }
            }

            getMemento(params:any[]):any {
                return this._plugin.getMemento.apply(this._plugin, params)
            }

            restoreFromMemento(container:any, memento:any) {
                return this._plugin.restoreFromMemento(container, memento);
            }

            afterAbort(params:any[]) {
                return this._plugin.afterAbort.apply(this._plugin, params)
            }

            abort(container:any, action:number) {
                this._aborted = true;
                this._streams.push("aborted", this._params);
            }

            afterFinish(params) {
                if (!this._holds) {
                    this._plugin.afterFinish.apply(this._plugin, params);
                    this._streams.push("finished", params);
                }
            }
        }

        export class NewContainer {

            private _plugins;
            private _anyPlugins: Fluss.Plugins.IActionPlugin[];
            private _stack: PluginCarrier[];

            constructor() {
                this._plugins = {};
                this._stack = [];
                this._anyPlugins = [];
            }

            destroy() {
                this._plugins = null;
            }

            abort(action?:number) {
                if (this._stack.length) {
                    this._stack.pop().abort(this, action);
                }
                this._stack = [];
            }

            wrap(action:number, plugin:Fluss.Plugins.IActionPlugin) {
                if (action === Fluss.BaseActions.ACTIONS.__ANY__) {
                    this._anyPlugins.push(plugin);
                    this.dowrap(action, plugin);

                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a) && (a != Fluss.BaseActions.ACTIONS.__ANY__)) {
                            this.dowrap(a, plugin);
                        }
                    }
                } else {
                    this.wrapAnyPluginsForAction(action);
                    this.dowrap(action, plugin);
                }
            }

            private wrapAnyPluginsForAction(action) {
                if (!this._plugins[action]) {
                    var that = this;
                    this._anyPlugins.forEach(function(plg) {
                        that.dowrap(action, plg);
                    })
                }
            }

            private dowrap(action:number, plugin:Fluss.Plugins.IActionPlugin) {
                var plg:PluginCarrier = new PluginCarrier(plugin);
                var that = this;

                if (this._plugins[action]) {
                    var next:PluginCarrier = this._plugins[action];
                    plg.done.combine(plg.holding).forEach(function(params) {

                        next.run(params);
                    });

                    next.finished.forEach(function(params) {
                        that._stack.pop();
                        plg.afterFinish(params);
                    });
                    next.aborted.forEach(function(params) {
                        plg.abort.apply(plg, params);
                    });
                } else {
                    plg.done.forEach(function(params) {
                        plg.afterFinish(params);
                    });

                    Fluss.Dispatcher.subscribeAction(action, function(...args:any[]) {
                        that._stack = [];
                        // We have to reread the first plugin when executing the action because other plugins might have
                        // been wrapped in the meantime. Don't use plg here.
                        var plg = that._plugins[action];

                        if (plg && action !== Fluss.BaseActions.ACTIONS.__ANY__) {
                            that._plugins[action].run([that, action].concat(args));
                        }
                        else if (that._anyPlugins.length) {
                            var act = args.shift();
                            if (!that._plugins[act]) {
                                that._plugins[Fluss.BaseActions.ACTIONS.__ANY__].run([that, act].concat(args));
                            }
                        }
                    }, null);
                }

                plg.released.forEach(function(params) {
                    plg.afterFinish(params);
                });

                plg.aborted.forEach(function(params) {
                    plg.afterAbort(params);
                });

                plg.started.forEach(function() {
                    that._stack.push(plg);
                });

                this._plugins[action] = plg;
            }
        }
    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Plugins = Fluss.Plugins;
}
