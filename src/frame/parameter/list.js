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
    getDepending: function(parsedParameters, currentPath) {
        var dependValues = parsedParameters.values.slice(), i, iLen,
            path, paths = [];
        for (i = 0, iLen = parsedParameters.variables.length; i < iLen; ++i) {
            path = currentPath + '.' + dependValues[parsedParameters.variables[i]];
            paths.push(path);
            dependValues[parsedParameters.variables[i]] = path;
        }

        return {
            values: dependValues,
            variables: parsedParameters.variables,
            paths: paths
        }
    },
    render: function(dependParameters, root) {
        var values = dependParameters.values.slice(), i, iLen;

        for (i = 0, iLen = dependParameters.variables.length; i < iLen; ++i) {
            values[dependParameters.variables[i]] = app.common.object.getValueFromPath(root, values[dependParameters.variables[i]]);
        }

        return values;
    }
});