/**
 * Created by Alex Manko on 10.11.2015.
 */

var defaults = {};
defaults.checker = (function() {
    var module = {};
    //= ./default/checker.js
    return module;
})();
defaults.model = (function() {
    var module = {};
    //= ./default/model.js
    return module;
});
defaults.flow = (function() {
    var module = {};
    //= ./default/flow.js
    return module;
})();

function getGroup(type) {
    switch (type) {
        case 'checker': return 'checker';
        case 'parameter': return 'parameter';
        case 'flow': return 'statement';
        case 'model': return 'statement';
    }
}

var db = {};
function register(type, name, definition) {
    var group = getGroup(type);
    if (!db[group])
        db[group] = {};

    if (db[group][name])
        throw group + ' with name "' + name + '" already has been registered';

    db[group][name] = {
        type: type,
        definition: definition
    };
    for (var i in defaults[type]) {
        if (!defaults[type].hasOwnProperty(i)) continue;
        if (!db[group][name].definition.hasOwnProperty(i))
            db[group][name].definition[i] = defaults[type][i];
    }
}

module = {
    getGroup: getGroup,
    checker: function(name, definition) {
        return register('checker', name, definition);
    },
    parameter: function(name, definition) {
        return register('parameter', name, definition);
    },
    flow: function(name, definition) {
        return register('flow', name, definition);
    },
    model: function(name, definition) {
        return register('model', name, definition);
    },
    get: function(group, name) {
        if (!db[group] || !db[group][name])
            throw group + ' with name "' + name + '" not registered';
        return db[group][name];
    }
};