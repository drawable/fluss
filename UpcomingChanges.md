# What you read here is not released yet. It's just a list of reminder of what to put in the Readme.

### 0.4.0
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
