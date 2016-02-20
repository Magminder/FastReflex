/**
 * Created by Alex Manko on 07.11.2015.
 */

FR.register.flow('if', {
    parameters: 'variable',
    apply: function(parameters, operand, sequence) {
        if (parameters)
            return sequence;
        return [];
    }
});