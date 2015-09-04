/**
 * Created by Stephan on 24.02.2015.
 */

import * as Store from '../src/Store';
import {expect} from 'chai';


describe("Record stores", function () {
        it("can hold values, that can be retrieved and set", function() {
            var store = Store.record();

            store.addItem("a", 1);
            store.addItem("b", "lkjh");
            store.addItem("c", {a: 12, b: 32});

            expect(store.a).to.equal(1);
            expect(store.b).to.equal("lkjh");
            expect(store.c.a).to.equal(12);
            expect(store.c.b).to.equal(32);

        });

        it("provide streams to keep track of updates and property changes", function () {
            var calls = "";

            var store = Store.record();

            store.addItem("a", 1);
            store.addItem("b", "lkjh");

            var updates = store.updates;
            updates.forEach(function (value) {
                calls += "(" + value.item + "=" + value.value + ")";
            });

            var newProps = store.newItems.forEach(function (value) {
                calls += "*" + value.item + "=" + value.value + "*"
            });

            var removeProps = store.removedItems.forEach(function (value) {
                calls += "!" + value.item + "!";
            });

            store["a"] = 2;
            store.b = "x";
            store.addItem("c", 43);
            store.removeItem("a");

            expect(calls).to.equal("(a=2)(b=x)*c=43*!a!");
        });

        it("provides a stream that processes on all change types", function() {
            var record = Store.record({
                a: 1
            });

            var calls = "";
            record.allChanges.forEach((update) => {
                calls += "(" + update.item + "=" + update.value + ")"
            });
        });

        it("can be initialized upon creation", function () {
            var store = Store.record({
                a: 1,
                b: "lkjh"
            });

            expect(store["a"]).to.equal(1);
            expect(store["b"]).to.equal("lkjh");
        });

        it("will create nested stores when given a nested object as initial value - 1", function () {
            var store = Store.record({
                a: 1,
                b: "lkjh",
                sub: {
                    x: 12,
                    y: 32
                }
            });

            expect(Store.isStore(store)).to.be.ok;
            expect(Store.isStore(store["sub"])).to.be.ok;
            expect(typeof store["sub"].addItem).to.equal("function");

        });

        it("will create nested stores when given a nested object as initial value - 2", function () {
            var store = Store.record({
                a: 1,
                b: "lkjh",
                sub: [1, 2, 3]
            });

            expect(Store.isStore(store)).to.be.ok;
            expect(Store.isStore(store["sub"])).to.be.ok;
            expect(typeof store["sub"].push).to.equal("function");
        });

        it("will create nested stores when given a nested object as initial value - 3", function () {
            var store = Store.record({
                a: 1,
                b: "lkjh",
                sub: [1, 2, { x: 10 }]
            });

            expect(Store.isStore(store)).to.be.ok;
            expect(Store.isStore(store["sub"])).to.be.ok;
            expect(Store.isStore(store["sub"][2])).to.be.ok;

            var calls = {};
            var updates = store.updates;
            updates.forEach(function(update) {
                calls[update.path] = update.value;
            });

            store["sub"][2]["x"] = 20;

            expect(calls["sub.2.x"]).to.equal(20);
        });

        it("provide a immutable proxy that supports all reading methods including the streams for update, new items and removed items", function() {
            var store = Store.record({ a: 1, b: "x"} );
            var imm = store.immutable;
            var calls = {};

            imm.updates.forEach(function(update) {
                calls[update.item] = update.value;
            });

            imm.newItems.forEach(function(update) {
                calls[update.item] = update.value;
            });

            imm.removedItems.forEach(function(update) {
                calls[update.item] = update.value;
            });

            expect(store.a).to.equal(imm.a);
            expect(store.b).to.equal(imm.b);

            store.a = 12;
            expect(store.a).to.equal(imm.a);
            expect(calls["a"]).to.equal(12);

            store.removeItem("b");
            expect(calls["b"]).to.equal(null);

            store.addItem("z", 42);
            expect(calls["z"]).to.equal(42);
            expect(store.z).to.equal(imm.z);

            imm.a = 100;
            expect(store.a).to.equal(imm.a);
            expect(imm.a).to.equal(12);
        });

        it("will return immutable substores by it's immutable proxy", function() {
            var store = Store.record();
            var sub = Store.record({ a: 1 });
            store.addItem("sub", sub);

            var imm = store.immutable;
            expect(Store.isStore(store["sub"])).to.be.ok;
            expect(imm.isImmutable).to.be.ok;
            expect(imm["sub"].isImmutable).to.be.ok;
        });

        it("will have immutable stores that don't fuck up", () => {
            var store = Store.record({sub: Store.record()});
            var imm = store.immutable;

            store.sub.addItem("a", 10);

            expect(imm.sub.a).to.equal(10);
            expect(imm.hasOwnProperty("a")).to.be.not.ok;
        })

        it("provides an item object that can be used to work with a single value", () => {
            var store = Store.record({
                a: 12,
                b: null
            });

            var a = store.item("a");
            var b = store.item("b");

            expect(a.value).to.equal(12);
            expect(b.value).to.equal(null);

            b.value = "lökjh";
            expect(b.value).to.equal("lökjh");

        });

        it("can be disposed and will delete all data and dispose all streams", function() {
            var closes = [];
            var store = Store.record({ a: 1, b: "x"} );

            store.updates.onClose(function () {
                closes.push("U");
            });
            store.newItems.onClose(function () {
                closes.push("N");
            });
            store.removedItems.onClose(function () {
                closes.push("R");
            });
            store.isDisposing.onClose(function () {
                closes.push("D");
            });

            store.dispose();
            expect(closes).to.include("R");
            expect(closes).to.include("U");
            expect(closes).to.include("N");
            expect(closes).to.include("D");
            expect(store["a"]).to.be.undefined;
        });
});