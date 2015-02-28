/**
 * Created by Stephan on 22.02.2015.
 */


import Fluss from '../src/Fluss'
import {expect} from 'chai';

describe("A StreamProvider manages different streams for different occasions. It", function() {
    it("can be created", function() {
        var sp = Fluss.StreamProvider.create();

        expect(sp).to.be.ok;
    });

    it("can create streams", function() {
        var sp = Fluss.StreamProvider.create();

        var sA1 = sp.newStream("A");
        var sA2 = sp.newStream("A");
        var sA3 = sp.newStream("A");
        var sB1 = sp.newStream("B");
        var sB2 = sp.newStream("B");
        var sB3 = sp.newStream("B");


        expect(sA1).to.be.ok;
        expect(sA2).to.be.ok;
        expect(sA3).to.be.ok;
        expect(sB1).to.be.ok;
        expect(sB2).to.be.ok;
        expect(sB3).to.be.ok;
    });

    it("can push values to streams it has created", function() {
        var sp = Fluss.StreamProvider.create();

        var calls = "";

        var sA1 = sp.newStream("A");
        var sA2 = sp.newStream("A");
        var sA3 = sp.newStream("A");
        var sB1 = sp.newStream("B");
        var sB2 = sp.newStream("B");
        var sB3 = sp.newStream("B");

        function makeForEach(stream, key) {
            stream.forEach(function(value) {
                calls += "(" + key + "=" + value + ")"
            })
        }


        makeForEach(sA1, "A1");
        makeForEach(sA2, "A2");
        makeForEach(sA3, "A3");
        makeForEach(sB1, "B1");
        makeForEach(sB2, "B2");
        makeForEach(sB3, "B3");

        sp.push("A", 1);

        expect(calls).to.equal("(A1=1)(A2=1)(A3=1)")

        sp.push("B", "X");
        expect(calls).to.equal("(A1=1)(A2=1)(A3=1)(B1=X)(B2=X)(B3=X)")
    });

    it("it can relay one stream to many", function() {
        var sp = Fluss.StreamProvider.create();
        var a = sp.newStream("Demo");
        var b = sp.newStream("Demo");
        var calls = {};
        a.forEach(function(v) {
            calls["A"] = v;
        });

        b.forEach(function(v) {
            calls["B"] = v;
        });

        var s = Fluss.Stream.create();

        sp.relay(s, "Demo");

        s.push("X");

        expect(calls["A"]).to.equal("X");
        expect(calls["B"]).to.equal("X");
    })
});