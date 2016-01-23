/**
 * Created by Alex Manko on 01.11.2015.
 */

module = {
    init: function(object, value) {
        Object.defineProperty(object, '$FR', {
            value: value instanceof Object ? value : {},
            configurable: true,
            enumerable: false,
            writable: true
        });
    },

    hasInit: function(object) {
        return object.hasOwnProperty('$FR');
    },

    getValueFromPath: function(object, path) {
        try {
            return eval('object.' + path);
        } catch (e) {
            return '';
        }
    },

    setValueForPath: function(object, path, value) {
        path = path.split('.');
        for (var i = 0, iLen = path.length - 1; i < iLen; ++i) {
            if (!object.hasOwnProperty(path[i]))
                object = object[path[i]] = {};
        }
        object[path.pop()] = value;
    }
};