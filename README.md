fluss
=====

fluss is opinionated JavaScript application framework for the frontend and the backend. It is based on the flux pattern
that uses a unidirectional flow of data through the application.


## What it provides

* EventEmitter
* Action-Dispatcher
* A Plugin-System that allows the developer to encapsulate the functionality in plugins. Provides an implementation of the memento pattern for full undo/redo support
* Streams: A simple stream implementation for reactive paradigms.
* Stores: An implementation of record stores and array stores for keeping application state. These provide reactive streams for updates. They can be nested.

## Why did you implement stuff instead of reusing existing frameworks

I did this mainly for learning purposes. To understand reactive patterns I implemented the streams. I wanted something lightweight.

## Beta

Be careful. This is beta software. APIs may change.




