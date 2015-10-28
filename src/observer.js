/**
 * Created by Alex Manko on 24.10.2015.
 */

//todo: maybe remove valueOld for speed boost on object cloning?
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
    Object.defineProperty(object, '$FR', {
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
            for (var i = 0; i < list.length; ++i) {
                this.observeObject(list[i].object, list[i].key, list[i].parent);
                var value = list[i].object[list[i].key];
                if (value instanceof Object) {
                    for (var key in Object.keys(value)) {
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
        initObject(object[key], key, parent);
        Object.observe(object[key], function(changes) {
            for (var i = 0; i < changes.length; ++i) {
                that.onChangeComing(changes[i], parent);
            }
        });
    }
};

var observerManual = {
    register: function(object, key) {
        if (object[key] instanceof Object) {
            initObject(object[key], key, object[key]);
            this.deepObserve(object[key]);
        }

        this.setWatcher(object, key);
    },
    checkComparisonValue: function(object, key, currentValue, currentComparisonValue, cacheValue, cacheComparisonValue) {
        var difference = false;
        if (currentValue != cacheValue) {
            if (currentValue instanceof Object) {
                initObject(currentValue, key, object);
                this.deepObserve(currentValue);
            }
            onChange(object, key, 'update', currentValue, cacheValue);
            difference = true;
        }

        //newValue and oldValue are objects and keys are different
        if (!difference && currentValue instanceof Object && currentComparisonValue != cacheComparisonValue) {
            var newKeys = Object.keys(currentValue), newKeysMap = {},
                oldKeys = Object.keys(cacheValue), oldKeysMap = {},
                i, value;

            for (i = 0; i < oldKeys.length; ++i) {
                oldKeysMap[oldKeys[i]] = true;
            }
            for (i = 0; i < newKeys.length; ++i) {
                newKeysMap[newKeys[i]] = true;
                if (!oldKeysMap[newKeys[i]]) {
                    value = currentValue[newKeys[i]];

                    if (value instanceof Object) {
                        initObject(value, newKeys[i], currentValue);
                        this.deepObserve(value);
                    }

                    this.setWatcher(currentValue, newKeys[i]);

                    onChange(currentValue, newKeys[i], 'add', currentValue[newKeys[i]]);
                }
            }
            for (i = 0; i < oldKeys.length; ++i) {
                if (!newKeysMap[oldKeys[i]]) {
                    delete currentValue.$FR._observeKeys[oldKeys[i]];
                    onChange(currentValue, oldKeys[i], 'delete', undefined, cacheValue[oldKeys[i]]);
                }
            }
        }
    },
    getComparisonValue: function(value) {
        if (!(value instanceof Object))
            return false;
        return Object.keys(value).join('\b'); //backspace for join
    },
    deepObserve: function(observeObject) {
        var list = [observeObject];
        while (list.length) {
            var newList = [];

            for (var i = 0; i < list.length; ++i) {
                var object = list[i];
                if (!object.$FR._observeKeys)
                    object.$FR._observeKeys = {};
                for (var key in Object.keys(object)) {
                    if (object.$FR._observeKeys[key]) continue;

                    if (object[key] instanceof Object) {
                        initObject(object[key], key, object);
                        newList.push(object);
                    }

                    this.setWatcher(object, key);
                    object.$FR._observeKeys[key] = true;
                }
            }

            list = newList;
        }
    },
    setWatcher: function(object, key) {
        var that = this;
        var currentValue = object[key];
        var cacheValue = this.copyObject(currentValue);
        var cacheComparisonValue = this.getComparisonValue(object[key]);

        delete object[key];
        var timeout = false;

        Object.defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            get: function() {
                if (!timeout && cacheValue instanceof Object) {
                    timeout = setTimeout(function() {
                        //todo: need to save old keys to array for comparison, instead reference object in cache with the save keys as in new value
                        timeout = false;
                        var currentComparisonValue = that.getComparisonValue(currentValue);
                        that.checkComparisonValue(object, key, currentValue, currentComparisonValue, cacheValue, cacheComparisonValue);
                        cacheValue = that.copyObject(currentValue);
                        cacheComparisonValue = currentComparisonValue;
                    }, 0);
                }
                console.log('get', currentValue);
                return currentValue;
            },
            set: function(value) {
                if (!timeout) {
                    timeout = setTimeout(function () {
                        timeout = false;
                        var currentComparisonValue = that.getComparisonValue(currentValue);
                        that.checkComparisonValue(object, key, currentValue, currentComparisonValue, cacheValue, cacheComparisonValue);
                        cacheValue = that.copyObject(currentValue);
                        cacheComparisonValue = currentComparisonValue;
                    }, 0);
                }
                console.log('set', value);
                currentValue = value;
            }
        });
    },
    copyObject: function(object) {
        if (object instanceof Array)
            return object.slice()

        if (!(object instanceof Object))
            return object;

        var newObject = {};
        for (var key in Object.keys(object)) {
            newObject[key] = object[key];
        }
        return newObject;
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

    observer = observerManual; return; //for development only
    if (app.browserCheck.hasObserve()) {
        observer = observerNative;
    } else {
        observer = observerManual;
    }
};

module = function(object, key) {
    if (!initDone) {
        initDone = true;
        init();
    }

    observer.register(object, key);
};