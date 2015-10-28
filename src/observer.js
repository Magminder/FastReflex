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
        var that = this, i;
        Object.observe(object, function (changes) {
            for (i = 0; i < changes.length; ++i) {
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
        var list = [{object: object, key: key, parent: parent}], i, j;
        while (list.length) {
            var newList = [];
            for (i = 0; i < list.length; ++i) {
                this.observeObject(list[i].object, list[i].key, list[i].parent);
                var value = list[i].object[list[i].key];
                if (!(value instanceof Object)) continue;

                for (j in value) {
                    if (value.hasOwnProperty(j) && value[j] instanceof Object && !hasInit(value[j])) {
                        newList.push({object: value, key: j, parent: value});
                    }
                }
            }
            list = newList;
        }
    },
    observeObject: function(object, key, parent) {
        var that = this, i;
        initObject(object[key], key, parent);
        Object.observe(object[key], function(changes) {
            for (i = 0; i < changes.length; ++i) {
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
        //newValue and oldValue are objects and keys are different
        if (currentValue instanceof Object && currentComparisonValue != cacheComparisonValue) {
            var newKeys = Object.keys(currentValue), newKeysMap = {},
                oldKeys = Object.keys(cacheValue), oldKeysMap = {},
                i, len, value;

            for (i = 0, len = oldKeys.length; i < len; ++i) {
                oldKeysMap[oldKeys[i]] = true;
            }
            for (i = 0, len = newKeys.length; i < len; ++i) {
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
            for (i = 0, len = oldKeys.length; i < len; ++i) {
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
        var list = [observeObject], i, len;
        while (list.length) {
            var newList = [];

            for (i = 0, len = list.length; i < len; ++i) {
                var object = list[i];
                if (!object.$FR._observeKeys)
                    object.$FR._observeKeys = {};
                for (var key in object) {
                    if (!object.hasOwnProperty(key) || object.$FR._observeKeys[key]) continue;

                    if (object[key] instanceof Object) {
                        initObject(object[key], key, object);
                        newList.push(object[key]);
                    }

                    this.setWatcher(object, key);
                    object.$FR._observeKeys[key] = true;
                }
            }

            list = newList;
        }
    },
    setWatcher: function(object, key) {
        var that = this,
            currentValue = object[key],
            cacheValue = this.copyObject(currentValue),
            cacheComparisonValue = this.getComparisonValue(object[key]),
            timeout = false;

        delete object[key];

        Object.defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            get: function() {
                if (!timeout && cacheValue instanceof Object) {
                    timeout = setTimeout(function() {
                        timeout = false;
                        var currentComparisonValue = that.getComparisonValue(currentValue);
                        that.checkComparisonValue(object, key, currentValue, currentComparisonValue, cacheValue, cacheComparisonValue);
                        cacheValue = that.copyObject(currentValue);
                        cacheComparisonValue = currentComparisonValue;
                    }, 0);
                }
                return currentValue;
            },
            set: function(value) {
                if (currentValue == value) return;

                currentValue = value;
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = false;
                }

                if (currentValue instanceof Object) {
                    initObject(currentValue, key, object);
                    that.deepObserve(currentValue);
                }
                onChange(object, key, 'update', currentValue, cacheValue);
                cacheValue = that.copyObject(currentValue);
                cacheComparisonValue = that.getComparisonValue(cacheValue);
            }
        });
    },
    copyObject: function(object) {
        if (object instanceof Array)
            return object.slice();

        if (!(object instanceof Object))
            return object;

        var newObject = {};
        for (var key in object) {
            if (!object.hasOwnProperty(key)) continue;
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