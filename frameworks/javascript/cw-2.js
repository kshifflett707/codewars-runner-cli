
try{
    var fnToString = Function.toString;
    Function.prototype.toString = function(){
        switch (this){
            case Test.expect:
            case Test.randomNumber:
            case Test.randomize:
            case Test.randomToken:
                return '[Codewars Code]';

            default:
                return fnToString.call(this);

        }
    };

    _setTimeout = setTimeout;
    setTimeout = function(fn, timeout){
        if (timeout > 50) throw 'setTimeout is restricted to no more than 50ms.';
        return _setTimeout(fn, timeout)
    }

    var methodCalls = {},
        describing = false,
        correct = 0,
        incorrect = 0,
        failed = [],
        beforeCallbacks = [],
        afterCallbacks = [];

    $$_SUCCESS__ = null;
    $STDOUT = [];

    var _expect = function(passed, msg, options){
        options = options || {};
        if (Object.__proto__.extraCredit || Object.prototype.extraCredit) throw 'extraCredit cannot be on the object prototype';

        if(passed){
            var successMsg = "Test Passed";
            if (options.successMsg){
                successMsg += ": " + options.successMsg;
            }
            console.log('<PASSED::>' + successMsg);
            correct++;
        } else {
            msg = _message(msg) || 'Value is not what was expected';
            if (options.extraCredit) {
                msg = (options.extraCredit !== true) ? _message(options.extraCredit) : null;
                msg = combineMessages(["Test Missed", msg], ": ");
                console.log("<MISSED::>" + msg);
                incorrect++;
            }
            else{
                console.log("<FAILED::>" + msg);
                var error = new Test.Error(msg);
                if (describing){
                    failed.push(error);
                }
                else{
                    throw error;
                }
            }
        }
    }

    console._log = console.log;
    console.log = function(){
        var out = [];
        Array.prototype.slice.apply(arguments).forEach(function(arg){
            out.push(Test.format(arg));
        });

        console._log(out.join(' '));
    };

    function combineMessages(msgs, separator){
        return msgs.filter(function(m){return m != null;}).join(separator)
    }

    function _message(msg, prefix){
        if (typeof msg == 'function'){
            msg = msg()
        }else if (typeof msg == 'array'){
            msg = combineMessages(msg, ' - ')
        }
        return prefix ? (prefix + ' - ' + msg) : msg
    }

    var Test = {
        // formats a string for HTML output
        format: function(obj, options){
            options = options || {};
            var out;
            if(typeof obj == 'string') {
                out = obj;
            } else if (typeof obj == 'function'){
                out = obj.toString();
            } else {
                out = obj && obj !== true ? JSON.stringify(obj, null, options.indent ? 4 : 0) : ('' + obj)
            }

            return out;
        },
        inspect: function(obj){
            if(typeof obj == 'string'){
                return obj;
            } else {
                return obj && obj !== true ? JSON.stringify(obj) : ('' + obj)
            }
        },
        describe: function(msg, fn) {
            var start = new Date();
            try{
                if (describing) throw "cannot call describe within another describe";
                describing = true;

                console.log("<DESCRIBE::>" + _message(msg));
                fn();
            }
            finally{
                var ms = new Date() - start;
                console.log("<COMPLETEDIN::>" + ms);
                describing = false;
                beforeCallbacks = [];
                afterCallbacks = [];

                if (failed.length > 0){
                    throw failed[0];
                }
            }
        },
        it: function(msg, fn) {
            if (!describing) throw '"it" calls must be invoked within a parent "describe" context';

            console.log("<IT::>" + _message(msg));
            beforeCallbacks.forEach(function(cb){
                cb();
            });

            var start = new Date();
            try{
                fn();
            } finally {
                var ms = new Date() - start;
                console.log("<COMPLETEDIN::>" + ms);

                afterCallbacks.forEach(function(cb){
                    cb();
                });
            }

        },
        before: function(cb) {
            beforeCallbacks.push(cb);
        },
        after: function(cb) {
            afterCallbacks.push(cb);
        },
        handleError: function(ex) {
            if (ex.name == 'AssertionError') {
                this.fail( ex.message );
            } else{
                console.log("<ERROR::>" + ex.message);
            }
        },
        fail: function(message) {
            _expect(false, message);
        },
        expect: function(passed, message, options){
            _expect(passed, message, options)
        },
        assertSimilar: function(actual, expected, msg, options){
            this.assertEquals(this.inspect(actual), this.inspect(expected), msg, options)
        },
        assertNotSimilar: function(actual, expected, msg, options){
            this.assertNotEquals(this.inspect(actual), this.inspect(expected), msg, options)
        },
        assertEquals: function(actual, expected, msg, options) {
            if(actual !== expected){
                msg = _message('Expected: ' + Test.inspect(expected) + ', instead got: ' + Test.inspect(actual), msg);
                Test.expect(false, msg, options);
            }else{
                options = options || {};
                options.successMsg = options.successMsg || 'Value == ' + Test.inspect(expected);
                Test.expect(true, null, options);
            }
        },
        assertNotEquals: function(a, b, msg, options){
            if(a === b){
                msg = _message('Not Expected: ' + Test.inspect(a), msg);
                Test.expect(false, msg, options);
            }else{
                options = options || {};
                options.successMsg = options.successMsg || 'Value != ' + Test.inspect(b);
                Test.expect(true, null, options);
            }
        },
        expectNoError: function(msg, fn){
            if(!fn){
                fn = msg;
                msg = 'Unexpected error was thrown';
            }

            try{
                fn();
                Test.expect(true)
            }catch(ex){
                if (ex.name == 'Test:Error'){
                    throw ex;
                }
                else {
                    msg += ': ' + ex.toString()
                    Test.expect(false, msg)
                }
            }
        },
        expectError: function(msg, fn, options){
            if(!fn){
                fn = msg;
                msg = 'Expected an error to be thrown'
            }

            var passed = false;
            try{
                fn();
            }catch(ex){
                console.log('<b>Expected error was thrown:</b> ' + ex.toString());
                passed = true
            }

            Test.expect(passed, msg, options)
        },
        randomNumber: function(){
            return Math.round(Math.random() * 100)
        },
        randomToken: function(){
            return Math.random().toString(36).substr(8)
        },
        randomize: function(array){
            var arr = array.concat(), i = arr.length, j, x;
            while(i) {
                j = (Math.random() * i) | 0;
                x = arr[--i];
                arr[i] = arr[j];
                arr[j] = x;
            }
            return arr;
        },
        sample: function(array){
            return array[~~(array.length * Math.random())]
        },
        Error: function(message){
            this.name = "AssertionError";
            this.message = (message || "");
        }
    }

    Test.Error.prototype = require('assert').AssertionError.prototype;

    Object.freeze(Test);
    Object.defineProperty(global, 'Test', {
        writable: false,
        configurable: false,
        value: Test
    })
    Object.defineProperty(global, 'describe', {
        writable: false,
        value: Test.describe
    })
    Object.defineProperty(global, 'it', {
        writable: false,
        value: Test.it
    })
    Object.defineProperty(global, 'before', {
        writable: false,
        value: Test.before
    })
    Object.defineProperty(global, 'after', {
        writable: false,
        value: Test.after
    })
    

}catch(ex){
    throw "Failed to load core API methods";
}