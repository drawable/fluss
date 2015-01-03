/// <reference path="../types/react.d.ts" />

/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import Stream = require("../../src/stream");
import Actions = require("./actions");



var componentLifeCycle = {
    _willUnmount:null,

    componentDidMount: function() {
        this._willUnmount = Stream.createStream("component-unmount");
    },

    componentWillUnmount: function() {
        this._willUnmount.push(true);
        this._willUnmount.dispose();
    }
};


export var AppView = React.createClass({

    mixins: [componentLifeCycle],

    handleToggleAll: function(event) {
        Actions.toggleAll(event.currentTarget.checked);
        this.setState({ allChecked: event.currentTarget.checked })
    },

    updateState: function() {
        var ac = this.props.todos.every(function(todo) {
            return todo.completed === true;
        });

        this.setState({ allChecked: ac})
    },

    componentDidMount: function() {
        var that = this;

        this.props.todos.updates()
            .until(this._willUnmount)
            .filter(function(update) {
                return update.item === "completed";
            }).forEach(function() {
                that.updateState();
            });

        this.props.todos.newItems()
            .until(this._willUnmount)
            .forEach(function() {
                that.updateState();
                that.forceUpdate();
            })
            .combine(this.props.todos.removedItems().until(this._willUnmount))
            .forEach(function() {
                that.updateState();
                that.forceUpdate();
            });
    },

    getInitialState: function() {
        return { allChecked: this.props.todos.every(function(todo) {
            return todo.completed === true;
        })
        }
    },

    render: function () {
        return React.DOM.header({id: "header"},
            React.DOM.h1({}, "todos"),
            NewTodo({}),
            React.DOM.section({ id: "main"},
                React.DOM.input({ type: "checkbox", id: "toggle-all", onClick: this.handleToggleAll, checked: this.state.allChecked }),
                TodoList({ todos: this.props.todos })
            ),
            this.props.todos.length ? Footer({ todos: this.props.todos }) : null
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
        return React.DOM.input({ id: "new-todo", placeholder: "What needs to be done?", autofocus: "autofocus",
            onChange: this.handleInput, onKeyDown: this.handleKeyDown,
            value: this.state.value })
    }
});


var TodoList = React.createClass({

    mixins: [componentLifeCycle],

    componentDidMount: function() {
        var that = this;
        this.props.todos.newItems()
            .until(this._willUnmount)
            .forEach(function() {
            that.forceUpdate();
        });

        this.props.todos.removedItems()
            .until(this._willUnmount)
            .forEach(function() {
                that.forceUpdate();
            })
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

    mixins: [componentLifeCycle],

    componentDidMount: function() {
        var that = this;
        this.props.todo.updates()
            .until(this._willUnmount)
            .forEach(function() {
                that.forceUpdate();
            })
    },

    handleCompletion: function(event) {
        if (this.props.todo.completed) {
            Actions.incompleteTodo(this.props.todo);
        } else {
            Actions.completeTodo(this.props.todo);
        }
    },

    handleRemove: function() {
        Actions.removeTodo(this.props.todo);
    },

    render: function() {
        return React.DOM.li({ className: this.props.todo.completed ? "completed" : ""},
            React.DOM.div({ className: "view" },
                React.DOM.input({ className: "toggle", type: "checkbox", checked: this.props.todo.completed, onChange: this.handleCompletion }),
                React.DOM.label({ }, this.props.todo.title ),
                React.DOM.button({ className: "destroy", onClick: this.handleRemove})
            )
        );
    }

});

var Footer = React.createClass({

    mixins: [componentLifeCycle],

    componentDidMount: function() {
        var that = this;
        this.props.todos.updates()
            .until(this._willUnmount)
            .filter(function(update) {
                return update.item === "completed";
            }).forEach(function() {
                that.forceUpdate();
            });

        this.props.todos.newItems()
            .until(this._willUnmount)
            .forEach(function() {
                that.forceUpdate();
            });

        this.props.todos.removedItems()
            .until(this._willUnmount)
            .forEach(function() {
                that.forceUpdate();
            })
    },

    handleClearCompleted: function() {
        Actions.removeCompleted();
    },

    render: function() {
        var count = this.props.todos.filter(function(todo) {
            return todo.completed === false
        }).length;

        return React.DOM.footer({ id: "footer" },
            React.DOM.span({ id: "todo-count"}, React.DOM.strong({}, count), count === 1 ? " item left" : " items left"),
            React.DOM.button({ id: "clear-completed", onClick: this.handleClearCompleted}, "Clear completed (" + (this.props.todos.length - count) + ")")
        )
    }
});