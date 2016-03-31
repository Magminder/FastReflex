/**
 * Created by Alex Manko on 28.11.2015.
 */

FR.register.parameter('variable', {
    parse: function(parametersString) {
        var value, parsed = false, isVariable = false, tmp;

        value = parametersString.trim();

        tmp = value.substr(-1);
        //comma is inside string
        if (((value[0] == '\'' && tmp != '\'') ||
            (value[0] == '"' && tmp != '"'))) {

            throw 'Wrong parameters string "' + parametersString + '"';
        }

        //string value
        if ((value[0] == '\'' && tmp == '\'') ||
            (value[0] == '"' && tmp == '"')) {
            value = value.substr(1, value.length - 2);
            parsed = true;
        }

        if (!parsed) {
            //numeric value
            tmp = parseFloat(value);
            if (value === tmp.toString()) {
                value = tmp;
                parsed = true;
            }
        }

        if (!parsed) {
            //boolean value
            if (value == 'false') {
                value = false;
                parsed = true;
            } else if (value == 'true') {
                value = true;
                parsed = true;
            }
        }

        //todo: parse arrays and objects, using list and object parameter parsers (low priority)

        if (!parsed) {
            //variable
            isVariable = true;
        }

        return {
            value: value,
            isVariable: isVariable
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