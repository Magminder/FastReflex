/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.model('value', {
    changes: 'value',
    parameters: 'variable',
    apply: function(domObject, parameters) {
        var valueChecker = app.register.get('checker', 'value').definition;
        valueChecker.set(domObject, parameters.value);
    },
    init: function(domObject, parameters) {
        //todo: implement event processing on first call?
    }
});