/**
 * Created by Alex Manko on 10.11.2015.
 */

var defaults = {};
defaults['checker'] = (function() {
    var module = {};
    //= ./default/checker.js
    return module;
})();

var db = {};
var register = function(type, name, definition) {
    if (!db[type]) db[type] = {};

    if (db[type][name])
        throw type+' with name "' + name + '" already has been registered';

    db[type][name] = definition;
    for (var i in defaults[type]) {
        if (!defaults[type].hasOwnProperty(i)) continue;
        if (!db[type][name].hasOwnProperty(i))
            db[type][name][i] = defaults[type][i];
    }
};

module = {
    checker: function(name, definition) {
        return register('checker', name, definition);
    },
    getList: function(type) {
        return db[type] || {};
    }
};