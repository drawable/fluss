/// <reference path="../types/mocha.d.ts" />
/// <reference path="../types/chai.d.ts" />
/// <reference path="../build/fluss.d.ts" />
/**
 * Created by Stephan on 18.01.2015.
 */

"use strict";

import chai = require("chai");
var expect = chai.expect;

declare function require(module:string):any;
var Fluss:any = require("../build/index");


class MyRecord extends Fluss.Store.RecordStore {

    constructor(a:number, b:number, c:number) {
        super({
            a: a,
            b: b,
            c: c
        },
            true);       // Disable adding new items
    }


    double() {
        this["a"] *= 2;
        this._set("b", this["b"] * 2);
        this["c"] *= 2;
    }

    get b():number {
        return this._get("b");
    }
    set b(value:number) {
    }
}

describe("The record store", function() {

   it("can be extended to create an own implementation (Typescript)", function() {
       var calls = {};
        var rec = new MyRecord(1, 2, 3);
        rec.updates.forEach(function(update) {
            calls[update.item] = update.value;
        });

       expect(rec["a"]).to.equal(1);
       expect(rec["b"]).to.equal(2);
       expect(rec["c"]).to.equal(3);

       rec.double();

       expect(rec["a"]).to.equal(2);
       expect(rec["b"]).to.equal(4);
       expect(rec["c"]).to.equal(6);

       expect(calls["a"]).to.equal(2);
       expect(calls["b"]).to.equal(4);
       expect(calls["c"]).to.equal(6);
   })

});
