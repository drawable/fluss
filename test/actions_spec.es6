/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

import * as Actions from "../src/Actions";
import {expect} from 'chai';

describe("Actions", function() {

    describe("enumerator", function() {
        it("creates a bidirectional object of action ids", function() {
            var a = Actions.enumerateActions("A", "B", "C");

            expect(a.A).to.equal(0);
            expect(a[0]).to.equal("A");
            expect(a.B).to.equal(1);
            expect(a[1]).to.equal("B");
            expect(a.C).to.equal(2);
            expect(a[2]).to.equal("C");
        });
    })

});