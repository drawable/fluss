/// <reference path="../types/react.d.ts" />

/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import BaseActions = require("../../src/baseActions");
import Plugins = require("../../src/plugins");
import Store = require("../../src/store");
import UI = require("./ui");
import Actions = require("./actions");

class Application extends Plugins.PluginContainer {

    todos:Store.IArrayStore;

    constructor() {
        super("Application");

        this.todos = Store.array();
    }
}


/**
 * This will create a new todo record
 * @param title
 * @returns {IRecordStore}
 */
function createTodo(title:string):Store.IRecordStore {
    return Store.record({ title: title, completed: false });
}


class AddTodo extends Plugins.BasePlugin {

    run(container:Application, action:number, text:string) {
        container.todos.push(createTodo(text));
    }
}


class CompleteTodo extends Plugins.BasePlugin {
    run(container:Application, action:number, todo:any) {
        todo.completed = true;
    }
}

class IncompleteTodo extends Plugins.BasePlugin {
    run(container:Application, action:number, todo:any) {
        todo.completed = false;
    }
}

class ToggleAll extends Plugins.BasePlugin {
    run(container:Application, action:number, state:boolean) {
        container.todos.forEach(function(todo) {
            todo.completed = state;
        })
    }
}

/**
 * This creates a new application object
 * @returns {Application}
 */
function createApplication() {
    var app = new Application();

    app.wrap(Actions.ACTIONS.ADD_TODO, new AddTodo());
    app.wrap(Actions.ACTIONS.COMPLETE_TODO, new CompleteTodo());
    app.wrap(Actions.ACTIONS.INCOMPLETE_TODO, new IncompleteTodo());
    app.wrap(Actions.ACTIONS.TOGGLE_ALL, new ToggleAll());

    return app;
}


function init() {
    var container = document.getElementById("todoapp");
    var app = createApplication();

    React["renderComponent"](UI.AppView({ todos: app.todos }), container);

    Actions.addTodo("A new Todo");
}

init();
