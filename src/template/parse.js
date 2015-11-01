/**
 * Created by Alex Manko on 24.10.2015.
 */

var parseDefinition = function(domObject) {
    if (!domObject.hasAttribute('data-fr')) return [];
    var attr = domObject.getAttribute('data-fr').trim();
    if (!attr) return [];
    attr = attr.split(';');
    var result = [], i, command, separatorPosition, modifierPosition, operator, operand, modifier;
    for (i = 0; i < attr.length; ++i) {
        command = attr[i].trim();
        if (!command) continue;
        separatorPosition = command.indexOf(':');
        if (separatorPosition < 0) {
            operator = command;
            operand = '';
        } else {
            operator = command.substr(0, separatorPosition).trim();
            operand = command.substr(separatorPosition + 1).trim();
        }
        modifierPosition = operator.indexOf('-');
        if (modifierPosition >= 0) {
            modifier = operator.substr(operator, modifierPosition + 1);
            operator = operator.substr(0, modifierPosition);
        } else {
            modifier = '';
        }
        //todo: put operand to operator for parse
        result.push({
            operator: operator,
            operand: operand,
            modifier: ''
        });
    }
    return result;
};

var parse = function(domObject) {
    if (!(domObject instanceof HTMLElement))
        throw new Exception('Unsupported DOM element type');

    var list = [domObject], newList, i, iLen, j, jLen, childNode;
    while (list.length) {
        newList = [];
        for (i = 0, iLen = list.length; i < iLen; ++i) {
            if (app.common.object.hasInit(domObject)) continue;
            app.common.object.init(domObject);
            domObject.$FR.operators = parseDefinition(domObject);
            if (!domObject.childNodes.length) continue;
            for (j = 0; jLen = domObject.childNodes.length, j < jLen; ++j) {
                childNode = domObject.childNodes[j];
                if (!(childNode) instanceof HTMLElement) continue;
                newList.push(childNode);
            }
        }
        list = newList;
    }
};

module = parse;