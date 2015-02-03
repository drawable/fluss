/**
 * Created by Stephan.Smola on 30.10.2014.
 */

"use strict";

module Fluss {
    export module Errors {

        var streams = Fluss.Stream.createStreamProvider();

        function errors():Fluss.Stream.IStream {
            return streams.newStream("errors");
        }

        function fatals():Fluss.Stream.IStream {
            return streams.newStream("fatals");
        }

        function frameworks():Fluss.Stream.IStream {
            return streams.newStream("framework");
        }

        export function error(message:string, that?:any) {
            streams.push("errors", {
                message: message,
                that: that
            })
        }

        export function fatal(message:string, that?:any) {
            streams.push("fatals", {
                message: message,
                that: that
            })
        }

        export function framework(message:string, exception:any, that?:any) {
            streams.push("fatals", {
                message: message,
                exception: exception,
                that: that
            })
        }

    }
}

declare var exports: any;
if (typeof exports !== "undefined") {
    exports.Errors = Fluss.Errors;
}
