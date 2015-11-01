/**
 * Created by Alex Manko on 01.11.2015.
 */

module = {
    init: function(object, key, parent) {
        Object.defineProperty(object, '$FR', {
            value: {
                parent: parent,
                key: key
            },
            configurable: true,
            enumerable: false,
            writable: true
        });
    },

    hasInit: function(object) {
        return object.hasOwnProperty('$FR');
    }
};