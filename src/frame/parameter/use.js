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

        base = isVariable ? value.substr(0, tmp).trim() : value.substr(1, tmp - 1).trim();
        value = value.substr(tmp + (isVariable ? 4 : 5)).split(',');

        if (value.length > 2)
            throw 'Wrong parameters string "' + parametersString + '"';

        return {
            value: base,
            isVariable: isVariable,
            isKey: value.length > 1,
            mapKey: value.length > 1 ? value[0].trim() : false,
            mapValue: value.length > 1 ? value[1].trim() : value[0].trim()
        };
    },
    render: function(command, transformation, elementIndex) {
        var parsedParameters = command.operand, path;

        if (!parsedParameters.isVariable) return {
            value: parsedParameters.value,
            hash: parsedParameters.value
        };

        path = transformation._getRealPath(elementIndex, command.sid, parsedParameters.value);

        return {
            value: transformation.access.get(path),
            hash: path,
            paths: [path]
        };
    }
});