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
    TOGGLE_ALL,
    REMOVE_TODO,
    REMOVE_COMPLETED
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

export function toggleAll(state:boolean) {
    Dispatcher.dispatch(ACTIONS.TOGGLE_ALL, state);
}

export function removeTodo(todo) {
    Dispatcher.dispatch(ACTIONS.REMOVE_TODO, todo);
}

export function removeCompleted() {
    Dispatcher.dispatch(ACTIONS.REMOVE_COMPLETED);
}
