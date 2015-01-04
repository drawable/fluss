## Todos - Step 1. The standard application

The [TodoMVC specification](https://github.com/tastejs/todomvc/blob/master/app-spec.md) tells us everything we need.

### Data

Of course we'll need a todo. It has the following fields

* ID
* Title
* Completed flag

We need a list of todos. That will be an array.

The data we'll create needs to be stored in local storage.

### Actions

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


### UI

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

### Preparation

Create a new project like you use to do. Install fluss

    npm install fluss

### The application object

We start by creating an application object. This will hold the stores and will be the container for the plugins. Plugins are
objects that encapsulate the functionality of an action optionally including the means to undo/redo that action. Create a
file `application.ts`.

    import Plugins = require("../../src/plugins");
    import Store = require("../../src/store");

    export class Application extends Plugins.PluginContainer {

        todos:Store.IArrayStore;

        constructor() {
            super();

            this.todos = Store.array();
        }
    }

The application has one property, an array-store holding all todos.


### Adding a new todo

Now we need a way to add a new todo to our list. This will be our first action and the first plugin we'll implement. Create a
new file actions.ts

    import Dispatcher = require("../../src/dispatcher");
    import BaseActions = require("../../src/baseActions");

    enum ACTIONS {
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

    import Plugins      = require("../../../src/plugins");
    import Application  = require("../application");
    import Store        = require("../../../src/store");

    export class AddTodo extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, title:string) {
            container.todos.push(Store.record({ title: title, completed: false }));
        }
    }

At the moment the `run` method is all we need. Besides the container (our application) and the action we expect the text
of the todo to be passed. When the action is executed we simply create a new record store and push it to the list of todos.

#### Adding the plugin to the application

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

### UI

Now we're good to go for adding a todo. But we need a UI first. We'll use React-js for building the UI. I won't go into details
on how React works. What we'll do is not too sophisticated but you should be familiar with the basic principles of React in order to follow.

#### Basic html

The html is very simple. Create a new file `index.html`:

    <!DOCTYPE html>
    <html>
    <head lang="en">
        <meta charset="UTF-8">
        <title>fluss &amp; react js</title>
        <link rel="stylesheet" href="../bower_components/todomvc-common/base.css">
        <script type="text/javascript" src="../bower_components/react/react.min.js"></script>
    </head>
    <body>
        <section id="todoapp">
        </section>
    </body>
    </html>

The rest of the UI will be created using React in Typescript code. We'll not be using JSX fo this tutorial.




