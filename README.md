fluss
=====

fluss is an opinionated Typescript application framework for the frontend and the backend. It is based on the flux pattern
and establishes a unidirectional flow of data through the application. fluss can be used with javascript as well of course
but it uses subclassing for some things and enums are a bliss for events and actions.

## What it provides

* Actions. Really simple at the moment. You need to provide the functions yourself or call a generic dispatcher function.
* Streams: A simple stream implementation for reactive paradigms.
* Stores: An implementation of record stores and array stores for keeping application state. These provide reactive streams for updates. Stores can be nested.
* A Plugin-System that allows the developer to encapsulate the functionality in plugins. Provides an implementation of the memento pattern for full undo/redo support
* EventEmitter

## What it uses

* CommonJS modules.
* Browserify

## Why did you implement stuff again instead of reusing existing frameworks

I developed fluss as a learning project. To understand reactive patterns I implemented the streams.


## How to get started

Please see the [tutorial](examples/tutorial.md).

## Beta

Be careful. This is beta software. APIs may change.




