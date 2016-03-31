/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.parameter('list', {
    parse: function(parametersString) {
        var exploding = parametersString.split(','), i, iLen,
            value, values = [], variables = [], tmp,
            valueParser = app.register.get('parameter', 'variable').definition;

        for (i = 0, iLen = exploding.length; i < iLen; ++i) {
            value = exploding[i].trim();

            tmp = value.substr(-1);
            //comma is inside string
            if (((value[0] == '\'' && tmp != '\'') || (value[0] == '"' && tmp != '"'))) {
                if (i + 1 < iLen) {
                    exploding[i + 1] = exploding[i] + exploding[i + 1];
                } else {
                    throw 'Wrong parameters string "' + parametersString + '"';
                }
                continue;
            }

            value = valueParser.parse(value);

            if (value.isVariable) {
                variables.push(values.length);
            }

            values.push(value.value);
        }

        return {
            values: values,
            variables: variables
        };
    },
    render: function(command, transformation, elementIndex) {
        var parsedParameters = command.operand;

        var values = parsedParameters.values.slice(), i, iLen, path, hash = '', paths = [];

        for (i = 0, iLen = parsedParameters.variables.length; i < iLen; ++i) {
            path = transformation._getRealPath(elementIndex, command.sid, values[parsedParameters.variables[i]]);
            paths.push(path);
            hash += parsedParameters.variables[i] + '=' + (path instanceof Object ?
                    JSON.stringify(path.value) : path) + '|';
            values[parsedParameters.variables[i]] = transformation.access.get(path);
        }

        return {
            value: values,
            hash: hash,
            paths: paths
        };
    }
});