/**
 * Created by Alex Manko on 28.11.2015.
 */

//todo: implement value checker
FR.register.checker('value', {
    hash: function(domObject) {
        var value = app.common.domObject.getValue(domObject);
        if (value instanceof Array)
            value = value.join('|-|');
        if (value instanceof Object)
            value = JSON.stringify(value);
        return value;
    },
    get: function(domObject) {
        return app.common.domObject.getValue(domObject);
    },
    set: function(domObject, value) {
        return app.common.domObject.setValue(domObject, value);
    }
});