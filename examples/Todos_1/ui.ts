/// <reference path="../types/react.d.ts" />

/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import Stream = require("../../src/stream");
import Actions = require("./actions");

export var AppView = React.createClass({

    todoUpdates: null,

    handleToggleAll: function(event) {
        Actions.toggleAll(event.currentTarget.checked);
        this.setState({ allChecked: event.currentTarget.checked })
    },

    componentDidMount: function() {
        this.todoUpdates = this.props.todos.updates();

        var that = this;
        this.todoUpdates.filter(function(update) {
            return update.item === "completed" && update.value === false;
        }).forEach(function() {
            that.setState({ allChecked: false })
        })
    },

    componentWillUnmount: function() {
        this.todoUpdates.dispose();
    },

    getInitialState: function() {
        return { allChecked: false }
    },

    render: function () {
        return React.DOM.header({id: "header"},
            React.DOM.h1({}, "todos"),
            NewTodo({}),
            React.DOM.section({ id: "main"},
                React.DOM.input({ type: "checkbox", id: "toggle-all", onClick: this.handleToggleAll, checked: this.state.allChecked }),
                TodoList({ todos: this.props.todos })
            )
        )
    }
});


var NewTodo = React.createClass({

    handleInput: function(event) {
        this.setState({ value: event.currentTarget.value })
    },

    handleKeyDown: function(event) {
        if (event.keyCode === 13) {
            Actions.addTodo(this.state.value);
            this.setState({ value: "" });
        }
    },

    killSubmit: function(event) {
        return false;
    },

    getInitialState: function() {
        return { value: ""}
    },


    render: function() {
        return React.DOM.form({ id: "todo-form", onSubmit: this.killSubmit },
            React.DOM.input({ id: "new-todo", placeholder: "What needs to be done?", autofocus: "autofocus",
                              onChange: this.handleInput, onKeyDown: this.handleKeyDown,
                              value: this.state.value })
        )
    }
});


var TodoList = React.createClass({

    newTodos: null,

    componentDidMount: function() {
        this.newTodos = this.props.todos.newItems();

        var that = this;
        this.newTodos.forEach(function() {
            that.forceUpdate();
        })
    },

    componentWillUnmount: function() {
        this.newTodos.dispose();
    },

    render: function() {
        return React.DOM.ul({ id: "todo-list" },
            this.props.todos.map(function(todo, index) {
                return Todo({ todo: todo, key: index })
            })
        )
    }
});

var Todo = React.createClass({

    updates:null,

    componentDidMount: function() {
        this.updates = this.props.todo.updates();

        var that = this;
        this.updates.forEach(function() {
            that.forceUpdate();
        })
    },

    componentWillUnmount: function() {
        this.updates.dispose();
    },

    handleCompletion: function(event) {
        if (this.props.todo.completed) {
            Actions.incompleteTodo(this.props.todo);
        } else {
            Actions.completeTodo(this.props.todo);
        }
    },

    render: function() {
        return React.DOM.li({},
            React.DOM.div({ className: "view" },
                React.DOM.input({ className: "toggle", type: "checkbox", checked: this.props.todo.completed, onChange: this.handleCompletion }),
                React.DOM.label({ }, this.props.todo.title ),
                React.DOM.button({ className: "destroy "})
            )
        );
    }

});