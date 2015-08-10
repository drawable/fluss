/**
 * Created by Stephan on 22.02.2015.
 */

/**
 * Base implementation for a plugin. Does absolutely nothing.
 */
export default class Plugin {
    run(container, action, ...args) {}
    afterFinish(container, action, ...args) {}
    afterAbort(container, action, ...args) {}

    getMemento(container, action, ...args) {
        return null;
    }

    undo(container, memento) {}
    hold() {}
    release(action) {}
    abort(action) {}
}

