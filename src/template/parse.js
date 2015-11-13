/**
 * Created by Alex Manko on 24.10.2015.
 */

var systemUid = 1;
var correctModifiers = {begin: 1, end: 1, middle: 1};

var initDomObject = function(domObject, domRoot) {
    app.common.object.init(domObject, {
        domRoot: domRoot,
        commandsBySid: {},
        commandsByOrder: []
    });
};

/**
 * Parsing commands from data attribute
 *
 * @param domObject
 * @returns {Array}
 */
var parseDefinition = function(domObject) {
    if (!(domObject instanceof HTMLElement)) return [];
    if (!domObject.hasAttribute('data-fr')) return [];
    var attr = domObject.getAttribute('data-fr').trim();
    if (!attr) return [];
    attr = attr.split(';');
    var result = [], i, command, separatorPosition, operator, parsedCommand;
    for (i = 0; i < attr.length; ++i) {
        command = attr[i].trim();
        if (!command) continue;
        parsedCommand = {
            commandString: command
        };

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

/**
 * Builds commands layouts for dom objects
 *
 * @param domObject
 * @param openCommands
 * @param commandsList
 */
var processOperators = function(domObject, openCommands, commandsList) {
    //todo: check collisions (mb only for dev environment?) and create statements queue
    var definitions = parseDefinition(domObject),
        objectOpenCommands = [], objectMiddleCommands = {},
        isBegin, isEnd, isSingle, commandDefinition, i, iLen,
        j, jLen = openCommands.length, sid, commandIndex;

    domObject.$FR.commandsByOrder = [];
    domObject.$FR.commandsBySid = {};

    for (i = 0, iLen = definitions.length; i < iLen; ++i) {
        isSingle = !definitions[i].modifier;
        isBegin = definitions[i].modifier == 'begin';
        isEnd = definitions[i].modifier == 'end';

        if (isBegin || isSingle) { //we have new command
            sid = definitions[i].uid ? 'u' + definitions[i].uid : 's' + systemUid++;

            /** check that user do not used the save identifier
             * in more than one command for children in same parent area
             */
            if (definitions[i].uid && commandsList[sid])
                throw 'Duplicate definition for "' + definitions[i].uid +
                    '" on statement "' + definitions[i].commandString + '"';

            //command definition for use in common commands list and in dom elements
            commandDefinition = {
                operator: definitions[i].operator,
                operand: definitions[i].operand, //todo: add parsed operand
                isSingle: isSingle,
                domObjects: [domObject], //every command has list of dom objects involved in processing
                sid: sid
            };

            //addition command to global list
            commandsList[sid] = commandDefinition;

            /**if we have begin statement, save new open command in local array and copy in global array later,
             * to preventing it's closing in current dom object
              */
            if (isBegin) {
                objectOpenCommands.push({
                    operator: definitions[i].operator,
                    uid: definitions[i].uid,
                    sid: sid,
                    commandString: definitions[i].commandString
                });
            }
        } else { //command was begun previously
            sid = false;
            for (j = 0; j < jLen; ++j) { //find suitable opened (begin) statement for current command
                if (openCommands[j].operator == definitions[i].operator && openCommands[j].uid == definitions[i].uid) {
                    sid = openCommands[j].sid;
                    break;
                }
            }
            if (!sid)
                throw 'There is no begin statement for "' + definitions[i].commandString + '"';

            commandDefinition = commandsList[sid];
            commandDefinition.domObjects.push(domObject); //add current dom object to command

            if (isEnd) {
                //command was closed, removing from global list
                openCommands.splice(j, 1);
                --jLen;
            } else {
                /** middle command definition. Save sid for excluding command addition for current dom object
                 * from global list (openCommands) if it was explicity used
                 */
                objectMiddleCommands[sid] = true;
            }
        }

        //command addition to dom object
        domObject.$FR.commandsByOrder.push(commandDefinition);
    }

    //previously opened commands addition before current dom object commands
    for (i = openCommands.length - 1; i >= 0; --i) {
        if (objectMiddleCommands[openCommands[i].sid])
            continue;
        commandDefinition = commandsList[openCommands[i].sid];
        commandDefinition.domObjects.push(domObject);
        domObject.$FR.commandsByOrder.unshift(commandDefinition);
    }

    //map commands by sid for current dom object
    for (i = 0, iLen = domObject.$FR.commandsByOrder.length; i < iLen; ++i) {
        commandDefinition = domObject.$FR.commandsByOrder[i];
        domObject.$FR.commandsBySid[commandDefinition.sid] = {
            index: i, //we can't save index in command definition, because it can be used in multiple dom objects
            command: commandDefinition
        };
    }

    //copying opened (in current dom object) commands to global list
    for (i = 0, iLen = objectOpenCommands.length; i < iLen; ++i) {
        openCommands.push(objectOpenCommands[i]);
    }
};

var parse = function(domRoot) {
    if (!(domRoot instanceof HTMLElement))
        throw 'Unsupported DOM element type';
    if (app.common.object.hasInit(domRoot))
        throw 'Dom object can\'t be used more than once';
    domRoot.$FR.template = domRoot.cloneNode(true);
    initDomObject(domRoot, domRoot);
    domRoot.$FR.commandsList = []; //saves command lists in root element

    var list = [domRoot.$FR.template], newList, i, iLen, j, jLen, childNode, domObject,
        openCommands = [], lastParent = null, templateRoot = domRoot.$FR.template;
    while (list.length) {
        newList = [];
        for (i = 0, iLen = list.length; i < iLen; ++i) {
            domObject = list[i];

            //when we switch to next dom element, all commands must be closed in previous
            if (lastParent != domObject.parentNode) {
                if (openCommands.length)
                    throw 'Unclosed statement "' + openCommands[0].commandString + '"';
                lastParent = domObject.parentNode;
            }

            if (app.common.object.hasInit(domObject)) continue;
            initDomObject(domObject, templateRoot);

            domObject.$FR.operators = processOperators(domObject, openCommands, domRoot.$FR.commandsList);
            if (!domObject.childNodes.length) continue;

            //add all child elements for parse queue
            for (j = 0, jLen = domObject.childNodes.length; j < jLen; ++j) {
                childNode = domObject.childNodes[j];
                newList.push(childNode);
            }
        }
        list = newList;
    }
};

module = parse;