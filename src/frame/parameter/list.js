/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.parameter('list', {
    parse: function(parametersString) {
        var exploding = parametersString.split(','), i, iLen,
            value, values = [], variables = [], tmp, dependsOn = [],
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
                dependsOn.push(value.value);
                variables.push(values.length);
            }

            values.push(value.value);
        }

        return {
            values: values,
            variables: variables,
            dependsOn: dependsOn
        };
    },
    render: function(dependParameters, access) {
        var values = dependParameters.values.slice(), i, iLen;

        for (i = 0, iLen = dependParameters.variables.length; i < iLen; ++i) {
            values[dependParameters.variables[i]] = access.get(values[dependParameters.variables[i]]);
        }

        return values;
    }
});