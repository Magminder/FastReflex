/**
 * Created by Alex Manko on 04.01.2016.
 */

module = {
    parameters: 'variable',
    isChangeFlow: true, //can change flow
    isDefineReferences: false, //can define references to some path
    //apply value to dom object
    apply: function(domObject, parameters) {
        throw 'Apply function must be implemented';
    },
    //init dom object state on first call
    init: function(domObject, parameters) {
    }
};