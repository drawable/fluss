/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

import * as Stream from '../src/Stream'
import {expect} from 'chai';
let sinon = require('sinon');

let Fluss = {
    Stream: Stream
};

describe("A stream (used for reactive programming patterns)", function() {
    it("can be created", function() {
        var s = Fluss.Stream.create("myStream");

        expect(s).not.to.be.undefined();
        expect(s.name).to.equal("myStream");
    });

    it("can have values pushed to it", function() {
        var s = Fluss.Stream.create("myStream");

        expect(function() {
            s.push("A");
            s.push(23);
        }).not.to.throw(Error);
    });

    it("provides 'forEach' to define a function to be called for every value pushed to it", function() {
        var s = Fluss.Stream.create("myStream");
        var calls = [];

        s.forEach(function(value) {
            calls.push(value);
        });

        s.push("A");
        s.push(23);

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("A");
        expect(calls[1]).to.equal(23);
    });

    it("passes the index of the processed value to forEach", function() {
        var calls = "";
        var s = Fluss.Stream.create("myStream");

        s.forEach(function(value, index) {
            calls += index;
        });

        s.push("A");
        s.push(23);
        s.push("A");
        s.push(23);

        expect(calls).to.equal("0123");
    });

    it("can be preloaded with values before the first method is defined", function() {
        var s = Fluss.Stream.create("myStream");
        var calls = [];

        s.push("A");
        s.push(23);

        s.forEach(function(value) {
            calls.push(value);
        });

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("A");
        expect(calls[1]).to.equal(23);

    });

    it("can tell you how many values where processed", function() {
        var s = Fluss.Stream.create("myStream");

        expect(s.length).to.equal(0);
        s.push(1);
        expect(s.length).to.equal(1);
        s.push(2);
        expect(s.length).to.equal(2);
        s.push(3);
        expect(s.length).to.equal(3);
        s.push(4);
        expect(s.length).to.equal(4);
        s.push(5);
        expect(s.length).to.equal(5);

    });

    it("can be closed - no more methods are called, pushing has no effect", function() {
        var s = Fluss.Stream.create("myStream");
        var calls = [];

        s.forEach(function(value) {
            calls.push(value);
        });

        s.push("A");
        s.push(23);
        s.close();
        s.push("B");

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("A");
        expect(calls[1]).to.equal(23);
        expect(s.length).to.equal(2);
        expect(s.closed).to.be.ok();
    });

    it("can use multiple 'forEach'", function() {
        var s = Fluss.Stream.create("myStream");
        var calls1 = [];
        var calls2 = [];

        s.forEach(function(value) {
            calls1.push(value);
        });

        s.forEach(function(value) {
            calls2.push(value);
        });

        s.push("A");
        s.push(23);

        expect(calls1.length).to.equal(2);
        expect(calls1[0]).to.equal("A");
        expect(calls1[1]).to.equal(23);
        expect(calls2.length).to.equal(2);
        expect(calls2[0]).to.equal("A");
        expect(calls2[1]).to.equal(23);
    });

    it("provides 'map', that returns a new stream of values that are first processed by the map predicate", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var m = s.map(function(value) {
            return typeof value;
        });

        m.forEach(function(value) {
            calls.push(value);
        });

        s.push("A");
        s.push(23);

        expect(m).not.to.equal(s);
        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("string");
        expect(calls[1]).to.equal("number");
    });

    it("passes the index of the processed value to map", function() {
        var calls = "";
        var s = Fluss.Stream.create("myStream");

        var m = s.map(function(value, index) {
            return index;
        });

        m.forEach(function(value) {
            calls += value;
        });


        s.push("A");
        s.push(23);
        s.push("A");
        s.push(23);

        expect(calls).to.equal("0123");
    });

    it("can 'map' to a constant", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var m = s.map("Hello!");

        m.forEach(function(value) {
            calls.push(value);
        });

        s.push("A");
        s.push(23);

        expect(m).not.to.equal(s);
        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("Hello!");
        expect(calls[1]).to.equal("Hello!");
    });


    it("provides 'filter', that returns a new stream of values that meet a specific criterium", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var f = s.filter(function(value) {
            return !(value % 2);
        });

        f.forEach(function(value) {
            calls.push(value);
        });

        expect(f).not.to.equal(s);

        s.push(1);
        s.push(2);
        s.push(3);
        s.push(4);
        s.push(5);
        s.push(6);
        s.push(7);

        expect(calls.length).to.equal(3);
        expect(calls[0]).to.equal(2);
        expect(calls[1]).to.equal(4);
        expect(calls[2]).to.equal(6);
    });

    it("passes the index of the processed value to filter", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var f = s.filter(function(value, index) {
            return index % 2;
        });

        f.forEach(function(value) {
            calls.push(value);
        });

        expect(f).not.to.equal(s);

        s.push(12);
        s.push(21);
        s.push(32);
        s.push(41);
        s.push(52);
        s.push(61);
        s.push(72);

        expect(calls.length).to.equal(3);
        expect(calls[0]).to.equal(21);
        expect(calls[1]).to.equal(41);
        expect(calls[2]).to.equal(61);
    });

    it("can filter using a constant, that checks whether the processed value equals this constant", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var f = s.filter(2);

        f.forEach(function(value) {
            calls.push(value);
        });

        expect(f).not.to.equal(s);

        s.push(1);
        s.push(2);
        s.push(3);
        s.push(1);
        s.push(2);
        s.push(3);

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal(2);
        expect(calls[1]).to.equal(2);
    });

    it("provides 'scan', that returns a new stream that accumulates the result of a predicate of the last result and the " +
    "current value. The initial seed of the scan is the first value to be processed", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var sc = s.scan(function(prev, current) {
            return prev + current;
        }, 0);

        sc.forEach(function(value) {
            calls.push(value);
        });

        expect(sc).not.to.equal(s);

        s.push(1);
        s.push(2);
        s.push(3);
        s.push(4);
        s.push(5);

        expect(calls.length).to.equal(6);
        expect(calls[0]).to.equal(0);
        expect(calls[1]).to.equal(1);
        expect(calls[2]).to.equal(3);
        expect(calls[3]).to.equal(6);
        expect(calls[4]).to.equal(10);
        expect(calls[5]).to.equal(15);
    });

    it("provides 'reduce', that returns a new stream that gives the accumulated result of a predicate over all values when the original stream is closed", function() {
        var calls = [];

        var s = Fluss.Stream.create("myStream");
        var re = s.reduce(function(prev, current) {
            return prev + current;
        }, 0);

        re.forEach(function(value) {
            calls.push(value);
        });

        expect(re).not.to.equal(s);

        s.push(1);
        expect(calls.length).to.equal(0);
        s.push(2);
        expect(calls.length).to.equal(0);
        s.push(3);
        expect(calls.length).to.equal(0);
        s.push(4);
        expect(calls.length).to.equal(0);
        s.push(5);
        expect(calls.length).to.equal(0);

        s.close();

        expect(calls.length).to.equal(1);
        expect(calls[0]).to.equal(15);
    });

    it("provides 'concat', that returns a new stream that processes all values of the original stream and all of another given stream, when the original stream is closed", function() {
        var calls = [];

        var s1 = Fluss.Stream.create("One");
        var s2 = Fluss.Stream.create("Two");
        var co = s1.concat(s2);

        expect(co).not.to.equal(s1);

        co.forEach(function(value) {
            calls.push(value);
        });

        s1.push(1);
        expect(calls.length).to.equal(1);
        s1.push(2);
        expect(calls.length).to.equal(2);
        s1.push(3);
        expect(calls.length).to.equal(3);

        s2.push(10);
        expect(calls.length).to.equal(3);
        s2.push(11);
        expect(calls.length).to.equal(3);

        s1.close();
        expect(calls.length).to.equal(5);

        s2.push(12);
        expect(calls.length).to.equal(6);

        expect(calls[0]).to.equal(1);
        expect(calls[1]).to.equal(2);
        expect(calls[2]).to.equal(3);
        expect(calls[3]).to.equal(10);
        expect(calls[4]).to.equal(11);
        expect(calls[5]).to.equal(12);
    });

    it("that is closed and then concated will result in the concat to be the values of the other stream immediately", function() {
        var calls = "";
        var s1 = Fluss.Stream.create("A");
        var s2 = Fluss.Stream.create("B");

        s1.close();

        var co = s1.concat(s2);

        co.forEach(function(value) {
            calls += value;
        });

        s2.push("A");
        s2.push("B");
        s2.push("C");

        expect(calls).to.equal("ABC");
    });


    it("provides 'concatAll', that returns a new stream that takes a stream of streams, whose items are flattened. " +
    "Flattened items are in sequence, i.e. one substream at a time is completely processed before the next substream is processed", function() {
        var calls = [];

        var s = Fluss.Stream.create("MyStream");
        var co = s.concatAll();

        co.forEach(function(value) {
            calls.push(value);
        });

        expect(co).not.to.equal(s);

        // Weird names are given to make it more obvious what's happening
        var AAAA = Fluss.Stream.create("Sub1");
        var OOOO = Fluss.Stream.create("Sub2");
        var XXXX = Fluss.Stream.create("Sub3");

        // This defines the sequence of the substreams
        s.push(AAAA);
        s.push(OOOO);
        s.push(XXXX);

        // The pushes to the substreams are NOT in sequence
        AAAA.push(1);
        AAAA.push(2);

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal(1);
        expect(calls[1]).to.equal(2);

        OOOO.push(11);

        AAAA.push(3); AAAA.close();
        expect(calls[2]).to.equal(3);
        expect(calls[3]).to.equal(11);

        OOOO.push(12);
        expect(calls[4]).to.equal(12);

        XXXX.push(21);

        OOOO.push(13); OOOO.close();
        expect(calls[5]).to.equal(13);
        expect(calls[6]).to.equal(21);

        XXXX.push(22);
        expect(calls[7]).to.equal(22);
        XXXX.push(23); XXXX.close();
        expect(calls[8]).to.equal(23);

        OOOO.push(6534);  // <-- this is ignored

        // The result from the concatAll is in the sequence of the substreams
        expect(calls.length).to.equal(9);
        expect(calls[0]).to.equal(1);
        expect(calls[1]).to.equal(2);
        expect(calls[2]).to.equal(3);
        expect(calls[3]).to.equal(11);
        expect(calls[4]).to.equal(12);
        expect(calls[5]).to.equal(13);
        expect(calls[6]).to.equal(21);
        expect(calls[7]).to.equal(22);
        expect(calls[8]).to.equal(23);


        var PPPP = Fluss.Stream.create("Sub4");
        var QQQQ = Fluss.Stream.create("Sub5");

        s.push(PPPP);
        s.push(QQQQ);

        QQQQ.push(41);
        PPPP.push(31);
        expect(calls[9]).to.equal(31);
        PPPP.push(32);
        expect(calls[10]).to.equal(32);
        PPPP.push(33);
        QQQQ.push(42);
        QQQQ.push(43);
        expect(calls[11]).to.equal(33);

        expect(calls.length).to.equal(12);
        expect(calls[0]).to.equal(1);
        expect(calls[1]).to.equal(2);
        expect(calls[2]).to.equal(3);
        expect(calls[3]).to.equal(11);
        expect(calls[4]).to.equal(12);
        expect(calls[5]).to.equal(13);
        expect(calls[6]).to.equal(21);
        expect(calls[7]).to.equal(22);
        expect(calls[8]).to.equal(23);
        expect(calls[9]).to.equal(31);
        expect(calls[10]).to.equal(32);
        expect(calls[11]).to.equal(33);

        PPPP.close();
        expect(calls.length).to.equal(15);
        expect(calls[12]).to.equal(41);
        expect(calls[13]).to.equal(42);
        expect(calls[14]).to.equal(43);
    });

    it("provides 'combine', that returns a new stream that combines the values of the original and another stream. The " +
    "sequence of the new stream is that of the items irrespected of their original stream", function() {
        var calls = "";
        var s1 = Fluss.Stream.create("A");
        var s2 = Fluss.Stream.create("B");

        var c = s1.combine(s2);

        c.forEach(function(value) {
            calls += value;
        });

        s1.push("A");
        s2.push("B");
        s2.push("B");
        s1.push("A");
        s2.push("B");
        s2.push("B");
        s1.push("A");
        s1.push("A");
        s2.push("B");
        s1.push("A");
        s1.push("A");
        s2.push("B");

        expect(calls).to.equal("ABBABBAABAAB");
    });

    it("provides 'combineAll', that returns a new stream that processes all items of all " +
    "streams that are processed by the original", function() {
        var calls = "";
        var main = Fluss.Stream.create();

        var a = Fluss.Stream.create();
        var b = Fluss.Stream.create();
        var c = Fluss.Stream.create();

        var ca = main.combineAll();

        ca.forEach((value) => calls += value);

        a.push("A")
        main.push(a);
        main.push(b);
        a.push("A")
        main.push(c);
        c.push("C");
        b.push("B");
        c.push("C");
        a.push("A");
        b.push("B");

        expect(calls).to.equal("AACBCAB");
    });

    describe("handles errors", function() {
        it("by providing onError to define an error handling method, that kicks in when an exception is raised", function() {
            var s = Fluss.Stream.create("myStream");
            var calls = [];
            var errors = [];

            s.forEach(function(value) {
                if (!value) {
                    throw new Error("An error")
                }
                calls.push(value);
            });

            s.onError(function(error) {
                errors.push(error);
            });

            expect(function() {
                s.push("A");
                s.push(23);
                s.push(0);
            }).not.to.throw(Error);

            expect(calls.length).to.equal(2);
            expect(calls[0]).to.equal("A");
            expect(calls[1]).to.equal(23);

            expect(errors.length).to.equal(1);
        });

        it("that are not handled on subsequent streams - 1", function() {
            var calls = [];
            var errors_s = [];

            var s = Fluss.Stream.create("myStream");
            var m = s.map(function(value) {
                var t = typeof value;

                if (t === "string" || t === "number") {
                    return t;
                } else {
                    throw new Error("Not a string or a number");
                }
            });

            m.forEach(function(value) {
                calls.push(value);
            });


            s.onError(function(error) {
                errors_s.push(error);
            });

            expect(function() {
                s.push("A");
                s.push(23);
                s.push({ a: 12 })
            }).not.to.throw(Error);

            expect(m).not.to.equal(s);
            expect(calls.length).to.equal(2);
            expect(calls[0]).to.equal("string");
            expect(calls[1]).to.equal("number");

            expect(errors_s.length).to.equal(1);
        });

        it("that are not handled on subsequent streams - 2", function() {
            var calls = "";
            var errors = 0;

            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("B");

            var c = s1.combine(s2);

            c.forEach(function(value) {
                if (typeof value !== "string") {
                    throw new Error("Only strings please");
                }
                calls += value;
            });

            c.onError(function(error) {
                errors++;
            });

            s1.push("A");
            s2.push("B");
            s2.push("B");
            s1.push("A");
            s2.push("B");
            s2.push("B");
            s1.push("A");
            s1.push("A");
            s2.push("B");
            s1.push("A");
            s1.push("A");
            s2.push("B");

            expect(function() {
                s1.push(1);
            }).not.to.throw(Error);

            expect(calls).to.equal("ABBABBAABAAB");
            expect(errors).to.equal(1);
        });

        it("that are not handled on subsequent streams - 3", function() {
            var calls = "";
            var errors = 0;

            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("B");

            var c = s1.combine(s2);

            c.forEach(function(value) {
                if (typeof value !== "string") {
                    throw new Error("Only strings please");
                }
                calls += value;
            });

            s1.onError(function(error) {
                errors++;
            });

            s1.push("A");
            s2.push("B");
            s2.push("B");
            s1.push("A");
            s2.push("B");
            s2.push("B");
            s1.push("A");
            s1.push("A");
            s2.push("B");
            s1.push("A");
            s1.push("A");
            s2.push("B");

            expect(function() {
                s1.push(1);
            }).not.to.throw(Error);

            expect(calls).to.equal("ABBABBAABAAB");
            expect(errors).to.equal(1);
        });

        it("as late as possible in the stream chain - 1", function() {
            var errors = 0;
            var s1 = Fluss.Stream.create("A");
            var s2 = s1.map(1);
            var s3 = s2.map(1);
            var s4 = s3.map(1);
            var s5 = s4.map(function(value) {
                if (typeof value !== "string") {
                    throw new Error("Only numbers");
                }
            });

            s3.onError(function() {
                errors++;
            });

            s1.push(1);
            expect(errors).to.equal(1);
        });

        it("as late as possible in the stream chain - 2", function() {
            var calls = [];
            var errors_s = [];
            var errors_m = [];

            var s = Fluss.Stream.create("myStream");
            var m = s.map(function(value) {
                var t = typeof value;

                if (t === "string" || t === "number") {
                    return t;
                } else {
                    throw new Error("Not a string or a number");
                }
            });

            m.forEach(function(value) {
                calls.push(value);
            });


            s.onError(function(error) {
                errors_s.push(error);
            });

            s.forEach(function(value) {
                if (value === 42) {
                    throw new Error("This is not the answer");
                }
            });

            m.onError(function(error) {
                errors_m.push(error);
            });

            expect(function() {
                s.push("A");
                s.push(23);
                s.push({ a: 12 })
            }).not.to.throw(Error);

            expect(m).not.to.equal(s);
            expect(calls.length).to.equal(2);
            expect(calls[0]).to.equal("string");
            expect(calls[1]).to.equal("number");

            expect(errors_s.length).to.equal(0);
            expect(errors_m.length).to.equal(1);

            expect(function() {
                s.push(42);
            }).not.to.throw(Error);

            expect(errors_s.length).to.equal(1);
            expect(errors_m.length).to.equal(1);
        });
    });



    it("provides 'onClose' to react on the fact that a stream was closed", function () {
        var s = Fluss.Stream.create("myStream");
        var calls = [];
        var closed = 0;

        s.forEach(function(value) {
            calls.push(value);
        });

        s.onClose(function() {
            closed++;
        });

        s.push("A");
        s.push(23);
        s.close();
        s.push("B");

        expect(calls.length).to.equal(2);
        expect(calls[0]).to.equal("A");
        expect(calls[1]).to.equal(23);
        expect(s.length).to.equal(2);
        expect(closed).to.be.ok();
        expect(s.closed).to.be.ok();

        // Subsequent calls to close have no effect
        s.close();
        expect(closed).to.equal(1);
    });

    it("will close all subsequent streams when it is closed", function() {
        var calls = [];
        var closed = false;

        var s = Fluss.Stream.create("myStream");
        var m1 = s.map(function(value) {
            return typeof value;
        });
        var m2 = s.map(function(value) {
            return typeof value;
        });
        var m3 = m1.map(function(value) {
            return typeof value;
        });

        m1.forEach(function(value) {
            calls.push(value);
        });

        s.onClose(function() {
            closed = true;
        });

        s.push("A");
        s.push(23);
        s.close();

        expect(s.closed).to.be.ok();
        expect(m1.closed).to.be.ok();
        expect(m2.closed).to.be.ok();
        expect(m3.closed).to.be.ok();
        expect(closed).to.be.ok();
    });

    it("can be throttled", function() {
        var calls = "";

        var baseStream = Fluss.Stream.create();
        var stream = baseStream.throttle(200);
        var clock = sinon.useFakeTimers();

        stream.forEach(function(value) {
            calls += value;
        });

        baseStream.push("A");
        baseStream.push("B");
        expect(calls).to.be.equal("A");

        clock.tick(200);
        baseStream.push("C");
        expect(calls).to.be.equal("AC");
        baseStream.push("D");
        clock.tick(100);
        baseStream.push("D");
        clock.tick(150);
        baseStream.push("E");
        expect(calls).to.be.equal("ACE");

        clock.tick(199);
        baseStream.push("F");
        clock.tick(1);
        baseStream.push("G");
        expect(calls).to.be.equal("ACEG");

        clock.restore();
    });

    it ("can be debounced", function() {
        var calls = "";

        var baseStream = Fluss.Stream.create();
        var stream = baseStream.debounce(200);
        var clock = sinon.useFakeTimers();

        stream.forEach(function(value) {
            calls += value;
        });

        baseStream.push("A");
        expect(calls).to.equal("")
        clock.tick(199);
        baseStream.push("B");
        clock.tick(1);
        baseStream.push("C");
        clock.tick(200);

        expect(calls).to.equal("C");

        baseStream.push("D");
        expect(calls).to.equal("C");
        clock.tick(800);
        expect(calls).to.equal("CD");

        clock.restore();
    });

    it("can be buffered until another stream processes", function() {

        var valve = Fluss.Stream.create();
        var base = Fluss.Stream.create();
        var buffered = base.buffer(valve);

        var calls = "";

        buffered.forEach(function(value ) {
            calls += "[" + value.join("") + "]";
        });

        base.push("A");
        base.push("B");
        base.push("C");
        expect(calls).to.equal("");

        valve.push(1);
        expect(calls).to.equal("[ABC]");

        base.push("D");
        base.push("E");
        expect(calls).to.equal("[ABC]");
        valve.push(1);
        expect(calls).to.equal("[ABC][DE]");
    });

    it("can work as a multi-event detector", function() {
        var clock = sinon.useFakeTimers();

        var base = Fluss.Stream.create();

        var multi = base.buffer(base.debounce(250))
            .filter(function(list) {
                return list.length > 1;
            });

        var calls = "";

        multi.forEach(function(list) {
            calls += list.length;
        });

        base.push("1");
        clock.tick(100);
        base.push("2");
        clock.tick(300);

        expect(calls).to.equal("2");

        base.push("3");
        clock.tick(300);
        expect(calls).to.equal("2");

        base.push("4");
        clock.tick(100);
        expect(calls).to.equal("2");
        base.push("5");
        clock.tick(100);
        expect(calls).to.equal("2");
        base.push("6");
        clock.tick(100);
        expect(calls).to.equal("2");
        base.push("7");
        clock.tick(400);
        expect(calls).to.equal("24");

        clock.restore();
    });



    describe("will close automatically", function() {
        it("when a specific number of values where processed by using 'times'", function() {
            var s = Fluss.Stream.create("myStream").times(4);

            s.push(1);
            s.push(2);
            s.push(3);
            s.push(4);
            s.push(5);
            expect(s.length).to.equal(4);
            expect(s.closed).to.be.ok();
        });

        it("when another stream processes by using 'until'", function() {
            var c = Fluss.Stream.create("closer");
            var s = Fluss.Stream.create("myStream").until(c);

            s.push(1);
            s.push(2);
            s.push(3);
            s.push(4);
            c.push(1);      //<-- this closes
            s.push(5);
            expect(s.length).to.equal(4);
            expect(s.closed).to.be.ok();
        });

        it("when it is a filter and the filtered stream closes", function() {
            var s = Fluss.Stream.create("A");
            var f = s.filter(function(value) {
                return true;
            });

            s.push(1);
            s.push(1);
            s.push(1);
            s.push(1);
            s.close();

            expect(s.closed).to.be.ok();
            expect(f.closed).to.be.ok();
        });

        it("when it is a map and the mapped stream closes", function() {
            var s = Fluss.Stream.create("A");
            var m = s.map(function(value) {
                return 2 * value;
            });

            s.push(1);
            s.push(1);
            s.push(1);
            s.push(1);
            s.close();

            expect(s.closed).to.be.ok();
            expect(m.closed).to.be.ok();
        });

        it("when it is a scan and the scanned stream closes", function() {
            var s = Fluss.Stream.create("A");
            var m = s.scan(function(a, b) {
                return a + b;
            }, 0);

            s.push(1);
            s.push(1);
            s.push(1);
            s.push(1);
            s.close();

            expect(s.closed).to.be.ok();
            expect(m.closed).to.be.ok();
        });

        it("when it is a reduction and the reduced stream closes", function() {
            var s = Fluss.Stream.create("A");
            var m = s.reduce(function(a, b) {
                return a + b;
            }, 0);

            s.push(1);
            s.push(1);
            s.push(1);
            s.push(1);
            s.close();

            expect(s.closed).to.be.ok();
            expect(m.closed).to.be.ok();
        });

        it("when it is a concat and the second stream closes", function() {
            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("B");

            var co = s1.concat(s2);

            s1.push(1);
            s1.push(1);
            s1.push(1);
            s1.close();
            s2.push(1);
            s2.push(1);
            s2.push(1);

            expect(s1.closed).to.be.ok();
            expect(s2.closed).not.to.be.ok();
            expect(co.closed).not.to.be.ok();

            s2.close();

            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(co.closed).to.be.ok();
        });

        it("when it is a concatAll and the concatted stream closes", function() {
            var calls = [];

            var s = Fluss.Stream.create("MyStream");
            var co = s.concatAll();

            co.forEach(function(value) {
                calls.push(value);
            });

            expect(co).not.to.equal(s);

            // Weird names are given to make it more obvious what's happening
            var AAAA = Fluss.Stream.create("Sub1");
            var OOOO = Fluss.Stream.create("Sub2");
            var XXXX = Fluss.Stream.create("Sub3");

            // This defines the sequence of the substreams
            s.push(AAAA);
            s.push(OOOO);
            s.push(XXXX);

            // The pushes to the substreams are NOT in sequence
            AAAA.push(1);
            AAAA.push(2);
            OOOO.push(11);

            AAAA.push(3); AAAA.close();
            OOOO.push(12);
            XXXX.push(21);

            OOOO.push(13); OOOO.close();
            XXXX.push(22);
            XXXX.push(23); XXXX.close();
            OOOO.push(6534);  // <-- this is ignored

            s.close();
            expect(s.closed).to.be.ok();
            expect(co.closed).to.be.ok();
        });

        it("when it is a combination and both of the combined streams close", function() {
            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("B");

            var co = s1.combine(s2);

            s1.push(1);
            s1.push(1);
            s1.push(1);

            expect(s1.closed).not.to.be.ok();
            expect(s2.closed).not.to.be.ok();
            expect(co.closed).not.to.be.ok();

            s1.close();
            s2.push(1);
            s2.push(1);
            s2.push(1);

            expect(s1.closed).to.be.ok();
            expect(s2.closed).not.to.be.ok();
            expect(co.closed).not.to.be.ok();

            s2.close();
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(co.closed).to.be.ok();

            // Now close s2 first
            s1 = Fluss.Stream.create("A");
            s2 = Fluss.Stream.create("B");

            co = s1.combine(s2);

            s1.push(1);
            s1.push(1);
            s1.push(1);

            expect(s1.closed).not.to.be.ok();
            expect(s2.closed).not.to.be.ok();
            expect(co.closed).not.to.be.ok();

            s2.push(1);
            s2.push(1);
            s2.push(1);

            s2.close();

            expect(s1.closed).not.to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(co.closed).not.to.be.ok();

            s1.close();
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(co.closed).to.be.ok();

        });
    });

    describe("is closed from the start", function() {
        it("and close calls are buffered", function() {
            var s2Closed = false;
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.filter(function() {
                return 1;
            });

            s2.onClose(function() {
                s2Closed = true;
            });

            expect(s2Closed).to.be.ok();
        });

        it("when it is a filter on an already closed stream", function() {
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.filter(function() {
                return 1;
            });
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
        });

        it("when it is a map on an already closed stream", function() {
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.map(function() {
                return 1;
            });
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
        });

        it("when it is a scan on an already closed stream", function() {
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.scan(function() {
                return 1;
            }, 0);
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
        });

        it("when it is a reduction on an already closed stream", function() {
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.reduce(function() {
                return 1;
            }, 0);
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
        });

        it("when it is a concat of two already closed streams", function() {
            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("A");
            s1.close();
            s2.close();
            var s3 = s1.concat(s2);

            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(s3.closed).to.be.ok();
        });

        it("when it is a concatAll on an already closed stream", function() {
            var s1 = Fluss.Stream.create("A");
            s1.close();
            var s2 = s1.concatAll();
            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
        });

        it("when it is a combination of two already closed streams", function() {
            var s1 = Fluss.Stream.create("A");
            var s2 = Fluss.Stream.create("A");
            s1.close();
            s2.close();
            var s3 = s1.combine(s2);

            expect(s1.closed).to.be.ok();
            expect(s2.closed).to.be.ok();
            expect(s3.closed).to.be.ok();
        });

        it("will close automatically when all 'child-streams' close", function() {
            var calls = 0;
            var s = Fluss.Stream.create();
            var f = s.map(1);

            s.onClose(function() { calls++ });
            s.forEach(function() {});
            f.close();

            expect(calls).to.equal(1);

            s = Fluss.Stream.create();
            var c = Fluss.Stream.create();
            f = s.combine(c).map(1).filter(function() { return true });

            s.onClose(function() { calls++ });
            s.forEach(function() {});
            f.close();

            expect(calls).to.equal(2);
        });
    });

    it("can be reopened", function() {
        var calls = "";
        var s = Fluss.Stream.create();

        s.forEach(function(d) {
            calls += d;
        });

        s.push(1);
        s.push(2);
        s.push(3);
        s.close();
        s.push(4);
        s.push(5);
        s.push(6);
        s.reset();
        s.forEach(function(d) {
            calls += "-" + d;
        });
        s.push(7);
        s.push(8);
        s.push(9);

        expect(calls).to.equal("123-7-8-9");
    });
});

describe("Stream - Usage patterns, demonstrating", function() {
    it("being started by one event, processing another event and stopping on a third (use for D'n'D e.g)", function() {
        var start = Fluss.Stream.create();
        var interest = Fluss.Stream.create();
        var stop = Fluss.Stream.create();

        var calls = "";

        start.map(function() {
            interest.reset();
            return interest.until(stop);
        }).concatAll().forEach(function(data) {
            calls += data;
        });

        interest.push(1);
        interest.push(2);
        interest.push(3);
        interest.push(4);
        start.push(true);
        interest.push(5);
        interest.push(6);
        interest.push(7);
        interest.push(8);
        stop.push(true);
        interest.push(9);
        interest.push(10);
        interest.push(11);
        interest.push(12);

        expect(calls).to.equal("5678");
    });
});