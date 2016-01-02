/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.model('value', {
    changes: 'value',
    parameters: 'object',
    apply: function(domObject, parameters) {
        var valueChecker = app.register.get('checker', 'value');
        valueChecker.set(domObject, parameters);
    },
    init: function(domObject, parameters) {
        //todo: implement event processing on first call?
    }
});