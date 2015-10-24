/**
 * Created by Alex Manko on 24.10.2015.
 */

module = {
    hasObserve: function() {
        return Object.hasOwnProperty('observe');
    },
    hasDefineProperty: function() {
        return Object.hasOwnProperty('defineProperty');
    }
};
