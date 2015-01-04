/// <reference path="../types/react.d.ts" />

/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import Plugins = require("../../src/plugins");
import Store = require("../../src/store");

import UI = require("./ui");
import Actions = require("./actions");
import TodoPlugins = require("./plugins/todos");

export class Application extends Plugins.PluginContainer {

    private _todos:Store.IArrayStore;
    filter:Store.IRecordStore;

    constructor() {
        super();

        this._todos = Store.array();
        this.filter = Store.record({
            all: true,
            active: false,
            completed: false
        })
    }

    get todos():Store.IArrayStore {
        return this._todos;
    }
}


/**
 * This creates a new application object
 * @returns {Application}
 */
function createApplication() {
    var app = new Application();

    app.wrap(Actions.ACTIONS.ADD_TODO, new TodoPlugins.AddTodo());
    app.wrap(Actions.ACTIONS.COMPLETE_TODO, new TodoPlugins.CompleteTodo());
    app.wrap(Actions.ACTIONS.INCOMPLETE_TODO, new TodoPlugins.IncompleteTodo());
    app.wrap(Actions.ACTIONS.TOGGLE_ALL, new TodoPlugins.ToggleAll());
    app.wrap(Actions.ACTIONS.REMOVE_TODO, new TodoPlugins.RemoveTodo());
    app.wrap(Actions.ACTIONS.REMOVE_COMPLETED, new TodoPlugins.RemoveCompleted());
    return app;
}


function init() {
    var container = document.getElementById("todoapp");
    var app = createApplication();

    // Always pass immutable stores to the frontend to prevent disruption of the data flow.
    React["renderComponent"](UI.AppView({ todos: app.todos.immutable }), container);

    Actions.addTodo("Learn some fluss");
}

init();
