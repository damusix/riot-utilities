var RiotUtilities = (function () {
'use strict';

var observable = riot.observable;

var opts = {
    debug: false,
    debugFn: false
};

function Observer(obj) {

    var self = this;

    // Observerable observer for this instance
    var observer = observable();

    // Properties object to rewrap
    var properties = {};

    // Rewrap observer functions for debugging
    ['on', 'one', 'off', 'trigger'].forEach(function (fn) {

        // Simply pass by reference in production
        var execFn = observer[fn];

        // Rewrap and log if debugging
        if (opts.debug) {

            execFn = function execFn() {

                observer[fn].apply(observer[fn], arguments);

                // Hook into function for making debugging tools
                if (opts.debugFn && typeof opts.debugFn === 'function') {

                    var args = Array.prototype.slice.apply(arguments);
                    var action = args.shift();

                    opts.debugFn.apply({}, [obj, fn, action, args]);
                }
            };
        }

        // Make sure those functions cannot be overwritten
        properties[fn] = {
            value: execFn,
            enumerable: false,
            writable: false,
            configurable: false
        };
    });

    Object.defineProperties(obj, properties);
}

Observer.configure = function (obj) {

    Object.assign(opts, obj);
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var beautify = createCommonjsModule(function (module, exports) {
    /*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
    /*
    
      The MIT License (MIT)
    
      Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.
    
      Permission is hereby granted, free of charge, to any person
      obtaining a copy of this software and associated documentation files
      (the "Software"), to deal in the Software without restriction,
      including without limitation the rights to use, copy, modify, merge,
      publish, distribute, sublicense, and/or sell copies of the Software,
      and to permit persons to whom the Software is furnished to do so,
      subject to the following conditions:
    
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
    
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
      NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
      BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
      ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
      CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
    
     JS Beautifier
    ---------------
    
    
      Written by Einar Lielmanis, <einar@jsbeautifier.org>
          http://jsbeautifier.org/
    
      Originally converted to javascript by Vital, <vital76@gmail.com>
      "End braces on own line" added by Chris J. Shull, <chrisjshull@gmail.com>
      Parsing improvements for brace-less statements by Liam Newman <bitwiseman@gmail.com>
    
    
      Usage:
        js_beautify(js_source_text);
        js_beautify(js_source_text, options);
    
      The options are:
        indent_size (default 4)          - indentation size,
        indent_char (default space)      - character to indent with,
        preserve_newlines (default true) - whether existing line breaks should be preserved,
        max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk,
    
        jslint_happy (default false) - if true, then jslint-stricter mode is enforced.
    
                jslint_happy        !jslint_happy
                ---------------------------------
                function ()         function()
    
                switch () {         switch() {
                case 1:               case 1:
                  break;                break;
                }                   }
    
        space_after_anon_function (default false) - should the space before an anonymous function's parens be added, "function()" vs "function ()",
              NOTE: This option is overriden by jslint_happy (i.e. if jslint_happy is true, space_after_anon_function is true by design)
    
        brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none" | any of the former + ",preserve-inline"
                put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
                preserve-inline will try to preserve inline blocks of curly braces
    
        space_before_conditional (default true) - should the space before conditional statement be added, "if(true)" vs "if (true)",
    
        unescape_strings (default false) - should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"
    
        wrap_line_length (default unlimited) - lines should wrap at next opportunity after this number of characters.
              NOTE: This is not a hard limit. Lines will continue until a point where a newline would
                    be preserved if it were present.
    
        end_with_newline (default false)  - end output with a newline
    
    
        e.g
    
        js_beautify(js_source_text, {
          'indent_size': 1,
          'indent_char': '\t'
        });
    
    */

    // Object.values polyfill found here:
    // http://tokenposts.blogspot.com.au/2012/04/javascript-objectkeys-browser.html
    if (!Object.values) {
        Object.values = function (o) {
            if (o !== Object(o)) {
                throw new TypeError('Object.values called on a non-object');
            }
            var k = [],
                p;
            for (p in o) {
                if (Object.prototype.hasOwnProperty.call(o, p)) {
                    k.push(o[p]);
                }
            }
            return k;
        };
    }

    (function () {

        function mergeOpts(allOptions, targetType) {
            var finalOpts = {};
            var name;

            for (name in allOptions) {
                if (name !== targetType) {
                    finalOpts[name] = allOptions[name];
                }
            }

            //merge in the per type settings for the targetType
            if (targetType in allOptions) {
                for (name in allOptions[targetType]) {
                    finalOpts[name] = allOptions[targetType][name];
                }
            }
            return finalOpts;
        }

        function js_beautify(js_source_text, options) {

            var acorn = {};
            (function (exports) {
                /* jshint curly: false */
                // This section of code is taken from acorn.
                //
                // Acorn was written by Marijn Haverbeke and released under an MIT
                // license. The Unicode regexps (for identifiers and whitespace) were
                // taken from [Esprima](http://esprima.org) by Ariya Hidayat.
                //
                // Git repositories for Acorn are available at
                //
                //     http://marijnhaverbeke.nl/git/acorn
                //     https://github.com/marijnh/acorn.git

                // ## Character categories

                // Big ugly regular expressions that match characters in the
                // whitespace, identifier, and identifier-start categories. These
                // are only applied when a character is found to actually have a
                // code point above 128.

                var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/; // jshint ignore:line
                var nonASCIIidentifierStartChars = '\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC';
                var nonASCIIidentifierChars = '\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u0620-\u0649\u0672-\u06D3\u06E7-\u06E8\u06FB-\u06FC\u0730-\u074A\u0800-\u0814\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0840-\u0857\u08E4-\u08FE\u0900-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09D7\u09DF-\u09E0\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5F-\u0B60\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2-\u0CE3\u0CE6-\u0CEF\u0D02\u0D03\u0D46-\u0D48\u0D57\u0D62-\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E34-\u0E3A\u0E40-\u0E45\u0E50-\u0E59\u0EB4-\u0EB9\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F41-\u0F47\u0F71-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1029\u1040-\u1049\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u170E-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17B2\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1920-\u192B\u1930-\u193B\u1951-\u196D\u19B0-\u19C0\u19C8-\u19C9\u19D0-\u19D9\u1A00-\u1A15\u1A20-\u1A53\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1B46-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C00-\u1C22\u1C40-\u1C49\u1C5B-\u1C7D\u1CD0-\u1CD2\u1D00-\u1DBE\u1E01-\u1F15\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2D81-\u2D96\u2DE0-\u2DFF\u3021-\u3028\u3099\u309A\uA640-\uA66D\uA674-\uA67D\uA69F\uA6F0-\uA6F1\uA7F8-\uA800\uA806\uA80B\uA823-\uA827\uA880-\uA881\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8F3-\uA8F7\uA900-\uA909\uA926-\uA92D\uA930-\uA945\uA980-\uA983\uA9B3-\uA9C0\uAA00-\uAA27\uAA40-\uAA41\uAA4C-\uAA4D\uAA50-\uAA59\uAA7B\uAAE0-\uAAE9\uAAF2-\uAAF3\uABC0-\uABE1\uABEC\uABED\uABF0-\uABF9\uFB20-\uFB28\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F';
                var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
                var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

                // Whether a single character denotes a newline.

                exports.newline = /[\n\r\u2028\u2029]/;

                // Matches a whole line break (where CRLF is considered a single
                // line break). Used to count lines.

                // in javascript, these two differ
                // in python they are the same, different methods are called on them
                exports.lineBreak = new RegExp('\r\n|' + exports.newline.source);
                exports.allLineBreaks = new RegExp(exports.lineBreak.source, 'g');

                // Test whether a given character code starts an identifier.

                exports.isIdentifierStart = function (code) {
                    // permit $ (36) and @ (64). @ is used in ES7 decorators.
                    if (code < 65) return code === 36 || code === 64;
                    // 65 through 91 are uppercase letters.
                    if (code < 91) return true;
                    // permit _ (95).
                    if (code < 97) return code === 95;
                    // 97 through 123 are lowercase letters.
                    if (code < 123) return true;
                    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
                };

                // Test whether a given character is part of an identifier.

                exports.isIdentifierChar = function (code) {
                    if (code < 48) return code === 36;
                    if (code < 58) return true;
                    if (code < 65) return false;
                    if (code < 91) return true;
                    if (code < 97) return code === 95;
                    if (code < 123) return true;
                    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
                };
            })(acorn);
            /* jshint curly: true */

            function in_array(what, arr) {
                for (var i = 0; i < arr.length; i += 1) {
                    if (arr[i] === what) {
                        return true;
                    }
                }
                return false;
            }

            function trim(s) {
                return s.replace(/^\s+|\s+$/g, '');
            }

            function ltrim(s) {
                return s.replace(/^\s+/g, '');
            }

            // function rtrim(s) {
            //     return s.replace(/\s+$/g, '');
            // }

            function sanitizeOperatorPosition(opPosition) {
                opPosition = opPosition || OPERATOR_POSITION.before_newline;

                var validPositionValues = Object.values(OPERATOR_POSITION);

                if (!in_array(opPosition, validPositionValues)) {
                    throw new Error("Invalid Option Value: The option 'operator_position' must be one of the following values\n" + validPositionValues + "\nYou passed in: '" + opPosition + "'");
                }

                return opPosition;
            }

            var OPERATOR_POSITION = {
                before_newline: 'before-newline',
                after_newline: 'after-newline',
                preserve_newline: 'preserve-newline'
            };

            var OPERATOR_POSITION_BEFORE_OR_PRESERVE = [OPERATOR_POSITION.before_newline, OPERATOR_POSITION.preserve_newline];

            var MODE = {
                BlockStatement: 'BlockStatement', // 'BLOCK'
                Statement: 'Statement', // 'STATEMENT'
                ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
                ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
                ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
                Conditional: 'Conditional', //'(COND-EXPRESSION)',
                Expression: 'Expression' //'(EXPRESSION)'
            };

            function Beautifier(js_source_text, options) {
                "use strict";

                var output;
                var tokens = [],
                    token_pos;
                var Tokenizer;
                var current_token;
                var last_type, last_last_text, indent_string;
                var flags, previous_flags, flag_store;
                var prefix;

                var handlers, opt;
                var baseIndentString = '';

                handlers = {
                    'TK_START_EXPR': handle_start_expr,
                    'TK_END_EXPR': handle_end_expr,
                    'TK_START_BLOCK': handle_start_block,
                    'TK_END_BLOCK': handle_end_block,
                    'TK_WORD': handle_word,
                    'TK_RESERVED': handle_word,
                    'TK_SEMICOLON': handle_semicolon,
                    'TK_STRING': handle_string,
                    'TK_EQUALS': handle_equals,
                    'TK_OPERATOR': handle_operator,
                    'TK_COMMA': handle_comma,
                    'TK_BLOCK_COMMENT': handle_block_comment,
                    'TK_COMMENT': handle_comment,
                    'TK_DOT': handle_dot,
                    'TK_UNKNOWN': handle_unknown,
                    'TK_EOF': handle_eof
                };

                function create_flags(flags_base, mode) {
                    var next_indent_level = 0;
                    if (flags_base) {
                        next_indent_level = flags_base.indentation_level;
                        if (!output.just_added_newline() && flags_base.line_indent_level > next_indent_level) {
                            next_indent_level = flags_base.line_indent_level;
                        }
                    }

                    var next_flags = {
                        mode: mode,
                        parent: flags_base,
                        last_text: flags_base ? flags_base.last_text : '', // last token text
                        last_word: flags_base ? flags_base.last_word : '', // last 'TK_WORD' passed
                        declaration_statement: false,
                        declaration_assignment: false,
                        multiline_frame: false,
                        inline_frame: false,
                        if_block: false,
                        else_block: false,
                        do_block: false,
                        do_while: false,
                        import_block: false,
                        in_case_statement: false, // switch(..){ INSIDE HERE }
                        in_case: false, // we're on the exact line with "case 0:"
                        case_body: false, // the indented case-action block
                        indentation_level: next_indent_level,
                        line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
                        start_line_index: output.get_line_number(),
                        ternary_depth: 0
                    };
                    return next_flags;
                }

                // Some interpreters have unexpected results with foo = baz || bar;
                options = options ? options : {};

                // Allow the setting of language/file-type specific options
                // with inheritance of overall settings
                options = mergeOpts(options, 'js');

                opt = {};

                // compatibility, re
                if (options.brace_style === "expand-strict") {
                    //graceful handling of deprecated option
                    options.brace_style = "expand";
                } else if (options.brace_style === "collapse-preserve-inline") {
                    //graceful handling of deprecated option
                    options.brace_style = "collapse,preserve-inline";
                } else if (options.braces_on_own_line !== undefined) {
                    //graceful handling of deprecated option
                    options.brace_style = options.braces_on_own_line ? "expand" : "collapse";
                } else if (!options.brace_style) //Nothing exists to set it
                    {
                        options.brace_style = "collapse";
                    }

                var brace_style_split = options.brace_style.split(/[^a-zA-Z0-9_\-]+/);
                opt.brace_style = brace_style_split[0];
                opt.brace_preserve_inline = brace_style_split[1] ? brace_style_split[1] : false;

                opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
                opt.indent_char = options.indent_char ? options.indent_char : ' ';
                opt.eol = options.eol ? options.eol : 'auto';
                opt.preserve_newlines = options.preserve_newlines === undefined ? true : options.preserve_newlines;
                opt.break_chained_methods = options.break_chained_methods === undefined ? false : options.break_chained_methods;
                opt.max_preserve_newlines = options.max_preserve_newlines === undefined ? 0 : parseInt(options.max_preserve_newlines, 10);
                opt.space_in_paren = options.space_in_paren === undefined ? false : options.space_in_paren;
                opt.space_in_empty_paren = options.space_in_empty_paren === undefined ? false : options.space_in_empty_paren;
                opt.jslint_happy = options.jslint_happy === undefined ? false : options.jslint_happy;
                opt.space_after_anon_function = options.space_after_anon_function === undefined ? false : options.space_after_anon_function;
                opt.keep_array_indentation = options.keep_array_indentation === undefined ? false : options.keep_array_indentation;
                opt.space_before_conditional = options.space_before_conditional === undefined ? true : options.space_before_conditional;
                opt.unescape_strings = options.unescape_strings === undefined ? false : options.unescape_strings;
                opt.wrap_line_length = options.wrap_line_length === undefined ? 0 : parseInt(options.wrap_line_length, 10);
                opt.e4x = options.e4x === undefined ? false : options.e4x;
                opt.end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
                opt.comma_first = options.comma_first === undefined ? false : options.comma_first;
                opt.operator_position = sanitizeOperatorPosition(options.operator_position);

                // For testing of beautify ignore:start directive
                opt.test_output_raw = options.test_output_raw === undefined ? false : options.test_output_raw;

                // force opt.space_after_anon_function to true if opt.jslint_happy
                if (opt.jslint_happy) {
                    opt.space_after_anon_function = true;
                }

                if (options.indent_with_tabs) {
                    opt.indent_char = '\t';
                    opt.indent_size = 1;
                }

                if (opt.eol === 'auto') {
                    opt.eol = '\n';
                    if (js_source_text && acorn.lineBreak.test(js_source_text || '')) {
                        opt.eol = js_source_text.match(acorn.lineBreak)[0];
                    }
                }

                opt.eol = opt.eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

                //----------------------------------
                indent_string = '';
                while (opt.indent_size > 0) {
                    indent_string += opt.indent_char;
                    opt.indent_size -= 1;
                }

                var preindent_index = 0;
                if (js_source_text && js_source_text.length) {
                    while (js_source_text.charAt(preindent_index) === ' ' || js_source_text.charAt(preindent_index) === '\t') {
                        baseIndentString += js_source_text.charAt(preindent_index);
                        preindent_index += 1;
                    }
                    js_source_text = js_source_text.substring(preindent_index);
                }

                last_type = 'TK_START_BLOCK'; // last token type
                last_last_text = ''; // pre-last token text
                output = new Output(indent_string, baseIndentString);

                // If testing the ignore directive, start with output disable set to true
                output.raw = opt.test_output_raw;

                // Stack of parsing/formatting states, including MODE.
                // We tokenize, parse, and output in an almost purely a forward-only stream of token input
                // and formatted output.  This makes the beautifier less accurate than full parsers
                // but also far more tolerant of syntax errors.
                //
                // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
                // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
                // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a ";",
                // most full parsers would die, but the beautifier gracefully falls back to
                // MODE.BlockStatement and continues on.
                flag_store = [];
                set_mode(MODE.BlockStatement);

                this.beautify = function () {

                    /*jshint onevar:true */
                    var sweet_code;
                    Tokenizer = new tokenizer(js_source_text, opt, indent_string);
                    tokens = Tokenizer.tokenize();
                    token_pos = 0;

                    current_token = get_token();
                    while (current_token) {
                        handlers[current_token.type]();

                        last_last_text = flags.last_text;
                        last_type = current_token.type;
                        flags.last_text = current_token.text;

                        token_pos += 1;
                        current_token = get_token();
                    }

                    sweet_code = output.get_code();
                    if (opt.end_with_newline) {
                        sweet_code += '\n';
                    }

                    if (opt.eol !== '\n') {
                        sweet_code = sweet_code.replace(/[\n]/g, opt.eol);
                    }

                    return sweet_code;
                };

                function handle_whitespace_and_comments(local_token, preserve_statement_flags) {
                    var newlines = local_token.newlines;
                    var keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);
                    var temp_token = current_token;

                    for (var h = 0; h < local_token.comments_before.length; h++) {
                        // The cleanest handling of inline comments is to treat them as though they aren't there.
                        // Just continue formatting and the behavior should be logical.
                        // Also ignore unknown tokens.  Again, this should result in better behavior.
                        current_token = local_token.comments_before[h];
                        handle_whitespace_and_comments(current_token, preserve_statement_flags);
                        handlers[current_token.type](preserve_statement_flags);
                    }
                    current_token = temp_token;

                    if (keep_whitespace) {
                        for (var i = 0; i < newlines; i += 1) {
                            print_newline(i > 0, preserve_statement_flags);
                        }
                    } else {
                        if (opt.max_preserve_newlines && newlines > opt.max_preserve_newlines) {
                            newlines = opt.max_preserve_newlines;
                        }

                        if (opt.preserve_newlines) {
                            if (local_token.newlines > 1) {
                                print_newline(false, preserve_statement_flags);
                                for (var j = 1; j < newlines; j += 1) {
                                    print_newline(true, preserve_statement_flags);
                                }
                            }
                        }
                    }
                }

                // we could use just string.split, but
                // IE doesn't like returning empty strings
                function split_linebreaks(s) {
                    //return s.split(/\x0d\x0a|\x0a/);

                    s = s.replace(acorn.allLineBreaks, '\n');
                    var out = [],
                        idx = s.indexOf("\n");
                    while (idx !== -1) {
                        out.push(s.substring(0, idx));
                        s = s.substring(idx + 1);
                        idx = s.indexOf("\n");
                    }
                    if (s.length) {
                        out.push(s);
                    }
                    return out;
                }

                var newline_restricted_tokens = ['break', 'continue', 'return', 'throw'];

                function allow_wrap_or_preserved_newline(force_linewrap) {
                    force_linewrap = force_linewrap === undefined ? false : force_linewrap;

                    // Never wrap the first token on a line
                    if (output.just_added_newline()) {
                        return;
                    }

                    var shouldPreserveOrForce = opt.preserve_newlines && current_token.wanted_newline || force_linewrap;
                    var operatorLogicApplies = in_array(flags.last_text, Tokenizer.positionable_operators) || in_array(current_token.text, Tokenizer.positionable_operators);

                    if (operatorLogicApplies) {
                        var shouldPrintOperatorNewline = in_array(flags.last_text, Tokenizer.positionable_operators) && in_array(opt.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE) || in_array(current_token.text, Tokenizer.positionable_operators);
                        shouldPreserveOrForce = shouldPreserveOrForce && shouldPrintOperatorNewline;
                    }

                    if (shouldPreserveOrForce) {
                        print_newline(false, true);
                    } else if (opt.wrap_line_length) {
                        if (last_type === 'TK_RESERVED' && in_array(flags.last_text, newline_restricted_tokens)) {
                            // These tokens should never have a newline inserted
                            // between them and the following expression.
                            return;
                        }
                        var proposed_line_length = output.current_line.get_character_count() + current_token.text.length + (output.space_before_token ? 1 : 0);
                        if (proposed_line_length >= opt.wrap_line_length) {
                            print_newline(false, true);
                        }
                    }
                }

                function print_newline(force_newline, preserve_statement_flags) {
                    if (!preserve_statement_flags) {
                        if (flags.last_text !== ';' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
                            var next_token = get_token(1);
                            while (flags.mode === MODE.Statement && !(flags.if_block && next_token && next_token.type === 'TK_RESERVED' && next_token.text === 'else') && !flags.do_block) {
                                restore_mode();
                            }
                        }
                    }

                    if (output.add_new_line(force_newline)) {
                        flags.multiline_frame = true;
                    }
                }

                function print_token_line_indentation() {
                    if (output.just_added_newline()) {
                        if (opt.keep_array_indentation && is_array(flags.mode) && current_token.wanted_newline) {
                            output.current_line.push(current_token.whitespace_before);
                            output.space_before_token = false;
                        } else if (output.set_indent(flags.indentation_level)) {
                            flags.line_indent_level = flags.indentation_level;
                        }
                    }
                }

                function print_token(printable_token) {
                    if (output.raw) {
                        output.add_raw_token(current_token);
                        return;
                    }

                    if (opt.comma_first && last_type === 'TK_COMMA' && output.just_added_newline()) {
                        if (output.previous_line.last() === ',') {
                            var popped = output.previous_line.pop();
                            // if the comma was already at the start of the line,
                            // pull back onto that line and reprint the indentation
                            if (output.previous_line.is_empty()) {
                                output.previous_line.push(popped);
                                output.trim(true);
                                output.current_line.pop();
                                output.trim();
                            }

                            // add the comma in front of the next token
                            print_token_line_indentation();
                            output.add_token(',');
                            output.space_before_token = true;
                        }
                    }

                    printable_token = printable_token || current_token.text;
                    print_token_line_indentation();
                    output.add_token(printable_token);
                }

                function indent() {
                    flags.indentation_level += 1;
                }

                function deindent() {
                    if (flags.indentation_level > 0 && (!flags.parent || flags.indentation_level > flags.parent.indentation_level)) {
                        flags.indentation_level -= 1;
                    }
                }

                function set_mode(mode) {
                    if (flags) {
                        flag_store.push(flags);
                        previous_flags = flags;
                    } else {
                        previous_flags = create_flags(null, mode);
                    }

                    flags = create_flags(previous_flags, mode);
                }

                function is_array(mode) {
                    return mode === MODE.ArrayLiteral;
                }

                function is_expression(mode) {
                    return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
                }

                function restore_mode() {
                    if (flag_store.length > 0) {
                        previous_flags = flags;
                        flags = flag_store.pop();
                        if (previous_flags.mode === MODE.Statement) {
                            output.remove_redundant_indentation(previous_flags);
                        }
                    }
                }

                function start_of_object_property() {
                    return flags.parent.mode === MODE.ObjectLiteral && flags.mode === MODE.Statement && (flags.last_text === ':' && flags.ternary_depth === 0 || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']));
                }

                function start_of_statement() {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD' || last_type === 'TK_RESERVED' && flags.last_text === 'do' || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['return', 'throw']) && !current_token.wanted_newline || last_type === 'TK_RESERVED' && flags.last_text === 'else' && !(current_token.type === 'TK_RESERVED' && current_token.text === 'if' && !current_token.comments_before.length) || last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional) || last_type === 'TK_WORD' && flags.mode === MODE.BlockStatement && !flags.in_case && !(current_token.text === '--' || current_token.text === '++') && last_last_text !== 'function' && current_token.type !== 'TK_WORD' && current_token.type !== 'TK_RESERVED' || flags.mode === MODE.ObjectLiteral && (flags.last_text === ':' && flags.ternary_depth === 0 || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']))) {

                        set_mode(MODE.Statement);
                        indent();

                        handle_whitespace_and_comments(current_token, true);

                        // Issue #276:
                        // If starting a new statement with [if, for, while, do], push to a new line.
                        // if (a) if (b) if(c) d(); else e(); else f();
                        if (!start_of_object_property()) {
                            allow_wrap_or_preserved_newline(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['do', 'for', 'if', 'while']));
                        }

                        return true;
                    }
                    return false;
                }

                function all_lines_start_with(lines, c) {
                    for (var i = 0; i < lines.length; i++) {
                        var line = trim(lines[i]);
                        if (line.charAt(0) !== c) {
                            return false;
                        }
                    }
                    return true;
                }

                function each_line_matches_indent(lines, indent) {
                    var i = 0,
                        len = lines.length,
                        line;
                    for (; i < len; i++) {
                        line = lines[i];
                        // allow empty lines to pass through
                        if (line && line.indexOf(indent) !== 0) {
                            return false;
                        }
                    }
                    return true;
                }

                function is_special_word(word) {
                    return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
                }

                function get_token(offset) {
                    var index = token_pos + (offset || 0);
                    return index < 0 || index >= tokens.length ? null : tokens[index];
                }

                function handle_start_expr() {
                    // The conditional starts the statement if appropriate.
                    if (!start_of_statement()) {
                        handle_whitespace_and_comments(current_token);
                    }

                    var next_mode = MODE.Expression;
                    if (current_token.text === '[') {

                        if (last_type === 'TK_WORD' || flags.last_text === ')') {
                            // this is array index specifier, break immediately
                            // a[x], fn()[x]
                            if (last_type === 'TK_RESERVED' && in_array(flags.last_text, Tokenizer.line_starters)) {
                                output.space_before_token = true;
                            }
                            set_mode(next_mode);
                            print_token();
                            indent();
                            if (opt.space_in_paren) {
                                output.space_before_token = true;
                            }
                            return;
                        }

                        next_mode = MODE.ArrayLiteral;
                        if (is_array(flags.mode)) {
                            if (flags.last_text === '[' || flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}')) {
                                // ], [ goes to new line
                                // }, [ goes to new line
                                if (!opt.keep_array_indentation) {
                                    print_newline();
                                }
                            }
                        }
                    } else {
                        if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
                            next_mode = MODE.ForInitializer;
                        } else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
                            next_mode = MODE.Conditional;
                        } else {
                            // next_mode = MODE.Expression;
                        }
                    }

                    if (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                        // TODO: Consider whether forcing this is required.  Review failing tests when removed.
                        allow_wrap_or_preserved_newline(current_token.wanted_newline);
                        // do nothing on (( and )( and ][ and ]( and .(
                    } else if (!(last_type === 'TK_RESERVED' && current_token.text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                        output.space_before_token = true;
                    } else if (last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof') || flags.last_text === '*' && (in_array(last_last_text, ['function', 'yield']) || flags.mode === MODE.ObjectLiteral && in_array(last_last_text, ['{', ',']))) {
                        // function() vs function ()
                        // yield*() vs yield* ()
                        // function*() vs function* ()
                        if (opt.space_after_anon_function) {
                            output.space_before_token = true;
                        }
                    } else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === 'catch')) {
                        if (opt.space_before_conditional) {
                            output.space_before_token = true;
                        }
                    }

                    // Should be a space between await and an IIFE
                    if (current_token.text === '(' && last_type === 'TK_RESERVED' && flags.last_word === 'await') {
                        output.space_before_token = true;
                    }

                    // Support of this kind of newline preservation.
                    // a = (b &&
                    //     (c || d));
                    if (current_token.text === '(') {
                        if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                            if (!start_of_object_property()) {
                                allow_wrap_or_preserved_newline();
                            }
                        }
                    }

                    // Support preserving wrapped arrow function expressions
                    // a.b('c',
                    //     () => d.e
                    // )
                    if (current_token.text === '(' && last_type !== 'TK_WORD' && last_type !== 'TK_RESERVED') {
                        allow_wrap_or_preserved_newline();
                    }

                    set_mode(next_mode);
                    print_token();
                    if (opt.space_in_paren) {
                        output.space_before_token = true;
                    }

                    // In all cases, if we newline while inside an expression it should be indented.
                    indent();
                }

                function handle_end_expr() {
                    // statements inside expressions are not valid syntax, but...
                    // statements must all be closed when their container closes
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }

                    handle_whitespace_and_comments(current_token);

                    if (flags.multiline_frame) {
                        allow_wrap_or_preserved_newline(current_token.text === ']' && is_array(flags.mode) && !opt.keep_array_indentation);
                    }

                    if (opt.space_in_paren) {
                        if (last_type === 'TK_START_EXPR' && !opt.space_in_empty_paren) {
                            // () [] no inner space in empty parens like these, ever, ref #320
                            output.trim();
                            output.space_before_token = false;
                        } else {
                            output.space_before_token = true;
                        }
                    }
                    if (current_token.text === ']' && opt.keep_array_indentation) {
                        print_token();
                        restore_mode();
                    } else {
                        restore_mode();
                        print_token();
                    }
                    output.remove_redundant_indentation(previous_flags);

                    // do {} while () // no statement required after
                    if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                        previous_flags.mode = MODE.Expression;
                        flags.do_block = false;
                        flags.do_while = false;
                    }
                }

                function handle_start_block() {
                    handle_whitespace_and_comments(current_token);

                    // Check if this is should be treated as a ObjectLiteral
                    var next_token = get_token(1);
                    var second_token = get_token(2);
                    if (second_token && (in_array(second_token.text, [':', ',']) && in_array(next_token.type, ['TK_STRING', 'TK_WORD', 'TK_RESERVED']) || in_array(next_token.text, ['get', 'set', '...']) && in_array(second_token.type, ['TK_WORD', 'TK_RESERVED']))) {
                        // We don't support TypeScript,but we didn't break it for a very long time.
                        // We'll try to keep not breaking it.
                        if (!in_array(last_last_text, ['class', 'interface'])) {
                            set_mode(MODE.ObjectLiteral);
                        } else {
                            set_mode(MODE.BlockStatement);
                        }
                    } else if (last_type === 'TK_OPERATOR' && flags.last_text === '=>') {
                        // arrow function: (param1, paramN) => { statements }
                        set_mode(MODE.BlockStatement);
                    } else if (in_array(last_type, ['TK_EQUALS', 'TK_START_EXPR', 'TK_COMMA', 'TK_OPERATOR']) || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['return', 'throw', 'import', 'default'])) {
                        // Detecting shorthand function syntax is difficult by scanning forward,
                        //     so check the surrounding context.
                        // If the block is being returned, imported, export default, passed as arg,
                        //     assigned with = or assigned in a nested object, treat as an ObjectLiteral.
                        set_mode(MODE.ObjectLiteral);
                    } else {
                        set_mode(MODE.BlockStatement);
                    }

                    var empty_braces = !next_token.comments_before.length && next_token.text === '}';
                    var empty_anonymous_function = empty_braces && flags.last_word === 'function' && last_type === 'TK_END_EXPR';

                    if (opt.brace_preserve_inline) // check for inline, set inline_frame if so
                        {
                            // search forward for a newline wanted inside this block
                            var index = 0;
                            var check_token = null;
                            flags.inline_frame = true;
                            do {
                                index += 1;
                                check_token = get_token(index);
                                if (check_token.wanted_newline) {
                                    flags.inline_frame = false;
                                    break;
                                }
                            } while (check_token.type !== 'TK_EOF' && !(check_token.type === 'TK_END_BLOCK' && check_token.opened === current_token));
                        }

                    if ((opt.brace_style === "expand" || opt.brace_style === "none" && current_token.wanted_newline) && !flags.inline_frame) {
                        if (last_type !== 'TK_OPERATOR' && (empty_anonymous_function || last_type === 'TK_EQUALS' || last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else')) {
                            output.space_before_token = true;
                        } else {
                            print_newline(false, true);
                        }
                    } else {
                        // collapse || inline_frame
                        if (is_array(previous_flags.mode) && (last_type === 'TK_START_EXPR' || last_type === 'TK_COMMA')) {
                            if (last_type === 'TK_COMMA' || opt.space_in_paren) {
                                output.space_before_token = true;
                            }

                            if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' && flags.inline_frame) {
                                allow_wrap_or_preserved_newline();
                                previous_flags.multiline_frame = previous_flags.multiline_frame || flags.multiline_frame;
                                flags.multiline_frame = false;
                            }
                        }
                        if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                            if (last_type === 'TK_START_BLOCK' && !flags.inline_frame) {
                                print_newline();
                            } else {
                                output.space_before_token = true;
                            }
                        }
                    }
                    print_token();
                    indent();
                }

                function handle_end_block() {
                    // statements must all be closed when their container closes
                    handle_whitespace_and_comments(current_token);

                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }

                    var empty_braces = last_type === 'TK_START_BLOCK';

                    if (flags.inline_frame && !empty_braces) {
                        // try inline_frame (only set if opt.braces-preserve-inline) first
                        output.space_before_token = true;
                    } else if (opt.brace_style === "expand") {
                        if (!empty_braces) {
                            print_newline();
                        }
                    } else {
                        // skip {}
                        if (!empty_braces) {
                            if (is_array(flags.mode) && opt.keep_array_indentation) {
                                // we REALLY need a newline here, but newliner would skip that
                                opt.keep_array_indentation = false;
                                print_newline();
                                opt.keep_array_indentation = true;
                            } else {
                                print_newline();
                            }
                        }
                    }
                    restore_mode();
                    print_token();
                }

                function handle_word() {
                    if (current_token.type === 'TK_RESERVED') {
                        if (in_array(current_token.text, ['set', 'get']) && flags.mode !== MODE.ObjectLiteral) {
                            current_token.type = 'TK_WORD';
                        } else if (in_array(current_token.text, ['as', 'from']) && !flags.import_block) {
                            current_token.type = 'TK_WORD';
                        } else if (flags.mode === MODE.ObjectLiteral) {
                            var next_token = get_token(1);
                            if (next_token.text === ':') {
                                current_token.type = 'TK_WORD';
                            }
                        }
                    }

                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                        if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD') {
                            flags.declaration_statement = true;
                        }
                    } else if (current_token.wanted_newline && !is_expression(flags.mode) && (last_type !== 'TK_OPERATOR' || flags.last_text === '--' || flags.last_text === '++') && last_type !== 'TK_EQUALS' && (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const', 'set', 'get'])))) {
                        handle_whitespace_and_comments(current_token);
                        print_newline();
                    } else {
                        handle_whitespace_and_comments(current_token);
                    }

                    if (flags.do_block && !flags.do_while) {
                        if (current_token.type === 'TK_RESERVED' && current_token.text === 'while') {
                            // do {} ## while ()
                            output.space_before_token = true;
                            print_token();
                            output.space_before_token = true;
                            flags.do_while = true;
                            return;
                        } else {
                            // do {} should always have while as the next word.
                            // if we don't see the expected while, recover
                            print_newline();
                            flags.do_block = false;
                        }
                    }

                    // if may be followed by else, or not
                    // Bare/inline ifs are tricky
                    // Need to unwind the modes correctly: if (a) if (b) c(); else d(); else e();
                    if (flags.if_block) {
                        if (!flags.else_block && current_token.type === 'TK_RESERVED' && current_token.text === 'else') {
                            flags.else_block = true;
                        } else {
                            while (flags.mode === MODE.Statement) {
                                restore_mode();
                            }
                            flags.if_block = false;
                            flags.else_block = false;
                        }
                    }

                    if (current_token.type === 'TK_RESERVED' && (current_token.text === 'case' || current_token.text === 'default' && flags.in_case_statement)) {
                        print_newline();
                        if (flags.case_body || opt.jslint_happy) {
                            // switch cases following one another
                            deindent();
                            flags.case_body = false;
                        }
                        print_token();
                        flags.in_case = true;
                        flags.in_case_statement = true;
                        return;
                    }

                    if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                        if (!start_of_object_property()) {
                            allow_wrap_or_preserved_newline();
                        }
                    }

                    if (current_token.type === 'TK_RESERVED' && current_token.text === 'function') {
                        if (in_array(flags.last_text, ['}', ';']) || output.just_added_newline() && !(in_array(flags.last_text, ['(', '[', '{', ':', '=', ',']) || last_type === 'TK_OPERATOR')) {
                            // make sure there is a nice clean space of at least one blank line
                            // before a new function definition
                            if (!output.just_added_blankline() && !current_token.comments_before.length) {
                                print_newline();
                                print_newline(true);
                            }
                        }
                        if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                            if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return', 'export', 'async'])) {
                                output.space_before_token = true;
                            } else if (last_type === 'TK_RESERVED' && flags.last_text === 'default' && last_last_text === 'export') {
                                output.space_before_token = true;
                            } else {
                                print_newline();
                            }
                        } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                            // foo = function
                            output.space_before_token = true;
                        } else if (!flags.multiline_frame && (is_expression(flags.mode) || is_array(flags.mode))) {
                            // (function
                        } else {
                            print_newline();
                        }

                        print_token();
                        flags.last_word = current_token.text;
                        return;
                    }

                    prefix = 'NONE';

                    if (last_type === 'TK_END_BLOCK') {

                        if (previous_flags.inline_frame) {
                            prefix = 'SPACE';
                        } else if (!(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally', 'from']))) {
                            prefix = 'NEWLINE';
                        } else {
                            if (opt.brace_style === "expand" || opt.brace_style === "end-expand" || opt.brace_style === "none" && current_token.wanted_newline) {
                                prefix = 'NEWLINE';
                            } else {
                                prefix = 'SPACE';
                                output.space_before_token = true;
                            }
                        }
                    } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                        // TODO: Should this be for STATEMENT as well?
                        prefix = 'NEWLINE';
                    } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                        prefix = 'SPACE';
                    } else if (last_type === 'TK_STRING') {
                        prefix = 'NEWLINE';
                    } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' || flags.last_text === '*' && (in_array(last_last_text, ['function', 'yield']) || flags.mode === MODE.ObjectLiteral && in_array(last_last_text, ['{', ',']))) {
                        prefix = 'SPACE';
                    } else if (last_type === 'TK_START_BLOCK') {
                        if (flags.inline_frame) {
                            prefix = 'SPACE';
                        } else {
                            prefix = 'NEWLINE';
                        }
                    } else if (last_type === 'TK_END_EXPR') {
                        output.space_before_token = true;
                        prefix = 'NEWLINE';
                    }

                    if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                        if (flags.inline_frame || flags.last_text === 'else' || flags.last_text === 'export') {
                            prefix = 'SPACE';
                        } else {
                            prefix = 'NEWLINE';
                        }
                    }

                    if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally'])) {
                        if ((!(last_type === 'TK_END_BLOCK' && previous_flags.mode === MODE.BlockStatement) || opt.brace_style === "expand" || opt.brace_style === "end-expand" || opt.brace_style === "none" && current_token.wanted_newline) && !flags.inline_frame) {
                            print_newline();
                        } else {
                            output.trim(true);
                            var line = output.current_line;
                            // If we trimmed and there's something other than a close block before us
                            // put a newline back in.  Handles '} // comment' scenario.
                            if (line.last() !== '}') {
                                print_newline();
                            }
                            output.space_before_token = true;
                        }
                    } else if (prefix === 'NEWLINE') {
                        if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                            // no newline between 'return nnn'
                            output.space_before_token = true;
                        } else if (last_type !== 'TK_END_EXPR') {
                            if ((last_type !== 'TK_START_EXPR' || !(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['var', 'let', 'const']))) && flags.last_text !== ':') {
                                // no need to force newline on 'var': for (var x = 0...)
                                if (current_token.type === 'TK_RESERVED' && current_token.text === 'if' && flags.last_text === 'else') {
                                    // no newline for } else if {
                                    output.space_before_token = true;
                                } else {
                                    print_newline();
                                }
                            }
                        } else if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                            print_newline();
                        }
                    } else if (flags.multiline_frame && is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                        print_newline(); // }, in lists get a newline treatment
                    } else if (prefix === 'SPACE') {
                        output.space_before_token = true;
                    }
                    print_token();
                    flags.last_word = current_token.text;

                    if (current_token.type === 'TK_RESERVED') {
                        if (current_token.text === 'do') {
                            flags.do_block = true;
                        } else if (current_token.text === 'if') {
                            flags.if_block = true;
                        } else if (current_token.text === 'import') {
                            flags.import_block = true;
                        } else if (flags.import_block && current_token.type === 'TK_RESERVED' && current_token.text === 'from') {
                            flags.import_block = false;
                        }
                    }
                }

                function handle_semicolon() {
                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                        // Semicolon can be the start (and end) of a statement
                        output.space_before_token = false;
                    } else {
                        handle_whitespace_and_comments(current_token);
                    }

                    var next_token = get_token(1);
                    while (flags.mode === MODE.Statement && !(flags.if_block && next_token && next_token.type === 'TK_RESERVED' && next_token.text === 'else') && !flags.do_block) {
                        restore_mode();
                    }

                    // hacky but effective for the moment
                    if (flags.import_block) {
                        flags.import_block = false;
                    }
                    print_token();
                }

                function handle_string() {
                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                        // One difference - strings want at least a space before
                        output.space_before_token = true;
                    } else {
                        handle_whitespace_and_comments(current_token);
                        if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' || flags.inline_frame) {
                            output.space_before_token = true;
                        } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                            if (!start_of_object_property()) {
                                allow_wrap_or_preserved_newline();
                            }
                        } else {
                            print_newline();
                        }
                    }
                    print_token();
                }

                function handle_equals() {
                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                    } else {
                        handle_whitespace_and_comments(current_token);
                    }

                    if (flags.declaration_statement) {
                        // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                        flags.declaration_assignment = true;
                    }
                    output.space_before_token = true;
                    print_token();
                    output.space_before_token = true;
                }

                function handle_comma() {
                    handle_whitespace_and_comments(current_token, true);

                    print_token();
                    output.space_before_token = true;
                    if (flags.declaration_statement) {
                        if (is_expression(flags.parent.mode)) {
                            // do not break on comma, for(var a = 1, b = 2)
                            flags.declaration_assignment = false;
                        }

                        if (flags.declaration_assignment) {
                            flags.declaration_assignment = false;
                            print_newline(false, true);
                        } else if (opt.comma_first) {
                            // for comma-first, we want to allow a newline before the comma
                            // to turn into a newline after the comma, which we will fixup later
                            allow_wrap_or_preserved_newline();
                        }
                    } else if (flags.mode === MODE.ObjectLiteral || flags.mode === MODE.Statement && flags.parent.mode === MODE.ObjectLiteral) {
                        if (flags.mode === MODE.Statement) {
                            restore_mode();
                        }

                        if (!flags.inline_frame) {
                            print_newline();
                        }
                    } else if (opt.comma_first) {
                        // EXPR or DO_BLOCK
                        // for comma-first, we want to allow a newline before the comma
                        // to turn into a newline after the comma, which we will fixup later
                        allow_wrap_or_preserved_newline();
                    }
                }

                function handle_operator() {
                    var isGeneratorAsterisk = current_token.text === '*' && (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['function', 'yield']) || in_array(last_type, ['TK_START_BLOCK', 'TK_COMMA', 'TK_END_BLOCK', 'TK_SEMICOLON']));
                    var isUnary = in_array(current_token.text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === ',');

                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                    } else {
                        var preserve_statement_flags = !isGeneratorAsterisk;
                        handle_whitespace_and_comments(current_token, preserve_statement_flags);
                    }

                    if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                        // "return" had a special handling in TK_WORD. Now we need to return the favor
                        output.space_before_token = true;
                        print_token();
                        return;
                    }

                    // hack for actionscript's import .*;
                    if (current_token.text === '*' && last_type === 'TK_DOT') {
                        print_token();
                        return;
                    }

                    if (current_token.text === '::') {
                        // no spaces around exotic namespacing syntax operator
                        print_token();
                        return;
                    }

                    // Allow line wrapping between operators when operator_position is
                    //   set to before or preserve
                    if (last_type === 'TK_OPERATOR' && in_array(opt.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)) {
                        allow_wrap_or_preserved_newline();
                    }

                    if (current_token.text === ':' && flags.in_case) {
                        flags.case_body = true;
                        indent();
                        print_token();
                        print_newline();
                        flags.in_case = false;
                        return;
                    }

                    var space_before = true;
                    var space_after = true;
                    var in_ternary = false;
                    if (current_token.text === ':') {
                        if (flags.ternary_depth === 0) {
                            // Colon is invalid javascript outside of ternary and object, but do our best to guess what was meant.
                            space_before = false;
                        } else {
                            flags.ternary_depth -= 1;
                            in_ternary = true;
                        }
                    } else if (current_token.text === '?') {
                        flags.ternary_depth += 1;
                    }

                    // let's handle the operator_position option prior to any conflicting logic
                    if (!isUnary && !isGeneratorAsterisk && opt.preserve_newlines && in_array(current_token.text, Tokenizer.positionable_operators)) {
                        var isColon = current_token.text === ':';
                        var isTernaryColon = isColon && in_ternary;
                        var isOtherColon = isColon && !in_ternary;

                        switch (opt.operator_position) {
                            case OPERATOR_POSITION.before_newline:
                                // if the current token is : and it's not a ternary statement then we set space_before to false
                                output.space_before_token = !isOtherColon;

                                print_token();

                                if (!isColon || isTernaryColon) {
                                    allow_wrap_or_preserved_newline();
                                }

                                output.space_before_token = true;
                                return;

                            case OPERATOR_POSITION.after_newline:
                                // if the current token is anything but colon, or (via deduction) it's a colon and in a ternary statement,
                                //   then print a newline.

                                output.space_before_token = true;

                                if (!isColon || isTernaryColon) {
                                    if (get_token(1).wanted_newline) {
                                        print_newline(false, true);
                                    } else {
                                        allow_wrap_or_preserved_newline();
                                    }
                                } else {
                                    output.space_before_token = false;
                                }

                                print_token();

                                output.space_before_token = true;
                                return;

                            case OPERATOR_POSITION.preserve_newline:
                                if (!isOtherColon) {
                                    allow_wrap_or_preserved_newline();
                                }

                                // if we just added a newline, or the current token is : and it's not a ternary statement,
                                //   then we set space_before to false
                                space_before = !(output.just_added_newline() || isOtherColon);

                                output.space_before_token = space_before;
                                print_token();
                                output.space_before_token = true;
                                return;
                        }
                    }

                    if (isGeneratorAsterisk) {
                        allow_wrap_or_preserved_newline();
                        space_before = false;
                        var next_token = get_token(1);
                        space_after = next_token && in_array(next_token.type, ['TK_WORD', 'TK_RESERVED']);
                    } else if (current_token.text === '...') {
                        allow_wrap_or_preserved_newline();
                        space_before = last_type === 'TK_START_BLOCK';
                        space_after = false;
                    } else if (in_array(current_token.text, ['--', '++', '!', '~']) || isUnary) {
                        // unary operators (and binary +/- pretending to be unary) special cases

                        space_before = false;
                        space_after = false;

                        // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
                        // if there is a newline between -- or ++ and anything else we should preserve it.
                        if (current_token.wanted_newline && (current_token.text === '--' || current_token.text === '++')) {
                            print_newline(false, true);
                        }

                        if (flags.last_text === ';' && is_expression(flags.mode)) {
                            // for (;; ++i)
                            //        ^^^
                            space_before = true;
                        }

                        if (last_type === 'TK_RESERVED') {
                            space_before = true;
                        } else if (last_type === 'TK_END_EXPR') {
                            space_before = !(flags.last_text === ']' && (current_token.text === '--' || current_token.text === '++'));
                        } else if (last_type === 'TK_OPERATOR') {
                            // a++ + ++b;
                            // a - -b
                            space_before = in_array(current_token.text, ['--', '-', '++', '+']) && in_array(flags.last_text, ['--', '-', '++', '+']);
                            // + and - are not unary when preceeded by -- or ++ operator
                            // a-- + b
                            // a * +b
                            // a - -b
                            if (in_array(current_token.text, ['+', '-']) && in_array(flags.last_text, ['--', '++'])) {
                                space_after = true;
                            }
                        }

                        if ((flags.mode === MODE.BlockStatement && !flags.inline_frame || flags.mode === MODE.Statement) && (flags.last_text === '{' || flags.last_text === ';')) {
                            // { foo; --i }
                            // foo(); --bar;
                            print_newline();
                        }
                    }

                    output.space_before_token = output.space_before_token || space_before;
                    print_token();
                    output.space_before_token = space_after;
                }

                function handle_block_comment(preserve_statement_flags) {
                    if (output.raw) {
                        output.add_raw_token(current_token);
                        if (current_token.directives && current_token.directives.preserve === 'end') {
                            // If we're testing the raw output behavior, do not allow a directive to turn it off.
                            output.raw = opt.test_output_raw;
                        }
                        return;
                    }

                    if (current_token.directives) {
                        print_newline(false, preserve_statement_flags);
                        print_token();
                        if (current_token.directives.preserve === 'start') {
                            output.raw = true;
                        }
                        print_newline(false, true);
                        return;
                    }

                    // inline block
                    if (!acorn.newline.test(current_token.text) && !current_token.wanted_newline) {
                        output.space_before_token = true;
                        print_token();
                        output.space_before_token = true;
                        return;
                    }

                    var lines = split_linebreaks(current_token.text);
                    var j; // iterator for this case
                    var javadoc = false;
                    var starless = false;
                    var lastIndent = current_token.whitespace_before;
                    var lastIndentLength = lastIndent.length;

                    // block comment starts with a new line
                    print_newline(false, preserve_statement_flags);
                    if (lines.length > 1) {
                        javadoc = all_lines_start_with(lines.slice(1), '*');
                        starless = each_line_matches_indent(lines.slice(1), lastIndent);
                    }

                    // first line always indented
                    print_token(lines[0]);
                    for (j = 1; j < lines.length; j++) {
                        print_newline(false, true);
                        if (javadoc) {
                            // javadoc: reformat and re-indent
                            print_token(' ' + ltrim(lines[j]));
                        } else if (starless && lines[j].length > lastIndentLength) {
                            // starless: re-indent non-empty content, avoiding trim
                            print_token(lines[j].substring(lastIndentLength));
                        } else {
                            // normal comments output raw
                            output.add_token(lines[j]);
                        }
                    }

                    // for comments of more than one line, make sure there's a new line after
                    print_newline(false, preserve_statement_flags);
                }

                function handle_comment(preserve_statement_flags) {
                    if (current_token.wanted_newline) {
                        print_newline(false, preserve_statement_flags);
                    } else {
                        output.trim(true);
                    }

                    output.space_before_token = true;
                    print_token();
                    print_newline(false, preserve_statement_flags);
                }

                function handle_dot() {
                    if (start_of_statement()) {
                        // The conditional starts the statement if appropriate.
                    } else {
                        handle_whitespace_and_comments(current_token, true);
                    }

                    if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                        output.space_before_token = true;
                    } else {
                        // allow preserved newlines before dots in general
                        // force newlines on dots after close paren when break_chained - for bar().baz()
                        allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
                    }

                    print_token();
                }

                function handle_unknown(preserve_statement_flags) {
                    print_token();

                    if (current_token.text[current_token.text.length - 1] === '\n') {
                        print_newline(false, preserve_statement_flags);
                    }
                }

                function handle_eof() {
                    // Unwind any open statements
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    handle_whitespace_and_comments(current_token);
                }
            }

            function OutputLine(parent) {
                var _character_count = 0;
                // use indent_count as a marker for lines that have preserved indentation
                var _indent_count = -1;

                var _items = [];
                var _empty = true;

                this.set_indent = function (level) {
                    _character_count = parent.baseIndentLength + level * parent.indent_length;
                    _indent_count = level;
                };

                this.get_character_count = function () {
                    return _character_count;
                };

                this.is_empty = function () {
                    return _empty;
                };

                this.last = function () {
                    if (!this._empty) {
                        return _items[_items.length - 1];
                    } else {
                        return null;
                    }
                };

                this.push = function (input) {
                    _items.push(input);
                    _character_count += input.length;
                    _empty = false;
                };

                this.pop = function () {
                    var item = null;
                    if (!_empty) {
                        item = _items.pop();
                        _character_count -= item.length;
                        _empty = _items.length === 0;
                    }
                    return item;
                };

                this.remove_indent = function () {
                    if (_indent_count > 0) {
                        _indent_count -= 1;
                        _character_count -= parent.indent_length;
                    }
                };

                this.trim = function () {
                    while (this.last() === ' ') {
                        _items.pop();
                        _character_count -= 1;
                    }
                    _empty = _items.length === 0;
                };

                this.toString = function () {
                    var result = '';
                    if (!this._empty) {
                        if (_indent_count >= 0) {
                            result = parent.indent_cache[_indent_count];
                        }
                        result += _items.join('');
                    }
                    return result;
                };
            }

            function Output(indent_string, baseIndentString) {
                baseIndentString = baseIndentString || '';
                this.indent_cache = [baseIndentString];
                this.baseIndentLength = baseIndentString.length;
                this.indent_length = indent_string.length;
                this.raw = false;

                var lines = [];
                this.baseIndentString = baseIndentString;
                this.indent_string = indent_string;
                this.previous_line = null;
                this.current_line = null;
                this.space_before_token = false;

                this.add_outputline = function () {
                    this.previous_line = this.current_line;
                    this.current_line = new OutputLine(this);
                    lines.push(this.current_line);
                };

                // initialize
                this.add_outputline();

                this.get_line_number = function () {
                    return lines.length;
                };

                // Using object instead of string to allow for later expansion of info about each line
                this.add_new_line = function (force_newline) {
                    if (this.get_line_number() === 1 && this.just_added_newline()) {
                        return false; // no newline on start of file
                    }

                    if (force_newline || !this.just_added_newline()) {
                        if (!this.raw) {
                            this.add_outputline();
                        }
                        return true;
                    }

                    return false;
                };

                this.get_code = function () {
                    var sweet_code = lines.join('\n').replace(/[\r\n\t ]+$/, '');
                    return sweet_code;
                };

                this.set_indent = function (level) {
                    // Never indent your first output indent at the start of the file
                    if (lines.length > 1) {
                        while (level >= this.indent_cache.length) {
                            this.indent_cache.push(this.indent_cache[this.indent_cache.length - 1] + this.indent_string);
                        }

                        this.current_line.set_indent(level);
                        return true;
                    }
                    this.current_line.set_indent(0);
                    return false;
                };

                this.add_raw_token = function (token) {
                    for (var x = 0; x < token.newlines; x++) {
                        this.add_outputline();
                    }
                    this.current_line.push(token.whitespace_before);
                    this.current_line.push(token.text);
                    this.space_before_token = false;
                };

                this.add_token = function (printable_token) {
                    this.add_space_before_token();
                    this.current_line.push(printable_token);
                };

                this.add_space_before_token = function () {
                    if (this.space_before_token && !this.just_added_newline()) {
                        this.current_line.push(' ');
                    }
                    this.space_before_token = false;
                };

                this.remove_redundant_indentation = function (frame) {
                    // This implementation is effective but has some issues:
                    //     - can cause line wrap to happen too soon due to indent removal
                    //           after wrap points are calculated
                    // These issues are minor compared to ugly indentation.

                    if (frame.multiline_frame || frame.mode === MODE.ForInitializer || frame.mode === MODE.Conditional) {
                        return;
                    }

                    // remove one indent from each line inside this section
                    var index = frame.start_line_index;

                    var output_length = lines.length;
                    while (index < output_length) {
                        lines[index].remove_indent();
                        index++;
                    }
                };

                this.trim = function (eat_newlines) {
                    eat_newlines = eat_newlines === undefined ? false : eat_newlines;

                    this.current_line.trim(indent_string, baseIndentString);

                    while (eat_newlines && lines.length > 1 && this.current_line.is_empty()) {
                        lines.pop();
                        this.current_line = lines[lines.length - 1];
                        this.current_line.trim();
                    }

                    this.previous_line = lines.length > 1 ? lines[lines.length - 2] : null;
                };

                this.just_added_newline = function () {
                    return this.current_line.is_empty();
                };

                this.just_added_blankline = function () {
                    if (this.just_added_newline()) {
                        if (lines.length === 1) {
                            return true; // start of the file and newline = blank
                        }

                        var line = lines[lines.length - 2];
                        return line.is_empty();
                    }
                    return false;
                };
            }

            var InputScanner = function InputScanner(input) {
                var _input = input;
                var _input_length = _input.length;
                var _position = 0;

                this.back = function () {
                    _position -= 1;
                };

                this.hasNext = function () {
                    return _position < _input_length;
                };

                this.next = function () {
                    var val = null;
                    if (this.hasNext()) {
                        val = _input.charAt(_position);
                        _position += 1;
                    }
                    return val;
                };

                this.peek = function (index) {
                    var val = null;
                    index = index || 0;
                    index += _position;
                    if (index >= 0 && index < _input_length) {
                        val = _input.charAt(index);
                    }
                    return val;
                };

                this.peekCharCode = function (index) {
                    var val = 0;
                    index = index || 0;
                    index += _position;
                    if (index >= 0 && index < _input_length) {
                        val = _input.charCodeAt(index);
                    }
                    return val;
                };

                this.test = function (pattern, index) {
                    index = index || 0;
                    pattern.lastIndex = _position + index;
                    return pattern.test(_input);
                };

                this.testChar = function (pattern, index) {
                    var val = this.peek(index);
                    return val !== null && pattern.test(val);
                };

                this.match = function (pattern) {
                    pattern.lastIndex = _position;
                    var pattern_match = pattern.exec(_input);
                    if (pattern_match && pattern_match.index === _position) {
                        _position += pattern_match[0].length;
                    } else {
                        pattern_match = null;
                    }
                    return pattern_match;
                };
            };

            var Token = function Token(type, text, newlines, whitespace_before, parent) {
                this.type = type;
                this.text = text;

                // comments_before are
                // comments that have a new line before them
                // and may or may not have a newline after
                // this is a set of comments before
                this.comments_before = /* inline comment*/[];

                this.comments_after = []; // no new line before and newline after
                this.newlines = newlines || 0;
                this.wanted_newline = newlines > 0;
                this.whitespace_before = whitespace_before || '';
                this.parent = parent || null;
                this.opened = null;
                this.directives = null;
            };

            function tokenizer(input_string, opts) {

                var whitespace = "\n\r\t ".split('');
                var digit = /[0-9]/;
                var digit_bin = /[01]/;
                var digit_oct = /[01234567]/;
                var digit_hex = /[0123456789abcdefABCDEF]/;

                this.positionable_operators = '!= !== % & && * ** + - / : < << <= == === > >= >> >>> ? ^ | ||'.split(' ');
                var punct = this.positionable_operators.concat(
                // non-positionable operators - these do not follow operator position settings
                '! %= &= *= **= ++ += , -- -= /= :: <<= = => >>= >>>= ^= |= ~ ...'.split(' '));

                // words which should always start on new line.
                this.line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,import,export'.split(',');
                var reserved_words = this.line_starters.concat(['do', 'in', 'of', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof', 'yield', 'async', 'await', 'from', 'as']);

                //  /* ... */ comment ends with nearest */ or end of file
                var block_comment_pattern = /([\s\S]*?)((?:\*\/)|$)/g;

                // comment ends just before nearest linefeed or end of file
                var comment_pattern = /([^\n\r\u2028\u2029]*)/g;

                var directives_block_pattern = /\/\* beautify( \w+[:]\w+)+ \*\//g;
                var directive_pattern = / (\w+)[:](\w+)/g;
                var directives_end_ignore_pattern = /([\s\S]*?)((?:\/\*\sbeautify\signore:end\s\*\/)|$)/g;

                var template_pattern = /((<\?php|<\?=)[\s\S]*?\?>)|(<%[\s\S]*?%>)/g;

                var n_newlines, whitespace_before_token, in_html_comment, tokens;
                var input;

                this.tokenize = function () {
                    input = new InputScanner(input_string);
                    in_html_comment = false;
                    tokens = [];

                    var next, last;
                    var token_values;
                    var open = null;
                    var open_stack = [];
                    var comments = [];

                    while (!(last && last.type === 'TK_EOF')) {
                        token_values = tokenize_next();
                        next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                        while (next.type === 'TK_COMMENT' || next.type === 'TK_BLOCK_COMMENT' || next.type === 'TK_UNKNOWN') {
                            if (next.type === 'TK_BLOCK_COMMENT') {
                                next.directives = token_values[2];
                            }
                            comments.push(next);
                            token_values = tokenize_next();
                            next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                        }

                        if (comments.length) {
                            next.comments_before = comments;
                            comments = [];
                        }

                        if (next.type === 'TK_START_BLOCK' || next.type === 'TK_START_EXPR') {
                            next.parent = last;
                            open_stack.push(open);
                            open = next;
                        } else if ((next.type === 'TK_END_BLOCK' || next.type === 'TK_END_EXPR') && open && (next.text === ']' && open.text === '[' || next.text === ')' && open.text === '(' || next.text === '}' && open.text === '{')) {
                            next.parent = open.parent;
                            next.opened = open;

                            open = open_stack.pop();
                        }

                        tokens.push(next);
                        last = next;
                    }

                    return tokens;
                };

                function get_directives(text) {
                    if (!text.match(directives_block_pattern)) {
                        return null;
                    }

                    var directives = {};
                    directive_pattern.lastIndex = 0;
                    var directive_match = directive_pattern.exec(text);

                    while (directive_match) {
                        directives[directive_match[1]] = directive_match[2];
                        directive_match = directive_pattern.exec(text);
                    }

                    return directives;
                }

                function tokenize_next() {
                    var resulting_string;
                    var whitespace_on_this_line = [];

                    n_newlines = 0;
                    whitespace_before_token = '';

                    var c = input.next();

                    if (c === null) {
                        return ['', 'TK_EOF'];
                    }

                    var last_token;
                    if (tokens.length) {
                        last_token = tokens[tokens.length - 1];
                    } else {
                        // For the sake of tokenizing we can pretend that there was on open brace to start
                        last_token = new Token('TK_START_BLOCK', '{');
                    }

                    while (in_array(c, whitespace)) {

                        if (acorn.newline.test(c)) {
                            if (!(c === '\n' && input.peek(-2) === '\r')) {
                                n_newlines += 1;
                                whitespace_on_this_line = [];
                            }
                        } else {
                            whitespace_on_this_line.push(c);
                        }

                        c = input.next();

                        if (c === null) {
                            return ['', 'TK_EOF'];
                        }
                    }

                    if (whitespace_on_this_line.length) {
                        whitespace_before_token = whitespace_on_this_line.join('');
                    }

                    if (digit.test(c) || c === '.' && input.testChar(digit)) {
                        var allow_decimal = true;
                        var allow_e = true;
                        var local_digit = digit;

                        if (c === '0' && input.testChar(/[XxOoBb]/)) {
                            // switch to hex/oct/bin number, no decimal or e, just hex/oct/bin digits
                            allow_decimal = false;
                            allow_e = false;
                            if (input.testChar(/[Bb]/)) {
                                local_digit = digit_bin;
                            } else if (input.testChar(/[Oo]/)) {
                                local_digit = digit_oct;
                            } else {
                                local_digit = digit_hex;
                            }
                            c += input.next();
                        } else if (c === '.') {
                            // Already have a decimal for this literal, don't allow another
                            allow_decimal = false;
                        } else {
                            // we know this first loop will run.  It keeps the logic simpler.
                            c = '';
                            input.back();
                        }

                        // Add the digits
                        while (input.testChar(local_digit)) {
                            c += input.next();

                            if (allow_decimal && input.peek() === '.') {
                                c += input.next();
                                allow_decimal = false;
                            }

                            // a = 1.e-7 is valid, so we test for . then e in one loop
                            if (allow_e && input.testChar(/[Ee]/)) {
                                c += input.next();

                                if (input.testChar(/[+-]/)) {
                                    c += input.next();
                                }

                                allow_e = false;
                                allow_decimal = false;
                            }
                        }

                        return [c, 'TK_WORD'];
                    }

                    if (acorn.isIdentifierStart(input.peekCharCode(-1))) {
                        if (input.hasNext()) {
                            while (acorn.isIdentifierChar(input.peekCharCode())) {
                                c += input.next();
                                if (!input.hasNext()) {
                                    break;
                                }
                            }
                        }

                        if (!(last_token.type === 'TK_DOT' || last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['set', 'get'])) && in_array(c, reserved_words)) {
                            if (c === 'in' || c === 'of') {
                                // hack for 'in' and 'of' operators
                                return [c, 'TK_OPERATOR'];
                            }
                            return [c, 'TK_RESERVED'];
                        }

                        return [c, 'TK_WORD'];
                    }

                    if (c === '(' || c === '[') {
                        return [c, 'TK_START_EXPR'];
                    }

                    if (c === ')' || c === ']') {
                        return [c, 'TK_END_EXPR'];
                    }

                    if (c === '{') {
                        return [c, 'TK_START_BLOCK'];
                    }

                    if (c === '}') {
                        return [c, 'TK_END_BLOCK'];
                    }

                    if (c === ';') {
                        return [c, 'TK_SEMICOLON'];
                    }

                    if (c === '/') {
                        var comment = '';
                        var comment_match;
                        // peek for comment /* ... */
                        if (input.peek() === '*') {
                            input.next();
                            comment_match = input.match(block_comment_pattern);
                            comment = '/*' + comment_match[0];
                            var directives = get_directives(comment);
                            if (directives && directives.ignore === 'start') {
                                comment_match = input.match(directives_end_ignore_pattern);
                                comment += comment_match[0];
                            }
                            comment = comment.replace(acorn.allLineBreaks, '\n');
                            return [comment, 'TK_BLOCK_COMMENT', directives];
                        }
                        // peek for comment // ...
                        if (input.peek() === '/') {
                            input.next();
                            comment_match = input.match(comment_pattern);
                            comment = '//' + comment_match[0];
                            return [comment, 'TK_COMMENT'];
                        }
                    }

                    var startXmlRegExp = /<()([-a-zA-Z:0-9_.]+|{[\s\S]+?}|!\[CDATA\[[\s\S]*?\]\])(\s+{[\s\S]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{[\s\S]+?}))*\s*(\/?)\s*>/g;

                    if (c === '`' || c === "'" || c === '"' || // string
                    (c === '/' || // regexp
                    opts.e4x && c === "<" && input.test(startXmlRegExp, -1) // xml
                    ) && ( // regex and xml can only appear in specific locations during parsing
                    last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['return', 'case', 'throw', 'else', 'do', 'typeof', 'yield']) || last_token.type === 'TK_END_EXPR' && last_token.text === ')' && last_token.parent && last_token.parent.type === 'TK_RESERVED' && in_array(last_token.parent.text, ['if', 'while', 'for']) || in_array(last_token.type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK', 'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA']))) {

                        var sep = c,
                            esc = false,
                            has_char_escapes = false;

                        resulting_string = c;

                        if (sep === '/') {
                            //
                            // handle regexp
                            //
                            var in_char_class = false;
                            while (input.hasNext() && (esc || in_char_class || input.peek() !== sep) && !input.testChar(acorn.newline)) {
                                resulting_string += input.peek();
                                if (!esc) {
                                    esc = input.peek() === '\\';
                                    if (input.peek() === '[') {
                                        in_char_class = true;
                                    } else if (input.peek() === ']') {
                                        in_char_class = false;
                                    }
                                } else {
                                    esc = false;
                                }
                                input.next();
                            }
                        } else if (opts.e4x && sep === '<') {
                            //
                            // handle e4x xml literals
                            //

                            var xmlRegExp = /[\s\S]*?<(\/?)([-a-zA-Z:0-9_.]+|{[\s\S]+?}|!\[CDATA\[[\s\S]*?\]\])(\s+{[\s\S]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{[\s\S]+?}))*\s*(\/?)\s*>/g;
                            input.back();
                            var xmlStr = '';
                            var match = input.match(startXmlRegExp);
                            if (match) {
                                // Trim root tag to attempt to
                                var rootTag = match[2].replace(/^{\s+/, '{').replace(/\s+}$/, '}');
                                var isCurlyRoot = rootTag.indexOf('{') === 0;
                                var depth = 0;
                                while (match) {
                                    var isEndTag = !!match[1];
                                    var tagName = match[2];
                                    var isSingletonTag = !!match[match.length - 1] || tagName.slice(0, 8) === "![CDATA[";
                                    if (!isSingletonTag && (tagName === rootTag || isCurlyRoot && tagName.replace(/^{\s+/, '{').replace(/\s+}$/, '}'))) {
                                        if (isEndTag) {
                                            --depth;
                                        } else {
                                            ++depth;
                                        }
                                    }
                                    xmlStr += match[0];
                                    if (depth <= 0) {
                                        break;
                                    }
                                    match = input.match(xmlRegExp);
                                }
                                // if we didn't close correctly, keep unformatted.
                                if (!match) {
                                    xmlStr += input.match(/[\s\S]*/g)[0];
                                }
                                xmlStr = xmlStr.replace(acorn.allLineBreaks, '\n');
                                return [xmlStr, "TK_STRING"];
                            }
                        } else {
                            //
                            // handle string
                            //
                            var parse_string = function parse_string(delimiter, allow_unescaped_newlines, start_sub) {
                                // Template strings can travers lines without escape characters.
                                // Other strings cannot
                                var current_char;
                                while (input.hasNext()) {
                                    current_char = input.peek();
                                    if (!(esc || current_char !== delimiter && (allow_unescaped_newlines || !acorn.newline.test(current_char)))) {
                                        break;
                                    }

                                    // Handle \r\n linebreaks after escapes or in template strings
                                    if ((esc || allow_unescaped_newlines) && acorn.newline.test(current_char)) {
                                        if (current_char === '\r' && input.peek(1) === '\n') {
                                            input.next();
                                            current_char = input.peek();
                                        }
                                        resulting_string += '\n';
                                    } else {
                                        resulting_string += current_char;
                                    }

                                    if (esc) {
                                        if (current_char === 'x' || current_char === 'u') {
                                            has_char_escapes = true;
                                        }
                                        esc = false;
                                    } else {
                                        esc = current_char === '\\';
                                    }

                                    input.next();

                                    if (start_sub && resulting_string.indexOf(start_sub, resulting_string.length - start_sub.length) !== -1) {
                                        if (delimiter === '`') {
                                            parse_string('}', allow_unescaped_newlines, '`');
                                        } else {
                                            parse_string('`', allow_unescaped_newlines, '${');
                                        }

                                        if (input.hasNext()) {
                                            resulting_string += input.next();
                                        }
                                    }
                                }
                            };

                            if (sep === '`') {
                                parse_string('`', true, '${');
                            } else {
                                parse_string(sep);
                            }
                        }

                        if (has_char_escapes && opts.unescape_strings) {
                            resulting_string = unescape_string(resulting_string);
                        }

                        if (input.peek() === sep) {
                            resulting_string += sep;
                            input.next();

                            if (sep === '/') {
                                // regexps may have modifiers /regexp/MOD , so fetch those, too
                                // Only [gim] are valid, but if the user puts in garbage, do what we can to take it.
                                while (input.hasNext() && acorn.isIdentifierStart(input.peekCharCode())) {
                                    resulting_string += input.next();
                                }
                            }
                        }
                        return [resulting_string, 'TK_STRING'];
                    }

                    if (c === '#') {

                        if (tokens.length === 0 && input.peek() === '!') {
                            // shebang
                            resulting_string = c;
                            while (input.hasNext() && c !== '\n') {
                                c = input.next();
                                resulting_string += c;
                            }
                            return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
                        }

                        // Spidermonkey-specific sharp variables for circular references
                        // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                        // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
                        var sharp = '#';
                        if (input.hasNext() && input.testChar(digit)) {
                            do {
                                c = input.next();
                                sharp += c;
                            } while (input.hasNext() && c !== '#' && c !== '=');
                            if (c === '#') {
                                //
                            } else if (input.peek() === '[' && input.peek(1) === ']') {
                                sharp += '[]';
                                input.next();
                                input.next();
                            } else if (input.peek() === '{' && input.peek(1) === '}') {
                                sharp += '{}';
                                input.next();
                                input.next();
                            }
                            return [sharp, 'TK_WORD'];
                        }
                    }

                    if (c === '<' && (input.peek() === '?' || input.peek() === '%')) {
                        input.back();
                        var template_match = input.match(template_pattern);
                        if (template_match) {
                            c = template_match[0];
                            c = c.replace(acorn.allLineBreaks, '\n');
                            return [c, 'TK_STRING'];
                        }
                    }

                    if (c === '<' && input.match(/\!--/g)) {
                        c = '<!--';
                        while (input.hasNext() && !input.testChar(acorn.newline)) {
                            c += input.next();
                        }
                        in_html_comment = true;
                        return [c, 'TK_COMMENT'];
                    }

                    if (c === '-' && in_html_comment && input.match(/->/g)) {
                        in_html_comment = false;
                        return ['-->', 'TK_COMMENT'];
                    }

                    if (c === '.') {
                        if (input.peek() === '.' && input.peek(1) === '.') {
                            c += input.next() + input.next();
                            return [c, 'TK_OPERATOR'];
                        }
                        return [c, 'TK_DOT'];
                    }

                    if (in_array(c, punct)) {
                        while (input.hasNext() && in_array(c + input.peek(), punct)) {
                            c += input.next();
                            if (!input.hasNext()) {
                                break;
                            }
                        }

                        if (c === ',') {
                            return [c, 'TK_COMMA'];
                        } else if (c === '=') {
                            return [c, 'TK_EQUALS'];
                        } else {
                            return [c, 'TK_OPERATOR'];
                        }
                    }

                    return [c, 'TK_UNKNOWN'];
                }

                function unescape_string(s) {
                    // You think that a regex would work for this
                    // return s.replace(/\\x([0-9a-f]{2})/gi, function(match, val) {
                    //         return String.fromCharCode(parseInt(val, 16));
                    //     })
                    // However, dealing with '\xff', '\\xff', '\\\xff' makes this more fun.
                    var out = '',
                        escaped = 0;

                    var input_scan = new InputScanner(s);
                    var matched = null;

                    while (input_scan.hasNext()) {
                        // Keep any whitespace, non-slash characters
                        // also keep slash pairs.
                        matched = input_scan.match(/([\s]|[^\\]|\\\\)+/g);

                        if (matched) {
                            out += matched[0];
                        }

                        if (input_scan.peek() === '\\') {
                            input_scan.next();
                            if (input_scan.peek() === 'x') {
                                matched = input_scan.match(/x([0-9A-Fa-f]{2})/g);
                            } else if (input_scan.peek() === 'u') {
                                matched = input_scan.match(/u([0-9A-Fa-f]{4})/g);
                            } else {
                                out += '\\';
                                if (input_scan.hasNext()) {
                                    out += input_scan.next();
                                }
                                continue;
                            }

                            // If there's some error decoding, return the original string
                            if (!matched) {
                                return s;
                            }

                            escaped = parseInt(matched[1], 16);

                            if (escaped > 0x7e && escaped <= 0xff && matched[0].indexOf('x') === 0) {
                                // we bail out on \x7f..\xff,
                                // leaving whole string escaped,
                                // as it's probably completely binary
                                return s;
                            } else if (escaped >= 0x00 && escaped < 0x20) {
                                // leave 0x00...0x1f escaped
                                out += '\\' + matched[0];
                                continue;
                            } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
                                // single-quote, apostrophe, backslash - escape these
                                out += '\\' + String.fromCharCode(escaped);
                            } else {
                                out += String.fromCharCode(escaped);
                            }
                        }
                    }

                    return out;
                }
            }

            var beautifier = new Beautifier(js_source_text, options);
            return beautifier.beautify();
        }

        if (typeof undefined === "function" && undefined.amd) {
            // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
            undefined([], function () {
                return { js_beautify: js_beautify };
            });
        } else {
            // Add support for CommonJS. Just put this file somewhere on your require.paths
            // and you will be able to `var js_beautify = require("beautify").js_beautify`.
            exports.js_beautify = js_beautify;
        }
    })();
});

var beautifyCss = createCommonjsModule(function (module, exports) {
    /*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
    /*
    
      The MIT License (MIT)
    
      Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.
    
      Permission is hereby granted, free of charge, to any person
      obtaining a copy of this software and associated documentation files
      (the "Software"), to deal in the Software without restriction,
      including without limitation the rights to use, copy, modify, merge,
      publish, distribute, sublicense, and/or sell copies of the Software,
      and to permit persons to whom the Software is furnished to do so,
      subject to the following conditions:
    
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
    
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
      NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
      BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
      ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
      CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
    
    
     CSS Beautifier
    ---------------
    
        Written by Harutyun Amirjanyan, (amirjanyan@gmail.com)
    
        Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
            http://jsbeautifier.org/
    
        Usage:
            css_beautify(source_text);
            css_beautify(source_text, options);
    
        The options are (default in brackets):
            indent_size (4)                         — indentation size,
            indent_char (space)                     — character to indent with,
            preserve_newlines (default false)       - whether existing line breaks should be preserved,
            selector_separator_newline (true)       - separate selectors with newline or
                                                      not (e.g. "a,\nbr" or "a, br")
            end_with_newline (false)                - end with a newline
            newline_between_rules (true)            - add a new line after every css rule
            space_around_selector_separator (false) - ensure space around selector separators:
                                                      '>', '+', '~' (e.g. "a>b" -> "a > b")
        e.g
    
        css_beautify(css_source_text, {
          'indent_size': 1,
          'indent_char': '\t',
          'selector_separator': ' ',
          'end_with_newline': false,
          'newline_between_rules': true,
          'space_around_selector_separator': true
        });
    */

    // http://www.w3.org/TR/CSS21/syndata.html#tokenization
    // http://www.w3.org/TR/css3-syntax/

    (function () {

        function mergeOpts(allOptions, targetType) {
            var finalOpts = {};
            var name;

            for (name in allOptions) {
                if (name !== targetType) {
                    finalOpts[name] = allOptions[name];
                }
            }

            //merge in the per type settings for the targetType
            if (targetType in allOptions) {
                for (name in allOptions[targetType]) {
                    finalOpts[name] = allOptions[targetType][name];
                }
            }
            return finalOpts;
        }

        var lineBreak = /\r\n|[\n\r\u2028\u2029]/;
        var allLineBreaks = new RegExp(lineBreak.source, 'g');

        function css_beautify(source_text, options) {
            options = options || {};

            // Allow the setting of language/file-type specific options
            // with inheritance of overall settings
            options = mergeOpts(options, 'css');

            source_text = source_text || '';

            var newlinesFromLastWSEat = 0;
            var indentSize = options.indent_size ? parseInt(options.indent_size, 10) : 4;
            var indentCharacter = options.indent_char || ' ';
            var preserve_newlines = options.preserve_newlines === undefined ? false : options.preserve_newlines;
            var selectorSeparatorNewline = options.selector_separator_newline === undefined ? true : options.selector_separator_newline;
            var end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
            var newline_between_rules = options.newline_between_rules === undefined ? true : options.newline_between_rules;
            var space_around_combinator = options.space_around_combinator === undefined ? false : options.space_around_combinator;
            space_around_combinator = space_around_combinator || (options.space_around_selector_separator === undefined ? false : options.space_around_selector_separator);
            var eol = options.eol ? options.eol : 'auto';

            if (options.indent_with_tabs) {
                indentCharacter = '\t';
                indentSize = 1;
            }

            if (eol === 'auto') {
                eol = '\n';
                if (source_text && lineBreak.test(source_text || '')) {
                    eol = source_text.match(lineBreak)[0];
                }
            }

            eol = eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

            // HACK: newline parsing inconsistent. This brute force normalizes the input.
            source_text = source_text.replace(allLineBreaks, '\n');

            // tokenizer
            var whiteRe = /^\s+$/;

            var pos = -1,
                ch;
            var parenLevel = 0;

            function next() {
                ch = source_text.charAt(++pos);
                return ch || '';
            }

            function peek(skipWhitespace) {
                var result = '';
                var prev_pos = pos;
                if (skipWhitespace) {
                    eatWhitespace();
                }
                result = source_text.charAt(pos + 1) || '';
                pos = prev_pos - 1;
                next();
                return result;
            }

            function eatString(endChars) {
                var start = pos;
                while (next()) {
                    if (ch === "\\") {
                        next();
                    } else if (endChars.indexOf(ch) !== -1) {
                        break;
                    } else if (ch === "\n") {
                        break;
                    }
                }
                return source_text.substring(start, pos + 1);
            }

            function peekString(endChar) {
                var prev_pos = pos;
                var str = eatString(endChar);
                pos = prev_pos - 1;
                next();
                return str;
            }

            function eatWhitespace(preserve_newlines_local) {
                var result = 0;
                while (whiteRe.test(peek())) {
                    next();
                    if (ch === '\n' && preserve_newlines_local && preserve_newlines) {
                        print.newLine(true);
                        result++;
                    }
                }
                newlinesFromLastWSEat = result;
                return result;
            }

            function skipWhitespace() {
                var result = '';
                if (ch && whiteRe.test(ch)) {
                    result = ch;
                }
                while (whiteRe.test(next())) {
                    result += ch;
                }
                return result;
            }

            function eatComment(singleLine) {
                var start = pos;
                singleLine = peek() === "/";
                next();
                while (next()) {
                    if (!singleLine && ch === "*" && peek() === "/") {
                        next();
                        break;
                    } else if (singleLine && ch === "\n") {
                        return source_text.substring(start, pos);
                    }
                }

                return source_text.substring(start, pos) + ch;
            }

            function lookBack(str) {
                return source_text.substring(pos - str.length, pos).toLowerCase() === str;
            }

            // Nested pseudo-class if we are insideRule
            // and the next special character found opens
            // a new block
            function foundNestedPseudoClass() {
                var openParen = 0;
                for (var i = pos + 1; i < source_text.length; i++) {
                    var ch = source_text.charAt(i);
                    if (ch === "{") {
                        return true;
                    } else if (ch === '(') {
                        // pseudoclasses can contain ()
                        openParen += 1;
                    } else if (ch === ')') {
                        if (openParen === 0) {
                            return false;
                        }
                        openParen -= 1;
                    } else if (ch === ";" || ch === "}") {
                        return false;
                    }
                }
                return false;
            }

            // printer
            var basebaseIndentString = source_text.match(/^[\t ]*/)[0];
            var singleIndent = new Array(indentSize + 1).join(indentCharacter);
            var indentLevel = 0;
            var nestedLevel = 0;

            function indent() {
                indentLevel++;
                basebaseIndentString += singleIndent;
            }

            function outdent() {
                indentLevel--;
                basebaseIndentString = basebaseIndentString.slice(0, -indentSize);
            }

            var print = {};
            print["{"] = function (ch) {
                print.singleSpace();
                output.push(ch);
                if (!eatWhitespace(true)) {
                    print.newLine();
                }
            };
            print["}"] = function (newline) {
                if (newline) {
                    print.newLine();
                }
                output.push('}');
                if (!eatWhitespace(true)) {
                    print.newLine();
                }
            };

            print._lastCharWhitespace = function () {
                return whiteRe.test(output[output.length - 1]);
            };

            print.newLine = function (keepWhitespace) {
                if (output.length) {
                    if (!keepWhitespace && output[output.length - 1] !== '\n') {
                        print.trim();
                    } else if (output[output.length - 1] === basebaseIndentString) {
                        output.pop();
                    }
                    output.push('\n');

                    if (basebaseIndentString) {
                        output.push(basebaseIndentString);
                    }
                }
            };
            print.singleSpace = function () {
                if (output.length && !print._lastCharWhitespace()) {
                    output.push(' ');
                }
            };

            print.preserveSingleSpace = function () {
                if (isAfterSpace) {
                    print.singleSpace();
                }
            };

            print.trim = function () {
                while (print._lastCharWhitespace()) {
                    output.pop();
                }
            };

            var output = [];
            /*_____________________--------------------_____________________*/

            var insideRule = false;
            var insidePropertyValue = false;
            var enteringConditionalGroup = false;
            var top_ch = '';
            var last_top_ch = '';

            while (true) {
                var whitespace = skipWhitespace();
                var isAfterSpace = whitespace !== '';
                var isAfterNewline = whitespace.indexOf('\n') !== -1;
                last_top_ch = top_ch;
                top_ch = ch;

                if (!ch) {
                    break;
                } else if (ch === '/' && peek() === '*') {
                    /* css comment */
                    var header = indentLevel === 0;

                    if (isAfterNewline || header) {
                        print.newLine();
                    }

                    output.push(eatComment());
                    print.newLine();
                    if (header) {
                        print.newLine(true);
                    }
                } else if (ch === '/' && peek() === '/') {
                    // single line comment
                    if (!isAfterNewline && last_top_ch !== '{') {
                        print.trim();
                    }
                    print.singleSpace();
                    output.push(eatComment());
                    print.newLine();
                } else if (ch === '@') {
                    print.preserveSingleSpace();

                    // deal with less propery mixins @{...}
                    if (peek() === '{') {
                        output.push(eatString('}'));
                    } else {
                        output.push(ch);

                        // strip trailing space, if present, for hash property checks
                        var variableOrRule = peekString(": ,;{}()[]/='\"");

                        if (variableOrRule.match(/[ :]$/)) {
                            // we have a variable or pseudo-class, add it and insert one space before continuing
                            next();
                            variableOrRule = eatString(": ").replace(/\s$/, '');
                            output.push(variableOrRule);
                            print.singleSpace();
                        }

                        variableOrRule = variableOrRule.replace(/\s$/, '');

                        // might be a nesting at-rule
                        if (variableOrRule in css_beautify.NESTED_AT_RULE) {
                            nestedLevel += 1;
                            if (variableOrRule in css_beautify.CONDITIONAL_GROUP_RULE) {
                                enteringConditionalGroup = true;
                            }
                        }
                    }
                } else if (ch === '#' && peek() === '{') {
                    print.preserveSingleSpace();
                    output.push(eatString('}'));
                } else if (ch === '{') {
                    if (peek(true) === '}') {
                        eatWhitespace();
                        next();
                        print.singleSpace();
                        output.push("{");
                        print['}'](false);
                        if (newlinesFromLastWSEat < 2 && newline_between_rules && indentLevel === 0) {
                            print.newLine(true);
                        }
                    } else {
                        indent();
                        print["{"](ch);
                        // when entering conditional groups, only rulesets are allowed
                        if (enteringConditionalGroup) {
                            enteringConditionalGroup = false;
                            insideRule = indentLevel > nestedLevel;
                        } else {
                            // otherwise, declarations are also allowed
                            insideRule = indentLevel >= nestedLevel;
                        }
                    }
                } else if (ch === '}') {
                    outdent();
                    print["}"](true);
                    insideRule = false;
                    insidePropertyValue = false;
                    if (nestedLevel) {
                        nestedLevel--;
                    }
                    if (newlinesFromLastWSEat < 2 && newline_between_rules && indentLevel === 0) {
                        print.newLine(true);
                    }
                } else if (ch === ":") {
                    eatWhitespace();
                    if ((insideRule || enteringConditionalGroup) && !(lookBack("&") || foundNestedPseudoClass()) && !lookBack("(")) {
                        // 'property: value' delimiter
                        // which could be in a conditional group query
                        output.push(':');
                        if (!insidePropertyValue) {
                            insidePropertyValue = true;
                            print.singleSpace();
                        }
                    } else {
                        // sass/less parent reference don't use a space
                        // sass nested pseudo-class don't use a space

                        // preserve space before pseudoclasses/pseudoelements, as it means "in any child"
                        if (lookBack(" ") && output[output.length - 1] !== " ") {
                            output.push(" ");
                        }
                        if (peek() === ":") {
                            // pseudo-element
                            next();
                            output.push("::");
                        } else {
                            // pseudo-class
                            output.push(':');
                        }
                    }
                } else if (ch === '"' || ch === '\'') {
                    print.preserveSingleSpace();
                    output.push(eatString(ch));
                } else if (ch === ';') {
                    insidePropertyValue = false;
                    output.push(ch);
                    if (!eatWhitespace(true)) {
                        print.newLine();
                    }
                } else if (ch === '(') {
                    // may be a url
                    if (lookBack("url")) {
                        output.push(ch);
                        eatWhitespace();
                        if (next()) {
                            if (ch !== ')' && ch !== '"' && ch !== '\'') {
                                output.push(eatString(')'));
                            } else {
                                pos--;
                            }
                        }
                    } else {
                        parenLevel++;
                        print.preserveSingleSpace();
                        output.push(ch);
                        eatWhitespace();
                    }
                } else if (ch === ')') {
                    output.push(ch);
                    parenLevel--;
                } else if (ch === ',') {
                    output.push(ch);
                    if (!eatWhitespace(true) && selectorSeparatorNewline && !insidePropertyValue && parenLevel < 1) {
                        print.newLine();
                    } else {
                        print.singleSpace();
                    }
                } else if ((ch === '>' || ch === '+' || ch === '~') && !insidePropertyValue && parenLevel < 1) {
                    //handle combinator spacing
                    if (space_around_combinator) {
                        print.singleSpace();
                        output.push(ch);
                        print.singleSpace();
                    } else {
                        output.push(ch);
                        eatWhitespace();
                        // squash extra whitespace
                        if (ch && whiteRe.test(ch)) {
                            ch = '';
                        }
                    }
                } else if (ch === ']') {
                    output.push(ch);
                } else if (ch === '[') {
                    print.preserveSingleSpace();
                    output.push(ch);
                } else if (ch === '=') {
                    // no whitespace before or after
                    eatWhitespace();
                    output.push('=');
                    if (whiteRe.test(ch)) {
                        ch = '';
                    }
                } else {
                    print.preserveSingleSpace();
                    output.push(ch);
                }
            }

            var sweetCode = '';
            if (basebaseIndentString) {
                sweetCode += basebaseIndentString;
            }

            sweetCode += output.join('').replace(/[\r\n\t ]+$/, '');

            // establish end_with_newline
            if (end_with_newline) {
                sweetCode += '\n';
            }

            if (eol !== '\n') {
                sweetCode = sweetCode.replace(/[\n]/g, eol);
            }

            return sweetCode;
        }

        // https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
        css_beautify.NESTED_AT_RULE = {
            "@page": true,
            "@font-face": true,
            "@keyframes": true,
            // also in CONDITIONAL_GROUP_RULE below
            "@media": true,
            "@supports": true,
            "@document": true
        };
        css_beautify.CONDITIONAL_GROUP_RULE = {
            "@media": true,
            "@supports": true,
            "@document": true
        };

        /*global define */
        if (typeof undefined === "function" && undefined.amd) {
            // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
            undefined([], function () {
                return {
                    css_beautify: css_beautify
                };
            });
        } else {
            // Add support for CommonJS. Just put this file somewhere on your require.paths
            // and you will be able to `var html_beautify = require("beautify").html_beautify`.
            exports.css_beautify = css_beautify;
        }
    })();
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var beautifyHtml = createCommonjsModule(function (module, exports) {
    /*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
    /*
    
      The MIT License (MIT)
    
      Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.
    
      Permission is hereby granted, free of charge, to any person
      obtaining a copy of this software and associated documentation files
      (the "Software"), to deal in the Software without restriction,
      including without limitation the rights to use, copy, modify, merge,
      publish, distribute, sublicense, and/or sell copies of the Software,
      and to permit persons to whom the Software is furnished to do so,
      subject to the following conditions:
    
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
    
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
      NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
      BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
      ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
      CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
    
    
     Style HTML
    ---------------
    
      Written by Nochum Sossonko, (nsossonko@hotmail.com)
    
      Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
        http://jsbeautifier.org/
    
      Usage:
        style_html(html_source);
    
        style_html(html_source, options);
    
      The options are:
        indent_inner_html (default false)  — indent <head> and <body> sections,
        indent_size (default 4)          — indentation size,
        indent_char (default space)      — character to indent with,
        wrap_line_length (default 250)            -  maximum amount of characters per line (0 = disable)
        brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none"
                put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
        unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
        content_unformatted (defaults to pre tag) - list of tags, that its content shouldn't be reformatted
        indent_scripts (default normal)  - "keep"|"separate"|"normal"
        preserve_newlines (default true) - whether existing line breaks before elements should be preserved
                                            Only works before elements, not inside tags or for text.
        max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk
        indent_handlebars (default false) - format and indent {{#foo}} and {{/foo}}
        end_with_newline (false)          - end with a newline
        extra_liners (default [head,body,/html]) -List of tags that should have an extra newline before them.
    
        e.g.
    
        style_html(html_source, {
          'indent_inner_html': false,
          'indent_size': 2,
          'indent_char': ' ',
          'wrap_line_length': 78,
          'brace_style': 'expand',
          'preserve_newlines': true,
          'max_preserve_newlines': 5,
          'indent_handlebars': false,
          'extra_liners': ['/html']
        });
    */

    (function () {

        // function trim(s) {
        //     return s.replace(/^\s+|\s+$/g, '');
        // }

        function ltrim(s) {
            return s.replace(/^\s+/g, '');
        }

        function rtrim(s) {
            return s.replace(/\s+$/g, '');
        }

        function mergeOpts(allOptions, targetType) {
            var finalOpts = {};
            var name;

            for (name in allOptions) {
                if (name !== targetType) {
                    finalOpts[name] = allOptions[name];
                }
            }

            //merge in the per type settings for the targetType
            if (targetType in allOptions) {
                for (name in allOptions[targetType]) {
                    finalOpts[name] = allOptions[targetType][name];
                }
            }
            return finalOpts;
        }

        var lineBreak = /\r\n|[\n\r\u2028\u2029]/;
        var allLineBreaks = new RegExp(lineBreak.source, 'g');

        function style_html(html_source, options, js_beautify, css_beautify) {
            //Wrapper function to invoke all the necessary constructors and deal with the output.

            var multi_parser, indent_inner_html, indent_body_inner_html, indent_head_inner_html, indent_size, indent_character, wrap_line_length, brace_style, unformatted, content_unformatted, preserve_newlines, max_preserve_newlines, indent_handlebars, wrap_attributes, wrap_attributes_indent_size, is_wrap_attributes_force, is_wrap_attributes_force_expand_multiline, is_wrap_attributes_force_aligned, end_with_newline, extra_liners, eol;

            options = options || {};

            // Allow the setting of language/file-type specific options
            // with inheritance of overall settings
            options = mergeOpts(options, 'html');

            // backwards compatibility to 1.3.4
            if ((options.wrap_line_length === undefined || parseInt(options.wrap_line_length, 10) === 0) && options.max_char !== undefined && parseInt(options.max_char, 10) !== 0) {
                options.wrap_line_length = options.max_char;
            }

            indent_inner_html = options.indent_inner_html === undefined ? false : options.indent_inner_html;
            indent_body_inner_html = options.indent_body_inner_html === undefined ? true : options.indent_body_inner_html;
            indent_head_inner_html = options.indent_head_inner_html === undefined ? true : options.indent_head_inner_html;
            indent_size = options.indent_size === undefined ? 4 : parseInt(options.indent_size, 10);
            indent_character = options.indent_char === undefined ? ' ' : options.indent_char;
            brace_style = options.brace_style === undefined ? 'collapse' : options.brace_style;
            wrap_line_length = parseInt(options.wrap_line_length, 10) === 0 ? 32786 : parseInt(options.wrap_line_length || 250, 10);
            unformatted = options.unformatted || [
            // https://www.w3.org/TR/html5/dom.html#phrasing-content
            'a', 'abbr', 'area', 'audio', 'b', 'bdi', 'bdo', 'br', 'button', 'canvas', 'cite', 'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'math', 'meter', 'noscript', 'object', 'output', 'progress', 'q', 'ruby', 's', 'samp', /* 'script', */'select', 'small', 'span', 'strong', 'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'u', 'var', 'video', 'wbr', 'text',
            // prexisting - not sure of full effect of removing, leaving in
            'acronym', 'address', 'big', 'dt', 'ins', 'strike', 'tt'];
            content_unformatted = options.content_unformatted || ['pre'];
            preserve_newlines = options.preserve_newlines === undefined ? true : options.preserve_newlines;
            max_preserve_newlines = preserve_newlines ? isNaN(parseInt(options.max_preserve_newlines, 10)) ? 32786 : parseInt(options.max_preserve_newlines, 10) : 0;
            indent_handlebars = options.indent_handlebars === undefined ? false : options.indent_handlebars;
            wrap_attributes = options.wrap_attributes === undefined ? 'auto' : options.wrap_attributes;
            wrap_attributes_indent_size = isNaN(parseInt(options.wrap_attributes_indent_size, 10)) ? indent_size : parseInt(options.wrap_attributes_indent_size, 10);
            is_wrap_attributes_force = wrap_attributes.substr(0, 'force'.length) === 'force';
            is_wrap_attributes_force_expand_multiline = wrap_attributes === 'force-expand-multiline';
            is_wrap_attributes_force_aligned = wrap_attributes === 'force-aligned';
            end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
            extra_liners = _typeof(options.extra_liners) === 'object' && options.extra_liners ? options.extra_liners.concat() : typeof options.extra_liners === 'string' ? options.extra_liners.split(',') : 'head,body,/html'.split(',');
            eol = options.eol ? options.eol : 'auto';

            if (options.indent_with_tabs) {
                indent_character = '\t';
                indent_size = 1;
            }

            if (eol === 'auto') {
                eol = '\n';
                if (html_source && lineBreak.test(html_source || '')) {
                    eol = html_source.match(lineBreak)[0];
                }
            }

            eol = eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

            // HACK: newline parsing inconsistent. This brute force normalizes the input.
            html_source = html_source.replace(allLineBreaks, '\n');

            function Parser() {

                this.pos = 0; //Parser position
                this.token = '';
                this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
                this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
                    parent: 'parent1',
                    parentcount: 1,
                    parent1: ''
                };
                this.tag_type = '';
                this.token_text = this.last_token = this.last_text = this.token_type = '';
                this.newlines = 0;
                this.indent_content = indent_inner_html;
                this.indent_body_inner_html = indent_body_inner_html;
                this.indent_head_inner_html = indent_head_inner_html;

                this.Utils = { //Uilities made available to the various functions
                    whitespace: "\n\r\t ".split(''),

                    single_token: options.void_elements || [
                    // HTLM void elements - aka self-closing tags - aka singletons
                    // https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
                    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
                    // NOTE: Optional tags - are not understood.
                    // https://www.w3.org/TR/html5/syntax.html#optional-tags
                    // The rules for optional tags are too complex for a simple list
                    // Also, the content of these tags should still be indented in many cases.
                    // 'li' is a good exmple.

                    // Doctype and xml elements
                    '!doctype', '?xml',
                    // ?php tag
                    '?php',
                    // other tags that were in this list, keeping just in case
                    'basefont', 'isindex'],
                    extra_liners: extra_liners, //for tags that need a line of whitespace before them
                    in_array: function in_array(what, arr) {
                        for (var i = 0; i < arr.length; i++) {
                            if (what === arr[i]) {
                                return true;
                            }
                        }
                        return false;
                    }
                };

                // Return true if the given text is composed entirely of whitespace.
                this.is_whitespace = function (text) {
                    for (var n = 0; n < text.length; n++) {
                        if (!this.Utils.in_array(text.charAt(n), this.Utils.whitespace)) {
                            return false;
                        }
                    }
                    return true;
                };

                this.traverse_whitespace = function () {
                    var input_char = '';

                    input_char = this.input.charAt(this.pos);
                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        this.newlines = 0;
                        while (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                            if (preserve_newlines && input_char === '\n' && this.newlines <= max_preserve_newlines) {
                                this.newlines += 1;
                            }

                            this.pos++;
                            input_char = this.input.charAt(this.pos);
                        }
                        return true;
                    }
                    return false;
                };

                // Append a space to the given content (string array) or, if we are
                // at the wrap_line_length, append a newline/indentation.
                // return true if a newline was added, false if a space was added
                this.space_or_wrap = function (content) {
                    if (this.line_char_count >= this.wrap_line_length) {
                        //insert a line when the wrap_line_length is reached
                        this.print_newline(false, content);
                        this.print_indentation(content);
                        return true;
                    } else {
                        this.line_char_count++;
                        content.push(' ');
                        return false;
                    }
                };

                this.get_content = function () {
                    //function to capture regular content between tags
                    var input_char = '',
                        content = [],
                        handlebarsStarted = 0;

                    while (this.input.charAt(this.pos) !== '<' || handlebarsStarted === 2) {
                        if (this.pos >= this.input.length) {
                            return content.length ? content.join('') : ['', 'TK_EOF'];
                        }

                        if (handlebarsStarted < 2 && this.traverse_whitespace()) {
                            this.space_or_wrap(content);
                            continue;
                        }

                        input_char = this.input.charAt(this.pos);

                        if (indent_handlebars) {
                            if (input_char === '{') {
                                handlebarsStarted += 1;
                            } else if (handlebarsStarted < 2) {
                                handlebarsStarted = 0;
                            }

                            if (input_char === '}' && handlebarsStarted > 0) {
                                if (handlebarsStarted-- === 0) {
                                    break;
                                }
                            }
                            // Handlebars parsing is complicated.
                            // {{#foo}} and {{/foo}} are formatted tags.
                            // {{something}} should get treated as content, except:
                            // {{else}} specifically behaves like {{#if}} and {{/if}}
                            var peek3 = this.input.substr(this.pos, 3);
                            if (peek3 === '{{#' || peek3 === '{{/') {
                                // These are tags and not content.
                                break;
                            } else if (peek3 === '{{!') {
                                return [this.get_tag(), 'TK_TAG_HANDLEBARS_COMMENT'];
                            } else if (this.input.substr(this.pos, 2) === '{{') {
                                if (this.get_tag(true) === '{{else}}') {
                                    break;
                                }
                            }
                        }

                        this.pos++;
                        this.line_char_count++;
                        content.push(input_char); //letter at-a-time (or string) inserted to an array
                    }
                    return content.length ? content.join('') : '';
                };

                this.get_contents_to = function (name) {
                    //get the full content of a script or style to pass to js_beautify
                    if (this.pos === this.input.length) {
                        return ['', 'TK_EOF'];
                    }
                    var content = '';
                    var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
                    reg_match.lastIndex = this.pos;
                    var reg_array = reg_match.exec(this.input);
                    var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script
                    if (this.pos < end_script) {
                        //get everything in between the script tags
                        content = this.input.substring(this.pos, end_script);
                        this.pos = end_script;
                    }
                    return content;
                };

                this.record_tag = function (tag) {
                    //function to record a tag and its parent in this.tags Object
                    if (this.tags[tag + 'count']) {
                        //check for the existence of this tag type
                        this.tags[tag + 'count']++;
                        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                    } else {
                        //otherwise initialize this tag type
                        this.tags[tag + 'count'] = 1;
                        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                    }
                    this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
                    this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
                };

                this.retrieve_tag = function (tag) {
                    //function to retrieve the opening tag to the corresponding closer
                    if (this.tags[tag + 'count']) {
                        //if the openener is not in the Object we ignore it
                        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                        while (temp_parent) {
                            //till we reach '' (the initial value);
                            if (tag + this.tags[tag + 'count'] === temp_parent) {
                                //if this is it use it
                                break;
                            }
                            temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                        }
                        if (temp_parent) {
                            //if we caught something
                            this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                            this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
                        }
                        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                        if (this.tags[tag + 'count'] === 1) {
                            delete this.tags[tag + 'count'];
                        } else {
                            this.tags[tag + 'count']--;
                        }
                    }
                };

                this.indent_to_tag = function (tag) {
                    // Match the indentation level to the last use of this tag, but don't remove it.
                    if (!this.tags[tag + 'count']) {
                        return;
                    }
                    var temp_parent = this.tags.parent;
                    while (temp_parent) {
                        if (tag + this.tags[tag + 'count'] === temp_parent) {
                            break;
                        }
                        temp_parent = this.tags[temp_parent + 'parent'];
                    }
                    if (temp_parent) {
                        this.indent_level = this.tags[tag + this.tags[tag + 'count']];
                    }
                };

                this.get_tag = function (peek) {
                    //function to get a full tag and parse its type
                    var input_char = '',
                        content = [],
                        comment = '',
                        space = false,
                        first_attr = true,
                        has_wrapped_attrs = false,
                        tag_start,
                        tag_end,
                        tag_start_char,
                        orig_pos = this.pos,
                        orig_line_char_count = this.line_char_count,
                        is_tag_closed = false,
                        tail;

                    peek = peek !== undefined ? peek : false;

                    do {
                        if (this.pos >= this.input.length) {
                            if (peek) {
                                this.pos = orig_pos;
                                this.line_char_count = orig_line_char_count;
                            }
                            return content.length ? content.join('') : ['', 'TK_EOF'];
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++;

                        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                            //don't want to insert unnecessary space
                            space = true;
                            continue;
                        }

                        if (input_char === "'" || input_char === '"') {
                            input_char += this.get_unformatted(input_char);
                            space = true;
                        }

                        if (input_char === '=') {
                            //no space before =
                            space = false;
                        }
                        tail = this.input.substr(this.pos - 1);
                        if (is_wrap_attributes_force_expand_multiline && has_wrapped_attrs && !is_tag_closed && (input_char === '>' || input_char === '/')) {
                            if (tail.match(/^\/?\s*>/)) {
                                space = false;
                                is_tag_closed = true;
                                this.print_newline(false, content);
                                this.print_indentation(content);
                            }
                        }
                        if (content.length && content[content.length - 1] !== '=' && input_char !== '>' && space) {
                            //no space after = or before >
                            var wrapped = this.space_or_wrap(content);
                            var indentAttrs = wrapped && input_char !== '/' && !is_wrap_attributes_force;
                            space = false;

                            if (is_wrap_attributes_force && input_char !== '/') {
                                var force_first_attr_wrap = false;
                                if (is_wrap_attributes_force_expand_multiline && first_attr) {
                                    var is_only_attribute = tail.match(/^\S*(="([^"]|\\")*")?\s*\/?\s*>/) !== null;
                                    force_first_attr_wrap = !is_only_attribute;
                                }
                                if (!first_attr || force_first_attr_wrap) {
                                    this.print_newline(false, content);
                                    this.print_indentation(content);
                                    indentAttrs = true;
                                }
                            }
                            if (indentAttrs) {
                                has_wrapped_attrs = true;

                                //indent attributes an auto, forced, or forced-align line-wrap
                                var alignment_size = wrap_attributes_indent_size;
                                if (is_wrap_attributes_force_aligned) {
                                    alignment_size = content.indexOf(' ') + 1;
                                }

                                for (var count = 0; count < alignment_size; count++) {
                                    // only ever further indent with spaces since we're trying to align characters
                                    content.push(' ');
                                }
                            }
                            if (first_attr) {
                                for (var i = 0; i < content.length; i++) {
                                    if (content[i] === ' ') {
                                        first_attr = false;
                                        break;
                                    }
                                }
                            }
                        }

                        if (indent_handlebars && tag_start_char === '<') {
                            // When inside an angle-bracket tag, put spaces around
                            // handlebars not inside of strings.
                            if (input_char + this.input.charAt(this.pos) === '{{') {
                                input_char += this.get_unformatted('}}');
                                if (content.length && content[content.length - 1] !== ' ' && content[content.length - 1] !== '<') {
                                    input_char = ' ' + input_char;
                                }
                                space = true;
                            }
                        }

                        if (input_char === '<' && !tag_start_char) {
                            tag_start = this.pos - 1;
                            tag_start_char = '<';
                        }

                        if (indent_handlebars && !tag_start_char) {
                            if (content.length >= 2 && content[content.length - 1] === '{' && content[content.length - 2] === '{') {
                                if (input_char === '#' || input_char === '/' || input_char === '!') {
                                    tag_start = this.pos - 3;
                                } else {
                                    tag_start = this.pos - 2;
                                }
                                tag_start_char = '{';
                            }
                        }

                        this.line_char_count++;
                        content.push(input_char); //inserts character at-a-time (or string)

                        if (content[1] && (content[1] === '!' || content[1] === '?' || content[1] === '%')) {
                            //if we're in a comment, do something special
                            // We treat all comments as literals, even more than preformatted tags
                            // we just look for the appropriate close tag
                            content = [this.get_comment(tag_start)];
                            break;
                        }

                        if (indent_handlebars && content[1] && content[1] === '{' && content[2] && content[2] === '!') {
                            //if we're in a comment, do something special
                            // We treat all comments as literals, even more than preformatted tags
                            // we just look for the appropriate close tag
                            content = [this.get_comment(tag_start)];
                            break;
                        }

                        if (indent_handlebars && tag_start_char === '{' && content.length > 2 && content[content.length - 2] === '}' && content[content.length - 1] === '}') {
                            break;
                        }
                    } while (input_char !== '>');

                    var tag_complete = content.join('');
                    var tag_index;
                    var tag_offset;

                    // must check for space first otherwise the tag could have the first attribute included, and
                    // then not un-indent correctly
                    if (tag_complete.indexOf(' ') !== -1) {
                        //if there's whitespace, thats where the tag name ends
                        tag_index = tag_complete.indexOf(' ');
                    } else if (tag_complete.indexOf('\n') !== -1) {
                        //if there's a line break, thats where the tag name ends
                        tag_index = tag_complete.indexOf('\n');
                    } else if (tag_complete.charAt(0) === '{') {
                        tag_index = tag_complete.indexOf('}');
                    } else {
                        //otherwise go with the tag ending
                        tag_index = tag_complete.indexOf('>');
                    }
                    if (tag_complete.charAt(0) === '<' || !indent_handlebars) {
                        tag_offset = 1;
                    } else {
                        tag_offset = tag_complete.charAt(2) === '#' ? 3 : 2;
                    }
                    var tag_check = tag_complete.substring(tag_offset, tag_index).toLowerCase();
                    if (tag_complete.charAt(tag_complete.length - 2) === '/' || this.Utils.in_array(tag_check, this.Utils.single_token)) {
                        //if this tag name is a single tag type (either in the list or has a closing /)
                        if (!peek) {
                            this.tag_type = 'SINGLE';
                        }
                    } else if (indent_handlebars && tag_complete.charAt(0) === '{' && tag_check === 'else') {
                        if (!peek) {
                            this.indent_to_tag('if');
                            this.tag_type = 'HANDLEBARS_ELSE';
                            this.indent_content = true;
                            this.traverse_whitespace();
                        }
                    } else if (this.is_unformatted(tag_check, unformatted) || this.is_unformatted(tag_check, content_unformatted)) {
                        // do not reformat the "unformatted" or "content_unformatted" tags
                        comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function
                        content.push(comment);
                        tag_end = this.pos - 1;
                        this.tag_type = 'SINGLE';
                    } else if (tag_check === 'script' && (tag_complete.search('type') === -1 || tag_complete.search('type') > -1 && tag_complete.search(/\b(text|application|dojo)\/(x-)?(javascript|ecmascript|jscript|livescript|(ld\+)?json|method|aspect)/) > -1)) {
                        if (!peek) {
                            this.record_tag(tag_check);
                            this.tag_type = 'SCRIPT';
                        }
                    } else if (tag_check === 'style' && (tag_complete.search('type') === -1 || tag_complete.search('type') > -1 && tag_complete.search('text/css') > -1)) {
                        if (!peek) {
                            this.record_tag(tag_check);
                            this.tag_type = 'STYLE';
                        }
                    } else if (tag_check.charAt(0) === '!') {
                        //peek for <! comment
                        // for comments content is already correct.
                        if (!peek) {
                            this.tag_type = 'SINGLE';
                            this.traverse_whitespace();
                        }
                    } else if (!peek) {
                        if (tag_check.charAt(0) === '/') {
                            //this tag is a double tag so check for tag-ending
                            this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
                            this.tag_type = 'END';
                        } else {
                            //otherwise it's a start-tag
                            this.record_tag(tag_check); //push it on the tag stack
                            if (tag_check.toLowerCase() !== 'html') {
                                this.indent_content = true;
                            }
                            this.tag_type = 'START';
                        }

                        // Allow preserving of newlines after a start or end tag
                        if (this.traverse_whitespace()) {
                            this.space_or_wrap(content);
                        }

                        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) {
                            //check if this double needs an extra line
                            this.print_newline(false, this.output);
                            if (this.output.length && this.output[this.output.length - 2] !== '\n') {
                                this.print_newline(true, this.output);
                            }
                        }
                    }

                    if (peek) {
                        this.pos = orig_pos;
                        this.line_char_count = orig_line_char_count;
                    }

                    return content.join(''); //returns fully formatted tag
                };

                this.get_comment = function (start_pos) {
                    //function to return comment content in its entirety
                    // this is will have very poor perf, but will work for now.
                    var comment = '',
                        delimiter = '>',
                        matched = false;

                    this.pos = start_pos;
                    var input_char = this.input.charAt(this.pos);
                    this.pos++;

                    while (this.pos <= this.input.length) {
                        comment += input_char;

                        // only need to check for the delimiter if the last chars match
                        if (comment.charAt(comment.length - 1) === delimiter.charAt(delimiter.length - 1) && comment.indexOf(delimiter) !== -1) {
                            break;
                        }

                        // only need to search for custom delimiter for the first few characters
                        if (!matched && comment.length < 10) {
                            if (comment.indexOf('<![if') === 0) {
                                //peek for <![if conditional comment
                                delimiter = '<![endif]>';
                                matched = true;
                            } else if (comment.indexOf('<![cdata[') === 0) {
                                //if it's a <[cdata[ comment...
                                delimiter = ']]>';
                                matched = true;
                            } else if (comment.indexOf('<![') === 0) {
                                // some other ![ comment? ...
                                delimiter = ']>';
                                matched = true;
                            } else if (comment.indexOf('<!--') === 0) {
                                // <!-- comment ...
                                delimiter = '-->';
                                matched = true;
                            } else if (comment.indexOf('{{!--') === 0) {
                                // {{!-- handlebars comment
                                delimiter = '--}}';
                                matched = true;
                            } else if (comment.indexOf('{{!') === 0) {
                                // {{! handlebars comment
                                if (comment.length === 5 && comment.indexOf('{{!--') === -1) {
                                    delimiter = '}}';
                                    matched = true;
                                }
                            } else if (comment.indexOf('<?') === 0) {
                                // {{! handlebars comment
                                delimiter = '?>';
                                matched = true;
                            } else if (comment.indexOf('<%') === 0) {
                                // {{! handlebars comment
                                delimiter = '%>';
                                matched = true;
                            }
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++;
                    }

                    return comment;
                };

                function tokenMatcher(delimiter) {
                    var token = '';

                    var add = function add(str) {
                        var newToken = token + str.toLowerCase();
                        token = newToken.length <= delimiter.length ? newToken : newToken.substr(newToken.length - delimiter.length, delimiter.length);
                    };

                    var doesNotMatch = function doesNotMatch() {
                        return token.indexOf(delimiter) === -1;
                    };

                    return {
                        add: add,
                        doesNotMatch: doesNotMatch
                    };
                }

                this.get_unformatted = function (delimiter, orig_tag) {
                    //function to return unformatted content in its entirety
                    if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) !== -1) {
                        return '';
                    }
                    var input_char = '';
                    var content = '';
                    var space = true;

                    var delimiterMatcher = tokenMatcher(delimiter);

                    do {

                        if (this.pos >= this.input.length) {
                            return content;
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++;

                        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                            if (!space) {
                                this.line_char_count--;
                                continue;
                            }
                            if (input_char === '\n' || input_char === '\r') {
                                content += '\n';
                                /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                                for (var i=0; i<this.indent_level; i++) {
                                content += this.indent_string;
                                }
                                space = false; //...and make sure other indentation is erased
                                */
                                this.line_char_count = 0;
                                continue;
                            }
                        }
                        content += input_char;
                        delimiterMatcher.add(input_char);
                        this.line_char_count++;
                        space = true;

                        if (indent_handlebars && input_char === '{' && content.length && content.charAt(content.length - 2) === '{') {
                            // Handlebars expressions in strings should also be unformatted.
                            content += this.get_unformatted('}}');
                            // Don't consider when stopping for delimiters.
                        }
                    } while (delimiterMatcher.doesNotMatch());

                    return content;
                };

                this.get_token = function () {
                    //initial handler for token-retrieval
                    var token;

                    if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') {
                        //check if we need to format javascript
                        var type = this.last_token.substr(7);
                        token = this.get_contents_to(type);
                        if (typeof token !== 'string') {
                            return token;
                        }
                        return [token, 'TK_' + type];
                    }
                    if (this.current_mode === 'CONTENT') {
                        token = this.get_content();
                        if (typeof token !== 'string') {
                            return token;
                        } else {
                            return [token, 'TK_CONTENT'];
                        }
                    }

                    if (this.current_mode === 'TAG') {
                        token = this.get_tag();
                        if (typeof token !== 'string') {
                            return token;
                        } else {
                            var tag_name_type = 'TK_TAG_' + this.tag_type;
                            return [token, tag_name_type];
                        }
                    }
                };

                this.get_full_indent = function (level) {
                    level = this.indent_level + level || 0;
                    if (level < 1) {
                        return '';
                    }

                    return Array(level + 1).join(this.indent_string);
                };

                this.is_unformatted = function (tag_check, unformatted) {
                    //is this an HTML5 block-level link?
                    if (!this.Utils.in_array(tag_check, unformatted)) {
                        return false;
                    }

                    if (tag_check.toLowerCase() !== 'a' || !this.Utils.in_array('a', unformatted)) {
                        return true;
                    }

                    //at this point we have an  tag; is its first child something we want to remain
                    //unformatted?
                    var next_tag = this.get_tag(true /* peek. */);

                    // test next_tag to see if it is just html tag (no external content)
                    var tag = (next_tag || "").match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/);

                    // if next_tag comes back but is not an isolated tag, then
                    // let's treat the 'a' tag as having content
                    // and respect the unformatted option
                    if (!tag || this.Utils.in_array(tag[1], unformatted)) {
                        return true;
                    } else {
                        return false;
                    }
                };

                this.printer = function (js_source, indent_character, indent_size, wrap_line_length, brace_style) {
                    //handles input/output and some other printing functions

                    this.input = js_source || ''; //gets the input for the Parser

                    // HACK: newline parsing inconsistent. This brute force normalizes the input.
                    this.input = this.input.replace(/\r\n|[\r\u2028\u2029]/g, '\n');

                    this.output = [];
                    this.indent_character = indent_character;
                    this.indent_string = '';
                    this.indent_size = indent_size;
                    this.brace_style = brace_style;
                    this.indent_level = 0;
                    this.wrap_line_length = wrap_line_length;
                    this.line_char_count = 0; //count to see if wrap_line_length was exceeded

                    for (var i = 0; i < this.indent_size; i++) {
                        this.indent_string += this.indent_character;
                    }

                    this.print_newline = function (force, arr) {
                        this.line_char_count = 0;
                        if (!arr || !arr.length) {
                            return;
                        }
                        if (force || arr[arr.length - 1] !== '\n') {
                            //we might want the extra line
                            if (arr[arr.length - 1] !== '\n') {
                                arr[arr.length - 1] = rtrim(arr[arr.length - 1]);
                            }
                            arr.push('\n');
                        }
                    };

                    this.print_indentation = function (arr) {
                        for (var i = 0; i < this.indent_level; i++) {
                            arr.push(this.indent_string);
                            this.line_char_count += this.indent_string.length;
                        }
                    };

                    this.print_token = function (text) {
                        // Avoid printing initial whitespace.
                        if (this.is_whitespace(text) && !this.output.length) {
                            return;
                        }
                        if (text || text !== '') {
                            if (this.output.length && this.output[this.output.length - 1] === '\n') {
                                this.print_indentation(this.output);
                                text = ltrim(text);
                            }
                        }
                        this.print_token_raw(text);
                    };

                    this.print_token_raw = function (text) {
                        // If we are going to print newlines, truncate trailing
                        // whitespace, as the newlines will represent the space.
                        if (this.newlines > 0) {
                            text = rtrim(text);
                        }

                        if (text && text !== '') {
                            if (text.length > 1 && text.charAt(text.length - 1) === '\n') {
                                // unformatted tags can grab newlines as their last character
                                this.output.push(text.slice(0, -1));
                                this.print_newline(false, this.output);
                            } else {
                                this.output.push(text);
                            }
                        }

                        for (var n = 0; n < this.newlines; n++) {
                            this.print_newline(n > 0, this.output);
                        }
                        this.newlines = 0;
                    };

                    this.indent = function () {
                        this.indent_level++;
                    };

                    this.unindent = function () {
                        if (this.indent_level > 0) {
                            this.indent_level--;
                        }
                    };
                };
                return this;
            }

            /*_____________________--------------------_____________________*/

            multi_parser = new Parser(); //wrapping functions Parser
            multi_parser.printer(html_source, indent_character, indent_size, wrap_line_length, brace_style); //initialize starting values

            while (true) {
                var t = multi_parser.get_token();
                multi_parser.token_text = t[0];
                multi_parser.token_type = t[1];

                if (multi_parser.token_type === 'TK_EOF') {
                    break;
                }

                switch (multi_parser.token_type) {
                    case 'TK_TAG_START':
                        multi_parser.print_newline(false, multi_parser.output);
                        multi_parser.print_token(multi_parser.token_text);
                        if (multi_parser.indent_content) {
                            if ((multi_parser.indent_body_inner_html || !multi_parser.token_text.match(/<body(?:.*)>/)) && (multi_parser.indent_head_inner_html || !multi_parser.token_text.match(/<head(?:.*)>/))) {

                                multi_parser.indent();
                            }

                            multi_parser.indent_content = false;
                        }
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_STYLE':
                    case 'TK_TAG_SCRIPT':
                        multi_parser.print_newline(false, multi_parser.output);
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_END':
                        //Print new line only if the tag has no content and has child
                        if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
                            var tag_name = (multi_parser.token_text.match(/\w+/) || [])[0];
                            var tag_extracted_from_last_output = null;
                            if (multi_parser.output.length) {
                                tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/(?:<|{{#)\s*(\w+)/);
                            }
                            if (tag_extracted_from_last_output === null || tag_extracted_from_last_output[1] !== tag_name && !multi_parser.Utils.in_array(tag_extracted_from_last_output[1], unformatted)) {
                                multi_parser.print_newline(false, multi_parser.output);
                            }
                        }
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_SINGLE':
                        // Don't add a newline before elements that should remain unformatted.
                        var tag_check = multi_parser.token_text.match(/^\s*<([a-z-]+)/i);
                        if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_HANDLEBARS_ELSE':
                        // Don't add a newline if opening {{#if}} tag is on the current line
                        var foundIfOnCurrentLine = false;
                        for (var lastCheckedOutput = multi_parser.output.length - 1; lastCheckedOutput >= 0; lastCheckedOutput--) {
                            if (multi_parser.output[lastCheckedOutput] === '\n') {
                                break;
                            } else {
                                if (multi_parser.output[lastCheckedOutput].match(/{{#if/)) {
                                    foundIfOnCurrentLine = true;
                                    break;
                                }
                            }
                        }
                        if (!foundIfOnCurrentLine) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                        multi_parser.print_token(multi_parser.token_text);
                        if (multi_parser.indent_content) {
                            multi_parser.indent();
                            multi_parser.indent_content = false;
                        }
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_HANDLEBARS_COMMENT':
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'TAG';
                        break;
                    case 'TK_CONTENT':
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'TAG';
                        break;
                    case 'TK_STYLE':
                    case 'TK_SCRIPT':
                        if (multi_parser.token_text !== '') {
                            multi_parser.print_newline(false, multi_parser.output);
                            var text = multi_parser.token_text,
                                _beautifier,
                                script_indent_level = 1;
                            if (multi_parser.token_type === 'TK_SCRIPT') {
                                _beautifier = typeof js_beautify === 'function' && js_beautify;
                            } else if (multi_parser.token_type === 'TK_STYLE') {
                                _beautifier = typeof css_beautify === 'function' && css_beautify;
                            }

                            if (options.indent_scripts === "keep") {
                                script_indent_level = 0;
                            } else if (options.indent_scripts === "separate") {
                                script_indent_level = -multi_parser.indent_level;
                            }

                            var indentation = multi_parser.get_full_indent(script_indent_level);
                            if (_beautifier) {

                                // call the Beautifier if avaliable
                                var Child_options = function Child_options() {
                                    this.eol = '\n';
                                };
                                Child_options.prototype = options;
                                var child_options = new Child_options();
                                text = _beautifier(text.replace(/^\s*/, indentation), child_options);
                            } else {
                                // simply indent the string otherwise
                                var white = text.match(/^\s*/)[0];
                                var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                                var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                                text = text.replace(/^\s*/, indentation).replace(/\r\n|\r|\n/g, '\n' + reindent).replace(/\s+$/, '');
                            }
                            if (text) {
                                multi_parser.print_token_raw(text);
                                multi_parser.print_newline(true, multi_parser.output);
                            }
                        }
                        multi_parser.current_mode = 'TAG';
                        break;
                    default:
                        // We should not be getting here but we don't want to drop input on the floor
                        // Just output the text and move on
                        if (multi_parser.token_text !== '') {
                            multi_parser.print_token(multi_parser.token_text);
                        }
                        break;
                }
                multi_parser.last_token = multi_parser.token_type;
                multi_parser.last_text = multi_parser.token_text;
            }
            var sweet_code = multi_parser.output.join('').replace(/[\r\n\t ]+$/, '');

            // establish end_with_newline
            if (end_with_newline) {
                sweet_code += '\n';
            }

            if (eol !== '\n') {
                sweet_code = sweet_code.replace(/[\n]/g, eol);
            }

            return sweet_code;
        }

        if (typeof undefined === "function" && undefined.amd) {
            // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
            undefined(["require", "./beautify", "./beautify-css"], function (requireamd) {
                var js_beautify = requireamd("./beautify");
                var css_beautify = requireamd("./beautify-css");

                return {
                    html_beautify: function html_beautify(html_source, options) {
                        return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
                    }
                };
            });
        } else {
            // Add support for CommonJS. Just put this file somewhere on your require.paths
            // and you will be able to `var html_beautify = require("beautify").html_beautify`.
            var js_beautify = beautify;
            var css_beautify = beautifyCss;

            exports.html_beautify = function (html_source, options) {
                return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
            };
        }
    })();
});

var js = createCommonjsModule(function (module) {
    /*
      The MIT License (MIT)
    
      Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.
    
      Permission is hereby granted, free of charge, to any person
      obtaining a copy of this software and associated documentation files
      (the "Software"), to deal in the Software without restriction,
      including without limitation the rights to use, copy, modify, merge,
      publish, distribute, sublicense, and/or sell copies of the Software,
      and to permit persons to whom the Software is furnished to do so,
      subject to the following conditions:
    
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
    
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
      NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
      BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
      ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
      CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
    
    */

    /**
    The following batches are equivalent:
    
    var beautify_js = require('js-beautify');
    var beautify_js = require('js-beautify').js;
    var beautify_js = require('js-beautify').js_beautify;
    
    var beautify_css = require('js-beautify').css;
    var beautify_css = require('js-beautify').css_beautify;
    
    var beautify_html = require('js-beautify').html;
    var beautify_html = require('js-beautify').html_beautify;
    
    All methods returned accept two arguments, the source string and an options object.
    **/

    function get_beautify(js_beautify, css_beautify, html_beautify) {
        // the default is js
        var beautify$$1 = function beautify$$1(src, config) {
            return js_beautify.js_beautify(src, config);
        };

        // short aliases
        beautify$$1.js = js_beautify.js_beautify;
        beautify$$1.css = css_beautify.css_beautify;
        beautify$$1.html = html_beautify.html_beautify;

        // legacy aliases
        beautify$$1.js_beautify = js_beautify.js_beautify;
        beautify$$1.css_beautify = css_beautify.css_beautify;
        beautify$$1.html_beautify = html_beautify.html_beautify;

        return beautify$$1;
    }

    if (typeof undefined === "function" && undefined.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        undefined(["./lib/beautify", "./lib/beautify-css", "./lib/beautify-html"], function (js_beautify, css_beautify, html_beautify) {
            return get_beautify(js_beautify, css_beautify, html_beautify);
        });
    } else {
        (function (mod) {
            var js_beautify = beautify;
            var css_beautify = beautifyCss;
            var html_beautify = beautifyHtml;

            mod.exports = get_beautify(js_beautify, css_beautify, html_beautify);
        })(module);
    }
});

var name = 'prettifier';

/** Used for escape and unescape HTML. */
var escElement = document.createElement('textarea');

/**
 * Escapes HTML.
 * Used for pretty formatting HTML, CSS and JS to prepare for syntax highlighting.
 * @param {String} html - Valid HTML syntax
 */
function escapeHTML(html) {
  escElement.textContent = html;
  return escElement.innerHTML;
}

/**
 * Unescapes HTML.
 * @param {String} html - Valid HTML syntax,
 */
function unescapeHTML(html) {
  escElement.innerHTML = html;
  return escElement.textContent;
}

Observer(module.exports);

var Beautify = Object.freeze({
	name: name,
	escapeHTML: escapeHTML,
	unescapeHTML: unescapeHTML,
	__moduleExports: js
});

var config = {

    // Elements to be selected for validation
    elements: '[required],[data-validate],[data-equals],[data-regex],[data-cc]',

    // Regular expressions used to validate
    regexes: {

        alphanum: /^[a-z0-9]+$/i,
        alphanumspace: /^[a-z0-9\s]+$/i,
        name: /^[a-z\s\-\,\.]+$/i,
        username: /^[a-z0-9][a-z0-9\s\-\_\+\.]+[a-z0-9]$/i,
        fqdn: /^[a-z0-9][a-z0-9\-\_\.]+[a-z0-9]{2,20}$/i,
        tld: /^[a-z]{2,20}/i,
        phone: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
        email: /.+@.+\..+/i
    },

    // Feedback, state, and container classes
    classes: {

        container: 'field',
        error: 'error',
        help: 'help',
        hide: 'hide',
        info: 'info',
        success: 'success',
        warning: 'warning'
    },

    // Field formatting functions
    format: {
        cc: function cc() {}
    }

    /*
     * Format a field's value based on functions in `config.format`
     *
     * @param { String } formatFn - Name of function in `config.format`
     * @param { HTMLFormElement } field - Field to format value of
     */
};function formatValue(formatFn, field) {

    if (typeof config.format[formatFn] === 'function') {

        throw TypeError(formatFn + ' does not exist or is not a function');
    }

    field.value = config.format[formatFn](field.value);
}

// Overwrite config
function configure(opts) {

    for (opt in opts) {

        if (config[opt].constructor === Object) {

            config[opt] = Object.assign({}, config[opt], opts[opt]);
        } else {

            config[opt] = opts[opt];
        }
    }
}

/**
 * Validates a value and returns true or false.
 * Throws error if it cannot validate
 *
 * @param { String } value - Value to be validated
 * @param { String | RegExp } rgx - String reference to `regexes` or a RegExp
 *
 * @returns { Boolean }
 */
function validateRegex(value, rgx) {

    // Accepts RegExp as second value
    if (rgx.constructor === RegExp) {

        return rgx.test(value);
    }

    // Second value is a string, so it must exist
    // inside of `config.regexes` object
    if (typeof rgx === 'string' && config.regexes[rgx] !== undefined) {

        return config.regexes[rgx].test(value);
    }

    // If conditions aren't met, throw error
    throw Error('second parameter is an invalid regular expression or does not exist within utilities object');
}

/**
 * Iterates through an object and checks for true or false
 *
 * @param { Object } obj - Object to iterate
 *
 * @returns { Boolean }
 */
function confirmValidation(obj) {

    // Iterate through the object
    for (var v in obj) {

        // And return false if any key is false
        if (obj[v] === false) {

            return false;
        }
    }

    return true;
}

/**
 * Crawls up the DOM starting from the `field` element
 * and finds containing element with class names specified
 * in the `classes` object.
 *
 * @param { HTMLFormElement } field - Field whose parent we will return
 * @param { Object } containerClass - Name of class the container will have
 *
 * @returns { HTMLElement }
 */
function findFieldContainer(field, containerClass) {

    if (field === document.body) {

        throw new Error('Field named ' + field.name + ' is not inside a field container');
    }

    var parent = field.parentElement;

    if (!parent.classList.contains(containerClass)) {

        parent = findFieldContainer(parent, containerClass);
    }

    return parent;
}

var classes = config.classes;

/**
 * Adds validation functionality to form fields
 * to display errors and help fields. Binds field with
 * Riot Observable and gives elements event features.
 *
 * @param { HTMLFormElement } field - Field whose parent we will return
 * @param { Object } validations - Parent form validation object
 *
 */
function bindField(field, validations) {

    var parent = findFieldContainer(field, classes.container || '.field');

    var name = field.getAttribute('name');
    var type = field.getAttribute('type');
    var required = field.getAttribute('required') !== undefined;

    // Formatting function
    var format = field.getAttribute('format');

    // Validation function
    // input[data-validate] should be a function in
    var validate = field.getAttribute('validate');

    // Match value against another element
    // Should be a CSS selector
    var equals = field.getAttribute('equals');

    // Custom regular expression
    var regex = field.getAttribute('regex');

    // Events to bind to
    var on = field.getAttribute('on') || 'change';

    // Input validation object to handle multiple methods
    var validation = {};

    var isValid = false;

    if (field.getAttribute('disabled') || type === 'hidden') {

        return;
    }

    Observer(field);

    // Form validation object
    validations[name] = isValid;

    if (format) {

        formatValue(format, field);
    }

    var validateFn = function validateFn(e) {

        var keyCode = window.event ? e.which : e.keyCode;
        var isBlur = e.type === 'blur';
        var value = field.value;
        var empty = !value.length;

        // If it's required, it can't be empty
        if (required) {

            validation.required = !!value;

            if (type === 'checkbox') {

                validation.checked = field.checked;
            }
        }

        // Assert against existing validation function
        if (validate) {

            validation.validate = validateRegex(value, validate);
        }

        // Assert against custom regex
        if (regex) {

            var rgx = new RegExp(regex);
            validation.regex = rgx.test(value);
        }

        // Assert against another field's value
        if (equals) {

            var equalsElement = field.form.querySelector(equals);

            validation.equals = value === equalsElement.value;

            if (!equalsElement.isValid) {

                equalsElement.trigger('validate', {});
            }
        }

        // Check input validation
        isValid = confirmValidation(validation);

        // Input is not required and is empty
        if (!isValid && !required && !value && isBlur) {

            isValid = null;
        }

        validated(isValid);
        return isValid;
    };

    var validated = function validated(isValid) {

        // Bind to validation object for form check
        if (validate || regex || equals || required) {

            validations[name] = isValid;
        }

        // Bind validity to html element
        field.isValid = isValid;

        // If it's valid, remove error classes and hide the help block.
        // This is meant to work with bootstrap forms.
        if (isValid) {

            parent.classList.remove(classes.error);
            parent.classList.add(classes.success);

            parent.querySelector('.' + classes.help).classList.add(classes.hide);
        } else {

            parent.classList.add(classes.error);
            parent.classList.remove(classes.success);

            parent.querySelector('.' + classes.help).classList.remove(classes.hide);
        }

        // Allow fields that are not required
        if (isValid === null) {

            field.setBlank();
        }

        field.trigger('validated');
    };

    // Bind events to validation function
    on.split(' ').map(function (o) {
        return field['on' + o] = validateFn;
    });

    field.on('validate', validateFn);

    var setBlank = function setBlank() {

        parent.classList.remove(classes.success, classes.error, classes.warning, classes.info);
        parent.querySelector('.' + classes.help).classList.add(classes.hide);
    };
}

function bind(form) {

    var inputs = form.querySelectorAll(config.elements);
    var submit = form.querySelector('[type=submit]');
    var validations = {};

    form.validations = validations;
    form.isValid = false;
    form.noValidate = true;

    Observer(form);

    var validate = function validate() {

        form.isValid = confirmValidation(validations);
        return form.isValid;
    };

    var validateAll = function validateAll() {

        return new Promise(function (resolve, reject) {

            function assessSubmit() {

                // Returns true if valid
                if (validate()) {

                    resolve();
                } else {

                    reject();
                }
            }

            inputs.forEach(function (field, i) {

                if (i === inputs.length - 1) {

                    field.one('validated', function () {

                        assessSubmit();
                    });
                }

                field.trigger('validate', {});
            });
        });
    };

    form.on('validate', function () {

        validateAll().then(function () {

            form.trigger('validated');
        });
    });

    form.on('validated', function () {

        if (form.isValid) {

            form.trigger('submitted');
        }
    });

    // When the form is submitting, iterate through all the fields and validate them
    form.onsubmit = function (e) {

        e.preventDefault();

        if (!form.isValid) {

            form.trigger('validate');
        } else {

            form.trigger('validated');
            form.trigger('submitted');
        }
    };

    // Add validation functionality to form elements
    function bindFields() {

        inputs.forEach(function (field) {

            if (!field.on) {

                bindField(field, validations);
            }
        });
    }

    bindFields();

    // Rebind validations in case of new required fields
    if (!form.rebind) {

        form.rebind = function () {

            inputs = form.find(config.elements);
            bindFields();
        };

        form.on('rebind', form.rebind);
    }

    form.on('reset', function () {

        form.reset();
        form.isValid = false;

        inputs.forEach(function (field) {

            field.setBlank();
        });
    });
}



var ActionForms = Object.freeze({
	bind: bind,
	config: config,
	formatValue: formatValue,
	configure: configure,
	validateRegex: validateRegex,
	confirmValidation: confirmValidation,
	findFieldContainer: findFieldContainer
});

var __TAGS_CACHE = [];
var __TAG_IMPL = {};
var GLOBAL_MIXIN = '__global_mixin';
var ATTRS_PREFIX = 'riot-';
var REF_DIRECTIVES = ['ref', 'data-ref'];
var IS_DIRECTIVE = 'data-is';
var CONDITIONAL_DIRECTIVE = 'if';
var LOOP_DIRECTIVE = 'each';
var LOOP_NO_REORDER_DIRECTIVE = 'no-reorder';
var SHOW_DIRECTIVE = 'show';
var HIDE_DIRECTIVE = 'hide';
var RIOT_EVENTS_KEY = '__riot-events__';
var T_STRING = 'string';
var T_OBJECT = 'object';
var T_UNDEF = 'undefined';
var T_FUNCTION = 'function';
var XLINK_NS = 'http://www.w3.org/1999/xlink';
var SVG_NS = 'http://www.w3.org/2000/svg';
var XLINK_REGEX = /^xlink:(\w+)/;
var WIN = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === T_UNDEF ? undefined : window;
var RE_SPECIAL_TAGS = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/;
var RE_SPECIAL_TAGS_NO_OPTION = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/;
var RE_EVENTS_PREFIX = /^on/;
var RE_HTML_ATTRS = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g;
var CASE_SENSITIVE_ATTRIBUTES = { 'viewbox': 'viewBox' };
var RE_BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/;
var IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;

/**
 * Check if the passed argument is a boolean attribute
 * @param   { String } value -
 * @returns { Boolean } -
 */
function isBoolAttr(value) {
  return RE_BOOL_ATTRS.test(value);
}

/**
 * Check if passed argument is a function
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isFunction(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === T_FUNCTION;
}

/**
 * Check if passed argument is an object, exclude null
 * NOTE: use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isObject(value) {
  return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === T_OBJECT; // typeof null is 'object'
}

/**
 * Check if passed argument is undefined
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isUndefined(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === T_UNDEF;
}

/**
 * Check if passed argument is a string
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isString(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === T_STRING;
}

/**
 * Check if passed argument is empty. Different from falsy, because we dont consider 0 or false to be blank
 * @param { * } value -
 * @returns { Boolean } -
 */
function isBlank(value) {
  return isUndefined(value) || value === null || value === '';
}

/**
 * Check if passed argument is a kind of array
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isArray(value) {
  return Array.isArray(value) || value instanceof Array;
}

/**
 * Check whether object's property could be overridden
 * @param   { Object }  obj - source object
 * @param   { String }  key - object property
 * @returns { Boolean } -
 */
function isWritable(obj, key) {
  var descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return isUndefined(obj[key]) || descriptor && descriptor.writable;
}



var check = Object.freeze({
	isBoolAttr: isBoolAttr,
	isFunction: isFunction,
	isObject: isObject,
	isUndefined: isUndefined,
	isString: isString,
	isBlank: isBlank,
	isArray: isArray,
	isWritable: isWritable
});

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector);
}

/**
 * Create a document fragment
 * @returns { Object } document fragment
 */
function createFrag() {
  return document.createDocumentFragment();
}

/**
 * Create a document text node
 * @returns { Object } create a text node to use as placeholder
 */
function createDOMPlaceholder() {
  return document.createTextNode('');
}

/**
 * Check if a DOM node is an svg tag
 * @param   { HTMLElement }  el - node we want to test
 * @returns {Boolean} true if it's an svg node
 */
function isSvg(el) {
  return !!el.ownerSVGElement;
}

/**
 * Create a generic DOM node
 * @param   { String } name - name of the DOM node we want to create
 * @param   { Boolean } isSvg - true if we need to use an svg node
 * @returns { Object } DOM node just created
 */
function mkEl(name) {
  return name === 'svg' ? document.createElementNS(SVG_NS, name) : document.createElement(name);
}

/**
 * Set the inner html of any DOM node SVGs included
 * @param { Object } container - DOM node where we'll inject new html
 * @param { String } html - html to inject
 */
/* istanbul ignore next */
function setInnerHTML(container, html) {
  if (!isUndefined(container.innerHTML)) container.innerHTML = html;
  // some browsers do not support innerHTML on the SVGs tags
  else {
      var doc = new DOMParser().parseFromString(html, 'application/xml');
      var node = container.ownerDocument.importNode(doc.documentElement, true);
      container.appendChild(node);
    }
}

/**
 * Toggle the visibility of any DOM node
 * @param   { Object }  dom - DOM node we want to hide
 * @param   { Boolean } show - do we want to show it?
 */

function toggleVisibility(dom, show) {
  dom.style.display = show ? '' : 'none';
  dom['hidden'] = show ? false : true;
}

/**
 * Remove any DOM attribute from a node
 * @param   { Object } dom - DOM node we want to update
 * @param   { String } name - name of the property we want to remove
 */
function remAttr(dom, name) {
  dom.removeAttribute(name);
}

/**
 * Convert a style object to a string
 * @param   { Object } style - style object we need to parse
 * @returns { String } resulting css string
 * @example
 * styleObjectToString({ color: 'red', height: '10px'}) // => 'color: red; height: 10px'
 */
function styleObjectToString(style) {
  return Object.keys(style).reduce(function (acc, prop) {
    return acc + ' ' + prop + ': ' + style[prop] + ';';
  }, '');
}

/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name);
}

/**
 * Set any DOM attribute
 * @param { Object } dom - DOM node we want to update
 * @param { String } name - name of the property we want to set
 * @param { String } val - value of the property we want to set
 */
function setAttr(dom, name, val) {
  var xlink = XLINK_REGEX.exec(name);
  if (xlink && xlink[1]) dom.setAttributeNS(XLINK_NS, xlink[1], val);else dom.setAttribute(name, val);
}

/**
 * Insert safely a tag to fix #1962 #1649
 * @param   { HTMLElement } root - children container
 * @param   { HTMLElement } curr - node to insert
 * @param   { HTMLElement } next - node that should preceed the current node inserted
 */
function safeInsert(root, curr, next) {
  root.insertBefore(curr, next.parentNode && next);
}

/**
 * Minimize risk: only zero or one _space_ between attr & value
 * @param   { String }   html - html string we want to parse
 * @param   { Function } fn - callback function to apply on any attribute found
 */
function walkAttrs(html, fn) {
  if (!html) return;
  var m = void 0;
  while (m = RE_HTML_ATTRS.exec(html)) {
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4]);
  }
}

/**
 * Walk down recursively all the children tags starting dom node
 * @param   { Object }   dom - starting node where we will start the recursion
 * @param   { Function } fn - callback to transform the child node just found
 * @param   { Object }   context - fn can optionally return an object, which is passed to children
 */
function walkNodes(dom, fn, context) {
  if (dom) {
    var res = fn(dom, context);
    var next = void 0;
    // stop the recursion
    if (res === false) return;

    dom = dom.firstChild;

    while (dom) {
      next = dom.nextSibling;
      walkNodes(dom, fn, res);
      dom = next;
    }
  }
}

var dom = Object.freeze({
	$$: $$,
	$: $,
	createFrag: createFrag,
	createDOMPlaceholder: createDOMPlaceholder,
	isSvg: isSvg,
	mkEl: mkEl,
	setInnerHTML: setInnerHTML,
	toggleVisibility: toggleVisibility,
	remAttr: remAttr,
	styleObjectToString: styleObjectToString,
	getAttr: getAttr,
	setAttr: setAttr,
	safeInsert: safeInsert,
	walkAttrs: walkAttrs,
	walkNodes: walkNodes
});

var styleNode = void 0;
// Create cache and shortcut to the correct property
var cssTextProp = void 0;
var byName = {};
var remainder = [];
var needsInject = false;

// skip the following code on the server
if (WIN) {
  styleNode = function () {
    // create a new style element with the correct type
    var newNode = mkEl('style');
    setAttr(newNode, 'type', 'text/css');

    // replace any user node or insert the new one into the head
    var userNode = $('style[type=riot]');
    /* istanbul ignore next */
    if (userNode) {
      if (userNode.id) newNode.id = userNode.id;
      userNode.parentNode.replaceChild(newNode, userNode);
    } else document.getElementsByTagName('head')[0].appendChild(newNode);

    return newNode;
  }();
  cssTextProp = styleNode.styleSheet;
}

/**
 * Object that will be used to inject and manage the css of every tag instance
 */
var styleManager = {
  styleNode: styleNode,
  /**
   * Save a tag style to be later injected into DOM
   * @param { String } css - css string
   * @param { String } name - if it's passed we will map the css to a tagname
   */
  add: function add(css, name) {
    if (name) byName[name] = css;else remainder.push(css);
    needsInject = true;
  },

  /**
   * Inject all previously saved tag styles into DOM
   * innerHTML seems slow: http://jsperf.com/riot-insert-style
   */
  inject: function inject() {
    if (!WIN || !needsInject) return;
    needsInject = false;
    var style = Object.keys(byName).map(function (k) {
      return byName[k];
    }).concat(remainder).join('\n');
    /* istanbul ignore next */
    if (cssTextProp) cssTextProp.cssText = style;else styleNode.innerHTML = style;
  }
};

/**
 * The riot template engine
 * @version v3.0.8
 */

var skipRegex = function () {
  //eslint-disable-line no-unused-vars

  var beforeReChars = '[{(,;:?=|&!^~>%*/';

  var beforeReWords = ['case', 'default', 'do', 'else', 'in', 'instanceof', 'prefix', 'return', 'typeof', 'void', 'yield'];

  var wordsLastChar = beforeReWords.reduce(function (s, w) {
    return s + w.slice(-1);
  }, '');

  var RE_REGEX = /^\/(?=[^*>/])[^[/\\]*(?:(?:\\.|\[(?:\\.|[^\]\\]*)*\])[^[\\/]*)*?\/[gimuy]*/;
  var RE_VN_CHAR = /[$\w]/;

  function prev(code, pos) {
    while (--pos >= 0 && /\s/.test(code[pos])) {}
    return pos;
  }

  function _skipRegex(code, start) {

    var re = /.*/g;
    var pos = re.lastIndex = start++;
    var match = re.exec(code)[0].match(RE_REGEX);

    if (match) {
      var next = pos + match[0].length;

      pos = prev(code, pos);
      var c = code[pos];

      if (pos < 0 || ~beforeReChars.indexOf(c)) {
        return next;
      }

      if (c === '.') {

        if (code[pos - 1] === '.') {
          start = next;
        }
      } else if (c === '+' || c === '-') {

        if (code[--pos] !== c || (pos = prev(code, pos)) < 0 || !RE_VN_CHAR.test(code[pos])) {
          start = next;
        }
      } else if (~wordsLastChar.indexOf(c)) {

        var end = pos + 1;

        while (--pos >= 0 && RE_VN_CHAR.test(code[pos])) {}
        if (~beforeReWords.indexOf(code.slice(pos + 1, end))) {
          start = next;
        }
      }
    }

    return start;
  }

  return _skipRegex;
}();

/**
 * riot.util.brackets
 *
 * - `brackets    ` - Returns a string or regex based on its parameter
 * - `brackets.set` - Change the current riot brackets
 *
 * @module
 */

/* global riot */

var brackets = function (UNDEF) {

  var REGLOB = 'g',
      R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
      R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,
      S_QBLOCKS = R_STRINGS.source + '|' + /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' + /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?([^<]\/)[gim]*/.source,
      UNSUPPORTED = RegExp('[\\' + 'x00-\\x1F<>a-zA-Z0-9\'",;\\\\]'),
      NEED_ESCAPE = /(?=[[\]()*+?.^$|])/g,
      S_QBLOCK2 = R_STRINGS.source + '|' + /(\/)(?![*\/])/.source,
      FINDBRACES = {
    '(': RegExp('([()])|' + S_QBLOCK2, REGLOB),
    '[': RegExp('([[\\]])|' + S_QBLOCK2, REGLOB),
    '{': RegExp('([{}])|' + S_QBLOCK2, REGLOB)
  },
      DEFAULT = '{ }';

  var _pairs = ['{', '}', '{', '}', /{[^}]*}/, /\\([{}])/g, /\\({)|{/g, RegExp('\\\\(})|([[({])|(})|' + S_QBLOCK2, REGLOB), DEFAULT, /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/, /(^|[^\\]){=[\S\s]*?}/];

  var cachedBrackets = UNDEF,
      _regex,
      _cache = [],
      _settings;

  function _loopback(re) {
    return re;
  }

  function _rewrite(re, bp) {
    if (!bp) bp = _cache;
    return new RegExp(re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : '');
  }

  function _create(pair) {
    if (pair === DEFAULT) return _pairs;

    var arr = pair.split(' ');

    if (arr.length !== 2 || UNSUPPORTED.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"');
    }
    arr = arr.concat(pair.replace(NEED_ESCAPE, '\\').split(' '));

    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr);
    arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr);
    arr[6] = _rewrite(_pairs[6], arr);
    arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCK2, REGLOB);
    arr[8] = pair;
    return arr;
  }

  function _brackets(reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx];
  }

  _brackets.split = function split(str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) _bp = _cache;

    var parts = [],
        match,
        isexpr,
        start,
        pos,
        re = _bp[6];

    var qblocks = [];
    var prevStr = '';
    var mark, lastIndex;

    isexpr = start = re.lastIndex = 0;

    while (match = re.exec(str)) {

      lastIndex = re.lastIndex;
      pos = match.index;

      if (isexpr) {

        if (match[2]) {

          var ch = match[2];
          var rech = FINDBRACES[ch];
          var ix = 1;

          rech.lastIndex = lastIndex;
          while (match = rech.exec(str)) {
            if (match[1]) {
              if (match[1] === ch) ++ix;else if (! --ix) break;
            } else {
              rech.lastIndex = pushQBlock(match.index, rech.lastIndex, match[2]);
            }
          }
          re.lastIndex = ix ? str.length : rech.lastIndex;
          continue;
        }

        if (!match[3]) {
          re.lastIndex = pushQBlock(pos, lastIndex, match[4]);
          continue;
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos));
        start = re.lastIndex;
        re = _bp[6 + (isexpr ^= 1)];
        re.lastIndex = start;
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start));
    }

    parts.qblocks = qblocks;

    return parts;

    function unescapeStr(s) {
      if (prevStr) {
        s = prevStr + s;
        prevStr = '';
      }
      if (tmpl || isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'));
      } else {
        parts.push(s);
      }
    }

    function pushQBlock(_pos, _lastIndex, slash) {
      //eslint-disable-line
      if (slash) {
        _lastIndex = skipRegex(str, _pos);
      }

      if (tmpl && _lastIndex > _pos + 2) {
        mark = '\u2057' + qblocks.length + '~';
        qblocks.push(str.slice(_pos, _lastIndex));
        prevStr += str.slice(start, _pos) + mark;
        start = _lastIndex;
      }
      return _lastIndex;
    }
  };

  _brackets.hasExpr = function hasExpr(str) {
    return _cache[4].test(str);
  };

  _brackets.loopKeys = function loopKeys(expr) {
    var m = expr.match(_cache[9]);

    return m ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] } : { val: expr.trim() };
  };

  _brackets.array = function array(pair) {
    return pair ? _create(pair) : _cache;
  };

  function _reset(pair) {
    if ((pair || (pair = DEFAULT)) !== _cache[8]) {
      _cache = _create(pair);
      _regex = pair === DEFAULT ? _loopback : _rewrite;
      _cache[9] = _regex(_pairs[9]);
    }
    cachedBrackets = pair;
  }

  function _setSettings(o) {
    var b;

    o = o || {};
    b = o.brackets;
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function get$$1() {
        return cachedBrackets;
      },
      enumerable: true
    });
    _settings = o;
    _reset(b);
  }

  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function get$$1() {
      return _settings;
    }
  });

  /* istanbul ignore next: in the browser riot is always in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {};
  _brackets.set = _reset;
  _brackets.skipRegex = skipRegex;

  _brackets.R_STRINGS = R_STRINGS;
  _brackets.R_MLCOMMS = R_MLCOMMS;
  _brackets.S_QBLOCKS = S_QBLOCKS;
  _brackets.S_QBLOCK2 = S_QBLOCK2;

  return _brackets;
}();

/**
 * @module tmpl
 *
 * tmpl          - Root function, returns the template value, render with data
 * tmpl.hasExpr  - Test the existence of a expression inside a string
 * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
 */

var tmpl = function () {

  var _cache = {};

  function _tmpl(str, data) {
    if (!str) return str;

    return (_cache[str] || (_cache[str] = _create(str))).call(data, _logErr.bind({
      data: data,
      tmpl: str
    }));
  }

  _tmpl.hasExpr = brackets.hasExpr;

  _tmpl.loopKeys = brackets.loopKeys;

  // istanbul ignore next
  _tmpl.clearCache = function () {
    _cache = {};
  };

  _tmpl.errorHandler = null;

  function _logErr(err, ctx) {

    err.riotData = {
      tagName: ctx && ctx.__ && ctx.__.tagName,
      _riot_id: ctx && ctx._riot_id //eslint-disable-line camelcase
    };

    if (_tmpl.errorHandler) _tmpl.errorHandler(err);else if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(err.message);
      console.log('<%s> %s', err.riotData.tagName || 'Unknown tag', this.tmpl); // eslint-disable-line
      console.log(this.data); // eslint-disable-line
    }
  }

  function _create(str) {
    var expr = _getTmpl(str);

    if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr;

    return new Function('E', expr + ';'); // eslint-disable-line no-new-func
  }

  var RE_DQUOTE = /\u2057/g;
  var RE_QBMARK = /\u2057(\d+)~/g;

  function _getTmpl(str) {
    var parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1);
    var qstr = parts.qblocks;
    var expr;

    if (parts.length > 2 || parts[0]) {
      var i,
          j,
          list = [];

      for (i = j = 0; i < parts.length; ++i) {

        expr = parts[i];

        if (expr && (expr = i & 1 ? _parseExpr(expr, 1, qstr) : '"' + expr.replace(/\\/g, '\\\\').replace(/\r\n?|\n/g, '\\n').replace(/"/g, '\\"') + '"')) list[j++] = expr;
      }

      expr = j < 2 ? list[0] : '[' + list.join(',') + '].join("")';
    } else {

      expr = _parseExpr(parts[1], 0, qstr);
    }

    if (qstr.length) {
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos].replace(/\r/g, '\\r').replace(/\n/g, '\\n');
      });
    }
    return expr;
  }

  var RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/;
  var RE_BREND = {
    '(': /[()]/g,
    '[': /[[\]]/g,
    '{': /[{}]/g
  };

  function _parseExpr(expr, asText, qstr) {

    expr = expr.replace(/\s+/g, ' ').trim().replace(/\ ?([[\({},?\.:])\ ?/g, '$1');

    if (expr) {
      var list = [],
          cnt = 0,
          match;

      while (expr && (match = expr.match(RE_CSNAME)) && !match.index) {
        var key,
            jsb,
            re = /,|([[{(])|$/g;

        expr = RegExp.rightContext;
        key = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1];

        while (jsb = (match = re.exec(expr))[1]) {
          skipBraces(jsb, re);
        }jsb = expr.slice(0, match.index);
        expr = RegExp.rightContext;

        list[cnt++] = _wrapExpr(jsb, 1, key);
      }

      expr = !cnt ? _wrapExpr(expr, asText) : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0];
    }
    return expr;

    function skipBraces(ch, re) {
      var mm,
          lv = 1,
          ir = RE_BREND[ch];

      ir.lastIndex = re.lastIndex;
      while (mm = ir.exec(expr)) {
        if (mm[0] === ch) ++lv;else if (! --lv) break;
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex;
    }
  }

  // istanbul ignore next: not both
  var // eslint-disable-next-line max-len
  JS_CONTEXT = '"in this?this:' + ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' ? 'global' : 'window') + ').',
      JS_VARNAME = /[,{][\$\w]+(?=:)|(^ *|[^$\w\.{])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
      JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/;

  function _wrapExpr(expr, asText, key) {
    var tb;

    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length;

        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar;
          if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '[';
        } else if (pos) {
          tb = !JS_NOPROPS.test(s.slice(pos));
        }
      }
      return match;
    });

    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}';
    }

    if (key) {

      expr = (tb ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')') + '?"' + key + '":""';
    } else if (asText) {

      expr = 'function(v){' + (tb ? expr.replace('return ', 'v=') : 'v=(' + expr + ')') + ';return v||v===0?v:""}.call(this)';
    }

    return expr;
  }

  _tmpl.version = brackets.version = 'v3.0.8';

  return _tmpl;
}();

var observable$2 = createCommonjsModule(function (module, exports) {
  (function (window, undefined) {
    var observable = function observable(el) {

      /**
       * Extend the original object or create a new empty one
       * @type { Object }
       */

      el = el || {};

      /**
       * Private variables
       */
      var callbacks = {},
          slice = Array.prototype.slice;

      /**
       * Public Api
       */

      // extend the el object adding the observable methods
      Object.defineProperties(el, {
        /**
         * Listen to the given `event` ands
         * execute the `callback` each time an event is triggered.
         * @param  { String } event - event id
         * @param  { Function } fn - callback function
         * @returns { Object } el
         */
        on: {
          value: function value(event, fn) {
            if (typeof fn == 'function') (callbacks[event] = callbacks[event] || []).push(fn);
            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Removes the given `event` listeners
         * @param   { String } event - event id
         * @param   { Function } fn - callback function
         * @returns { Object } el
         */
        off: {
          value: function value(event, fn) {
            if (event == '*' && !fn) callbacks = {};else {
              if (fn) {
                var arr = callbacks[event];
                for (var i = 0, cb; cb = arr && arr[i]; ++i) {
                  if (cb == fn) arr.splice(i--, 1);
                }
              } else delete callbacks[event];
            }
            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Listen to the given `event` and
         * execute the `callback` at most once
         * @param   { String } event - event id
         * @param   { Function } fn - callback function
         * @returns { Object } el
         */
        one: {
          value: function value(event, fn) {
            function on() {
              el.off(event, on);
              fn.apply(el, arguments);
            }
            return el.on(event, on);
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Execute all callback functions that listen to
         * the given `event`
         * @param   { String } event - event id
         * @returns { Object } el
         */
        trigger: {
          value: function value(event) {

            // getting the arguments
            var arglen = arguments.length - 1,
                args = new Array(arglen),
                fns,
                fn,
                i;

            for (i = 0; i < arglen; i++) {
              args[i] = arguments[i + 1]; // skip first argument
            }

            fns = slice.call(callbacks[event] || [], 0);

            for (i = 0; fn = fns[i]; ++i) {
              fn.apply(el, args);
            }

            if (callbacks['*'] && event != '*') el.trigger.apply(el, ['*', event].concat(args));

            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        }
      });

      return el;
    };
    /* istanbul ignore next */
    // support CommonJS, AMD & browser
    module.exports = observable;
  })(typeof window != 'undefined' ? window : undefined);
});

/**
 * Specialized function for looping an array-like collection with `each={}`
 * @param   { Array } list - collection of items
 * @param   {Function} fn - callback function
 * @returns { Array } the array looped
 */
function each(list, fn) {
  var len = list ? list.length : 0;
  var i = 0;
  for (; i < len; ++i) {
    fn(list[i], i);
  }
  return list;
}

/**
 * Check whether an array contains an item
 * @param   { Array } array - target array
 * @param   { * } item - item to test
 * @returns { Boolean } -
 */
function contains(array, item) {
  return array.indexOf(item) !== -1;
}

/**
 * Convert a string containing dashes to camel case
 * @param   { String } str - input string
 * @returns { String } my-string -> myString
 */
function toCamel(str) {
  return str.replace(/-(\w)/g, function (_, c) {
    return c.toUpperCase();
  });
}

/**
 * Faster String startsWith alternative
 * @param   { String } str - source string
 * @param   { String } value - test string
 * @returns { Boolean } -
 */
function startsWith(str, value) {
  return str.slice(0, value.length) === value;
}

/**
 * Helper function to set an immutable property
 * @param   { Object } el - object where the new property will be set
 * @param   { String } key - object key where the new property will be stored
 * @param   { * } value - value of the new property
 * @param   { Object } options - set the propery overriding the default options
 * @returns { Object } - the initial object
 */
function defineProperty$1(el, key, value, options) {
  Object.defineProperty(el, key, extend({
    value: value,
    enumerable: false,
    writable: false,
    configurable: true
  }, options));
  return el;
}

/**
 * Extend any object with other properties
 * @param   { Object } src - source object
 * @returns { Object } the resulting extended object
 *
 * var obj = { foo: 'baz' }
 * extend(obj, {bar: 'bar', foo: 'bar'})
 * console.log(obj) => {bar: 'bar', foo: 'bar'}
 *
 */
function extend(src) {
  var obj = void 0;
  var args = arguments;
  for (var i = 1; i < args.length; ++i) {
    if (obj = args[i]) {
      for (var key in obj) {
        // check if this property of the source object could be overridden
        if (isWritable(src, key)) src[key] = obj[key];
      }
    }
  }
  return src;
}

var misc = Object.freeze({
	each: each,
	contains: contains,
	toCamel: toCamel,
	startsWith: startsWith,
	defineProperty: defineProperty$1,
	extend: extend
});

var settings$1 = extend(Object.create(brackets.settings), {
  skipAnonymousTags: true,
  // handle the auto updates on any DOM event
  autoUpdate: true
});

/**
 * Trigger DOM events
 * @param   { HTMLElement } dom - dom element target of the event
 * @param   { Function } handler - user function
 * @param   { Object } e - event object
 */
function handleEvent(dom, handler, e) {
  var ptag = this.__.parent;
  var item = this.__.item;

  if (!item) while (ptag && !item) {
    item = ptag.__.item;
    ptag = ptag.__.parent;
  }

  // override the event properties
  /* istanbul ignore next */
  if (isWritable(e, 'currentTarget')) e.currentTarget = dom;
  /* istanbul ignore next */
  if (isWritable(e, 'target')) e.target = e.srcElement;
  /* istanbul ignore next */
  if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode;

  e.item = item;

  handler.call(this, e);

  // avoid auto updates
  if (!settings$1.autoUpdate) return;

  if (!e.preventUpdate) {
    var p = getImmediateCustomParentTag(this);
    // fixes #2083
    if (p.isMounted) p.update();
  }
}

/**
 * Attach an event to a DOM node
 * @param { String } name - event name
 * @param { Function } handler - event callback
 * @param { Object } dom - dom node
 * @param { Tag } tag - tag instance
 */
function setEventHandler(name, handler, dom, tag) {
  var eventName = void 0;
  var cb = handleEvent.bind(tag, dom, handler);

  // avoid to bind twice the same event
  // possible fix for #2332
  dom[name] = null;

  // normalize event name
  eventName = name.replace(RE_EVENTS_PREFIX, '');

  // cache the listener into the listeners array
  if (!contains(tag.__.listeners, dom)) tag.__.listeners.push(dom);
  if (!dom[RIOT_EVENTS_KEY]) dom[RIOT_EVENTS_KEY] = {};
  if (dom[RIOT_EVENTS_KEY][name]) dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][name]);

  dom[RIOT_EVENTS_KEY][name] = cb;
  dom.addEventListener(eventName, cb, false);
}

/**
 * Update dynamically created data-is tags with changing expressions
 * @param { Object } expr - expression tag and expression info
 * @param { Tag }    parent - parent for tag creation
 * @param { String } tagName - tag implementation we want to use
 */
function updateDataIs(expr, parent, tagName) {
  var tag = expr.tag || expr.dom._tag,
      ref = void 0;

  var _ref = tag ? tag.__ : {},
      head = _ref.head;

  var isVirtual = expr.dom.tagName === 'VIRTUAL';

  if (tag && expr.tagName === tagName) {
    tag.update();
    return;
  }

  // sync _parent to accommodate changing tagnames
  if (tag) {
    // need placeholder before unmount
    if (isVirtual) {
      ref = createDOMPlaceholder();
      head.parentNode.insertBefore(ref, head);
    }

    tag.unmount(true);
  }

  // unable to get the tag name
  if (!isString(tagName)) return;

  expr.impl = __TAG_IMPL[tagName];

  // unknown implementation
  if (!expr.impl) return;

  expr.tag = tag = initChildTag(expr.impl, {
    root: expr.dom,
    parent: parent,
    tagName: tagName
  }, expr.dom.innerHTML, parent);

  each(expr.attrs, function (a) {
    return setAttr(tag.root, a.name, a.value);
  });
  expr.tagName = tagName;
  tag.mount();

  // root exist first time, after use placeholder
  if (isVirtual) makeReplaceVirtual(tag, ref || tag.root);

  // parent is the placeholder tag, not the dynamic tag so clean up
  parent.__.onUnmount = function () {
    var delName = tag.opts.dataIs;
    arrayishRemove(tag.parent.tags, delName, tag);
    arrayishRemove(tag.__.parent.tags, delName, tag);
    tag.unmount();
  };
}

/**
 * Nomalize any attribute removing the "riot-" prefix
 * @param   { String } attrName - original attribute name
 * @returns { String } valid html attribute name
 */
function normalizeAttrName(attrName) {
  if (!attrName) return null;
  attrName = attrName.replace(ATTRS_PREFIX, '');
  if (CASE_SENSITIVE_ATTRIBUTES[attrName]) attrName = CASE_SENSITIVE_ATTRIBUTES[attrName];
  return attrName;
}

/**
 * Update on single tag expression
 * @this Tag
 * @param { Object } expr - expression logic
 * @returns { undefined }
 */
function updateExpression(expr) {
  if (this.root && getAttr(this.root, 'virtualized')) return;

  var dom = expr.dom,

  // remove the riot- prefix
  attrName = normalizeAttrName(expr.attr),
      isToggle = contains([SHOW_DIRECTIVE, HIDE_DIRECTIVE], attrName),
      isVirtual = expr.root && expr.root.tagName === 'VIRTUAL',
      parent = dom && (expr.parent || dom.parentNode),

  // detect the style attributes
  isStyleAttr = attrName === 'style',
      isClassAttr = attrName === 'class',
      hasValue,
      isObj,
      value;

  // if it's a tag we could totally skip the rest
  if (expr._riot_id) {
    if (expr.__.wasCreated) {
      expr.update();
      // if it hasn't been mounted yet, do that now.
    } else {
      expr.mount();
      if (isVirtual) {
        makeReplaceVirtual(expr, expr.root);
      }
    }
    return;
  }
  // if this expression has the update method it means it can handle the DOM changes by itself
  if (expr.update) return expr.update();

  // ...it seems to be a simple expression so we try to calculat its value
  value = tmpl(expr.expr, isToggle ? extend({}, Object.create(this.parent), this) : this);
  hasValue = !isBlank(value);
  isObj = isObject(value);

  // convert the style/class objects to strings
  if (isObj) {
    isObj = !isClassAttr && !isStyleAttr;
    if (isClassAttr) {
      value = tmpl(JSON.stringify(value), this);
    } else if (isStyleAttr) {
      value = styleObjectToString(value);
    }
  }

  // remove original attribute
  if (expr.attr && (!expr.isAttrRemoved || !hasValue || value === false)) {
    remAttr(dom, expr.attr);
    expr.isAttrRemoved = true;
  }

  // for the boolean attributes we don't need the value
  // we can convert it to checked=true to checked=checked
  if (expr.bool) value = value ? attrName : false;
  if (expr.isRtag) return updateDataIs(expr, this, value);
  if (expr.wasParsedOnce && expr.value === value) return;

  // update the expression value
  expr.value = value;
  expr.wasParsedOnce = true;

  // if the value is an object we can not do much more with it
  if (isObj && !isToggle) return;
  // avoid to render undefined/null values
  if (isBlank(value)) value = '';

  // textarea and text nodes have no attribute name
  if (!attrName) {
    // about #815 w/o replace: the browser converts the value to a string,
    // the comparison by "==" does too, but not in the server
    value += '';
    // test for parent avoids error with invalid assignment to nodeValue
    if (parent) {
      // cache the parent node because somehow it will become null on IE
      // on the next iteration
      expr.parent = parent;
      if (parent.tagName === 'TEXTAREA') {
        parent.value = value; // #1113
        if (!IE_VERSION) dom.nodeValue = value; // #1625 IE throws here, nodeValue
      } // will be available on 'updated'
      else dom.nodeValue = value;
    }
    return;
  }

  // event handler
  if (isFunction(value)) {
    setEventHandler(attrName, value, dom, this);
    // show / hide
  } else if (isToggle) {
    toggleVisibility(dom, attrName === HIDE_DIRECTIVE ? !value : value);
    // handle attributes
  } else {
    if (expr.bool) {
      dom[attrName] = value;
    }

    if (attrName === 'value' && dom.value !== value) {
      dom.value = value;
    }

    if (hasValue && value !== false) {
      setAttr(dom, attrName, value);
    }

    // make sure that in case of style changes
    // the element stays hidden
    if (isStyleAttr && dom.hidden) toggleVisibility(dom, false);
  }
}

/**
 * Update all the expressions in a Tag instance
 * @this Tag
 * @param { Array } expressions - expression that must be re evaluated
 */
function updateAllExpressions(expressions) {
  each(expressions, updateExpression.bind(this));
}

var IfExpr = {
  init: function init(dom, tag, expr) {
    remAttr(dom, CONDITIONAL_DIRECTIVE);
    this.tag = tag;
    this.expr = expr;
    this.stub = createDOMPlaceholder();
    this.pristine = dom;

    var p = dom.parentNode;
    p.insertBefore(this.stub, dom);
    p.removeChild(dom);

    return this;
  },
  update: function update() {
    this.value = tmpl(this.expr, this.tag);

    if (this.value && !this.current) {
      // insert
      this.current = this.pristine.cloneNode(true);
      this.stub.parentNode.insertBefore(this.current, this.stub);
      this.expressions = [];
      parseExpressions.apply(this.tag, [this.current, this.expressions, true]);
    } else if (!this.value && this.current) {
      // remove
      unmountAll(this.expressions);
      if (this.current._tag) {
        this.current._tag.unmount();
      } else if (this.current.parentNode) {
        this.current.parentNode.removeChild(this.current);
      }
      this.current = null;
      this.expressions = [];
    }

    if (this.value) updateAllExpressions.call(this.tag, this.expressions);
  },
  unmount: function unmount() {
    unmountAll(this.expressions || []);
  }
};

var RefExpr = {
  init: function init(dom, parent, attrName, attrValue) {
    this.dom = dom;
    this.attr = attrName;
    this.rawValue = attrValue;
    this.parent = parent;
    this.hasExp = tmpl.hasExpr(attrValue);
    return this;
  },
  update: function update() {
    var old = this.value;
    var customParent = this.parent && getImmediateCustomParentTag(this.parent);
    // if the referenced element is a custom tag, then we set the tag itself, rather than DOM
    var tagOrDom = this.dom.__ref || this.tag || this.dom;

    this.value = this.hasExp ? tmpl(this.rawValue, this.parent) : this.rawValue;

    // the name changed, so we need to remove it from the old key (if present)
    if (!isBlank(old) && customParent) arrayishRemove(customParent.refs, old, tagOrDom);
    if (!isBlank(this.value) && isString(this.value)) {
      // add it to the refs of parent tag (this behavior was changed >=3.0)
      if (customParent) arrayishAdd(customParent.refs, this.value, tagOrDom,
      // use an array if it's a looped node and the ref is not an expression
      null, this.parent.__.index);

      if (this.value !== old) {
        setAttr(this.dom, this.attr, this.value);
      }
    } else {
      remAttr(this.dom, this.attr);
    }

    // cache the ref bound to this dom node
    // to reuse it in future (see also #2329)
    if (!this.dom.__ref) this.dom.__ref = tagOrDom;
  },
  unmount: function unmount() {
    var tagOrDom = this.tag || this.dom;
    var customParent = this.parent && getImmediateCustomParentTag(this.parent);
    if (!isBlank(this.value) && customParent) arrayishRemove(customParent.refs, this.value, tagOrDom);
  }
};

/**
 * Convert the item looped into an object used to extend the child tag properties
 * @param   { Object } expr - object containing the keys used to extend the children tags
 * @param   { * } key - value to assign to the new object returned
 * @param   { * } val - value containing the position of the item in the array
 * @param   { Object } base - prototype object for the new item
 * @returns { Object } - new object containing the values of the original item
 *
 * The variables 'key' and 'val' are arbitrary.
 * They depend on the collection type looped (Array, Object)
 * and on the expression used on the each tag
 *
 */
function mkitem(expr, key, val, base) {
  var item = base ? Object.create(base) : {};
  item[expr.key] = key;
  if (expr.pos) item[expr.pos] = val;
  return item;
}

/**
 * Unmount the redundant tags
 * @param   { Array } items - array containing the current items to loop
 * @param   { Array } tags - array containing all the children tags
 */
function unmountRedundant(items, tags) {
  var i = tags.length;
  var j = items.length;

  while (i > j) {
    i--;
    remove.apply(tags[i], [tags, i]);
  }
}

/**
 * Remove a child tag
 * @this Tag
 * @param   { Array } tags - tags collection
 * @param   { Number } i - index of the tag to remove
 */
function remove(tags, i) {
  tags.splice(i, 1);
  this.unmount();
  arrayishRemove(this.parent, this, this.__.tagName, true);
}

/**
 * Move the nested custom tags in non custom loop tags
 * @this Tag
 * @param   { Number } i - current position of the loop tag
 */
function moveNestedTags(i) {
  var _this = this;

  each(Object.keys(this.tags), function (tagName) {
    moveChildTag.apply(_this.tags[tagName], [tagName, i]);
  });
}

/**
 * Move a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to move
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function move(root, nextTag, isVirtual) {
  if (isVirtual) moveVirtual.apply(this, [root, nextTag]);else safeInsert(root, this.root, nextTag.root);
}

/**
 * Insert and mount a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to insert
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function insert(root, nextTag, isVirtual) {
  if (isVirtual) makeVirtual.apply(this, [root, nextTag]);else safeInsert(root, this.root, nextTag.root);
}

/**
 * Append a new tag into the DOM
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function append(root, isVirtual) {
  if (isVirtual) makeVirtual.call(this, root);else root.appendChild(this.root);
}

/**
 * Manage tags having the 'each'
 * @param   { HTMLElement } dom - DOM node we need to loop
 * @param   { Tag } parent - parent tag instance where the dom node is contained
 * @param   { String } expr - string contained in the 'each' attribute
 * @returns { Object } expression object for this each loop
 */
function _each(dom, parent, expr) {
  var mustReorder = _typeof(getAttr(dom, LOOP_NO_REORDER_DIRECTIVE)) !== T_STRING || remAttr(dom, LOOP_NO_REORDER_DIRECTIVE);
  var tagName = getTagName(dom);
  var impl = __TAG_IMPL[tagName];
  var parentNode = dom.parentNode;
  var placeholder = createDOMPlaceholder();
  var child = getTag(dom);
  var ifExpr = getAttr(dom, CONDITIONAL_DIRECTIVE);
  var tags = [];
  var isLoop = true;
  var isAnonymous = !__TAG_IMPL[tagName];
  var isVirtual = dom.tagName === 'VIRTUAL';
  var oldItems = [];
  var hasKeys = void 0;

  // remove the each property from the original tag
  remAttr(dom, LOOP_DIRECTIVE);

  // parse the each expression
  expr = tmpl.loopKeys(expr);
  expr.isLoop = true;

  if (ifExpr) remAttr(dom, CONDITIONAL_DIRECTIVE);

  // insert a marked where the loop tags will be injected
  parentNode.insertBefore(placeholder, dom);
  parentNode.removeChild(dom);

  expr.update = function updateEach() {
    // get the new items collection
    expr.value = tmpl(expr.val, parent);

    var items = expr.value;
    var frag = createFrag();
    var isObject$$1 = !isArray(items) && !isString(items);
    var root = placeholder.parentNode;

    // if this DOM was removed the update here is useless
    // this condition fixes also a weird async issue on IE in our unit test
    if (!root) return;

    // object loop. any changes cause full redraw
    if (isObject$$1) {
      hasKeys = items || false;
      items = hasKeys ? Object.keys(items).map(function (key) {
        return mkitem(expr, items[key], key);
      }) : [];
    } else {
      hasKeys = false;
    }

    if (ifExpr) {
      items = items.filter(function (item, i) {
        if (expr.key && !isObject$$1) return !!tmpl(ifExpr, mkitem(expr, item, i, parent));

        return !!tmpl(ifExpr, extend(Object.create(parent), item));
      });
    }

    // loop all the new items
    each(items, function (item, i) {
      // reorder only if the items are objects
      var doReorder = mustReorder && (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === T_OBJECT && !hasKeys;
      var oldPos = oldItems.indexOf(item);
      var isNew = oldPos === -1;
      var pos = !isNew && doReorder ? oldPos : i;
      // does a tag exist in this position?
      var tag = tags[pos];
      var mustAppend = i >= oldItems.length;
      var mustCreate = doReorder && isNew || !doReorder && !tag;

      item = !hasKeys && expr.key ? mkitem(expr, item, i) : item;

      // new tag
      if (mustCreate) {
        tag = new Tag$1(impl, {
          parent: parent,
          isLoop: isLoop,
          isAnonymous: isAnonymous,
          tagName: tagName,
          root: dom.cloneNode(isAnonymous),
          item: item,
          index: i
        }, dom.innerHTML);

        // mount the tag
        tag.mount();

        if (mustAppend) append.apply(tag, [frag || root, isVirtual]);else insert.apply(tag, [root, tags[i], isVirtual]);

        if (!mustAppend) oldItems.splice(i, 0, item);
        tags.splice(i, 0, tag);
        if (child) arrayishAdd(parent.tags, tagName, tag, true);
      } else if (pos !== i && doReorder) {
        // move
        if (contains(items, oldItems[pos])) {
          move.apply(tag, [root, tags[i], isVirtual]);
          // move the old tag instance
          tags.splice(i, 0, tags.splice(pos, 1)[0]);
          // move the old item
          oldItems.splice(i, 0, oldItems.splice(pos, 1)[0]);
        }

        // update the position attribute if it exists
        if (expr.pos) tag[expr.pos] = i;

        // if the loop tags are not custom
        // we need to move all their custom tags into the right position
        if (!child && tag.tags) moveNestedTags.call(tag, i);
      }

      // cache the original item to use it in the events bound to this node
      // and its children
      tag.__.item = item;
      tag.__.index = i;
      tag.__.parent = parent;

      if (!mustCreate) tag.update(item);
    });

    // remove the redundant tags
    unmountRedundant(items, tags);

    // clone the items array
    oldItems = items.slice();

    root.insertBefore(frag, placeholder);
  };

  expr.unmount = function () {
    each(tags, function (t) {
      t.unmount();
    });
  };

  return expr;
}

/**
 * Walk the tag DOM to detect the expressions to evaluate
 * @this Tag
 * @param   { HTMLElement } root - root tag where we will start digging the expressions
 * @param   { Array } expressions - empty array where the expressions will be added
 * @param   { Boolean } mustIncludeRoot - flag to decide whether the root must be parsed as well
 * @returns { Object } an object containing the root noode and the dom tree
 */
function parseExpressions(root, expressions, mustIncludeRoot) {
  var _this = this;

  var tree = { parent: { children: expressions } };

  walkNodes(root, function (dom, ctx) {
    var type = dom.nodeType,
        parent = ctx.parent,
        attr = void 0,
        expr = void 0,
        tagImpl = void 0;

    if (!mustIncludeRoot && dom === root) return { parent: parent

      // text node
    };if (type === 3 && dom.parentNode.tagName !== 'STYLE' && tmpl.hasExpr(dom.nodeValue)) parent.children.push({ dom: dom, expr: dom.nodeValue });

    if (type !== 1) return ctx; // not an element

    var isVirtual = dom.tagName === 'VIRTUAL';

    // loop. each does it's own thing (for now)
    if (attr = getAttr(dom, LOOP_DIRECTIVE)) {
      if (isVirtual) setAttr(dom, 'loopVirtual', true); // ignore here, handled in _each
      parent.children.push(_each(dom, _this, attr));
      return false;
    }

    // if-attrs become the new parent. Any following expressions (either on the current
    // element, or below it) become children of this expression.
    if (attr = getAttr(dom, CONDITIONAL_DIRECTIVE)) {
      parent.children.push(Object.create(IfExpr).init(dom, _this, attr));
      return false;
    }

    if (expr = getAttr(dom, IS_DIRECTIVE)) {
      if (tmpl.hasExpr(expr)) {
        parent.children.push({
          isRtag: true,
          expr: expr,
          dom: dom,
          attrs: [].slice.call(dom.attributes)
        });
        return false;
      }
    }

    // if this is a tag, stop traversing here.
    // we ignore the root, since parseExpressions is called while we're mounting that root
    tagImpl = getTag(dom);
    if (isVirtual) {
      if (getAttr(dom, 'virtualized')) {
        dom.parentElement.removeChild(dom);
      } // tag created, remove from dom
      if (!tagImpl && !getAttr(dom, 'virtualized') && !getAttr(dom, 'loopVirtual')) // ok to create virtual tag
        tagImpl = { tmpl: dom.outerHTML };
    }

    if (tagImpl && (dom !== root || mustIncludeRoot)) {
      if (isVirtual && !getAttr(dom, IS_DIRECTIVE)) {
        // handled in update
        // can not remove attribute like directives
        // so flag for removal after creation to prevent maximum stack error
        setAttr(dom, 'virtualized', true);
        var tag = new Tag$1({ tmpl: dom.outerHTML }, { root: dom, parent: _this }, dom.innerHTML);
        parent.children.push(tag); // no return, anonymous tag, keep parsing
      } else {
        parent.children.push(initChildTag(tagImpl, {
          root: dom,
          parent: _this
        }, dom.innerHTML, _this));
        return false;
      }
    }

    // attribute expressions
    parseAttributes.apply(_this, [dom, dom.attributes, function (attr, expr) {
      if (!expr) return;
      parent.children.push(expr);
    }]);

    // whatever the parent is, all child elements get the same parent.
    // If this element had an if-attr, that's the parent for all child elements
    return { parent: parent };
  }, tree);
}

/**
 * Calls `fn` for every attribute on an element. If that attr has an expression,
 * it is also passed to fn.
 * @this Tag
 * @param   { HTMLElement } dom - dom node to parse
 * @param   { Array } attrs - array of attributes
 * @param   { Function } fn - callback to exec on any iteration
 */
function parseAttributes(dom, attrs, fn) {
  var _this2 = this;

  each(attrs, function (attr) {
    if (!attr) return false;

    var name = attr.name;
    var bool = isBoolAttr(name);
    var expr = void 0;

    if (contains(REF_DIRECTIVES, name)) {
      expr = Object.create(RefExpr).init(dom, _this2, name, attr.value);
    } else if (tmpl.hasExpr(attr.value)) {
      expr = { dom: dom, expr: attr.value, attr: name, bool: bool };
    }

    fn(attr, expr);
  });
}

/*
  Includes hacks needed for the Internet Explorer version 9 and below
  See: http://kangax.github.io/compat-table/es5/#ie8
       http://codeplanet.io/dropping-ie8/
*/

var reHasYield = /<yield\b/i;
var reYieldAll = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig;
var reYieldSrc = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig;
var reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig;
var rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' };
var tblTags = IE_VERSION && IE_VERSION < 10 ? RE_SPECIAL_TAGS : RE_SPECIAL_TAGS_NO_OPTION;
var GENERIC = 'div';
var SVG = 'svg';

/*
  Creates the root element for table or select child elements:
  tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
*/
function specialTags(el, tmpl, tagName) {

  var select = tagName[0] === 'o',
      parent = select ? 'select>' : 'table>';

  // trim() is important here, this ensures we don't have artifacts,
  // so we can check if we have only one element inside the parent
  el.innerHTML = '<' + parent + tmpl.trim() + '</' + parent;
  parent = el.firstChild;

  // returns the immediate parent if tr/th/td/col is the only element, if not
  // returns the whole tree, as this can include additional elements
  /* istanbul ignore next */
  if (select) {
    parent.selectedIndex = -1; // for IE9, compatible w/current riot behavior
  } else {
    // avoids insertion of cointainer inside container (ex: tbody inside tbody)
    var tname = rootEls[tagName];
    if (tname && parent.childElementCount === 1) parent = $(tname, parent);
  }
  return parent;
}

/*
  Replace the yield tag from any tag template with the innerHTML of the
  original tag in the page
*/
function replaceYield(tmpl, html) {
  // do nothing if no yield
  if (!reHasYield.test(tmpl)) return tmpl;

  // be careful with #1343 - string on the source having `$1`
  var src = {};

  html = html && html.replace(reYieldSrc, function (_, ref, text) {
    src[ref] = src[ref] || text; // preserve first definition
    return '';
  }).trim();

  return tmpl.replace(reYieldDest, function (_, ref, def) {
    // yield with from - to attrs
    return src[ref] || def || '';
  }).replace(reYieldAll, function (_, def) {
    // yield without any "from"
    return html || def || '';
  });
}

/**
 * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
 * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
 *
 * @param   { String } tmpl  - The template coming from the custom tag definition
 * @param   { String } html - HTML content that comes from the DOM element where you
 *           will mount the tag, mostly the original tag in the page
 * @param   { Boolean } isSvg - true if the root node is an svg
 * @returns { HTMLElement } DOM element with _tmpl_ merged through `YIELD` with the _html_.
 */
function mkdom(tmpl, html, isSvg$$1) {
  var match = tmpl && tmpl.match(/^\s*<([-\w]+)/);
  var tagName = match && match[1].toLowerCase();
  var el = mkEl(isSvg$$1 ? SVG : GENERIC);

  // replace all the yield tags with the tag inner html
  tmpl = replaceYield(tmpl, html);

  /* istanbul ignore next */
  if (tblTags.test(tagName)) el = specialTags(el, tmpl, tagName);else setInnerHTML(el, tmpl);

  return el;
}

/**
 * Another way to create a riot tag a bit more es6 friendly
 * @param { HTMLElement } el - tag DOM selector or DOM node/s
 * @param { Object } opts - tag logic
 * @returns { Tag } new riot tag instance
 */
function Tag$2(el, opts) {
  // get the tag properties from the class constructor
  var name = this.name,
      tmpl = this.tmpl,
      css = this.css,
      attrs = this.attrs,
      onCreate = this.onCreate;
  // register a new tag and cache the class prototype

  if (!__TAG_IMPL[name]) {
    tag$1(name, tmpl, css, attrs, onCreate);
    // cache the class constructor
    __TAG_IMPL[name].class = this.constructor;
  }

  // mount the tag using the class instance
  mountTo(el, name, opts, this);
  // inject the component css
  if (css) styleManager.inject();

  return this;
}

/**
 * Create a new riot tag implementation
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag$1(name, tmpl, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs;

    if (/^[\w-]+\s?=/.test(css)) {
      attrs = css;
      css = '';
    } else attrs = '';
  }

  if (css) {
    if (isFunction(css)) fn = css;else styleManager.add(css);
  }

  name = name.toLowerCase();
  __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };

  return name;
}

/**
 * Create a new riot tag implementation (for use by the compiler)
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag2$1(name, tmpl, css, attrs, fn) {
  if (css) styleManager.add(css, name);

  __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };

  return name;
}

/**
 * Mount a tag using a specific tag implementation
 * @param   { * } selector - tag DOM selector or DOM node/s
 * @param   { String } tagName - tag implementation name
 * @param   { Object } opts - tag logic
 * @returns { Array } new tags instances
 */
function mount$1(selector, tagName, opts) {
  var tags = [];
  var elem = void 0,
      allTags = void 0;

  function pushTagsTo(root) {
    if (root.tagName) {
      var riotTag = getAttr(root, IS_DIRECTIVE),
          _tag = void 0;

      // have tagName? force riot-tag to be the same
      if (tagName && riotTag !== tagName) {
        riotTag = tagName;
        setAttr(root, IS_DIRECTIVE, tagName);
      }

      _tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts);

      if (_tag) tags.push(_tag);
    } else if (root.length) each(root, pushTagsTo); // assume nodeList
  }

  // inject styles into DOM
  styleManager.inject();

  if (isObject(tagName)) {
    opts = tagName;
    tagName = 0;
  }

  // crawl the DOM to find the tag
  if (isString(selector)) {
    selector = selector === '*' ?
    // select all registered tags
    // & tags found with the riot-tag attribute set
    allTags = selectTags() :
    // or just the ones named like the selector
    selector + selectTags(selector.split(/, */));

    // make sure to pass always a selector
    // to the querySelectorAll function
    elem = selector ? $$(selector) : [];
  } else
    // probably you have passed already a tag or a NodeList
    elem = selector;

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectTags();
    // if the root els it's just a single tag
    if (elem.tagName) elem = $$(tagName, elem);else {
      // select all the children for all the different root elements
      var nodeList = [];

      each(elem, function (_el) {
        return nodeList.push($$(tagName, _el));
      });

      elem = nodeList;
    }
    // get rid of the tagName
    tagName = 0;
  }

  pushTagsTo(elem);

  return tags;
}

// Create a mixin that could be globally shared across all the tags
var mixins = {};
var globals = mixins[GLOBAL_MIXIN] = {};
var mixins_id = 0;

/**
 * Create/Return a mixin by its name
 * @param   { String }  name - mixin name (global mixin if object)
 * @param   { Object }  mix - mixin logic
 * @param   { Boolean } g - is global?
 * @returns { Object }  the mixin logic
 */
function mixin$1(name, mix, g) {
  // Unnamed global
  if (isObject(name)) {
    mixin$1('__' + mixins_id++ + '__', name, true);
    return;
  }

  var store = g ? globals : mixins;

  // Getter
  if (!mix) {
    if (isUndefined(store[name])) throw new Error('Unregistered mixin: ' + name);

    return store[name];
  }

  // Setter
  store[name] = isFunction(mix) ? extend(mix.prototype, store[name] || {}) && mix : extend(store[name] || {}, mix);
}

/**
 * Update all the tags instances created
 * @returns { Array } all the tags instances
 */
function update$1() {
  return each(__TAGS_CACHE, function (tag) {
    return tag.update();
  });
}

function unregister$1(name) {
  __TAG_IMPL[name] = null;
}

var version$1 = 'WIP';

var core = Object.freeze({
	Tag: Tag$2,
	tag: tag$1,
	tag2: tag2$1,
	mount: mount$1,
	mixin: mixin$1,
	update: update$1,
	unregister: unregister$1,
	version: version$1
});

// counter to give a unique id to all the Tag instances
var uid = 0;

/**
 * We need to update opts for this tag. That requires updating the expressions
 * in any attributes on the tag, and then copying the result onto opts.
 * @this Tag
 * @param   {Boolean} isLoop - is it a loop tag?
 * @param   { Tag }  parent - parent tag node
 * @param   { Boolean }  isAnonymous - is it a tag without any impl? (a tag not registered)
 * @param   { Object }  opts - tag options
 * @param   { Array }  instAttrs - tag attributes array
 */
function updateOpts(isLoop, parent, isAnonymous, opts, instAttrs) {
  // isAnonymous `each` tags treat `dom` and `root` differently. In this case
  // (and only this case) we don't need to do updateOpts, because the regular parse
  // will update those attrs. Plus, isAnonymous tags don't need opts anyway
  if (isLoop && isAnonymous) return;
  var ctx = !isAnonymous && isLoop ? this : parent || this;

  each(instAttrs, function (attr) {
    if (attr.expr) updateAllExpressions.call(ctx, [attr.expr]);
    // normalize the attribute names
    opts[toCamel(attr.name).replace(ATTRS_PREFIX, '')] = attr.expr ? attr.expr.value : attr.value;
  });
}

/**
 * Toggle the isMounted flag
 * @this Tag
 * @param { Boolean } value - ..of the isMounted flag
 */
function setIsMounted(value) {
  defineProperty$1(this, 'isMounted', value);
}

/**
 * Tag class
 * @constructor
 * @param { Object } impl - it contains the tag template, and logic
 * @param { Object } conf - tag options
 * @param { String } innerHTML - html that eventually we need to inject in the tag
 */
function Tag$1() {
  var impl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var conf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var innerHTML = arguments[2];

  var opts = extend({}, conf.opts),
      parent = conf.parent,
      isLoop = conf.isLoop,
      isAnonymous = !!conf.isAnonymous,
      skipAnonymous = settings$1.skipAnonymousTags && isAnonymous,
      item = conf.item,
      index = conf.index,
      // available only for the looped nodes
  instAttrs = [],
      // All attributes on the Tag when it's first parsed
  implAttrs = [],
      // expressions on this type of Tag
  expressions = [],
      root = conf.root,
      tagName = conf.tagName || getTagName(root),
      isVirtual = tagName === 'virtual',
      isInline = !isVirtual && !impl.tmpl,
      propsInSyncWithParent = [],
      dom;

  // make this tag observable
  if (!skipAnonymous) observable$2(this);
  // only call unmount if we have a valid __TAG_IMPL (has name property)
  if (impl.name && root._tag) root._tag.unmount(true);

  // not yet mounted
  setIsMounted.call(this, false);

  defineProperty$1(this, '__', {
    isAnonymous: isAnonymous,
    instAttrs: instAttrs,
    innerHTML: innerHTML,
    tagName: tagName,
    index: index,
    isLoop: isLoop,
    isInline: isInline,
    // tags having event listeners
    // it would be better to use weak maps here but we can not introduce breaking changes now
    listeners: [],
    // these vars will be needed only for the virtual tags
    virts: [],
    wasCreated: false,
    tail: null,
    head: null,
    parent: null,
    item: null
  });

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  defineProperty$1(this, '_riot_id', ++uid); // base 1 allows test !t._riot_id
  defineProperty$1(this, 'root', root);
  extend(this, { opts: opts }, item);
  // protect the "tags" and "refs" property from being overridden
  defineProperty$1(this, 'parent', parent || null);
  defineProperty$1(this, 'tags', {});
  defineProperty$1(this, 'refs', {});

  if (isInline || isLoop && isAnonymous) {
    dom = root;
  } else {
    if (!isVirtual) root.innerHTML = '';
    dom = mkdom(impl.tmpl, innerHTML, isSvg(root));
  }

  /**
   * Update the tag expressions and options
   * @param   { * }  data - data we want to use to extend the tag properties
   * @returns { Tag } the current tag instance
   */
  defineProperty$1(this, 'update', function tagUpdate(data) {
    var nextOpts = {},
        canTrigger = this.isMounted && !skipAnonymous;

    extend(this, data);
    updateOpts.apply(this, [isLoop, parent, isAnonymous, nextOpts, instAttrs]);

    if (canTrigger && this.isMounted && isFunction(this.shouldUpdate) && !this.shouldUpdate(data, nextOpts)) {
      return this;
    }

    // inherit properties from the parent, but only for isAnonymous tags
    if (isLoop && isAnonymous) inheritFrom.apply(this, [this.parent, propsInSyncWithParent]);
    extend(opts, nextOpts);
    if (canTrigger) this.trigger('update', data);
    updateAllExpressions.call(this, expressions);
    if (canTrigger) this.trigger('updated');

    return this;
  }.bind(this));

  /**
   * Add a mixin to this tag
   * @returns { Tag } the current tag instance
   */
  defineProperty$1(this, 'mixin', function tagMixin() {
    var _this = this;

    each(arguments, function (mix) {
      var instance = void 0,
          obj = void 0;
      var props = [];

      // properties blacklisted and will not be bound to the tag instance
      var propsBlacklist = ['init', '__proto__'];

      mix = isString(mix) ? mixin$1(mix) : mix;

      // check if the mixin is a function
      if (isFunction(mix)) {
        // create the new mixin instance
        instance = new mix();
      } else instance = mix;

      var proto = Object.getPrototypeOf(instance);

      // build multilevel prototype inheritance chain property list
      do {
        props = props.concat(Object.getOwnPropertyNames(obj || instance));
      } while (obj = Object.getPrototypeOf(obj || instance));

      // loop the keys in the function prototype or the all object keys
      each(props, function (key) {
        // bind methods to this
        // allow mixins to override other properties/parent mixins
        if (!contains(propsBlacklist, key)) {
          // check for getters/setters
          var descriptor = Object.getOwnPropertyDescriptor(instance, key) || Object.getOwnPropertyDescriptor(proto, key);
          var hasGetterSetter = descriptor && (descriptor.get || descriptor.set);

          // apply method only if it does not already exist on the instance
          if (!_this.hasOwnProperty(key) && hasGetterSetter) {
            Object.defineProperty(_this, key, descriptor);
          } else {
            _this[key] = isFunction(instance[key]) ? instance[key].bind(_this) : instance[key];
          }
        }
      });

      // init method will be called automatically
      if (instance.init) instance.init.bind(_this)();
    });
    return this;
  }.bind(this));

  /**
   * Mount the current tag instance
   * @returns { Tag } the current tag instance
   */
  defineProperty$1(this, 'mount', function tagMount() {
    var _this2 = this;

    root._tag = this; // keep a reference to the tag just created

    // Read all the attrs on this instance. This give us the info we need for updateOpts
    parseAttributes.apply(parent, [root, root.attributes, function (attr, expr) {
      if (!isAnonymous && RefExpr.isPrototypeOf(expr)) expr.tag = _this2;
      attr.expr = expr;
      instAttrs.push(attr);
    }]);

    // update the root adding custom attributes coming from the compiler
    implAttrs = [];
    walkAttrs(impl.attrs, function (k, v) {
      implAttrs.push({ name: k, value: v });
    });
    parseAttributes.apply(this, [root, implAttrs, function (attr, expr) {
      if (expr) expressions.push(expr);else setAttr(root, attr.name, attr.value);
    }]);

    // initialiation
    updateOpts.apply(this, [isLoop, parent, isAnonymous, opts, instAttrs]);

    // add global mixins
    var globalMixin = mixin$1(GLOBAL_MIXIN);

    if (globalMixin && !skipAnonymous) {
      for (var i in globalMixin) {
        if (globalMixin.hasOwnProperty(i)) {
          this.mixin(globalMixin[i]);
        }
      }
    }

    if (impl.fn) impl.fn.call(this, opts);

    if (!skipAnonymous) this.trigger('before-mount');

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions.apply(this, [dom, expressions, isAnonymous]);

    this.update(item);

    if (!isAnonymous && !isInline) {
      while (dom.firstChild) {
        root.appendChild(dom.firstChild);
      }
    }

    defineProperty$1(this, 'root', root);

    // if we need to wait that the parent "mount" or "updated" event gets triggered
    if (!skipAnonymous && this.parent) {
      var p = getImmediateCustomParentTag(this.parent);
      p.one(!p.isMounted ? 'mount' : 'updated', function () {
        setIsMounted.call(_this2, true);
        _this2.trigger('mount');
      });
    } else {
      // otherwise it's not a child tag we can trigger its mount event
      setIsMounted.call(this, true);
      if (!skipAnonymous) this.trigger('mount');
    }

    this.__.wasCreated = true;

    return this;
  }.bind(this));

  /**
   * Unmount the tag instance
   * @param { Boolean } mustKeepRoot - if it's true the root node will not be removed
   * @returns { Tag } the current tag instance
   */
  defineProperty$1(this, 'unmount', function tagUnmount(mustKeepRoot) {
    var _this3 = this;

    var el = this.root;
    var p = el.parentNode;
    var tagIndex = __TAGS_CACHE.indexOf(this);
    var ptag = void 0;

    if (!skipAnonymous) this.trigger('before-unmount');

    // clear all attributes coming from the mounted tag
    walkAttrs(impl.attrs, function (name) {
      if (startsWith(name, ATTRS_PREFIX)) name = name.slice(ATTRS_PREFIX.length);

      remAttr(root, name);
    });

    // remove all the event listeners
    this.__.listeners.forEach(function (dom) {
      Object.keys(dom[RIOT_EVENTS_KEY]).forEach(function (eventName) {
        dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][eventName]);
      });
    });

    // remove this tag instance from the global virtualDom variable
    if (tagIndex !== -1) __TAGS_CACHE.splice(tagIndex, 1);

    if (p || isVirtual) {
      if (parent) {
        ptag = getImmediateCustomParentTag(parent);

        if (isVirtual) {
          Object.keys(this.tags).forEach(function (tagName) {
            arrayishRemove(ptag.tags, tagName, _this3.tags[tagName]);
          });
        } else {
          arrayishRemove(ptag.tags, tagName, this);
          // remove from _parent too
          if (parent !== ptag) {
            arrayishRemove(parent.tags, tagName, this);
          }
        }
      } else {
        // remove the tag contents
        setInnerHTML(el, '');
      }

      if (p && !mustKeepRoot) p.removeChild(el);
    }

    if (this.__.virts) {
      each(this.__.virts, function (v) {
        if (v.parentNode) v.parentNode.removeChild(v);
      });
    }

    // allow expressions to unmount themselves
    unmountAll(expressions);
    each(instAttrs, function (a) {
      return a.expr && a.expr.unmount && a.expr.unmount();
    });

    // custom internal unmount function to avoid relying on the observable
    if (this.__.onUnmount) this.__.onUnmount();

    if (!skipAnonymous) {
      // weird fix for a weird edge case #2409
      if (!this.isMounted) this.trigger('mount');
      this.trigger('unmount');
      this.off('*');
    }

    defineProperty$1(this, 'isMounted', false);
    this.__.wasCreated = false;

    delete this.root._tag;

    return this;
  }.bind(this));
}

/**
 * Detect the tag implementation by a DOM node
 * @param   { Object } dom - DOM node we need to parse to get its tag implementation
 * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
 */
function getTag(dom) {
  return dom.tagName && __TAG_IMPL[getAttr(dom, IS_DIRECTIVE) || getAttr(dom, IS_DIRECTIVE) || dom.tagName.toLowerCase()];
}

/**
 * Inherit properties from a target tag instance
 * @this Tag
 * @param   { Tag } target - tag where we will inherit properties
 * @param   { Array } propsInSyncWithParent - array of properties to sync with the target
 */
function inheritFrom(target, propsInSyncWithParent) {
  var _this = this;

  each(Object.keys(target), function (k) {
    // some properties must be always in sync with the parent tag
    var mustSync = contains(propsInSyncWithParent, k);

    if (isUndefined(_this[k]) || mustSync) {
      // track the property to keep in sync
      // so we can keep it updated
      if (!mustSync) propsInSyncWithParent.push(k);
      _this[k] = target[k];
    }
  });
}

/**
 * Move the position of a custom tag in its parent tag
 * @this Tag
 * @param   { String } tagName - key where the tag was stored
 * @param   { Number } newPos - index where the new tag will be stored
 */
function moveChildTag(tagName, newPos) {
  var parent = this.parent;
  var tags = void 0;
  // no parent no move
  if (!parent) return;

  tags = parent.tags[tagName];

  if (isArray(tags)) tags.splice(newPos, 0, tags.splice(tags.indexOf(this), 1)[0]);else arrayishAdd(parent.tags, tagName, this);
}

/**
 * Create a new child tag including it correctly into its parent
 * @param   { Object } child - child tag implementation
 * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
 * @param   { String } innerHTML - inner html of the child node
 * @param   { Object } parent - instance of the parent tag including the child custom tag
 * @returns { Object } instance of the new child tag just created
 */
function initChildTag(child, opts, innerHTML, parent) {
  var tag = new Tag$1(child, opts, innerHTML);
  var tagName = opts.tagName || getTagName(opts.root, true);
  var ptag = getImmediateCustomParentTag(parent);
  // fix for the parent attribute in the looped elements
  defineProperty$1(tag, 'parent', ptag);
  // store the real parent tag
  // in some cases this could be different from the custom parent tag
  // for example in nested loops
  tag.__.parent = parent;

  // add this tag to the custom parent tag
  arrayishAdd(ptag.tags, tagName, tag);

  // and also to the real parent tag
  if (ptag !== parent) arrayishAdd(parent.tags, tagName, tag);

  return tag;
}

/**
 * Loop backward all the parents tree to detect the first custom parent tag
 * @param   { Object } tag - a Tag instance
 * @returns { Object } the instance of the first custom parent tag found
 */
function getImmediateCustomParentTag(tag) {
  var ptag = tag;
  while (ptag.__.isAnonymous) {
    if (!ptag.parent) break;
    ptag = ptag.parent;
  }
  return ptag;
}

/**
 * Trigger the unmount method on all the expressions
 * @param   { Array } expressions - DOM expressions
 */
function unmountAll(expressions) {
  each(expressions, function (expr) {
    if (expr instanceof Tag$1) expr.unmount(true);else if (expr.tagName) expr.tag.unmount(true);else if (expr.unmount) expr.unmount();
  });
}

/**
 * Get the tag name of any DOM node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { Boolean } skipDataIs - hack to ignore the data-is attribute when attaching to parent
 * @returns { String } name to identify this dom node in riot
 */
function getTagName(dom, skipDataIs) {
  var child = getTag(dom);
  var namedTag = !skipDataIs && getAttr(dom, IS_DIRECTIVE);
  return namedTag && !tmpl.hasExpr(namedTag) ? namedTag : child ? child.name : dom.tagName.toLowerCase();
}

/**
 * Set the property of an object for a given key. If something already
 * exists there, then it becomes an array containing both the old and new value.
 * @param { Object } obj - object on which to set the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be set
 * @param { Boolean } ensureArray - ensure that the property remains an array
 * @param { Number } index - add the new item in a certain array position
 */
function arrayishAdd(obj, key, value, ensureArray, index) {
  var dest = obj[key];
  var isArr = isArray(dest);
  var hasIndex = !isUndefined(index);

  if (dest && dest === value) return;

  // if the key was never set, set it once
  if (!dest && ensureArray) obj[key] = [value];else if (!dest) obj[key] = value;
  // if it was an array and not yet set
  else {
      if (isArr) {
        var oldIndex = dest.indexOf(value);
        // this item never changed its position
        if (oldIndex === index) return;
        // remove the item from its old position
        if (oldIndex !== -1) dest.splice(oldIndex, 1);
        // move or add the item
        if (hasIndex) {
          dest.splice(index, 0, value);
        } else {
          dest.push(value);
        }
      } else obj[key] = [dest, value];
    }
}

/**
 * Removes an item from an object at a given key. If the key points to an array,
 * then the item is just removed from the array.
 * @param { Object } obj - object on which to remove the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be removed
 * @param { Boolean } ensureArray - ensure that the property remains an array
*/
function arrayishRemove(obj, key, value, ensureArray) {
  if (isArray(obj[key])) {
    var index = obj[key].indexOf(value);
    if (index !== -1) obj[key].splice(index, 1);
    if (!obj[key].length) delete obj[key];else if (obj[key].length === 1 && !ensureArray) obj[key] = obj[key][0];
  } else delete obj[key]; // otherwise just delete the key
}

/**
 * Mount a tag creating new Tag instance
 * @param   { Object } root - dom node where the tag will be mounted
 * @param   { String } tagName - name of the riot tag we want to mount
 * @param   { Object } opts - options to pass to the Tag instance
 * @param   { Object } ctx - optional context that will be used to extend an existing class ( used in riot.Tag )
 * @returns { Tag } a new Tag instance
 */
function mountTo(root, tagName, opts, ctx) {
  var impl = __TAG_IMPL[tagName];
  var implClass = __TAG_IMPL[tagName].class;
  var tag = ctx || (implClass ? Object.create(implClass.prototype) : {});
  // cache the inner HTML to fix #855
  var innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;
  var conf = extend({ root: root, opts: opts }, { parent: opts ? opts.parent : null });

  if (impl && root) Tag$1.apply(tag, [impl, conf, innerHTML]);

  if (tag && tag.mount) {
    tag.mount(true);
    // add this tag to the virtualDom variable
    if (!contains(__TAGS_CACHE, tag)) __TAGS_CACHE.push(tag);
  }

  return tag;
}

/**
 * makes a tag virtual and replaces a reference in the dom
 * @this Tag
 * @param { tag } the tag to make virtual
 * @param { ref } the dom reference location
 */
function makeReplaceVirtual(tag, ref) {
  var frag = createFrag();
  makeVirtual.call(tag, frag);
  ref.parentNode.replaceChild(frag, ref);
}

/**
 * Adds the elements for a virtual tag
 * @this Tag
 * @param { Node } src - the node that will do the inserting or appending
 * @param { Tag } target - only if inserting, insert before this tag's first child
 */
function makeVirtual(src, target) {
  var head = createDOMPlaceholder();
  var tail = createDOMPlaceholder();
  var frag = createFrag();
  var sib = void 0;
  var el = void 0;

  this.root.insertBefore(head, this.root.firstChild);
  this.root.appendChild(tail);

  this.__.head = el = head;
  this.__.tail = tail;

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    this.__.virts.push(el); // hold for unmounting
    el = sib;
  }

  if (target) src.insertBefore(frag, target.__.head);else src.appendChild(frag);
}

/**
 * Move virtual tag and all child nodes
 * @this Tag
 * @param { Node } src  - the node that will do the inserting
 * @param { Tag } target - insert before this tag's first child
 */
function moveVirtual(src, target) {
  var el = this.__.head,
      sib = void 0;
  var frag = createFrag();

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    el = sib;
    if (el === this.__.tail) {
      frag.appendChild(el);
      src.insertBefore(frag, target.__.head);
      break;
    }
  }
}

/**
 * Get selectors for tags
 * @param   { Array } tags - tag names to select
 * @returns { String } selector
 */
function selectTags(tags) {
  // select all tags
  if (!tags) {
    var keys = Object.keys(__TAG_IMPL);
    return keys + selectTags(keys);
  }

  return tags.filter(function (t) {
    return !/[^-\w]/.test(t);
  }).reduce(function (list, t) {
    var name = t.trim().toLowerCase();
    return list + (',[' + IS_DIRECTIVE + '="' + name + '"]');
  }, '');
}

var tags = Object.freeze({
	getTag: getTag,
	inheritFrom: inheritFrom,
	moveChildTag: moveChildTag,
	initChildTag: initChildTag,
	getImmediateCustomParentTag: getImmediateCustomParentTag,
	unmountAll: unmountAll,
	getTagName: getTagName,
	arrayishAdd: arrayishAdd,
	arrayishRemove: arrayishRemove,
	mountTo: mountTo,
	makeReplaceVirtual: makeReplaceVirtual,
	makeVirtual: makeVirtual,
	moveVirtual: moveVirtual,
	selectTags: selectTags
});

/**
 * Riot public api
 */
var settings = settings$1;
var util = {
  tmpl: tmpl,
  brackets: brackets,
  styleManager: styleManager,
  vdom: __TAGS_CACHE,
  styleNode: styleManager.styleNode,
  // export the riot internal utils as well
  dom: dom,
  check: check,
  misc: misc,
  tags: tags

  // export the core props/methods
};









var riot$1 = extend({}, core, {
  observable: observable$2,
  settings: settings,
  util: util
});

riot$1.tag2('debugger', '<b id="stick" onclick="{stickToggle}" if="{open}">{stickIndicator}</b> <select onchange="{changePos}" if="{open}"> <option>top-right</option> <option>top-left</option> <option selected="">bottom-right</option> <option>bottom-left</option> </select> <b id="clear" onclick="{clear}" if="{open}">clear</b> <h3 onclick="{toggle}"> <b id="toggle">{toggleIndicator}</b> Debugger </h3> <section id="actions"> <debugitem each="{actions}"></debugitem> <p class="message" onclick="{changeNumActions}"> Showing last {numActions} actions... </p> </section>', 'debugger,[data-is="debugger"]{ position: fixed; z-index: 9999; bottom: 10px; right: -300px; opacity: 0.25; width: 400px; height: 600px; background: #eee; font-family: monospace; font-size: 11px; } debugger.top-left,[data-is="debugger"].top-left,debugger.top-right,[data-is="debugger"].top-right{ top: 10px; } debugger.bottom-left,[data-is="debugger"].bottom-left,debugger.bottom-right,[data-is="debugger"].bottom-right{ bottom: 10px; } debugger.top-left,[data-is="debugger"].top-left,debugger.bottom-left,[data-is="debugger"].bottom-left{ left: -300px; } debugger.top-right,[data-is="debugger"].top-right,debugger.bottom-right,[data-is="debugger"].bottom-right{ right: -300px; } debugger.top-left:hover,[data-is="debugger"].top-left:hover,debugger.top-left.stick,[data-is="debugger"].top-left.stick,debugger.bottom-left:hover,[data-is="debugger"].bottom-left:hover,debugger.bottom-left.stick,[data-is="debugger"].bottom-left.stick{ left: 10px; opacity: 1; } debugger.top-right:hover,[data-is="debugger"].top-right:hover,debugger.top-right.stick,[data-is="debugger"].top-right.stick,debugger.bottom-right:hover,[data-is="debugger"].bottom-right:hover,debugger.bottom-right.stick,[data-is="debugger"].bottom-right.stick{ right: 10px; opacity: 1; } debugger.close,[data-is="debugger"].close{ height: 15px; } debugger #toggle,[data-is="debugger"] #toggle,debugger #stick,[data-is="debugger"] #stick,debugger h3,[data-is="debugger"] h3,debugger #clear,[data-is="debugger"] #clear{ cursor: pointer; } debugger #stick,[data-is="debugger"] #stick,debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ float: right; } debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ margin-right: 20px; } debugger h3,[data-is="debugger"] h3{ margin: 0; font-size: 15px; line-height: 15px; padding: 0; } debugger #actions,[data-is="debugger"] #actions{ display: block; position: absolute; top: 50px; left: 10px; right: 10px; bottom: 10px; overflow: auto; } debugger,[data-is="debugger"],debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ display: block; padding: 10px; margin-bottom: 10px; border: 1px solid #aaa; transition: all 250ms cubic-bezier(0.22, 0.61, 0.36, 1); } debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ background: #fff; position: relative; box-shadow: 0; } debugger #actions debugitem:hover,[data-is="debugger"] #actions debugitem:hover{ border-color: #f70; box-shadow: 0px 10px 5px -8px rgba(0,0,0,0.25); } debugger #actions debugitem code,[data-is="debugger"] #actions debugitem code{ background: #eee; padding: 2.5px 5px; line-height: 11px; } debugger #actions debugitem i#num,[data-is="debugger"] #actions debugitem i#num{ position: absolute; top: 10px; right: 10px; } debugger #actions debugitem #time,[data-is="debugger"] #actions debugitem #time{ position: absolute; top: 10px; right: 60px; opacity: 0.25; } debugger #actions .message,[data-is="debugger"] #actions .message{ cursor: pointer; text-align: center; opacity: 0.25; }', '', function (opts) {

    var self = this;
    self.actions = [];
    self.i = 0;
    self.toggleIndicator = '-';
    self.stickIndicator = 'stick';
    self.open = true;
    self.stick = false;

    self.toggle = function () {

        self.open = !self.open;
        self.root.classList[self.open ? 'remove' : 'add']('close');
        self.toggleIndicator = self.open ? '-' : '+';
    };

    self.stickToggle = function () {

        self.stick = !self.stick;
        self.root.classList[self.stick ? 'add' : 'remove']('stick');
        self.stickIndicator = self.stick ? 'fade' : 'stick';
    };

    self.clear = function () {

        self.actions = [];
    };

    self.changePos = function (event) {

        self.root.classList.remove('top-right', 'top-left', 'bottom-right', 'bottom-left');
        self.root.classList.add(event.target.value);
    };

    self.numActions = 20;
    self.changeNumActions = function () {

        var ask = prompt('Number of actions to show?');

        if (ask) {

            self.numActions = parseInt(ask.replace(/[a-z]+/ig, ''));
        }
    };

    self.on('state', function (obj, fn, action, args) {

        var time = +new Date();

        self.i++;
        var i = self.i;
        self.actions.unshift({ obj: obj, fn: fn, action: action, args: args, time: time, i: i });

        if (self.actions.length > self.numActions) {

            self.actions.pop();
        }

        self.update();
    });

    self.root.classList.add('bottom-right');

    app.debugger = self;
});

riot$1.tag2('debugitem', '<span class="name" if="{obj && obj.name}"> {obj.name} </span> <b>{fn}</b> &mdash; <i>{action}</i> <span id="time">{time}</span> <i id="num">{i}</i> <br> <p>Arguments</p> <div each="{arg in args}"> <i>{arg.constructor.name}</i> &mdash; <span if="{[\'object\', \'function\'].indexOf(typeof arg) === -1}">{arg}</span> <code if="{typeof arg === \'object\'}">{JSON.stringify(arg)}</code> <code if="{typeof arg === \'function\'}">{arg}</code> </div>', '', '', function (opts) {});

riot$1.tag2('icon', '<i class="fa {icon}"></i>', '', '', function (opts) {

    this.icon = Object.keys(this.opts).map(function (i) {
        return 'fa-' + i;
    }).join(' ');
});

riot$1.tag2('pretty-code', '<pre><code ref="code"></code></pre>', '', '', function (opts) {

    var self = this;
    var defaultOpts = {

        "indent_size": 4,
        "indent_char": " "
    };

    var before = RiotUtils.Beautify.before;
    var after = RiotUtils.Beautify.after;

    var type = self.opts.type || 'js';
    var decode = self.opts.decode !== undefined;
    var beautifyOpts = Object.assign({}, defaultOpts, self.opts);

    var raw = self.__.innerHTML;

    this.on('mount', function () {

        var prettified = RiotUtils.Beautify[type](raw, beautifyOpts);

        var prettify = { prettified: prettified, raw: raw };

        if (before && before.constructor === Function) {

            before(prettify);
        }

        if (decode && type === 'html') {

            prettify.prettified = RiotUtils.Beautify.escapeHTML(prettify.prettified);
        }

        self.refs.code.innerHTML = prettify.prettified;

        if (after && after.constructor === Function) {

            after(prettify);
        }

        RiotUtils.Beautify.trigger('prettified', prettify);
    });
});

var index = {

    ActionForms: ActionForms,
    Observer: Observer,
    Beautify: Beautify
};

return index;

}());
