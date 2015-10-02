/**
* Created by Stephan on 24.02.2015.
*/

import * as Store from '../src/Store';
import {expect} from 'chai';


describe("Record store provides an item", () => {
    it("gives you access to the value", () => {
        let r = Store.record({ a: 1, b: "2" });
        let i = r.item("a");

        expect(i).to.be.ok;
        expect(i.value).to.equal(r.a);

        i.value = "X";
        expect(i.value).to.equal(r.a);
        expect(r.a).to.equal("X");

        r.a = 12;
        expect(i.value).to.equal(r.a);
        expect(r.a).to.equal(12);
    });

    it("is always the same instance for the same property name", () => {
        let r = Store.record({ a: 1, b: "2" });
        let i = r.item("a");
        let j = r.item("a");

        expect(i).to.equal(j);
    });

    it("provides streams for updates", () => {
        let r = Store.record({ a: 1, b: "2" });
        let i = r.item("a");
        let calls = [];

        i.updates.forEach((update) => {
            calls.push(update.item);
        });


        r.b = "lkjh";
        expect(calls.length).to.equal(0);

        r.a = "12";
        expect(calls[0]).to.equal("a");

        i.value = 20;
        expect(calls[1]).to.equal("a");
    });

    it("disposes, when the item is removed from the record", () => {
        let r = Store.record({ a: 1, b: "2" });
        let i = r.item("a");

        let called = false;

        i.isDisposing.forEach(() => called = true);

        r.removeItem("b");
        expect(called).to.equal(false);

        r.removeItem("a");
        expect(called).to.equal(true);
    });

});
/*
 describe("and Item stores. They", function() {
 it("can be created", function() {
 var i = Store.item(5);

 expect(i).to.be.ok;
 });

 it("are reactive", function() {
 var i = Store.item(5);
 var calls = [];
 i.updates.forEach(function(update) {
 calls.push(update.value);
 });

 i.set(10);
 i.set(5);
 i.set("A");

 expect(calls[0]).to.equal(10);
 expect(calls[1]).to.equal(5);
 expect(calls[2]).to.equal("A");
 });

 it("support nested stores", function() {
 var a = Store.array();
 var i = Store.item(a);
 var calls = {};
 i.newItems.forEach(function(update) {
 calls[update.item] = update.value;
 });

 i.updates.forEach(function(update) {
 calls[update.item] = update.value;
 });

 i.get().push(10);
 i.get().push(5);
 i.get().push("A");

 expect(calls[0]).to.equal(10);
 expect(calls[1]).to.equal(5);
 expect(calls[2]).to.equal("A");

 i.get()[0] = 100;
 expect(calls[0]).to.equal(100);
 });

 it("provide an immutable proxy", function() {
 var a = Store.array();
 var i = Store.item(a);
 var ii = i.immutable;

 ii.set(12);

 expect(i.get()).not.to.equal(12);

 var ia = ii.get();

 expect(ia.isImmutable).to.be.true();
 });


 });
 */

