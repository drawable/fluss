# Todos - Step 1. The standard application

The [TodoMVC specification](https://github.com/tastejs/todomvc/blob/master/app-spec.md) tells us everything we need.

If you're just interested in the result you can see the final solution here (link will follow).

## Data

Of course we'll need a todo. It has the following fields

* ID
* Title
* Completed flag

We need a list of todos. That will be an array.

The data we'll create needs to be stored in local storage.

## Actions

Actions are primarily what the user triggers in order for the app to do something. So for the todo app we'll need the following

* Add a new todo
* Complete a todo
* Uncomplete a todo
* Delete a todo
* Toggle state for all todos
* Clear completed todos
* Filter all
* Filter active
* Filter completed


## UI

We need

* The input box for the new todo
* A list of todos
* The ability to edit the title of a todo
* Something to complete all todos
* A todo consisting of
    * The checkbox for un-/completing
    * The text
    * A button for deleting the todo
* An indicator for how many todos are uncompleted
* A button to clear the completed todos
* A combined trigger/indicator for toggling all todos and displaying if all are completed
* Buttons for filtering all, only active, only completed todos

## Preparation

Create a new project like you use to do. Install fluss

    npm install fluss

Use the following Typrescipt transpiler settings

* -t ES5
* -m commonjs

## The application object

We start by creating an application object. This will hold the stores and will be the container for the plugins. Plugins are
objects that encapsulate the functionality of an action optionally including the means to undo/redo that action. Create a
file `application.ts`.

    import Plugins = require("fluss/src/plugins");
    import Store = require("fluss/src/store");

    export class Application extends Plugins.PluginContainer {

        todos:Store.IArrayStore;

        constructor() {
            super();

            this.todos = Store.array();
        }
    }

The application has one property, an array-store holding all todos.


## Adding a new todo

Now we need a way to add a new todo to our list. This will be our first action and the first plugin we'll implement. Create a
new file actions.ts

    import Dispatcher = require("fluss/src/dispatcher");
    import BaseActions = require("fluss/src/baseActions");

    export enum ACTIONS {
        ADD_TODO
    }

    export function addTodo(title:string) {
        Dispatcher.dispatch(ACTIONS.ADD_TODO, title);
    }

We define all our actions in an an enum. Enums will become numbers eventually (and their string counterpart for reference)
when compiled to Javascipt. So you should define your actions in one place and one enum only to avoid clashes. Using
initializers on the enums is possible but in real life hard to keep track of.

The function `addTodo` is not necessary but good practice as it gives us the opportunity to provide a well defined signature
for our action.


Next we implement a plugin for that action. We'll create a new file `plugins/todos.ts` for that.

    import Plugins      = require("fluss/src/plugins");
    import Application  = require("application");
    import Store        = require("fluss/src/store");

    export class AddTodo extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, title:string) {
            container.todos.push(Store.record({ title: title, completed: false }));
        }
    }

At the moment the `run` method is all we need. Besides the container (our application) and the action we expect the text
of the todo to be passed. When the action is executed we simply create a new record store and push it to the list of todos.

## Adding the plugin to the application

We have defined the plugin but it would not do anything when the action is triggered. We need to add the plugin to the application first.

We'll import our action definitions and our plugins in `application.ts`:

    import Actions = require("./actions");
    import TodoPlugins = require("./plugins/todos");

and add a function for instantiating our application at the end of `application.ts`:

    function createApplication() {
        var app = new Application();

        app.wrap(ACTIONS.ADD_TODO, new AddTodo());

        return app;
    }

We 'wrap an instance of our new plugin around the application object' for the ADD_TODO action. This is called wrapping because
more than one plugin can ba wrapped around the plugin for any action and these plugins then will all be executed one after the other
for that action beginning with the last plugin that was wrapped for that action.

## UI

Now we're good to go for adding a todo. But we need a UI first. We'll use React-js for building the UI. I won't go into details
on how React works. What we'll do is not too sophisticated but you should be familiar with the basic principles of React in order to follow.

## Basic html

The html is very simple. Create a new file `index.html`:

    <!DOCTYPE html>
    <html>
    <head lang="en">
        <meta charset="UTF-8">
        <title>fluss &amp; react js</title>
        <link rel="stylesheet" href="bower_components/todomvc-common/base.css">
        <script type="text/javascript" src="bower_components/react/react.min.js"></script>
    </head>
    <body>
        <section id="todoapp">
        </section>
    </body>
    </html>


In addition we use bower to add todomvc-commons to get nice styles and React.

    bower install todomvc-common
    bower install react

The rest of the UI will be created using React in Typescript code. We'll not be using JSX fo this tutorial.

## Type definitions for React

Since we're using React with typescript we need to install proper typedefinitions. We use [tsd](https://github.com/DefinitelyTyped/tsd/tree/master).

    tsd query react -a install

## Todo-List Component

We start by creating a todo list component that display the todos in the array-store. Create a new file `ui/todosList.ts`.
(This is some old style React atm. Will update to the new API soon).

Let's first define a component that display a todo. It will receive on property `todo` and we simply display it's properties according to the styles
in TodoMVC.

    var Todo = React.createClass({

        render: function() {
            return React.DOM.li({ className: this.props.todo.completed ? "completed" : ""},
                React.DOM.div({ className: "view" },
                    React.DOM.input({ className: "toggle",
                                      type: "checkbox",
                                      checked: this.props.todo.completed }),
                    React.DOM.label({ }, this.props.todo.title ),
                    React.DOM.button({ className: "destroy"})
                )
            );
        }
    });


Now we define a list component that displays one Todo-Component for every item in our todo-array-store. All nothing special right now.

    export var TodoList = React.createClass({

        render: function() {
            return React.DOM.ul({ id: "todo-list" },
                this.props.todos.map(function(todo, index) {
                    return Todo({ todo: todo, key: index })
                })
            )
        }
    });

## Displaying the list

Import our new component module

    import TodoList = require("./ui/todoList");

In our `application.ts` let's define on last function to get everything going

    function init() {
        var container = document.getElementById("todoapp");
        var app = createApplication();

        Actions.addTodo("Learn some fluss");

        React["renderComponent"](
            React.DOM.header({id: "header"},
                React.DOM.h1({}, "todos"),
                React.DOM.section({ id: "main"},

                    TodoList.TodoList({ todos: app.todos.immutable })

                )), container);
    }

    init();

We get our container from the DOM and initialize the application object. Then for testing purposes we call our new action
to create todos. Then we render our todoList together with some html using React.

Notice how we do not pass the applications todos-store directly but it's immutable proxy. It's always good practice for UI to only
work on immutable application data to not disrupt the data flow flux defines.

After building our app it will display the one todo we created. It cannot do much right now, but we're going to change that. The
boilerplate is done. Now we can add new UIs and new functionality.

## Creating new Todos from the UI

The spec requires us to have an input field for creating a new todo. The new todo shall be created upon enter. Create a new file
`ui/newTodo.ts`

    import Actions = require("../actions");

    export var NewTodo = React.createClass({

        handleInput: function(event) {
            this.setState({ value: event.currentTarget.value })
        },

        handleKeyDown: function(event) {
            if (event.keyCode === 13) {
                Actions.addTodo(this.state.value);
                this.setState({ value: "" });
            }
        },

        getInitialState: function() {
            return { value: ""}
        },

        render: function() {
            return React.DOM.input({ id: "new-todo",
                                     placeholder: "What needs to be done?",
                                     autofocus: "autofocus",
                onChange: this.handleInput, onKeyDown: this.handleKeyDown,
                value: this.state.value })
        }
    });

If you're familiar with React this should all be straight forward. We render a [controlled input component](http://facebook.github.io/react/docs/forms.html#controlled-components)
to keep track of the user input. Then when the user hits ENTER we simply call our `addTodo`-action in `handleKeyDown` and clear the input.

After adding this to the React render call in `application.ts` you can try it out.

    function init() {
        var container = document.getElementById("todoapp");
        var app = createApplication();

        Actions.addTodo("Learn some fluss");

        React["renderComponent"](
            React.DOM.header({id: "header"},
                React.DOM.h1({}, "todos"),

                NewTodo.NewTodo({}),

                React.DOM.section({ id: "main"},
                    TodoList.TodoList({ todos: app.todos.immutable })
                )), container);
    }

You see no change in the UI entering a new todo. If you're using chrome and have the React-Addon installed you can see that the new todo was created.
So it seems we need to update our UI to reflect the new state.

Lets add code in `ui/todoList.ts` to update the UI when a new todo is created.

    export var TodoList = React.createClass({

        componentDidMount: function() {
            var that = this;
            this.props.todos.newItems()
                .forEach(function() {
                    that.forceUpdate();
                })
        },

        // (...)

In `componentDidMount` we simply observe the `newItems` stream of our todos-array and tell the component to re-render.

Now, when you enter a new todo it will be displayed in the list. In reactive programming it is good practice to dispose
a stream when it is not needed anymore. It is the same as unregistering an event handler. So let's improve our solution.

    import Stream = require("fluss/src/stream");

    var componentLifecycle = {

        _willUnmount:null,

        componentDidMount: function() {
            this._willUnmount = Stream.createStream("component-unmount");
        },

        componentWillUnmount: function() {
            this._willUnmount.push(true);
            this._willUnmount.dispose();
        }
    };

We create a new React mixin that provides a stream that will process whenever the component will unmount. Let's use it in our list.

    export var TodoList = React.createClass({

        mixins: [componentLifecycle],              // <-- use the mixin

        componentDidMount: function() {
            var that = this;
            this.props.todos.newItems()
                .forEach(function() {
                    that.forceUpdate();
                }).until(this._willUnmount);        // <-- dispose on unmount
        },

        render: function() {
            return React.DOM.ul({ id: "todo-list" },
                this.props.todos.map(function(todo, index) {
                    return React.createElement(Todo, { todo: todo, key: index })
                })
            )
        }
    });

We simply apply our mixin and add `until(this._willUnmount)` to our stream subscription for newItems. `until` tells the stream
it is called on, that that stream should automatically close/dispose itself when another stream processes an item.


## Completing todos

Let's add functionality to complete a todo.

Define the new action in `actions.ts`

    export enum ACTIONS {
        ADD_TODO,
        COMPLETE_TODO       // the new action
    }


    export function completeTodo(todo) {
        Dispatcher.dispatch(ACTIONS.COMPLETE_TODO, todo);
    }

Implement the plugin for the action in `plugins/todos.ts`

    export class CompleteTodo extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, todo:any) {
            // the given todo may be immutable
            container.todos.item(todo).complete = true;
        }
    }

The action may be invoke from anywhere including the UI. Remeber that the UI should only use immutable stores. So when passing
a store from the UI to an action, that will be immutable (substores of immutable stores are immutable too). The container.todos
on the other hand is the mutable array store holding our todos. The `item`-method returns the mutable item for the given one.
If the value given to `item` is already mutable then you get that value back. So it's safe to call `item` whithout knowing what
kind of item you have.

So we retrieve the mutable version of the item and set it's `completed` flag to true.

After adding the plugin to our application container, the action can be executed from anywhere.

    function createApplication() {
        var app = new Application();

        app.wrap(Actions.ACTIONS.ADD_TODO, new TodoPlugins.AddTodo());
        // Add the new plugin
        app.wrap(Actions.ACTIONS.COMPLETE_TODO, new TodoPlugins.CompleteTodo());

        return app;
    }

Now let's add the required functionality to our UI to use that new action. In `ui/todoList.ts`

    var Todo = React.createClass({

        mixins: [componentLifecycle],      // <-- Use our mixin

        handleToggle: function() {          // <-- Handle the click
            if (!this.props.todo.completed) {
                Actions.completeTodo(this.props.todo);
            }
        },

        componentDidMount: function() {
            var that = this;
            this.props.todo.updates()       // <-- Watch for updates on the todo...
                .forEach(function() {
                    that.forceUpdate();     // <-- and redraw
                }).until(this._willUnmount);
        },

        render: function() {
            return React.DOM.li({ className: this.props.todo.completed ? "completed" : ""},
                React.DOM.div({ className: "view" },
                    React.DOM.input({ className: "toggle",
                                      type: "checkbox",
                                      checked: this.props.todo.completed,
                                      onChange: this.handleToggle
                                    }),
                    React.DOM.label({ }, this.props.todo.title ),
                    React.DOM.button({ className: "destroy"})
                )
            );
        }
    });

We handle the change event on the checkbox and call our action to complete the todo when it is still active. To get UI
to update we subscribe to the updates of the todo and force a redraw on the component. Again we're using the `componentLifecyce`-mixin
we created earlier.

"Uncompleting" a todo should be an easy exercise now. Try it yourself. When you're having problems you can look at the final solution here (link will follow).

The process will look similar from now on. New action, new plugin, integrate trigger, setup streams to update the ui.

## Removing a todo

Declare the new action in `actions.ts`

    export enum ACTIONS {
        ADD_TODO,
        COMPLETE_TODO,
        UNCOMPLETE_TODO,
        REMOVE_TODO
    }

    export function removeTodo(todo) {
        Dispatcher.dispatch(ACTIONS.REMOVE_TODO, todo);
    }

Add the trigger to the UI

    var Todo = React.createClass({

        //(...)

        // Handle the click on the destroy button
        handleDestroy: function() {
            Actions.removeTodo(this.props.todo);
        },

        //(...)
        render: function() {
            return React.DOM.li({ className: this.props.todo.completed ? "completed" : ""},
                    //(...)
                    React.DOM.button({ className: "destroy",
                                       onClick: this.handleDestroy })       // new onClick handler
                )
            );
        }
    });

Implement the plugin in `plugins/todos.ts`

    export class RemoveTodo extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, todo:any) {
            container.todos.splice(container.todos.indexOf(todo), 1);
        }
    }

We don't need the `item()` method because indexOf works on immutable proxies too.

Register the plugin in `application.ts`

    app.wrap(Actions.ACTIONS.REMOVE_TODO, new TodoPlugins.RemoveTodo());

And make the UI update when todos are removed

    export var TodoList = React.createClass({

        mixins: [componentLifecycle],

        componentDidMount: function() {
            var that = this;
            this.props.todos.newItems()
                .forEach(function() {
                    that.forceUpdate();
                }).until(this._willUnmount);

            // New stream subscription for removed items
            this.props.todos.removedItems()
                .forEach(function() {
                    that.forceUpdate();
                }).until(this._willUnmount);
        },

        (...)
    });

## (Un-)Complete all and reflect the state of all todos in the checkbox

The spec requires us to provide a checkbox that

* Let's us complete all todos
* Let's us uncomplete all todos
* Reflect if all todos are completed (checkbox checked)

So we need two actions and the plugins. That's all familiar to us now.

`actions.ts`

    export enum ACTIONS {
        ADD_TODO,
        COMPLETE_TODO,
        UNCOMPLETE_TODO,
        REMOVE_TODO,
        COMPLETE_ALL,
        UNCOMPLETE_ALL
    }

    export function completeAll() {
        Dispatcher.dispatch(ACTIONS.COMPLETE_ALL);
    }

    export function uncompleteAll() {
        Dispatcher.dispatch(ACTIONS.UNCOMPLETE_ALL);
    }

`plugins/todos.ts`

    export class CompleteAll extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, todo:any) {
            container.todos.forEach(function(todo) {
                todo.completed = true;
            })
        }
    }

    export class UncompleteAll extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, todo:any) {
            container.todos.forEach(function(todo) {
                todo.completed = false;
            })
        }
    }

`application.ts`

    function createApplication() {
        var app = new Application();

        //(...)
        app.wrap(Actions.ACTIONS.COMPLETE_ALL, new TodoPlugins.CompleteAll());
        app.wrap(Actions.ACTIONS.UNCOMPLETE_ALL, new TodoPlugins.UncompleteAll());

        return app;
    }

The interesting part is the UI component.

    export var CheckAll = React.createClass({

        mixins: [componentLifecycle],

        calculateAllComplete: function() {
            return this.props.todos.every(function(todo) {
                return todo.completed === true;
            })
        },

        handleChange: function(event) {
            if (event.target.checked) {
                Actions.completeAll();
            } else {
                Actions.uncompleteAll();
            }
        },

        componentDidMount: function() {
            var that = this;
            this.props.todos.newItems()
                .combine(this.props.todos.removedItems())
                .forEach(function() {
                    that.forceUpdate();
                }).until(this._willUnmount);

            this.props.todos.updates().filter(function(update) {
                return update.item === "completed";
            }).forEach(function() {
                that.forceUpdate();
            }).until(this._willUnmount);
        },

        render: function() {
            return React.DOM.input({ id: "toggle-all",
                                     type: "checkbox",
                                     checked: this.calculateAllComplete(),
                                     onChange: this.handleChange})
        }
    });

It renders a checkbox as it's supposed to. The checked-state is calculated by checking if all todos are completed.

As usual we subscribe some streams to force the update on our component. The first is a combination of newItems() and
removedItems(). The second on is an update-stream on the todos-array that filters those that are updates on the completed
flag of a single todo. Remember that updates of substores "bubble" up through the stores and we'll take advantage of that.

