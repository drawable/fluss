fluss
=====

**fluss** is a application framework for the frontend and the backend. It is an interpretation of the
[flux architecture](http://facebook.github.io/flux/) that establishes a unidirectional flow of data through the application.

It can be used on the frontend and on the backend.

**fluss** is written in ES6. Views created with [React](http://facebook.github.io/react/) are the target but **fluss**
has no dependencies whatsoever to React. Using other view technologies is possible.


**I am currently converting fluss from Typescript to ES6 and refactor some parts of it significantly. Info below may not be up to date.**

## Contact

Reach me on Twitter [@drawableIO](https://twitter.com/drawableio)

## Main features

* Streams: A simple stream implementation for reactive programming.
* Stores: An implementation of record stores and array stores for keeping application state.
  These provide reactive streams for updates. Stores can be nested. Stores provide an
  immutable proxy.
* Domains. They define a closed set of stores and actions. You can create several.
* Actions. Really simple. You need to provide the functions yourself or call a generic dispatcher function.
* Plugins. Encapsulate all you need to perform an action and revert an action in one place.

## Modules

**fluss** can be compiled to create either AMD or CommonJS modules. The npm package provides both.

## Stability

This is beta software. APIs may change. Bugs are likely although there are [tests](test).

## Browser compatibility

**fluss** is compiled to ES5 so you need a modern browser. It is tested on the latest Firefox (33+), Chrome (37+) and
IE 10. It should work for ChromeApps, in NodeWebkit, Atomshell and the likes.

## Installation

(This will get you the Typescript version atm).

    npm install fluss

See [fluss-npm-module-usage](https://github.com/drawable/fluss-npm-module-usage) on how to setup your project in various ways.

## Getting started

Create stores ...

    var todos = Fluss.Store.array();
    todos.push(Fluss.Store.record( { title: "learn fluss...", completed: false } );
    todos[0].complete = true;

    todos.forEach(function(todo) {
        console.log(todo.title + " is " + (todo.completed ? "done" : "active"));
    });

Stores are reactive ...

    todos.newItems
         .forEach(function(update) {
            console.log(update.value.title + " was added");
         ));

    todos.push(Fluss.Store.record( { title: "make coffee...", completed: false } ));

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

Create a domain for plugins

    class Application extends Fluss.Domain {

        constructor() {
            super();
            this._todos = Fluss.Store.array();
    }

Create a plugin...

    class AddTodo extends Fluss.Plugin {

        run(domain, action, title) {
            domain.todos.push(Fluss.Store.record({ title: title, completed: false }));
        }
    }

... add it to your container...

    var NEW_TODO:number = 1000;                     // Better use enums ;-)
    application.wrap(NEW_TODO, new AddTodo());

... and execute the action

    application.execute(NEW_TODO, "... and make an awesome app with it");

Extend your plugin to support UNDO/REDO

        class AddTodo extends Fluss.Plugin {
            run(domain, action, title) {
                domain.todos.push(Fluss.Store.record({ title: title, completed: false}));
            }

            getMemento(domain, action) {
                return container.todos.length
            }

            restoreFromMemento(domain, memento) {
                container.todos.remove(memento, 1);
            }
        }

... and now you can undo actions

    // Create a new Todo
    domain.execute(NEW_TODO, "Never do unit tests again");

    // Reconsider... and undo your last action
    domain.undo();

## A full example

Please see the [tutorial](examples/tutorial.md).

## Differences to the original flux and other implementations

I don't know all implementations of flux so not all may apply to every implementation.

### There are no events

No event emitter in the classical sense is used. Change notifications from stores to the UI (or whomever) are transported using reactive streams.
Reactive programming seems like a natural fit for React UIs - not because of the similarities in names.


### The store does not know the actions

The store just stores data - nothing else. Handling the actions is done in the plugin. The plugin manipulates the data in the store. The plugin even
knows how to undo the action, i.e. what data changes to apply to get to an earlier state.

### No singleton dispatcher

There are other implementations that do this as well. Basically you can create a domain, that defines the data and the actions that are performed
on that data. Actions are executed on the domain. This allows you to have multiple domains in your application. Most relevant use case is
separating UI state from Application state.


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

## Changelog

### 0.3.5
* Added: Stream.throttle, Stream.debounce, Stream.buffer
* API-Docs using [TypeDoc](http://typedoc.io/)

### 0.3.4
* Fixed issues with AMD where multiple usages of the module would lead to multiple module instances

### 0.3.3
* Proper library bindings for Typescript enabling development in AMD and CommonJS

## License

[MIT](LICENSE)

Copyright &copy; 2014 Stephan Smola
