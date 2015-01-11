fluss
=====

**fluss** is an opinionated application framework for the frontend and the backend. It is an interpretation of the
[flux architecture](http://facebook.github.io/flux/) that establishes a unidirectional flow of data through the application.

It can be used on the frontend and on the backend.

**fluss** is written in Typescript but it can be used in JavaScript as well. Views created with
[React](http://facebook.github.io/react/) are the target but **fluss** has no dependencies
whatsoever to React. Using other view technologies is possible.

## Main features

* Streams: A simple stream implementation for reactive programming.
* Stores: An implementation of record stores and array stores for keeping application state.
  These provide reactive streams for updates. Stores can be nested. Stores provide an
  immutable proxy.
* Actions. Really simple. You need to provide the functions yourself or call a generic dispatcher function.
* A Plugin-System that allows the developer to encapsulate the functionality behind an action in one class. It provides an
  implementation of the memento pattern for full undo/redo support, the use of multiple plugins for the same action and
  the use of plugins to run on every action.

## Modules

**fluss** can be compiled to create either amd or commonjs modules. The npm module provides both.

## Stability

Be careful. This is beta software. APIs may change. There are bugs!

## Browser compatibility

**fluss** uses ES5 features so you need a modern browser. It is tested on the latest Firefox (33+), Chrome (37+) and
IE 10. It should work for ChromeApps, in NodeWebkit, Atomshell and the likes.

## Installation

    npm install fluss

See [fluss-npm-module-usage](https://github.com/drawable/fluss-npm-module-usage) on how to setup your project in various ways.

## Getting started

Create stores ...

    var todos = Store.array();
    todos.push(Store.record( { title: "learn **fluss**...", completed: false } );
    todos[0].complete = true;

    todos.forEach(function(todo) {
        console.log(todo.title + " is " + (todo.completed ? "done" : "active"));
    });

Stores are reactive ...

    todos.newItems
         .forEach(function(update) {
            console.log(update.value.title + " was added");
         ));

    todos.push(Store.record( { title: "make coffee...", completed: false } ));

    // The console now reads
    //  make coffee... was added

Filtered (and mapped) stores are even more reactive (within limits)...

    // todos may hold:
    //  { title: "learn fluss...", completed: true }
    //  { title: "make coffee...", completed: false }

    completed = todos.filter(function(item) {
        return item.completed;
    })

    completed.newItems.forEach(function(update) {
        console.log(update.value.title + " was completed!");
    });

    // completed now holds
    //  { title: "learn fluss...", completed: true }

    todos[1].completed = true;

    // completed now holds:
    //  { title: "learn fluss...", completed: true }
    //  { title: "make coffee...", completed: true }
    //
    // And the console reads
    //  make coffee... was completed!
(This is only guranteed to work when the filter-callback only uses the value for calculations and ignores the index
    or array parameters. If these are used, the result is likely to be undefined and wrong. For these cases the behaviour
    can be disabled).

Create a container for plugins

    // In Typescript
    class Application extends Plugins.PluginContainer {

        todos:Store.IArrayStore;

        constructor() {
            super();
            this._todos = Store.array();
    }

    // In JavaScript
    var Application = Plugins.createContainer({
        todos: null,

        constructor: function() {
            this.todos = Store.array();
        }
    })

    var application = new Application();

Create a plugin...

    // In Typescript
    class AddTodo extends Plugins.BasePlugin {

        run(container:Application.Application, action:number, title:string) {
            container.todos.push(Store.record({ title: title, completed: false }));
        }
    }


    // In Javascript
    var AddTodo = Plugins.createPlugin({
        run(container, action, title) {
            container.todos.push(Store.record({ title: title, completed: false }));
        }
    });

... add it to your container...

    var NEW_TODO:number = 1000;                     // Better use enums ;-)
    application.wrap(NEW_TODO, new AddTodo());

... and execute the action

    Dispatcher.dispatch(NEW_TODO, "... and make an awesome app with it");

You can create a nicely typed function for that

    function newTodo(title:string) {
        Dispatcher.dispatch(NEW_TODO, "... and make an awesome app with it");
    }

Extend your plugin to support UNDO/REDO

        class AddTodo extends Plugins.BasePlugin {
            run(container:Application.Application, action:number, title:string) {
                container.todos.push(Store.record({ title: title, completed: false}));
            }

            getMemento(container:Application.Application,
                       action:number, title:string):Dispatcher.IMemento {
                return Dispatcher.createMemento(null, { index: container.todos.length })
            }

            restoreFromMemento(container:Application.Application,
                               memento:Dispatcher.IMemento) {
                container.todos.remove(memento.data.index, 1);
            }
        }

... and now you can undo actions

    // Create a new Todo
    Dispatcher.dispatch(NEW_TODO, "Never do unit tests again");

    // Reconsider... and undo your last action
    Dispatcher.dispatch(BaseActions.ACTIONS.UNDO);

## A full example

Please see the [tutorial](examples/tutorial.md).

## Differences to the original flux and other implementations

I don't know all implementations of flux so not all may apply to every implementation.

### Actions are just IDs

You do not create an action object or anything. The reason for this lies in the ambiguous signature that leads to. Even for JavaScript
modern IDEs do a great job a code completion and hinting the developer on the usage of functions and their parameters. From a interface
perspective these generated actions are anonymous and the IDE cannot help you in telling the developer about which parameters the action
expects. This is even more relevant in a Typescript Environment where the IDE has very valid information for code completion.

Therefore right now actions are just IDs (numbers) and the developer can provide a dedicated function with an explicit signature to trigger
the action. To some this might seem a bit tedious and they're right. In the tutorial you have to edit three files to add a new action: The file that
provides all actions, the implementation of the plugin and the creation of the application that wraps the new plugin for the action. But it is all
about maintainability and end ease of use of the actions for the developer.

### There are no events

No event emitter in the classical sense is used. Change notifications from stores to the UI (or whomever) are transported using reactive streams.

Reactive programming seems like a natural fit for React UIs - not because of the similarities in names - but because React let's us so stupidly rerender
our UI whenever something changes and then does an excellent job determining what updates the DOM really needs.

There still is an implementation of an emitter and even an event channel that enables the subscription of events without knowing the emitting object.
With the introduction of the reactive streams these are obsolete and maybe are removed in a future version.

Of course one can regard the subscription to a stream using `forEach` the same as subscribing to an event.

### Immutable store proxies enforce the direction of data flow

The immutable store actively prevents it's user from changing the store data. When it is used in the UI it will enforce the dataflow that is at
the heart of flux.

### The store does not know the actions

The store just stores data - nothing else. Handling the actions is done in the plugin. Tha plugin manipulates the data in the store. The plugin even
knows how to undo the action, i.e. what data changes to apply to get to an earlier state.


## Building

You need [node](http://nodejs.org/), [NPM](https://www.npmjs.com), [Typescript](http://www.typescriptlang.org/)
[Gulp](http://gulpjs.com/) and [Mocha](http://mochajs.org/) installed globally.

Checkout the whole thing from github

    git clone git://github.com/drawable/fluss.git

Go to the directory and do an

    npm install

Now you should be able to compile the typescript with

    gulp compile-tsc

and run the tests with

    npm test

or

    mocha

Building the npm module is done using

    gulp build

It creates a directory `build` with everything in it.

## Why reinvent the wheel?

Most importantly it is fun to write. It's an exploration of concepts and ideas.

**fluss** is the result of both an ambitious project as well as a learning experience. Very good implementations for reactive
programming exist ([BaconJS](https://baconjs.github.io/), [kefir.js](http://pozadi.github.io/kefir/), [RxJS](https://github.com/Reactive-Extensions/RxJS))
but to completely wrap my head around reactive programming I wanted to implement my own thing.

## License

[MIT](LICENSE)

Copyright &copy; 2014 Stephan Smola
