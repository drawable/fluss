fluss
=====

fluss is an opinionated application framework for the frontend and the backend. It is an interpretation of the
[flux architecture](http://facebook.github.io/flux/) that establishes a unidirectional flow of data through the application.

fluss is written in Typescript. It can be used on the frontend and on the backend. fluss is written with views developed
in React in mind but has no dependencies to React. Using a different view layer technology is of course possible.

## Main features

* Streams: A simple stream implementation for reactive programming.
* Stores: An implementation of record stores and array stores for keeping application state.
  These provide reactive streams for updates. Stores can be nested. They provide an
  immutable proxy.
* Actions. Really simple. You need to provide the functions yourself or call a generic dispatcher function.
* A Plugin-System that allows the developer to encapsulate the functionality behind an action in one class. It provides an
  implementation of the memento pattern for full undo/redo support, the use of multiple plugins for the same action and
  the use of plugins to run on every action (great for protocols).

## Modules

fluss uses CommonJS modules to ease the transition from the frontend to the backend.

## Getting started

### Create stores ...

    var todos = Store.array();
    todos.push(Store.record( { id: 0, title: "learn fluss...", completed: false } );

    todos.forEach(function(todo) {
        console.log(todo.title + " is " + (todo.completed ? "done" : "active"));
    });

### ... and use streams to observe changes

    todos.updates()
         .filter(function(update) {
            return update.item === "completed";
         })
         .forEach(function(update) {
            console.log(update.store.title +
                        " was " + (update.value ? "completed" : "opened"));
         ));

    todos[0].completed = true;

### Create a plugin...

    class AddTodo extends Plugins.BasePlugin {
        run(container:Application.Application, action:number, title:string) {
            container.todos.push(Store.record({ title: title, completed: false }));
        }
    }

### ... add it to your application...

    var NEW_TODO:number = 1000;
    application.wrap(NEW_TODO, new AddTodo());

### ... and execute the action

    Dispatcher.dispatch(NEW_TODO, "... and make an awesome app with it");



## A full example

Please see the [tutorial](examples/tutorial.md).

## Why reinvent the wheel?

Most importantly it was fun to write.

fluss is the result of both an ambitious project as well as a learning experience. Very good implementations for reactive
programming exist ([BaconJS](https://baconjs.github.io/), [kefir.js](http://pozadi.github.io/kefir/), [RxJS](https://github.com/Reactive-Extensions/RxJS), )
but to completely wrap my head around these I wanted to implement my own version (which is very lightweight
and can and will not compete with existing frameworks in regards of features).

I tried to come up with simple implementations for the different modules. The reactive streams are less than 500 sloc
at the moment, the stores are less than 800 sloc.


## Stability

Be careful. This is beta software. APIs may change.




