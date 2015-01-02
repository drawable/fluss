/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import Dispatcher = require("../../src/dispatcher");
import BaseActions = require("../../src/baseActions");

export enum ACTIONS {
    ADD_TODO = 1000,
    COMPLETE_TODO,
    INCOMPLETE_TODO,
    COMPLETE_ALL
}

export function addTodo(title:string) {
    Dispatcher.dispatch(ACTIONS.ADD_TODO, title);
}

export function completeTodo(todo) {
    Dispatcher.dispatch(ACTIONS.COMPLETE_TODO, todo);
}

export function incompleteTodo(todo) {
    Dispatcher.dispatch(ACTIONS.INCOMPLETE_TODO, todo);
}

export function completeAll() {
    Dispatcher.dispatch(ACTIONS.COMPLETE_ALL);
}

