/**
 * Created by Stephan on 24.02.2015.
 */

import * as Store from '../src/Store';
import {expect} from 'chai';


describe("Data stores", function () {
    it("will return itself if it is immutable and is asked for its immutable", function() {
        var rec = Store.record({a: "b"});
        var arr = Store.array([1, 2, 3]);

        expect(rec.immutable).to.equal(rec.immutable.immutable);
        expect(arr.immutable).to.equal(arr.immutable.immutable);

    });

    describe("using streams they all", function() {
        it("will propagate updates up in nested stores", function() {
            var updateCount = 0;
            var store = Store.record();
            var sub = Store.record({ a: 1, b: 2});
            store.addItem("substore", sub);

            var updates = store.updates;
            var calls = {};
            updates.forEach(function(update) {
                calls[update.path] = update.value;
                updateCount++;
            });

            sub.a = 2;

            expect(calls["substore.a"]).to.equal(2);
            expect(updateCount).to.equal(1);

            var sub2 = Store.array([1, 2, 3]);
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

            var sub3 = Store.record({ a: 2 });
            sub2.push(sub3);

            sub3["a"] = 5;
            expect(calls["subArray.3.a"]).to.equal(5);
            expect(updateCount).to.equal(9);

            sub2[3] = 1;
            expect(calls["subArray.3"]).to.equal(1);
            expect(updateCount).to.equal(10);

            sub3["a"] = 17;
            expect(calls["subArray.3.a"]).to.equal(5);       // <-- this must not change because we removed the store from the array
            expect(updateCount).to.equal(10);
        });

        it("will propagate updates of nested stores up to the immutable", function() {
            var array = Store.array();
            array.push(Store.record({ a: 1, b: 2 }));

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