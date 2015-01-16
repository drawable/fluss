/// <reference path="../types/mocha.d.ts" />
/// <reference path="../types/chai.d.ts" />
/// <reference path="../build/fluss.d.ts" />
/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

import chai = require("chai");
var expect = chai.expect;


declare function require(module:string):any;
var Fluss:any = require("../build/index");


describe("Data stores", function () {
    describe("come as object stores. They", function () {
        it("can hold values, that can be retrieved and set", function() {
            var store:any = Fluss.Store.record();

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

            var store:any = Fluss.Store.record();

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

        it("can be initialized upon creation", function () {
            var store:any = Fluss.Store.record({
                a: 1,
                b: "lkjh"
            });

            expect(store["a"]).to.equal(1);
            expect(store["b"]).to.equal("lkjh");
        });

        it("will create nested stores when given a nested object as initial value - 1", function () {
            var store:any = Fluss.Store.record({
                a: 1,
                b: "lkjh",
                sub: {
                    x: 12,
                    y: 32
                }
            });

            expect(Fluss.Store.isStore(store)).to.be.ok();
            expect(Fluss.Store.isStore(store["sub"])).to.be.ok();
            expect(typeof store["sub"].addItem).to.equal("function");

        });

        it("will create nested stores when given a nested object as initial value - 2", function () {
            var store:any = Fluss.Store.record({
                a: 1,
                b: "lkjh",
                sub: [1, 2, 3]
            });

            expect(Fluss.Store.isStore(store)).to.be.ok();
            expect(Fluss.Store.isStore(store["sub"])).to.be.ok();
            expect(typeof store["sub"].push).to.equal("function");
        });

        it("will create nested stores when given a nested object as initial value - 3", function () {
            var store:any = Fluss.Store.record({
                a: 1,
                b: "lkjh",
                sub: [1, 2, { x: 10 }]
            });

            expect(Fluss.Store.isStore(store)).to.be.ok();
            expect(Fluss.Store.isStore(store["sub"])).to.be.ok();
            expect(Fluss.Store.isStore(store["sub"][2])).to.be.ok();

            var calls = {};
            var updates:Fluss.Stream.IStream = store.updates;
            updates.forEach(function(update) {
                calls[update.path] = update.value;
            });

            store["sub"][2]["x"] = 20;

            expect(calls["sub.2.x"]).to.equal(20);
        });

        it("provide a immutable proxy that supports all reading methods including the streams for update, new items and removed items", function() {
            var store:any = Fluss.Store.record({ a: 1, b: "x"} );
            var imm:any = store.immutable;
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
            var store = Fluss.Store.record();
            var sub = Fluss.Store.record({ a: 1 });
            store.addItem("sub", sub);

            var imm = store.immutable;
            expect(Fluss.Store.isStore(store["sub"])).to.be.ok();
            expect(imm.isImmutable).to.be.ok();
            expect(imm["sub"].isImmutable).to.be.ok();
        });

        it("can be disposed and will delete all data and dispose all streams", function() {
            var closes = "";
            var store:Fluss.Store.IStore = Fluss.Store.record({ a: 1, b: "x"} );

            store.updates.onClose(function () {
                closes += "U";
            });
            store.newItems.onClose(function () {
                closes += "N";
            });
            store.removedItems.onClose(function () {
                closes += "R";
            });
            store.isDisposing.onClose(function () {
                closes += "D";
            });

            store.dispose();
            expect(closes).to.equal("RUND");
            expect(store["a"]).to.be.undefined();
        });
    });

    describe("and array stores. They", function () {
        it("store values in an enumerated list", function () {
            var store:Fluss.Store.IArrayStore = Fluss.Store.array();

            store.push(1);
            store.push(2);
            store.push("d");
            store.push("longer");

            expect(store.length).to.equal(4);
            expect(store[0]).to.equal(1);
            expect(store[1]).to.equal(2);
            expect(store[2]).to.equal("d");
            expect(store[3]).to.equal("longer");

            store[0] = 47;
            store[1] = "string";
            expect(store.length).to.equal(4);
            expect(store[0]).to.equal(47);
            expect(store[1]).to.equal("string");
            expect(store[2]).to.equal("d");
            expect(store[3]).to.equal("longer");

            store.push(22);
            expect(store.length).to.equal(5);
            expect(store[0]).to.equal(47);
            expect(store[1]).to.equal("string");
            expect(store[2]).to.equal("d");
            expect(store[3]).to.equal("longer");
            expect(store[4]).to.equal(22);
        });

        it("can be initialized upon creation", function () {
            var store:Fluss.Store.IArrayStore = Fluss.Store.array([0, 1, 2, 3, 4]);

            expect(store[0]).to.equal(0);
            expect(store[1]).to.equal(1);
            expect(store[2]).to.equal(2);
            expect(store[3]).to.equal(3);
            expect(store[4]).to.equal(4);
            expect(store.length).to.equal(5);

            store.push(5);

            expect(store[0]).to.equal(0);
            expect(store[1]).to.equal(1);
            expect(store[2]).to.equal(2);
            expect(store[3]).to.equal(3);
            expect(store[4]).to.equal(4);
            expect(store[5]).to.equal(5);
            expect(store.length).to.equal(6);
        });

        it("provide streams for item updates", function () {
            var calls = "";

            var store:Fluss.Store.IArrayStore = Fluss.Store.array();
            var s = store.updates;

            s.forEach(function (update) {
                calls += "(" + update.item + "=" + update.value + ")";
            });

            store.push(1);
            store.push(2);
            store.push("d");
            store.push("longer");

            store[2] = 12;
            store[0] = "X";
            expect(calls).to.equal("(2=12)(0=X)");

            store[2] = 5;
            expect(calls).to.equal("(2=12)(0=X)(2=5)");
        });

        it("provide streams for new items", function () {
            var calls = "";
            var store:Fluss.Store.IArrayStore = Fluss.Store.array();

            store.push(1);

            var s = store.newItems;
            s.forEach(function (update) {
                calls += "(" + update.item + "=" + update.value + ")";
            });

            expect(calls).to.equal("");

            store.push(2);
            expect(calls).to.equal("(1=2)");

            store.push("l");
            store.push("12");
            expect(calls).to.equal("(1=2)(2=l)(3=12)");
        });

        it("provide streams for removed items", function () {
            var calls = "";
            var store:Fluss.Store.IArrayStore = Fluss.Store.array();

            store.push(1);
            store.push(2);
            store.push(3);
            store.push(4);
            store.push(5);

            var s = store.removedItems;
            s.forEach(function (update) {
                calls += "(" + update.item + "=" + update.value + ")";
            });

            expect(calls).to.equal("");

            var i = store.pop();         //--> 1, 2, 3, 4
            expect(calls).to.equal("(4=null)");
            expect(i).to.equal(5);

            i = store.shift();           //--> 2, 3, 4
            expect(calls).to.equal("(4=null)(0=null)");
            expect(i).to.equal(1);

            i = store.shift();           //--> 3, 4
            expect(calls).to.equal("(4=null)(0=null)(0=null)");
            expect(i).to.equal(2);

            i = store.pop();             //--> 3
            expect(calls).to.equal("(4=null)(0=null)(0=null)(1=null)");
            expect(i).to.equal(4);

            expect(store.length).to.equal(1);
        });

        it("provide sort with streamed updates", function () {
            var calls = {};
            var store:Fluss.Store.IArrayStore = Fluss.Store.array([0, 1, 2, 3, 4]);
            var up = store.updates;
            up.forEach(function (update) {
                calls[update.item] = update.value;
            });

            store.sort(function (a, b) {
                return b - a;
            });

            expect(store[4]).to.equal(0);
            expect(store[3]).to.equal(1);
            expect(store[2]).to.equal(2);
            expect(store[1]).to.equal(3);
            expect(store[0]).to.equal(4);
            expect(store.length).to.equal(5);

            expect(calls[0]).to.equal(4);
            expect(calls[1]).to.equal(3);
            expect(calls[2]).to.be.undefined();
            expect(calls[3]).to.equal(1);
            expect(calls[4]).to.equal(0);
        });

        it("provide reverse with streamed updates", function () {
            var calls = {};
            var store:Fluss.Store.IArrayStore = Fluss.Store.array([0, 1, 2, 3, 4]);
            var up = store.updates;
            up.forEach(function (update) {
                calls[update.item] = update.value;
            });

            store.reverse();

            expect(store[4]).to.equal(0);
            expect(store[3]).to.equal(1);
            expect(store[2]).to.equal(2);
            expect(store[1]).to.equal(3);
            expect(store[0]).to.equal(4);
            expect(store.length).to.equal(5);

            expect(calls[0]).to.equal(4);
            expect(calls[1]).to.equal(3);
            expect(calls[2]).to.be.undefined();
            expect(calls[3]).to.equal(1);
            expect(calls[4]).to.equal(0);
        });

        it("provide insert for one or many items with streamed updates, and streamed new items", function () {
            var upCalls = {};
            var upCount = 0;
            var newCalls = {};
            var newCount = 0;
            var store:Fluss.Store.IArrayStore = Fluss.Store.array([0, 1, 2, 3, 4]);
            var up = store.updates;
            up.forEach(function (update) {
                upCalls[update.item] = update.value;
                upCount++;
            });

            var news = store.newItems;
            news.forEach(function (item) {
                newCalls[item.item] = item.value;
                newCount++;
            });

            store.insert(2, 10, 11, 12, 13);

            expect(store[0]).to.equal(0);
            expect(store[1]).to.equal(1);
            expect(store[2]).to.equal(10);
            expect(store[3]).to.equal(11);
            expect(store[4]).to.equal(12);
            expect(store[5]).to.equal(13);
            expect(store[6]).to.equal(2);
            expect(store[7]).to.equal(3);
            expect(store[8]).to.equal(4);

          /*  expect(upCalls[6]).to.equal(2);
            expect(upCalls[7]).to.equal(3);
            expect(upCalls[8]).to.equal(4);
            expect(upCount).to.equal(3);
            */

            expect(newCalls[2]).to.equal(10);
            expect(newCalls[3]).to.equal(11);
            expect(newCalls[4]).to.equal(12);
            expect(newCalls[5]).to.equal(13);
            expect(newCount).to.equal(4);
        });

        it("provide splice with streamed updates (for moving), removed items and new items", function() {
            var upCalls = {};
            var upCount = 0;
            var newCalls = {};
            var newCount = 0;
            var remCalls = {};
            var remCount = 0;
            var store:Fluss.Store.IArrayStore = Fluss.Store.array([0, 1, 2, 3, 4]);
            var up = store.updates;
            up.forEach(function (update) {
                upCalls[update.item] = update.value;
                upCount++;
            });

            var news = store.newItems;
            news.forEach(function (item) {
                newCalls[item.item] = item.value;
                newCount++;
            });

            var rems = store.removedItems;
            rems.forEach(function(item) {
                remCalls[item.item] = item.value;
                remCount++;
            });

            store.splice(2, 1, 10, 11, 12, 13);

            expect(store[0]).to.equal(0);
            expect(store[1]).to.equal(1);
            expect(store[2]).to.equal(10);
            expect(store[3]).to.equal(11);
            expect(store[4]).to.equal(12);
            expect(store[5]).to.equal(13);
            expect(store[6]).to.equal(3);
            expect(store[7]).to.equal(4);

            expect(remCalls[2]).to.equal(2);
            expect(remCount).to.equal(1);

            expect(newCalls[2]).to.equal(10);
            expect(newCalls[3]).to.equal(11);
            expect(newCalls[4]).to.equal(12);
            expect(newCalls[5]).to.equal(13);
            expect(newCount).to.equal(4);

           /* expect(upCalls[6]).to.equal(3);
            expect(upCalls[7]).to.equal(4);
            expect(upCount).to.equal(2);*/
        });

        it("provide an immutable proxy that provides all non changing methods and the streams", function() {
            var store = Fluss.Store.array([1, 2, 3, 4]);
            var imm:Fluss.Store.IImmutableArrayStore = <Fluss.Store.IImmutableArrayStore>store.immutable;
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

            function checkEQ() {
                for (var i = 0; i < store.length; i++) {
                    expect(imm[i]).to.equal(store[i]);
                }
            }

            checkEQ();

            store[3] = 100;
            checkEQ();
            expect(store.length).to.equal(imm.length);

            store.push(10);
            checkEQ();
            expect(store.length).to.equal(imm.length);

            expect(calls[3]).to.equal(100);
            expect(calls[4]).to.equal(10);

            store.pop();
            checkEQ();
            expect(store.length).to.equal(imm.length);
            expect(calls[4]).to.equal(null);

            expect(imm.every(function(value) {
                return typeof value !== "undefined";
            })).not.to.be.undefined();
        });

        it("will find the index of an substores immutable", function() {
            var store = Fluss.Store.array([1, 2, 3]);
            var sub = Fluss.Store.record({ a: "b" });
            store.push(sub);

            var imm = sub.immutable;

            expect(store.indexOf(sub)).to.equal(3);
            expect(store.indexOf(imm)).to.equal(3);
        });

        it("can give you the mutable version of a substore if it itself is mutable using item", function() {
            var store = Fluss.Store.array([1, 2, 3]);
            var sub = Fluss.Store.record({ a: "b" });
            store.push(sub);

            var imm = sub.immutable;

            var m = store.item(sub);

            expect(imm.isImmutable).to.be.ok();
            expect(m.isImmutable).not.to.be.ok();
            expect(m["a"]).to.equal(imm["a"]);

            m.a = 10;
            expect(m["a"]).to.equal(10);
            expect(m["a"]).to.equal(imm["a"]);
        });

        it("will update mapped stores when the base store changes", function() {
            var array = Fluss.Store.array([1, 2, 3, 4, 5]);
            var twice = array.map(function(value) {
                return value * 2;
            });

            array.push(6);          // [1, 2, 3, 4, 5, 6]
            expect(twice[5]).to.equal(12);

            array.push(7);          // [1, 2, 3, 4, 5, 6, 7]
            expect(twice[6]).to.equal(14);

            array.pop();            // [1, 2, 3, 4, 5, 6]
            expect(twice.length).to.equal(array.length);
            expect(twice.length).to.equal(6);

            array.splice(1, 1);     // [1, 3, 4, 5, 6]
            expect(twice.length).to.equal(array.length);
            expect(twice.length).to.equal(5);
            expect(twice[1]).to.equal(6);

            array.splice(1, 1, 10); // [1, 10, 4, 5, 6]
            expect(twice.length).to.equal(array.length);
            expect(twice.length).to.equal(5);
            expect(twice[1]).to.equal(20);
        });

        it("will update filtered stores when the base store changes", function() {
            var calls = {};
            var rcalls = {};
            var array = Fluss.Store.array([1, 2, 3, 4, 5]);
            var evens = array.filter(function(v) { return v % 2 === 0});

            evens.newItems.forEach(function(update) {
                calls[update.item] = update.value;
            });
            evens.removedItems.forEach(function(update) {
                rcalls[update.item] = true;
            });

            expect(evens.length).to.equal(2);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);

            array.push(6);                  // [1, 2, 3, 4, 5, 6]
            array.push(7);                  // [1, 2, 3, 4, 5, 6, 7]

            expect(evens.length).to.equal(3);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);
            expect(evens[2]).to.equal(6);

            expect(calls[2]).to.equal(6);
            expect(calls[3]).to.be.undefined();

            array[6] = 8;                   // [1, 2, 3, 4, 5, 6, 8]
            expect(evens.length).to.equal(4);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);
            expect(evens[2]).to.equal(6);
            expect(evens[3]).to.equal(8);
            expect(calls[3]).to.equal(8);

            array[5] = 7;                   // [1, 2, 3, 4, 5, 7, 8]
            expect(evens.length).to.equal(3);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);
            expect(evens[2]).to.equal(8);
            expect(rcalls[2]).to.equal(true);

            array[6] = 20;                  // [1, 2, 3, 4, 5, 7, 20]
            expect(evens.length).to.equal(3);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);
            expect(evens[2]).to.equal(20);

            array.pop();                    // [1, 2, 3, 4, 5, 7]
            expect(evens.length).to.equal(2);
            expect(evens[0]).to.equal(2);
            expect(evens[1]).to.equal(4);

            array.splice(1, 0, 10);         // [1, 10, 2, 3, 4, 5, 7]
            expect(evens.length).to.equal(3);
            expect(evens[0]).to.equal(10);
            expect(evens[1]).to.equal(2);
            expect(evens[2]).to.equal(4);

            expect(array[0]).to.equal(1);
            expect(array[1]).to.equal(10);
            expect(array[2]).to.equal(2);
        });

        it("will updated filtered stores when the base store changes and manages nested stores", function() {

            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({ a: false }));
            array.push(Fluss.Store.record({ a: false }));

            var filtered = array.filter(function(value) {
                return value.a === false;
            });

            expect(filtered.length).to.equal(array.length);

            array.forEach(function(item) {
                item.a = true;
            });

            expect(filtered.length).to.equal(0);

            array.forEach(function(item) {
                item.a = false;
            });
            expect(filtered.length).to.equal(array.length);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 2", function() {

            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));

            var filtered = array.filter(function (value) {
                return value.a === false;
            });

            expect(filtered.length).to.equal(array.length);

            array.splice(1, 0, Fluss.Store.record({a: false}));
            expect(filtered.length).to.equal(array.length);
            array.splice(1, 0, Fluss.Store.record({a: false}));
            expect(filtered.length).to.equal(array.length);
            array.splice(1, 0, Fluss.Store.record({a: false}));
            expect(filtered.length).to.equal(array.length);
            array.splice(1, 0, Fluss.Store.record({a: false}));
            expect(filtered.length).to.equal(array.length);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 3", function() {

            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));

            var filtered = array.filter(function (value) {
                return value.a === false;
            });

            expect(filtered.length).to.equal(array.length);

            array.splice(1, 1);
            expect(filtered.length).to.equal(array.length);
            array.splice(1, 1);
            expect(filtered.length).to.equal(array.length);
            array.splice(1, 1);
            expect(filtered.length).to.equal(array.length);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 4", function() {
           var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({ a: false }));

            var filtered = array.filter(function(item) {
                return !item.a;
            });

            expect(filtered.length).to.equal(1);

            array.push(Fluss.Store.record({ a: false }));

            expect(filtered.length).to.equal(2);

            array[0].a = true;
            expect(filtered.length).to.equal(1);

            array[0].a = false;
            expect(filtered.length).to.equal(2);

            array[0].a = true;
            expect(filtered.length).to.equal(1);

            array.splice(0, 1);
            expect(filtered.length).to.equal(1);

            array.pop();
            expect(filtered.length).to.equal(0);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 5", function() {
           var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({ a: false }));

            var filtered = array.filter(function(item) {
                return !item.a;
            });

            expect(filtered.length).to.equal(1);

            array.push(Fluss.Store.record({ a: false }));

            expect(filtered.length).to.equal(2);

            array[0].a = true;
            expect(filtered.length).to.equal(1);

            array[0].a = false;
            expect(filtered.length).to.equal(2);

            array[0].a = true;
            expect(filtered.length).to.equal(1);

            array.pop();
            expect(filtered.length).to.equal(0);

            array.pop();
            expect(filtered.length).to.equal(0);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 6", function() {
            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({a: false}));

            var filtered = array.filter(function(item) {
                return !item.a;
            });

            array.push(Fluss.Store.record({a: false}));
            expect(filtered.length).to.equal(2);

            array[0].a = true;
            expect(filtered.length).to.equal(1);

            array[0].a = true;
            expect(filtered.length).to.equal(1);
            array[1].a = true;
            expect(filtered.length).to.equal(0);
        });

        it("will updated filtered stores when the base store changes and manages nested stores - 7", function() {
            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({a: false}));

            var filtered = array.filter(function(item) {
                return !item.a;
            });

            array.push(Fluss.Store.record({a: false}));
            array.push(Fluss.Store.record({a: false}));

            expect(filtered.length).to.equal(3);

            array[0].a = true;
            expect(filtered.length).to.equal(2);

            array.splice(1, 1);
            expect(filtered.length).to.equal(1);

        });

        it("will updated filtered stores when the base store changes and manages nested stores - 8", function () {
            var array = Fluss.Store.array([]);
            array.push(Fluss.Store.record({ a: false }));

            var filtered = array.filter(function (item) {
                return !item.a;
            });

            array.push(Fluss.Store.record({ a: false }));
            array.push(Fluss.Store.record({ a: false }));

            expect(filtered.length).to.equal(3);

            array[0].a = true;
            expect(filtered.length).to.equal(2);

            array.splice(1, 1);
            expect(filtered.length).to.equal(1);

            array.splice(1, 1);
            expect(filtered.length).to.equal(0);
        });

        it("will update filtered stores incorrectly with complex filter callbacks", function() {
            var array = Fluss.Store.array("A B C D E".split(" "));
            var filtered = array.filter(function(item, index) {
               return index % 2 === 1;
            });

            // A,B,C,D,E -> B,D
            expect(filtered.length).to.equal(2);
            expect(filtered[0]).to.equal("B");
            expect(filtered[1]).to.equal("D");

            array.splice(1, 0, "X");
            // A,X,B,C,D,E -> X,C,E
            expect(array[1]).to.equal("X");
            expect(array[2]).to.equal("B");

            expect(filtered.length).to.equal(3);
            expect(filtered[1]).not.to.equal("C");
        });


        it("will updated mixed filter/map stores automatically upon changes of the base store", function() {
            var array = Fluss.Store.array([1, 2, 3, 4, 5]);
            var evenTwice = array.filter(function(value) { return value % 2 === 0; })
                                 .map(function(value) { return value * 2; });

            var twiceEven = array.map(function(value) { return value * 2; })
                                 .filter(function(value) { return value % 2 === 0; });

            expect(evenTwice.length).to.equal(2);
            expect(evenTwice[0]).to.equal(4);
            expect(evenTwice[1]).to.equal(8);
            expect(twiceEven.length).to.equal(5);

            array.push(6);
            expect(evenTwice.length).to.equal(3);
            expect(evenTwice[0]).to.equal(4);
            expect(evenTwice[1]).to.equal(8);
            expect(evenTwice[2]).to.equal(12);

            expect(twiceEven.length).to.equal(6);
            expect(twiceEven[5]).to.equal(12);
        });
    });

    describe("using streams they all", function() {
        it("will propagate updates up in nested stores", function() {
            var updateCount = 0;
            var store:any = Fluss.Store.record();
            var sub:any = Fluss.Store.record({ a: 1, b: 2})
            store.addItem("substore", sub);

            var updates:Fluss.Stream.IStream = store.updates;
            var calls = {};
            updates.forEach(function(update) {
                calls[update.path] = update.value;
                updateCount++;
            });

            sub.a = 2;

            expect(calls["substore.a"]).to.equal(2);
            expect(updateCount).to.equal(1);

            var sub2:any = Fluss.Store.array([1, 2, 3]);
            store.addItem("subArray", sub2);

            sub2[0] = 4;

            expect(calls["subArray.0"]).to.equal(4);
            expect(updateCount).to.equal(2);

            sub2.sort();

            expect(calls["subArray.0"]).to.equal(2);
            expect(calls["subArray.1"]).to.equal(3);
            expect(calls["subArray.2"]).to.equal(4);
            expect(updateCount).to.equal(5);

            sub2[0] = 10;
            sub2[1] = 20;
            sub2[2] = 30;
            expect(calls["subArray.0"]).to.equal(10);
            expect(calls["subArray.1"]).to.equal(20);
            expect(calls["subArray.2"]).to.equal(30);
            expect(updateCount).to.equal(8);

            var sub3 = Fluss.Store.record({ a: 2 });
            sub2.push(sub3);

            sub3["a"] = 5;
            expect(calls["subArray.3.a"]).to.equal(5);
            expect(updateCount).to.equal(9);

            sub2[3] = 1;
            expect(calls["subArray.3"]).to.equal(1);
            expect(updateCount).to.equal(10);

            sub3["a"] = 10;
            expect(calls["subArray.3.a"]).to.equal(5);       // <-- this must not change because we removed the store from the array
            expect(updateCount).to.equal(10);
        });

        it("will propagate updates of nested stores up to the immutable", function() {
            var array = Fluss.Store.array();
            array.push(Fluss.Store.record({ a: 1, b: 2 }));

            var imm = array.immutable;
            var calls = "";
            imm.updates.filter(function(update) {
                return update.item === "a";
            }).forEach(function(update) {
                calls += "(" + update.item + "=" + update.value + ")";
            });

            var item = imm[0];

            array.item(item).a = 2;
            array.item(item).b = 1;

            expect(calls).to.equal("(a=2)");
        });

        /*it("will propagate added items up in nested stores"
            , function() {
            return;
            var store:any = Store.record();
            var sub:any = Store.record({ a: 1, b: 2});
            var sub2:any = Store.array([1, 2, 3]);
            store.addItem("substore", sub);
            store.addItem("subArray", sub2);

            var news:Stream.IStream = store.newItems();
            var calls = {};
            news.forEach(function(update) {
                calls[update.item] = update.value;
            });
        }
        );*/
    });

});