/**
 * Created by Alex Manko on 07.11.2015.
 */

FR.register.flow('for', {
    parameters: 'use',
    isDefineReferences: true,
    apply: function(parameters, operand, sequence) {
        if (!(parameters instanceof Object))
            return [];

        var newSequence = [], synonyms;
        for (var i in parameters) {
            if (!parameters.hasOwnProperty(i))
                continue;

            synonyms = {};
            synonyms[operand.mapValue] = operand.value + '.' + i;
            if (operand.isKey)
                synonyms[operand.mapKey] = {value: i};
            newSequence.push({
                index: sequence,
                synonyms: synonyms
            });
        }
        return newSequence;
    }
});