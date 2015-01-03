/**
 * Created by Stephan on 03.01.2015.
 */

"use strict";

import Plugins = require("../../../src/plugins");
import Application = require("../application");
import Store = require("../../../src/store");


export class AddTodo extends Plugins.BasePlugin {

    run(container:Application.Application, action:number, title:string) {
        container.todos.push(Store.record({ title: title, completed: false }));
    }
}


export class CompleteTodo extends Plugins.BasePlugin {
    run(container:Application.Application, action:number, todo:any) {
        todo.completed = true;
    }
}

export class IncompleteTodo extends Plugins.BasePlugin {
    run(container:Application.Application, action:number, todo:any) {
        todo.completed = false;
    }
}

export class ToggleAll extends Plugins.BasePlugin {
    run(container:Application.Application, action:number, state:boolean) {
        container.todos.forEach(function(todo) {
            todo.completed = state;
        })
    }
}

export class RemoveTodo extends Plugins.BasePlugin {
    run(container:Application.Application, action:number, todo:any) {
        container.todos.splice(container.todos.indexOf(todo), 1);
    }
}

export class RemoveCompleted extends Plugins.BasePlugin {
    run(container:Application.Application, action:number) {
        // We work on the immutable because map then creates a simple array instead of a store
        var idx = container.todos.immutable["map"](function (todo, index) {
            if (todo.completed) {
                return index
            }
            return -1;
        });

        idx.reverse();
        idx.forEach(function(index) {
            if (index !== -1) {
                container.todos.splice(index, 1);
            }
        });
    }
}