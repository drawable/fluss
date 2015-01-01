# Tutorial

fluss is a framework but it is not fully automatic. It provides the means to establish the data flow. So expect to do
at least some thing by hand.

## Todos - 1

Let's build the todo app as known on TodosMVC. We'll start by laying out what we'll need.

### Data

Of course we'll need a todo. It has a text and a flag that indicates if the todo is already done.

We need a list of todos. That can be an array.


### Actions

Actions are primarily what the user triggers in order for the app to do something. So for the todo app well need the following

* Add a new todo
* Complete a todo
* Uncomplete a todo
* Delete a todo
* Complete all uncompleted todos
* Clear completed todos

### UI

We need

* The input box for the new todo
* A list of todos
* A todo consisting of
** The checkbox for un-/completing
** The text
** A button for deleting the todo
* An indicator for how many todos are uncompleted
* A button to clear the completed todos


