/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import BaseActions = require("../../src/baseActions");
import Plugins = require("../../src/plugins");
import Store = require("../../src/store");

class Application extends Plugins.PluginContainer {

    todos:Store.IArrayStore;

    constructor() {
        super("Application");

        this.todos = Store.array();
    }
}


/**
 * This will create a new todo record
 * @param text
 * @returns {IRecordStore}
 */
function createTodo(text:string):Store.IRecordStore {
    return Store.record({ text: text, complete: false });
}


enum ACTIONS {
    ADD_TODO = BaseActions.firstAction
}

class AddTodo extends Plugins.BasePlugin {

    run(container:Application, action:number, text:string) {
        container.todos.push(createTodo(text));
    }
}



/**
 * This creates a new application object
 * @returns {Application}
 */
function createApplication() {
    var app = new Application();

    app.wrap(ACTIONS.ADD_TODO, new AddTodo());

    return app;
}