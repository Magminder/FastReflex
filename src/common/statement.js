/**
 * Created by Alex Manko on 04.01.2016.
 */

module = {
    parseParameters: function(name, operandString) {
        var statement = app.register.get('statement', name).definition;
        var parameter = app.register.get('parameter', statement.parameters).definition;
        return parameter.parse(operandString);
    }
};