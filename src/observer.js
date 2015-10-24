/**
 * Created by Alex Manko on 24.10.2015.
 */

var onChange = function(object, isArray, key, type, valueNew, valueOld) {

};

var observerNative = function(object, key) {
    var isArray = object instanceof Array;
    Object.observe(object, function(changes) {

    });
};

var observerDefineProperty = function(object, key) {
    var isArray = object instanceof Array;
};

var observer = function(object, key) {};

var initDone = false;
var init = function() {
    initDone = true;
    if (app.browserCheck.hasObserve()) {
        observer = observerNative;
    } else if (app.browserCheck.hasDefineProperty()) {
        observer = observerDefineProperty;
    } else {
        app.exception.unsupportedBrowser();
    }
};

//todo: use VB script for getter \ setter on IE < 9?

module = function(object) {
    Object.observe(object, function(changes) {

        // This asynchronous callback runs
        changes.forEach(function(change) {

            // Letting us know what changed
            console.log(change.type, change.name, change.oldValue, change);
        });

    });
};