fluss
=====

**fluss** is an application framework for the frontend and the backend. It is an interpretation of the
[flux architecture](http://facebook.github.io/flux/) that establishes a unidirectional flow of data through the application.

**fluss** is written in ES6. Views created with [React](http://facebook.github.io/react/) are the target but **fluss**
has no dependencies whatsoever to React. Using other view technologies is possible.

## Contact

Reach me on Twitter [@drawableIO](https://twitter.com/drawableio)

## Main features

* Streams: A simple stream implementation for reactive programming.
* Stores: An implementation of record stores and array stores for keeping application state.
  These provide reactive streams for updates. Stores can be nested. Stores provide an
  immutable proxy.
* Domains. They define a closed set of stores and actions. You can create several.
* Actions. Really simple. You need to provide the functions yourself or call a generic execution function on the domain.
* Plugins. Encapsulate all you need to perform an action and revert an action in one place.

## Modules

The npm module of **fluss** provides commonjs.

## Stability

This is beta software. I am still figuring out how things are best implemented so APIs and behavior may change. Bugs are likely,
but there are some [tests](test).

## Browser compatibility

**fluss** is compiled to ES5 so you need a modern browser. It is tested on the latest Firefox (33+), Chrome (37+) and
IE 10. It should work for ChromeApps, in NodeWebkit, Atomshell and the likes.

## Installation

**This will get you the Typescript version atm**. If you want the current ES6 development version please clone this
repository and [build](https://github.com/drawable/fluss#building) it.

    npm install fluss

See [fluss-npm-module-usage](https://github.com/drawable/fluss-npm-module-usage) on how to setup your project in various ways.

## Getting started

Use **fluss** in ES6

    import Fluss from 'fluss'

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

Create a domain to bundle state and action behaviour

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

Please see the [tutorial](examples/tutorial.md). Attention: This is still based on the Typescript version. It also misses
the latest changes, like the introduction of the domain object.

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
[separating UI state from Application state](http://blog.drawable.de/2015/02/27/double-flux-separating-ui-state-from-application-state/).



## Building

You need [node](http://nodejs.org/), [NPM](https://www.npmjs.com), [Babel](http://babeljs.io/),
[Gulp](http://gulpjs.com/) and [Mocha](http://mochajs.org/) installed globally.

Checkout the whole thing from github

    git clone git://github.com/drawable/fluss.git

Go to the directory and do an

    npm install

Now you should be able to compile the typescript with

    gulp compile

and run the tests with

    npm test

or

    mocha

Building the npm module is done using

    gulp module-build

It creates a directory `build` with everything in it.

## Changelog

### 0.4.0
This release ist not backwards compatible!

Converted from Typescript to ES6.

In order to simplify the API this contains breaking changes:
* Stream.createStream is now Stream.create
* The streamprovider is now in it's own submodule.
* Stream.createStreamProvider is now StreamProvider.create
* There is no dispatcher anymore. Instead of a singleton dispatching actions globally use Domain instances
* Plugins.BasePlugin is now it's own module Plugin
* Plugins.Container is now it's own module Domain. It is completely rewritten into a simpler implementation
  and handles action execution and undo handling itself
* Instead of Dispatcher.dispatchAction use aDomainInstance.execute
* There is no UndoManager anymore.



### 0.3.5
* Added: Stream.throttle, Stream.debounce, Stream.buffer
* API-Docs using [TypeDoc](http://typedoc.io/)

### 0.3.4
* Fixed issues with AMD where multiple usages of the module would lead to multiple module instances

### 0.3.3
* Proper library bindings for Typescript enabling development in AMD and CommonJS

## License

[MIT](LICENSE)

Copyright &copy; 2014, 2015 Stephan Smola

