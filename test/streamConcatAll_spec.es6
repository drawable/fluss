/**
 * Created by Stephan on 04.11.2015.
 */

import * as Stream from '../src/Stream'
import {expect} from 'chai';
let sinon = require('sinon');


let Fluss = {
    Stream: Stream
};

describe("A concatAll stream", () => {
   it("will close when all concated streams close", () => {
        var base = Fluss.Stream.create();

       var ca = base.map(() => {

       }).concatAll();


   })

});