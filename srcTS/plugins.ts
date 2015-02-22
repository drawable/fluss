/// <reference path="./dispatcher.ts" />
/// <reference path="./baseActions.ts" />
/// <reference path="./tools.ts" />
/**
 * Created by stephan on 01.11.14.
 */

"use strict";

module Fluss {

    /**
     * Plugins are the means to implement the behaviour of an action.
     *
     * An action is an ID (number) and a set of arguments specific to the action.
     *
     * A plugin implements behaviour for that action. Plugins are managed by a Container. A container can
     * handle plugins for several actions and several plugins for an action.
     *
     * ```
     * //Declare your container
     * class MyContainer extends Fluss.Plugins.PluginContainer {
     *  public property:string
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
     * memento in your plugin.
     *
     * ```js
     * class MyPlugin extends Fluss.Plugins.BasePlugin {
     *
     *      run(container:MyContainer, action:number, value:string) {
     *          container.property = value;
     *      }
     *
     *      // getMemento is always called with the exact same arguments as run. getMemento will always be called before
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
    export module Plugins {
        export interface FDoneCallback {
            (abort?:boolean);
        }


        /**
         * An action plugin provides methods to execute an action.
         * Every plugin defines three methods for control flow:
         *
         *   * run: Start the plugin execution.
         *   * afterFinish: Clean up after execution has finished
         *   * afterAbort: Clean up after execution was aborted
         *
         * It defines two additional methods
         *   * getMeneto
         *   * restoreFromMemento
         *
         * To implement undo functionality.
         *
         * During runtime it provides three methods do influence control flow
         *   * hold: Hold execution of the plugin stack for the action
         *   * release: Continue execution of the plugin stack for the action
         *   * abort: Abort execution of the plugin stack
         *
         */
        export interface IActionPlugin {


            /**
             * Start plugin execution
             *
             * The most important part is the done-callback doneCB. It is used by the plugin to tell the
             * framework that the plugin is done with it's execution. Only if a plugin is done, "outer" plugins
             * for the same action can be finished as well.
             *
             * The callback takes one parameter aborted:boolean to signal the system if the execution was successful or should be aborted.
             * Depending on that parameter either the finish-method or the abort-method will be called.
             *
             * @param container
             * @param action
             * @param doneCB        This is used to signal the system that the plugin is done with it's work.
             * @param args
             */
            run(container:any, action:number, ...args:any[]);

            /**
             * Called when the plugin signalled that it's done by calling the done-callback.
             * @see run
             * @param container
             * @param action
             */
            afterFinish(container:any, action:number, ...args:any[]);

            /**
             * Called when the plugin signalled that it has aborted it's action.
             * @see run
             * @param container
             * @param action
             */
            afterAbort(container:any, action:number, ...args:any[]);

            /**
             * Provide a memento for the action. If this returns `null` no memento is stored and the action cannote be
             * undone.
             *
             * @param container
             * @param type
             * @param args
             */
            getMemento(container:any, type:number, ...args:any[]):Dispatcher.IMemento;

            /**
             * Restore state from memento
             * @param memento
             */
            restoreFromMemento(container:any, memento:Dispatcher.IMemento);


            hold();
            release(action?:number);
            abort(action?:number);
        }


        /**
         *
         */
        export interface ActionConfig {
            action: any;
            plugins: any[];
        }

        /**
         * Configuration-Data for defining the plugins used by a plugin container
         */
        export interface PluginConfig {
            [index:number]:ActionConfig;
            length:number;
            forEach(...args:any[]);
        }


        /**
         * Plugin-Container proivdes the means to use plugins to execute actions
         */
        export interface IPluginContainer {


            /**
             * Setup plugins using a configuration.
             * @param config
             */
            configure(config:PluginConfig);

            /**
             * Add a plugin to the container for a given action to handle
             * @param action
             * @param handler
             */
            wrap(action:number, handler:any);

            /**
             * Remove a plugin from the container
             * @param action
             * @param handler
             */
            detach(action:number, handler:IActionPlugin);

            /**
             * Abort running plugins. If action is given only the plugins for that action are aborted,
             * otherwise for all actions actually running.
             * @param action
             */
            abort(action?:number);

            /**
             * Destroy this container
             */
            destroy();
        }


        /**
         * Base implementation for a plugin. Does absolutely nothing.
         */
        export class BasePlugin implements IActionPlugin {
            run(container:any, action:number, ...args:any[]) {
            }

            afterFinish(container:any, action:number, ...args:any[]) {

            }

            afterAbort(container:any, action:number, ...args:any[]) {

            }

            getMemento(container:any, action:number, ...args:any[]):Dispatcher.IMemento {
                return null;
            }

            restoreFromMemento(container:any, memento:Dispatcher.IMemento) {

            }

            hold() {

            }

            release(action?:number) {

            }

            abort(action?:number) {

            }
        }


        /**
         * Create a Plugin. Use this when you're using plain JavaScript.
         * @param spec
         * @returns {any}
         */
        export function createPlugin(spec:any):any {
            return Tools.subclass(spec, BasePlugin);
        }


        /**
         * Base implementation for a plugin container.
         */
        export class PluginContainer implements IPluginContainer {

            private _plugins;
            private _anyPlugins:IActionPlugin[];
            private _protocols;
            private _runningPlugins;
            private _mementos;

            constructor() {
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
            public configure(config:PluginConfig) {
                function construct(constructor:any, args:any):any {

                    function F() : void {
                        constructor.apply(this, args);
                    }
                    F.prototype = constructor.prototype;
                    return new F();
                }

                var that = this;
                config.forEach(function(action:any) {
                    action.plugins.forEach(function(plugin:any) {
                        if (plugin.plugin) {
                            that.wrap(action.action, construct(plugin.plugin, plugin.parameters))
                        } else {
                            that.wrap(action.action, new plugin())
                        }
                    })
                });
            }

            public destroy() {
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
            }

            public pluginDone(action:number, abort?:boolean) {
            }

            private abortAction(action:number) {
                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    var plg:IActionPlugin = this._runningPlugins[action][this._runningPlugins[action].length - 1];

                    if (plg) {
                        plg.abort(action);
                    }
                }

                this._runningPlugins[action] = null;
            }

            public abort(action?:number) {
                if (typeof action === "undefined") {
                    for (var actionKey in this._protocols) {
                        if (this._protocols.hasOwnProperty(actionKey)) {
                            this.abortAction(actionKey);
                        }
                    }
                } else {
                    if (this._protocols[action]) {
                        this.abortAction(action);
                    }
                }
            }

            /**
             * Handle the action.
             *
             * This does
             *  * Runs the plugins in the reverse wrapping order
             *  * Let's a plugin create a memento first
             *  * When a plugin hold's the execution, it waits for the plugin to call release
             *  * When a plugin is done calls its afterFinish-method
             *  * When a plugin aborts, aborts all other plugins
             *  *
             *
             *
             * @param action
             * @param args
             */
            private doHandleAction(plugins, action:number, args?:any[]) {

                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    throw new Error("ERROR calling action " + action + ". Same action cannot be called inside itself!")
                }

                var that = this;

                var composeArgs = function(plugin:IActionPlugin, action) {
                    return [that, action].concat(args);
                };

                this._mementos[action] = [];
                this._runningPlugins[action] = [];
                this._protocols[action] = [];
                plugins.forEach(function(plugin) {
                    that._protocols[action].push(0);
                    that._runningPlugins[action].push(plugin);
                });

                var aborted = false;
                plugins.forEach(function(plugin, i) {

                    (function(index) {
                        var done = function(abort, doneAction) {
                            index = that.getPluginsForAction(doneAction).indexOf(plugin);
                            that._protocols[doneAction][index] = {

                                plugin: plugin,

                                done: function(abort) {
                                    if (abort) {
                                        plugin.afterAbort.apply(plugin, composeArgs(plugin, doneAction));
                                    } else {
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
                                } else {
                                    //Here we exit because: The plugin indexed by last has not called it's done-callback.
                                    //When it will, this loop will be run again because we decreased last down to the index
                                    //of the first missing entry in the stack
                                    break;
                                }

                            }
                            if (!that._runningPlugins[doneAction] || !that._runningPlugins[doneAction].length) {
                                that.finalizeAction(doneAction, abort, that.getPluginsForAction(doneAction), that._mementos[doneAction], args);
                            }
                        };

                        var holds:boolean = false;
                        var dones = {};

                        plugin["hold"] = function()  {
                            holds = true;
                        };

                        plugin["abort"] = function(abortAction?:number) {
                            var act = typeof abortAction === "undefined" ? action : abortAction;
                            dones[act] = true;
                            done(true, act);
                            aborted = true;
                        };

                        plugin["release"] = function(releaseAction?:number) {
                            var act = typeof releaseAction === "undefined" ? action : releaseAction;
                            if (dones[act]) {
                                throw new Error("Plugin released twice for action " + act + "! Possibly called release after abort or vice versa.")
                            } else {
                                done(false, act);
                                dones[act] = true;
                            }
                        };

                        if (!aborted) {
                            var memento = plugin.getMemento.apply(plugin, composeArgs(plugin, action));
                            if (memento) {
                                memento["instance"] = {
                                    restoreFromMemento: function(mem) {
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
                                    } else {
                                        //Here we do not exit because we want to abort the whole stack
                                    }
                                }
                                that.finalizeAction(action, true, that.getPluginsForAction(action), null, args);
                            } else {
                                if (!holds && !dones[action]) done(false, action);
                            }
                        }

                    })(i);
                });
            }

            private getPluginsForAction(action:number) {
                if (this._plugins[action] && this._plugins[action].length) {
                    return this._plugins[action];
                } else if (this._anyPlugins && this._anyPlugins.length) {
                    return this._anyPlugins;
                } else return [];

            }

            private handleAction(action:number, args?:any[]) {
                try {
                    this.doHandleAction(this.getPluginsForAction(action), action, args);
                } catch(e) {
                    this.abort();
                    throw e;
                }
            }


            private finalizeAction(action:number, abort:boolean, plugins:IActionPlugin[], mementos, args?:any[]) {
                if (!abort) {
                    if (mementos && mementos.length && !Dispatcher.getDispatcher().undoing) {
                        Dispatcher.getUndoManager().storeMementos(mementos, action, Dispatcher.createRedo(action, args));
                    }
                }
                this._mementos[action] = null;
                this._runningPlugins[action] = null;
                this._protocols[action] = null;
            }

            private provideMementos(action:number, plugins:IActionPlugin[], args?:any[]):Dispatcher.IMemento[] {

                if (plugins) {
                    var ret = [];
                    var that = this;
                    plugins.forEach(function(plugin) {
                        var memento = plugin.getMemento.apply(plugin, [that, action].concat(args));
                        if (memento) {
                            memento.instance = {
                                storeToMemento: function():Dispatcher.IMemento {
                                    return null;
                                },
                                restoreFromMemento: function(mem){
                                    plugin.restoreFromMemento(that, mem);
                                }
                            };

                            ret.push(memento);
                        }
                    });

                    if (ret.length) {
                        Dispatcher.getUndoManager().storeMementos(ret, action, Dispatcher.createRedo(action, args));
                    }
                }
                return null;
            }


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
             * @param _handler
             */
            public wrap(action:number, handler:any) {
                var _handler;
                if (typeof handler === "function") {
                    _handler = {
                        run: (container, ...args) => handler["apply"](this, args),
                        getMemento: () => null,
                        restoreFromMemento: () => null,
                        afterFinish: () => null,
                        afterAbort: () => null
                    }
                } else {
                    _handler = handler;
                }

                if (action === BaseActions.ACTIONS.__ANY__) {
                    if (this._anyPlugins.length === 0) {
                        var that = this;
                        Dispatcher.subscribeAction(BaseActions.ACTIONS.__ANY__, function(...args:any[]) {
                            var act = args.shift();
                            if (that._plugins[act]) {
                                return;
                            }
                            that.handleAction(act, args);
                        }, function(type:number, ...args:any[]):Dispatcher.IMemento[] {
                            return null;
                        })
                    }

                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this.doWrap(a, _handler);
                        }
                    }
                    this._anyPlugins.unshift(_handler);
                } else {
                    if (!this._plugins[action] && this._anyPlugins.length) {
                        var l = this._anyPlugins.length;
                        while(l--) {
                            this.doWrap(action, this._anyPlugins[l]);
                        }
                    }
                    this.doWrap(action, _handler);
                }
            }

            private doWrap(action:number, handler:IActionPlugin) {
                if (!this._plugins[action]) {
                    this._plugins[action] = [];
                    var that = this;
                    Dispatcher.subscribeAction(action, function(...args:any[]) {
                        that.handleAction(action, args);
                    }, function(type:number, ...args:any[]):Dispatcher.IMemento[] {
                        return null; //return that.provideMementos(action, args);
                    })
                }

                if (this._plugins[action].indexOf(handler) !== -1) {
                    throw new Error("Plugin instances can only be used once per action!")
                }

                this._plugins[action].unshift(handler);
            }

            public detach(action:number, handler:IActionPlugin) {
                if (action === BaseActions.ACTIONS.__ANY__) {
                    this._anyPlugins.splice(this._anyPlugins.indexOf(handler), 1);
                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this._plugins[a].splice(this._plugins[a].indexOf(handler), 1);
                        }
                    }
                } else {
                    if (this._plugins[action]) {
                        this._plugins[action].splice(this._plugins[action].indexOf(handler), 1);
                    }
                }
            }
        }

        export function createContainer(spec:any):any {
            return Tools.subclass(spec, PluginContainer);
        }

    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Plugins = Fluss.Plugins;
}

