/**
 * Created by Stephan on 23.06.2015.
 */

import * as Store from '../src/Store';
import {expect} from 'chai';


describe("Stacked record store", () => {

    it("can be created", () => {
        let store = Store.record({ a: 1});
        let stack = Store.stackedRecord(store)
    });


    it("has all values the parent has", () => {
        let store = Store.record({ a: 1});
        let stack = Store.stackedRecord(store);

        expect(stack.a).to.equal(1);
    });

    it("has its own values", () => {
        let store = Store.record({ a: 1});
        let stack = Store.stackedRecord(store);

        stack.addItem("b", 2);

        expect(stack.a).to.equal(1);
        expect(stack.b).to.equal(2);
    });

    it("can mask values of it's parent", () => {
        let store = Store.record({ a: 1});
        let stack = Store.stackedRecord(store);

        expect(stack.a).to.equal(1);

        stack.addItem("a", 2);

        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(2);

        stack.removeItem("a");
        expect(stack.a).to.equal(1);
        expect(store.a).to.equal(1);
    });

    it("can be initialized", () => {
        let store = Store.record({ a: 1});
        let stack = Store.stackedRecord(store, { b: 2 });

        expect(stack.a).to.equal(1);
        expect(stack.b).to.equal(2);

        stack.addItem("a", 2);

        expect(store.b).to.not.be.ok;
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(2);

        stack.removeItem("a");
        expect(stack.a).to.equal(1);
        expect(store.a).to.equal(1);
    });

    it("works with nested stores as well", () => {
        let arr = Store.array();
        let store = Store.record({ a: arr});
        let stack = Store.stackedRecord(store);

        let calls = 0;

        stack.newItems
            .filter( ({store}) => store === arr)        // We only care for the pushes
            .forEach(() => {
            calls += 1;
        });

        arr.push(1);
        expect(calls).to.equal(1);

        stack.addItem("a", 1);
        arr.push(1);
        expect(calls).to.equal(1);

        stack.removeItem("a");
        arr.push(1);
        expect(calls).to.equal(2);

        store.addItem("b", 12);
        expect(store.b).to.equal(12);
        expect(stack.b).to.equal(12);

        store.removeItem("b");
        expect(store.b).not.to.be.ok;
        expect(stack.b).not.to.be.ok;
        expect(stack.hasItem("b")).to.be.false;
    });

    it("works with nested records as well", () => {
        let store = Store.record({ subStore: Store.record() });
        let stack = Store.stackedRecord(store.immutable);
        let iStack = stack.immutable;

        store.subStore.addItem("a", 10);

        expect(store.subStore.a).to.equal(10);
        expect(stack.subStore.a).to.equal(10);

        let subStore = iStack.subStore;
        expect(subStore.a).to.equal(10);


        stack.subStore.a = 11;

        expect(store.subStore.a).to.equal(11);
        expect(stack.subStore.a).to.equal(11);
    });

    it("creates the correct item for an item", () => {
        let store = Store.record({ a: 1 });
        let stack = Store.stackedRecord(store);
        let a = stack.item("a");

        expect(a.value).to.equal(1);

        stack.addItem("a", 2);

        expect(store.a).to.equal(1);
        expect(a.value).to.equal(2);

        stack.removeItem("a");
        expect(a.value).to.equal(1);
        expect(store.a).to.equal(1);
    });


    it("creates the correct item for an item that is a store", () => {
        let arr = Store.array();
        let store = Store.record({ a: arr});
        let stack = Store.stackedRecord(store);
        let a = stack.item("a");

        arr.push(1);
        expect(a.value.length).to.equal(1);


        stack.addItem("a", 1);
        arr.push(1);
        expect(a.value).to.equal(1);

        stack.removeItem("a");
        arr.push(1);
        expect(a.value.length).to.equal(3);
    });

    it("creates the correct item from the immutable as well", () => {
        let store = Store.record({ a: 1 });
        let stack = Store.stackedRecord(store.immutable);
        let iStack = stack.immutable;

        let a = iStack.item("a");
        expect(a.isStore).to.be.ok;
        expect(a.updates).to.be.ok;

        var called = 0;
        a.updates.forEach( value => called++ );

        expect(a.value).to.equal(1);

        expect(called).to.equal(0);
        store.a = 3;
        expect(called).to.equal(1);

        stack.addItem("a", 2);

        expect(store.a).to.equal(3);
        expect(a.value).to.equal(2);

        stack.removeItem("a");
        expect(a.value).to.equal(3);
        expect(store.a).to.equal(3);
    });

    it("can be stacked using another stack", () => {
        let store = Store.record({ a: 1 });
        let stack = Store.stackedRecord(store);
        let stack2 = Store.stackedRecord(stack);

        expect(stack.a).to.equal(1);
        expect(stack2.a).to.equal(1);

        stack.addItem("a", 2);
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(2);
        expect(stack2.a).to.equal(2);

        stack.removeItem("a");
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(1);
        expect(stack2.a).to.equal(1);

        stack2.addItem("a", 2);
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(1);
        expect(stack2.a).to.equal(2);

        stack.addItem("a", 3);
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(3);
        expect(stack2.a).to.equal(2);

        stack2.removeItem("a");
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(3);
        expect(stack2.a).to.equal(3);

        stack.removeItem("a");
        expect(store.a).to.equal(1);
        expect(stack.a).to.equal(1);
        expect(stack2.a).to.equal(1);
    });

    it("supports changing values through the store", () => {
        let store = Store.record({ a: 1 });
        let stack = Store.stackedRecord(store.immutable);
        let iStack = stack.immutable;

        let item = iStack.item("a");

        store.a = "2";

        expect(item.value).to.equal("2")
    })
});