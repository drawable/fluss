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

**fluss** can be compiled to create either amd or commonjs modules.

## Stability

Be careful. This is beta software. APIs may change. There are bugs!

## Browser compatibility

**fluss** uses ES5 features so you need a modern browser. It is tested on the latest Firefox (33+), Chrome (37+) and
IE 10. It should work for ChromeApps, in NodeWebkit, Atomshell and the likes.

## Installation

    npm install **fluss**

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
        todos: Store.array()
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


## A full example

Please see the [tutorial](examples/tutorial.md).

## Building

You need [node](http://nodejs.org/), [NPM](https://www.npmjs.com), [Typescript](http://www.typescriptlang.org/)
[Gulp](http://gulpjs.com/) and [Mocha](http://mochajs.org/) installed globally.

Checkout the whole thing from github. Go to the directory and do an

    npm install

Now you should be able to compile the typescript with

    gulp compile-tsc

and run the tests with

    npm test

or

    mocha


## Why reinvent the wheel?

Most importantly it is fun to write. It's an exploration of concepts and ideas.

**fluss** is the result of both an ambitious project as well as a learning experience. Very good implementations for reactive
programming exist ([BaconJS](https://baconjs.github.io/), [kefir.js](http://pozadi.github.io/kefir/), [RxJS](https://github.com/Reactive-Extensions/RxJS))
but to completely wrap my head around reactive programming I wanted to implement my own thing.

## License

[MIT](LICENSE)
