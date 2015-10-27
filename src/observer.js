/**
 * Created by Alex Manko on 24.10.2015.
 */

var onChange = function(object, key, type, valueNew, valueOld) {
    console.log('new change', object, key, type, valueNew, valueOld);
};

var setHiddenValue = function(object, key, value) {
    Object.defineProperty(object, key, {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    });
};

var initObject = function(object, key, parent) {
    Object.defineProperty(object[key], '$FR', {
        value: {
            parent: parent,
            key: key
        },
        configurable: true,
        enumerable: false,
        writable: true
    });
};

var hasInit = function(object) {
    return object.hasOwnProperty('$FR');
};

var observerNative = {
    register: function (object, key) {
        var that = this;
        Object.observe(object, function (changes) {
            for (var i = 0; i < changes.length; ++i) {
                if (changes[i].name != key) continue;

                that.onChangeComing(changes[i], object[key]);
            }
        });

        if (object[key] instanceof Object) {
            if (hasInit(object[key])) {
                throw new Exception('Attempt to double call for one object');
            }
            this.deepObserve(object, key, object[key]);
        }
    },
    onChangeComing: function(change, parent) {
        if (change.name == '$FR') return;

        var newValue = change.object[change.name];

        if ((change.type == 'add' && newValue instanceof Object) ||
            (change.type == 'update' && newValue instanceof Object && change.oldValue != newValue)) {
            this.deepObserve(change.object, change.name, parent);
        }

        onChange(change.object,
            change.name,
            change.type,
            change.object[change.name],
            change.oldValue);
    },
    deepObserve: function(object, key, parent) {
        var list = [{object: object, key: key, parent: parent}];
        while (list.length) {
            var newList = [];
            for (var i in list) {
                this.observeObject(list[i].object, list[i].key, list[i].parent);
                var value = list[i].object[list[i].key];
                if (value instanceof Object) {
                    for (var key in value) {
                        if (value[key] instanceof Object && !hasInit(value[key])) {
                            newList.push({object: value, key: key, parent: value});
                        }
                    }
                }
            }
            list = newList;
        }
    },
    observeObject: function(object, key, parent) {
        var that = this;
        initObject(object, key, parent);
        Object.observe(object[key], function(changes) {
            for (var i = 0; i < changes.length; ++i) {
                that.onChangeComing(changes[i], parent);
            }
        });
    }
};

var observerManual = {
    register: function(object, key) {
        //var oldValue =
        var newKey = '___' + key;

        setValue(object, newKey, object[key]);
        delete object[key];

        var timeout;

        Object.defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            get: function() {
                var value = object[newKey];
                if (typeof(value) == 'object') {
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        onBindValueUpdate.call(object, key);
                    }, 0);
                }
                console.log('get', value);
                return object[newKey];
            },
            set: function(value) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    onBindValueUpdate.call(object, key);
                }, 0);
                console.log('set', value);
                object[newKey] = value;
            }
        });
    },
    getComparisonValue: function(object) {
        if (!(object instanceof Object))
            return object;
        var value = '';
        for (var i in object) {
            value += i + '\b'; //backspace for join
        }
        return value;
    }
};

var observer = {
    register: function (object, key) {}
};

var initDone = false;
var init = function() {
    //todo: use VB script for getter \ setter on IE < 9?
    if (!app.browserCheck.hasDefineProperty()) {
        app.exception.unsupportedBrowser();
    }

    /*if (app.browserCheck.hasObserve()) {
        observer = observerNative;
    } else {*/ //for development
        observer = observerManual;
    //}
};

module = function(object, key) {
    if (!initDone) {
        initDone = true;
        init();
    }

    observer.register(object, key);
};