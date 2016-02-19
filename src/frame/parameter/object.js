/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.parameter('object', {
    parse: function(parametersString) {
        var exploding = parametersString.split(','), i, iLen,
            key, value, values = [], keys = [], variables = [], tmp, dependsOn = [],
            valueParser = app.register.get('parameter', 'variable').definition;

        for (i = 0, iLen = exploding.length; i < iLen; ++i) {
            value = exploding[i].trim();

            tmp = value.indexOf(':');
            if (tmp < 1 || tmp == value.length - 1) {
                throw 'Wrong parameters string "' + parametersString + '"';
            }

            key = value.substr(0, tmp);
            value = value.substr(tmp + 1);

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

            keys.push(key);
            values.push(value.value);
        }

        return {
            keys: keys,
            values: values,
            variables: variables,
            dependsOn: dependsOn
        };
    },
    render: function(parsedParameters, access) {
        var values = parsedParameters.values.slice(), i, iLen, result = {};

        for (i = 0, iLen = parsedParameters.variables.length; i < iLen; ++i) {
            values[parsedParameters.variables[i]] = access.get(values[parsedParameters.variables[i]]);
        }

        for (i = 0, iLen = parsedParameters.keys.length; i < iLen; ++i) {
            result[parsedParameters.keys[i]] = values[i];
        }

        return result;
    }
});