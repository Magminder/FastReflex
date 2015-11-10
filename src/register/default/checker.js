/**
 * Created by Alex Manko on 10.11.2015.
 */

module = {
    //returns value for comparion new value with old
    comparison: function(value) {
        return app.common.object.serialize(value);
    },
    //returns value for saving
    value: function() {
        throw 'Value function must be implemented';
    },
    //applies value to dom object
    apply: function(domObject, value) {
        throw 'Apply function must be implemented';
    }
};