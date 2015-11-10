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

    serialize: function() {
        var s = '';
        for (var i in value) {
            if (value.hasOwnProperty(i)) {
                s += i + ':' + value[i] + '#';
            }
        }
        return s;
    }
};