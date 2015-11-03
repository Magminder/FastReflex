/**
 * Created by Alex Manko on 24.10.2015.
 */

var systemUid = 1;
var correctModifiers = {begin: 1, end: 1, middle: 1};

var initDomObject = function(domObject, domRoot) {
    app.common.object.init(domObject, {
        domRoot: domRoot
    });
};

var parseDefinition = function(domObject) {
    if (!domObject.hasAttribute('data-fr')) return [];
    var attr = domObject.getAttribute('data-fr').trim();
    if (!attr) return [];
    attr = attr.split(';');
    var result = [], i, command, separatorPosition, operator, parsedCommand;
    for (i = 0; i < attr.length; ++i) {
        command = attr[i].trim();
        if (!command) continue;
        parsedCommand = {};

        separatorPosition = command.indexOf(':');
        if (separatorPosition < 0) {
            operator = command;
        } else {
            operator = command.substr(0, separatorPosition).trim();
            parsedCommand.operand = command.substr(separatorPosition + 1).trim();
        }
        operator = operator.split('-');
        if (operator.length > 3) throw 'Wrong statement definition "' + command + '"';

        if (operator.length > 1) {
            parsedCommand.modifier = operator.pop();
            if (!correctModifiers[parsedCommand.modifier])
                throw 'Incorrect modifier "' + modifier + '" in statement "' + command + '"';
        }
        if (operator.length > 1) {
            parsedCommand.uid = operator.pop();
        }
        parsedCommand.operator = operator[0];

        result.push(parsedCommand);
    }
    return result;
};

var processOperators = function(domObject, domRoot, openCommands, commandStack) {
    var definitions = parseDefinition(domObject),
        isBegin, isEnd;


};

var parse = function(domRoot) {
    if (!(domRoot instanceof HTMLElement))
        throw new Exception('Unsupported DOM element type');

    var list = [domRoot], newList, i, iLen, j, jLen, childNode, domObject;
    while (list.length) {
        newList = [];
        for (i = 0, iLen = list.length; i < iLen; ++i) {
            domObject = list[i];
            if (app.common.object.hasInit(domObject)) continue;
            initDomObject(domObject, domRoot);
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