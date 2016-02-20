/**
 * Created by Alex Manko on 20.01.2016.
 */

FR.register.flow('use', {
    parameters: 'use',
    isDefineReferences: true,
    isChangeFlow: false,
    apply: function(parameters, operand, sequence) {
        var synonyms = {};
        synonyms[operand.mapValue] = operand.value;
        if (operand.isKey) {
            synonyms[operand.mapKey] = operand.value;
        }
        return [{
            index: sequence,
            synonyms: synonyms
        }];
    }
});