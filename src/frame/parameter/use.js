/**
 * Created by Alex Manko on 04.01.2016.
 */

FR.register.parameter('use', {
    parse: function(parametersString) {
        var value, parsed = false, isVariable = false, base, tmp;

        value = parametersString.trim();

        //comma is inside string
        if (value[0] == '\'' || value[0] == '"') {
            tmp = value.indexOf(value[0] + ' as ', 1);
        } else {
            isVariable = true;
            tmp = value.indexOf(' as ', 0);
        }

        if (tmp < 0)
            throw 'Wrong parameters string "' + parametersString + '"';

        base = isVariable ? value.substr(0, tmp) : value.substr(1, tmp - 1);
        value = value.substr(tmp + (isVariable ? 4 : 5)).split(',');

        if (value.length > 2)
            throw 'Wrong parameters string "' + parametersString + '"';

        return {
            value: base,
            isVariable: isVariable,
            isKey: value.length > 1,
            mapKey: value.length > 1 ? value[0] : false,
            mapValue: value.length > 1 ? value[1] : value[0],
            dependsOn: isVariable ? [base] : []
        };
    },
    render: function(parsedParameters, access) {
        return parsedParameters.isVariable
            ? access.get(parsedParameters.value)
            : parsedParameters.value;
    }
});