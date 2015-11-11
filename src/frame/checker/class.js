/**
 * Created by Alex Manko on 10.11.2015.
 */

FR.register.checker('class', {
    hash: function(domObject) {
        return domObject.className;
    },
    get: function(domObject) {
        return domObject.className;
    },
    set: function(domObject, value) {
        domObject.className = value;
    }
});