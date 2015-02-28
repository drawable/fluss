/**
 * Created by Stephan on 25.02.2015.
 */


import * as Store from '../src/Store';
import {expect} from 'chai';

class Custom extends Store.RecordStore {

    constructor() {
        super({
            a: null,
            b: 1,
            c: "two",
            d: Store.array()
        })
    }
}


describe("A custom Store", function() {
    it("can be used very much like a regular object", function() {
        var store = new Custom();

        store.a = "Hello";
        store.b += 2;
        store.c += ", three";
        store.d.push("12");

        expect(store.a).to.equal("Hello");
        expect(store.b).to.equal(3);
        expect(store.c).to.equal("two, three");
        expect(store.d.length).to.equal(1);
        expect(store.d).to.contain("12");

        expect(Store.isStore(store.d)).to.equal(true);
    });

    it("provides all the store features", function() {
        let store = new Custom();
        let ch = 0;
        store.allChanges.forEach(() => ch += 1);
        store.d.push("12");
        expect(ch).to.equal(1);

        store.d[0] = 1;
        expect(ch).to.equal(2);

        store.addItem("e", 12);
        expect(ch).to.equal(3);
    })
});