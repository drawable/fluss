/**
 * Created by Stephan on 22.02.2015.
 */

"use strict";

import * as Actions from "../src/Actions";
import {expect} from 'chai';

describe("Actions", function() {

    describe("enumerator", function() {
        it("creates a bidirectional object of action ids", function() {
            var a = {A: null, B: null, C: null};
            Actions.enumerate(a);

            expect(a.A).to.equal(0);
            expect(a.B).to.equal(1);
            expect(a.C).to.equal(2);
        });
    })

});
