/**
 * Created by Alex Manko on 10.11.2015.
 */

module = {
    //returns value for comparion new value with old
    hash: function(domObject) {
        throw 'Hash function must be implemented';
    },
    //returns value for saving
    get: function(domObject) {
        throw 'Get function must be implemented';
    },
    //applies value to dom object
    set: function(domObject, value) {
        throw 'Set function must be implemented';
    }
};