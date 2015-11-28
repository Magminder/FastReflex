/**
 * Created by Alex Manko on 28.11.2015.
 */

//todo: implement value checker
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