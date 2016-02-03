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

var upLayout = function(commands, sid, layout) {
    var queue = [], q, i, iLen, commandIndex;

    queue.push({
        command: commands[sid],
        layout: layout
    });

    while (q = queue.pop()) {
        q.command.layout = q.layout;
        for (i = 0, iLen = q.command.elements.length; i < iLen; ++i) {
            if (!q.command.elements[i].hasOwnProperty('list'))
                continue; //currently added item

            commandIndex = q.command.elements[i].list[q.command.sid].index;
            if (commandIndex + 1 < q.command.elements[i].order.length &&
                q.command.elements[i].order[commandIndex + 1].layout <= q.layout)
                queue.push({
                    command: q.command.elements[i].order[commandIndex + 1],
                    layout: q.layout + 1
                });
        }
    }
};

/**
 * Builds commands layouts for dom objects
 *
 * @param index
 * @param definitions
 * @param openCommands
 * @param plate
 * @returns {{}}
 */
var processOperators = function(index, definitions, openCommands, commands) {
    //todo: check collisions (mb only for dev environment?)
    var objectOpenCommands = [], objectMiddleCommands = {},
        isBegin, isEnd, isSingle, commandDefinition, i, iLen,
        j, jLen = openCommands.length, sid, statement, parameter,
        list = {}, order = [], layout = 0,
        q, qLen, needMarker = false, currentElement = {
            index: index
        };

    for (i = 0, iLen = definitions.length; i < iLen; ++i) {
        isSingle = !definitions[i].modifier;
        isBegin = definitions[i].modifier == 'begin';
        isEnd = definitions[i].modifier == 'end';

        if (isBegin || isSingle) { //we have new command
            sid = definitions[i].uid ? 'u' + definitions[i].uid : 's' + systemUid++;

            /** check that user do not used the save identifier
             * in more than one command for children in same parent area
             */
            if (definitions[i].uid && commands[sid])
                throw 'Duplicate definition for "' + definitions[i].uid +
                    '" on statement "' + definitions[i].commandString + '"';

            statement = app.register.get('statement', definitions[i].operator).definition;
            parameter = app.register.get('parameter', statement.parameters).definition;

            //command definition for use in common commands list and in dom elements
            commandDefinition = {
                statement: statement,
                parameter: parameter,
                operator: definitions[i].operator,
                operand: parameter.parse(definitions[i].operand),
                isSingle: isSingle,
                elements: [currentElement], //every command has list of dom objects involved in processing
                sid: sid,
                layout: layout
            };
            ++layout;

            //addition command to global list
            commands[sid] = commandDefinition;

            /**if we have begin statement, save new open command in local array and copy in global array later,
             * to preventing it's closing in current dom object
              */
            if (isBegin) {
                objectOpenCommands.push({
                    statement: statement,
                    layout: commandDefinition.layout,
                    operator: definitions[i].operator,
                    uid: definitions[i].uid,
                    sid: sid,
                    commandString: definitions[i].commandString
                });
            } else {
                //single flow operator, needs to add marker after, to identify place
                if (statement.isChangeFlow)
                    needMarker = true;
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

            commandDefinition = commands[sid];
            commandDefinition.elements.push(currentElement); //add current dom object to command

            if (isEnd) {
                //closed flow operator, needs to add marker after, to identify place
                if (openCommands[j].statement.isChangeFlow)
                    needMarker = true;

                //command was closed, removing from global list
                openCommands.splice(j, 1);
                --jLen;
            } else {
                /** middle command definition. Save sid for excluding command addition for current dom object
                 * from global list (openCommands) if it was explicity used
                 */

                //adds all previous command from openCommands
                for (q = 0, qLen = openCommands.length; q < qLen; ++q) {
                    objectMiddleCommands[openCommands[q].sid] = true;
                    if (commands[openCommands[q].sid].layout >= layout) {
                        layout = commands[openCommands[q].sid].layout + 1;
                    } else {
                        upLayout(commands, openCommands[q].sid, layout);
                        ++layout;
                    }

                    if (openCommands[q].sid == sid)
                        break;

                    //only for commands, before sid, For sid elements was pushed earlier
                    commands[openCommands[q].sid].elements.push(currentElement);
                }
            }
        }

        //command addition to dom object
        order.push(commandDefinition);
    }

    //previously opened commands addition before current dom object commands
    for (i = openCommands.length - 1; i >= 0; --i) {
        if (objectMiddleCommands[openCommands[i].sid])
            continue;

        if (openCommands[i].layout >= layout) {
            layout = openCommands[i].layout + 1;
        } else {
            upLayout(commands, openCommands[i].sid, layout);
            ++layout;
        }

        commandDefinition = commands[openCommands[i].sid];
        commandDefinition.elements.push(currentElement);
        order.unshift(commandDefinition);
    }

    //map commands by sid for current dom object
    for (i = 0, iLen = order.length; i < iLen; ++i) {
        commandDefinition = order[i];
        list[commandDefinition.sid] = {
            index: i,
            command: commandDefinition
        };
    }

    //copying opened (in current dom object) commands to global list
    for (i = 0, iLen = objectOpenCommands.length; i < iLen; ++i) {
        openCommands.push(objectOpenCommands[i]);
    }

    currentElement.order = order;
    return needMarker;
};

var checkOpenCommands = function(openCommands) {
    if (openCommands.length) {
        var statements = [];
        for (var i = 0, iLen = openCommands.length; i < iLen; ++i) {
            statements.push(openCommands[i].commandString);
        }
        throw 'Unclosed statement: "' + statements.join('", "') + '"';
    }
};

var processCommands = function(plate, commands) {
    var layouts = [], sid, i, iLen;
    for (sid in commands) {
        if (!commands.hasOwnProperty(sid)) continue;

        commands[sid].index_min = commands[sid].elements[0].index;
        commands[sid].index_max = commands[sid].elements[commands[sid].elements.length - 1].index;

        /*if (!layouts[commands[sid].layout])
            layouts[commands[sid].layout] = {};
        layouts[commands[sid].layout][sid] = commands[sid];*/
    }
};

var parsePlate = function(listElement, newList) {
    systemUid = 1; //reset uid counter
    var openCommands = [], domElement, definitions, parsedElement, j, jLen,
        plate = {
            plateLevel: listElement.plateLevel,
            path: listElement.path,
            plates: []
        }, needMarker, commands = {};

    for (j = 0, jLen = listElement.parent.childNodes.length; j < jLen; ++j) {
        domElement = listElement.parent.childNodes[j];

        definitions = parseDefinition(domElement);
        if (definitions.length || openCommands.length) {
            //need to define what to do with elements, that do not includes into commands, but can have plates
            newList.push({
                plateLevel: listElement.plateLevel + 1,
                path: [],
                plates: plate.plates,
                parent: domElement
            });
        } else {
            newList.push({
                plateLevel: listElement.plateLevel + 1,
                path: listElement.path.concat(j),
                plates: listElement.plates,
                parent: domElement
            });
        }

        if (!definitions.length)
            continue;

        needMarker = processOperators(j, definitions, openCommands, commands);

        //can throws exception for document or documentElement nodes
        //todo: check that marker can be added
        //todo: check next node, to using as marker
        if (needMarker) {
            domElement.parentNode.insertBefore(new Text(), domElement.nextSibling);
        }
    }

    checkOpenCommands(openCommands);

    processCommands(plate, commands);

    return plate;
};

var parse = function(domRoot) {
    if (!(domRoot instanceof HTMLElement))
        throw 'Unsupported DOM element type';
    if (app.common.object.hasInit(domRoot))
        throw 'Dom object can\'t be used more than once';

    var list, newList, i, iLen, plate,
        openCommands, commandsList, definitions, parsedElement;

    openCommands = [];
    commandsList = {};

    var parsedRoot = {
        template: domRoot.cloneNode(true),
        plates: []
    };

    definitions = parseDefinition(parsedRoot.template);
    parsedElement = processOperators(definitions, openCommands, commandsList);

    //todo: remove elements, add to commands only start and end indexes (elements range)

    //can throws exception for document or documentElement nodes
    //todo: check that marker can be added
    //todo: move this logic to render section?
    if (parsedElement.needMarker)
        parsedElement.marker = domRoot.parentNode.insertBefore(new Text(), domRoot.nextSibling);

    checkOpenCommands(openCommands);

    parsedRoot.list = parsedElement.list;
    parsedRoot.order = parsedElement.order;

    if (!domRoot.childNodes.length)
        return;

    list = [{
        plateLevel: 1,
        path: [],
        plates: parsedRoot.plates,
        parent: parsedRoot.template
    }];

    while (list.length) {
        newList = [];

        for (i = 0, iLen = list.length; i < iLen; ++i) {
            plate = parsePlate(list[i], newList);

            /*if (!plate.children.length)
                continue;*/

            plate.template = list[i].parent;

            list[i].plates.push(plate);
        }
        list = newList;
    }

    return parsedRoot;
};

module = parse;