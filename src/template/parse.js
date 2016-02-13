/**
 * Created by Alex Manko on 24.10.2015.
 */

var systemUid = 1;
var correctModifiers = {begin: 1, end: 1, middle: 1};

function CLayoutsList() {
    this.layoutFirst = false;
    this.layoutLast = false;
    this.layoutsCount = 0;
}
CLayoutsList.prototype.add = function(layoutLeft, layoutRight) {
    if (layoutLeft) {
        if (layoutLeft.next != layoutRight)
            return layoutLeft.next;
    } else {
        if (this.layoutFirst && (!layoutRight || layoutRight.prev))
            return this.layoutFirst;
    }

    var layout = {
        prev: layoutLeft || false,
        next: layoutRight || false,
        commands: {},
        id: this.layoutsCount
    };
    ++this.layoutsCount;

    if (layoutLeft)
        layoutLeft.next = layout;
    else
        this.layoutFirst = layout;

    if (layoutRight)
        layoutRight.prev = layout;
    else
        this.layoutLast = layout;

    return layout;
};
CLayoutsList.prototype.addBefore = function(layout) {
    return this.add(layout && layout.prev, layout);
};
CLayoutsList.prototype.addAfter = function(layout) {
    return this.add(layout, layout && layout.next);
};
CLayoutsList.prototype.countBetween = function(layoutLeft, layoutRight) {
    if (!this.layoutFirst) return 0;

    var result = 0;
    if (!layoutLeft) {
        ++result;
        layoutLeft = this.layoutFirst;

        if (layoutLeft == layoutRight)
            return result - 1;
        if (layoutLeft.next == layoutRight)
            return result;
    }
    if (!layoutRight) {
        ++result;
        layoutRight = this.layoutLast;

        if (layoutLeft == layoutRight)
            return result - 1;
        if (layoutRight.prev == layoutLeft)
            return result;
    }

    if (layoutLeft == layoutRight)
        return result;
    while (layoutLeft.next != layoutRight.next) {
        ++result;
        layoutLeft = layoutLeft.next;
    }
    return result;
};

/**
 * Parsing commands from data attribute
 *
 * @param domObject
 * @returns {Array}
 */
function parseDefinition(domObject) {
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
}

/**
 * Builds commands layouts for dom objects
 *
 * @param index
 * @param definitions
 * @param openCommands
 * @param commands
 * @param layoutsList
 * @returns {boolean}
 */
function processOperators(index, definitions, openCommands, commands, layoutsList) {
    var currentOpenCommands = [], currentClosedCommands = [], currentCommandsList = [],
        isBegin, isEnd, isSingle, commandDefinition, tmp, i, iLen,
        openCommandsIndex = 0, openCommandsLen = openCommands.length, sid,
        definitionsIndex = 0, definitionsLen = definitions.length,
        currentLayout = false, j, jLen, needMarker = false;

    for (i = 0; i < definitionsLen; ++i) {
        isSingle = !definitions[i].modifier;
        isBegin = definitions[i].modifier == 'begin';
        isEnd = definitions[i].modifier == 'end';

        if (isBegin || isSingle) { //we have new command
            sid = definitions[i].uid ? 'u' + definitions[i].uid : 's' + systemUid++;

            //todo: remove, for debug only!!!
            console.log(sid, definitions[i].commandString);

            /** check that user do not used the save identifier
             * in more than one command for children in same parent area
             */
            if (definitions[i].uid && commands[sid])
                throw 'Duplicate definition for "' + definitions[i].uid +
                    '" on statement "' + definitions[i].commandString + '"';

            //command definition for use in common commands list and in dom elements
            commandDefinition = {
                sid: sid,
                indexStart: index,
                indexEnd: false,
                depends: {}
            };
            commandDefinition.statement = app.register.get('statement', definitions[i].operator);
            commandDefinition.parameter = app.register.get('parameter',
                commandDefinition.statement.definition.parameters);
            commandDefinition.operand = commandDefinition.parameter.definition.parse(definitions[i].operand);
            definitions[i].command = commandDefinition;

            //addition command to global list
            commands[sid] = commandDefinition;

            /**if we have begin statement, save new open command in local array and copy in global array later,
             * to preventing it's closing in current dom object
              */
            if (isBegin) {
                currentOpenCommands.push(i);
            } else {
                //single flow operator, needs to add marker after, to identify place
                if (commandDefinition.statement.isChangeFlow)
                    needMarker = true;
            }
        } else { //command was begun previously
            sid = false;
            for (; openCommandsIndex < openCommandsLen; ++openCommandsIndex) { //find suitable opened (begin) statement for current command
                if (openCommands[openCommandsIndex].operator == definitions[i].operator &&
                    openCommands[openCommandsIndex].uid == definitions[i].uid) {
                    sid = openCommands[openCommandsIndex].sid;
                    break;
                }
                currentCommandsList.push(openCommands[openCommandsIndex].sid);
            }
            if (!sid)
                throw 'There is no begin statement for "' + definitions[i].commandString + '" or collision detected';

            if (openCommandsIndex > 0)
                currentLayout = commands[openCommands[openCommandsIndex - 1].sid].layout;

            commandDefinition = commands[sid];

            for (; definitionsIndex < i; ++definitionsIndex) {
                currentLayout = layoutsList.add(currentLayout, commandDefinition.layout);
                tmp = definitions[definitionsIndex].command;
                tmp.layout = currentLayout;
                currentLayout.commands[tmp.sid] = tmp;
                currentCommandsList.push(tmp.sid);
            }

            for (j = 0, jLen = currentOpenCommands.length; j < jLen; ++j) {
                tmp = definitions[currentOpenCommands[j]];
                openCommands.splice(openCommandsIndex, 0, {
                    sid: tmp.command.sid,
                    uid: tmp.uid,
                    operator: tmp.operator
                });
                currentOpenCommands = [];
                ++openCommandsIndex;
            }

            ++definitionsIndex;

            if (isEnd) {
                commandDefinition.indexEnd = index;

                //closed flow operator, needs to add marker after, to identify place
                if (commandDefinition.isChangeFlow)
                    needMarker = true;

                //command was closed, need to be removed from global list
                currentClosedCommands.push(openCommandsIndex);
            }

            currentCommandsList.push(sid);
            ++openCommandsIndex;
        }
    }

    for (; openCommandsIndex < openCommandsLen; ++openCommandsIndex) {
        currentCommandsList.push(openCommands[openCommandsIndex].sid);
    }

    if (openCommands.length)
        currentLayout = commands[openCommands[openCommands.length - 1].sid].layout;

    for (; definitionsIndex < definitionsLen; ++definitionsIndex) {
        currentLayout = layoutsList.add(currentLayout, false);
        tmp = definitions[definitionsIndex].command;
        tmp.layout = currentLayout;
        currentLayout.commands[tmp.sid] = tmp;
        currentCommandsList.push(tmp.sid);
    }

    for (i = 1, iLen = currentCommandsList.length; i < iLen; ++i) {
        for (j = i - 1; j >= 0; --j) {
            commands[currentCommandsList[j]].depends[currentCommandsList[i]] = true;
        }
    }

    for (j = currentClosedCommands.length - 1; j >= 0; --j) {
        openCommands.splice(currentClosedCommands[j], 1);
    }

    for (j = 0, jLen = currentOpenCommands.length; j < jLen; ++j) {
        tmp = definitions[currentOpenCommands[j]];
        openCommands.push({
            sid: tmp.command.sid,
            uid: tmp.uid,
            operator: tmp.operator
        });
    }

    return needMarker;
}

function checkOpenCommands(openCommands) {
    if (openCommands.length) {
        var statements = [];
        for (var i = 0, iLen = openCommands.length; i < iLen; ++i) {
            statements.push(openCommands[i].commandString);
        }
        throw 'Unclosed statement: "' + statements.join('", "') + '"';
    }
}

function parsePlate(listElement, newList) {
    systemUid = 1; //reset uid counter
    var openCommands = [], domElement, definitions, j, jLen,
        plate = {
            plateLevel: listElement.plateLevel,
            path: listElement.path,
            plates: [],
            layouts: new CLayoutsList(),
            commands: {}
        }, needMarker;

    for (j = 0, jLen = listElement.parent.childNodes.length; j < jLen; ++j) {
        domElement = listElement.parent.childNodes[j];

        definitions = parseDefinition(domElement);
        if (definitions.length || openCommands.length) {
            //need to define what to do with elements, that do not includes into commands, but can have plates
            newList.push({
                plateLevel: listElement.plateLevel + 1,
                path: [j],
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

        needMarker = processOperators(j, definitions, openCommands, plate.commands, plate.layouts);

        //can throws exception for document or documentElement nodes
        //todo: check that marker can be added
        //todo: check next node, to using as marker
        if (needMarker) {
            domElement.parentNode.insertBefore(new Text(), domElement.nextSibling);
        }
    }

    checkOpenCommands(openCommands);

    return plate;
}

function parse(domRoot) {
    if (!(domRoot instanceof HTMLElement))
        throw 'Unsupported DOM element type';
    if (app.common.object.hasInit(domRoot))
        throw 'Dom object can\'t be used more than once';

    var list, newList, i, iLen, plate,
        openCommands, commandsList, definitions, needMarker;

    openCommands = [];
    commandsList = {};

    var parsedRoot = {
        template: domRoot.cloneNode(true),
        plates: []
    };

    definitions = parseDefinition(parsedRoot.template);

    if (definitions.length) {
        needMarker = processOperators(definitions, openCommands, commandsList);

        //todo: remove elements, add to commands only start and end indexes (elements range)

        //can throws exception for document or documentElement nodes
        //todo: check that marker can be added
        //todo: move this logic to render section?
        if (needMarker)
            domRoot.parentNode.insertBefore(new Text(), domRoot.nextSibling);

        checkOpenCommands(openCommands);
    }

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

            if (!plate.layouts.layoutFirst)
                continue;

            plate.template = list[i].parent;

            list[i].plates.push(plate);
        }
        list = newList;
    }

    return parsedRoot;
}

module = parse;