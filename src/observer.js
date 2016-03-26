/**
 * Created by Alex Manko on 24.10.2015.
 */

/**
 *
 * @param object
 * @param key
 * @param type add|update|delete
 * @param valueNew
 * @param valueOld
 * @param watcher
 *
 * todo: implement reaction to add and delete events at transformations level
 */
function onChange(object, key, type, valueNew, valueOld, watcher) {
    var path = '';

    if (object.hasOwnProperty('$FR')) {
        if (type == 'add' || type == 'delete') {
            watcher(object.$FR.path, 'update', object, object);
            return;
        }

        if (object.$FR.path) {
            path = object.$FR.path + '.' + key;
        } else {
            path = key;
        }
    }

    watcher(path, type, valueNew, valueOld);
}

function initObject(object, key, parent) {
    app.common.object.init(object, {
        key: key,
        parent: parent,
        path: parent.hasOwnProperty('$FR') ?
            (parent.$FR.path ? (parent.$FR.path + '.' + key) : key) : ''
    });
}

var observerNative = {
    register: function (object, key, watcher) {
        var that = this, i;
        Object.observe(object, function (changes) {
            for (i = 0; i < changes.length; ++i) {
                if (changes[i].name != key) continue;

                that.onChangeComing(changes[i], object[key], watcher);
            }
        });

        if (object[key] instanceof Object) {
            if (app.common.object.hasInit(object[key])) {
                throw new Exception('Attempt to double call for one object');
            }
            this.deepObserve(object, key, object[key], watcher);
        }
    },
    onChangeComing: function(change, parent, watcher) {
        if (change.name == '$FR') return;

        var newValue = change.object[change.name];

        if ((change.type == 'add' && newValue instanceof Object) ||
            (change.type == 'update' && newValue instanceof Object && change.oldValue != newValue)) {
            this.deepObserve(change.object, change.name, parent, watcher);
        }

        onChange(change.object,
            change.name,
            change.type,
            change.object[change.name],
            change.oldValue,
            watcher);
    },
    deepObserve: function(object, key, parent, watcher) {
        var list = [{object: object, key: key, parent: parent}], i, j;
        while (list.length) {
            var newList = [];
            for (i = 0; i < list.length; ++i) {
                this.observeObject(list[i].object, list[i].key, list[i].parent, watcher);
                var value = list[i].object[list[i].key];
                if (!(value instanceof Object)) continue;

                for (j in value) {
                    if (value.hasOwnProperty(j) && value[j] instanceof Object && !app.common.object.hasInit(value[j])) {
                        newList.push({object: value, key: j, parent: value});
                    }
                }
            }
            list = newList;
        }
    },
    observeObject: function(object, key, parent, watcher) {
        var that = this, i;
        initObject(object[key], key, parent);
        Object.observe(object[key], function(changes) {
            for (i = 0; i < changes.length; ++i) {
                that.onChangeComing(changes[i], parent, watcher);
            }
        });
    }
};

//todo: observe length for arrays
var observerManual = {
    register: function(object, key, watcher) {
        if (object[key] instanceof Object) {
            initObject(object[key], key, object[key]);
            this.deepObserve(object[key], watcher);
        }

        this.setWatcher(object, key, watcher);
    },
    checkComparisonValue: function(object, key, currentValue, currentComparisonValue, cacheValue, cacheComparisonValue, watcher) {
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
                        this.deepObserve(value, watcher);
                    }

                    this.setWatcher(currentValue, newKeys[i], watcher);

                    onChange(currentValue, newKeys[i], 'add', currentValue[newKeys[i]], undefined, watcher);
                }
            }
            for (i = 0, len = oldKeys.length; i < len; ++i) {
                if (!newKeysMap[oldKeys[i]]) {
                    delete currentValue.$FR._observeKeys[oldKeys[i]];
                    onChange(currentValue, oldKeys[i], 'delete', undefined, cacheValue[oldKeys[i]], watcher);
                }
            }
            if (currentValue instanceof Array && currentValue.length != cacheValue.length)
                onChange(currentValue, 'length', 'update', currentValue.length, cacheValue.length, watcher);
        }
    },
    getComparisonValue: function(value) {
        if (!(value instanceof Object))
            return false;
        return Object.keys(value).join('\b'); //backspace for join
    },
    deepObserve: function(observeObject, watcher) {
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

                    this.setWatcher(object, key, watcher);
                    object.$FR._observeKeys[key] = true;
                }
            }

            list = newList;
        }
    },
    setWatcher: function(object, key, watcher) {
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
                        that.checkComparisonValue(object, key, currentValue, currentComparisonValue, cacheValue,
                            cacheComparisonValue, watcher);
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
                    that.deepObserve(currentValue, watcher);
                }
                onChange(object, key, 'update', currentValue, cacheValue, watcher);
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
    register: function (object, key, wather) {}
};

var initDone = false;
function init() {
    if (!app.browserCheck.hasDefineProperty()) {
        app.exception.unsupportedBrowser();
    }

    if (app.browserCheck.hasObserve()) {
        observer = observerNative;
    } else {
        observer = observerManual;
    }
}

module = {
    register: function(object, key, wather) {
        if (!initDone) {
            initDone = true;
            init();
        }

        observer.register(object, key, wather);
    }
};

