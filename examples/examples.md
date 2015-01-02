# Tutorial

fluss is a framework but it is not fully automatic. It provides the means to establish the data flow. So expect to do
at least some thing by hand.

## Todos - 1

Let's build the todo app as known from [Todo MVC}(http://todomvc.com/). We'll start by laying out what we'll need.

### Data

Of course we'll need a todo. It has a text and a flag that indicates if the todo is already done.

We need a list of todos. That can be an array.


### Actions

Actions are primarily what the user triggers in order for the app to do something. So for the todo app well need the following

* Add a new todo
* Complete a todo
* Uncomplete a todo
* Delete a todo
* Complete all uncompleted todos
* Clear completed todos

### UI

We need

* The input box for the new todo
* A list of todos
* Something to complete all todos
* A todo consisting of
    * The checkbox for un-/completing
    * The text
    * A button for deleting the todo
* An indicator for how many todos are uncompleted
* A button to clear the completed todos

### The application object

We start by creating an application object. This will hold the stores and will be the container for the plugins. Plugins are
objects that encapsulate the functionality of an action optionally including the means to undo/redo that action.

    export class Application extends Plugins.PluginContainer {

        todos:Store.IArrayStore;

        constructor() {
            super("Application");

            this.todos = Store.array();
        }
    }

The super-calls argument is an identifier for the event channel to bind the applications events to this channel. The application has
one property, an array-store holding all todos.

Next we'll need a means to create a new todo.

    export function createTodo(text:string):Store.IRecordStore {
        return Store.record({ text: text, complete: false });
    }

We use a simple function that creates a new record for the todo text.

### Adding a new todo

Now we need a way to add a new todo to our list. This will be our first action and the first plugin we'll implement.

    enum ACTIONS {
        ADD_TODO = BaseActions.firstAction
    }

First we define a new Action ADD_TODO in an enum that will eventually hold all our actions. Enums will become numbers eventually
(and their counterpart for reference) when compiled to Javascipt. fluss defines to global actions to we need to set our first action to a
safe value to prevent clashes.

    class AddTodo extends Plugins.BasePlugin {
        run(container:Application, action:number, text:string) {
            container.todos.push(createTodo(text));
        }
    }

A plugin-implementation implements at max 5 methods the most important being the run method. The container (our application),
the action and an arbitrary number of additional parameters are passed to that method. For our AddTodo-Action we'll expect
the text of the todo to be passed.

#### Adding the plugin to the application

We have defined the plugin but it would not do anything when the action is triggered. We need to add the plugin to the application first.

    function createApplication() {
        var app = new Application();

        app.wrap(ACTIONS.ADD_TODO, new AddTodo());

        return app;
    }

So we 'wrap' an instance of our new plugin around the application object for the ADD_TODO action. This is called wrapping because
more than one plugin can ba wrapped around the plugin for any action and these plugins then will all be executed one after the other
for that action beginning with the last plugin that was wrapped for that action.

### UI

Now we're god to go for adding a todo. But we need a UI first. We'll use React-js for building the UI.

#### Basic html




