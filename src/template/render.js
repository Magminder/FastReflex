/**
 * Created by Alex Manko on 24.10.2015.
 */

function CTransformation(access) {
    this.access = access;
    this.clear();
}
CTransformation.prototype.add = function(indexStart, indexEnd, command) {
    var localList = [], i, j, jLen;
    for (i = indexStart; i <= indexEnd; ++i) {
        if (this.map.hasOwnProperty(i)) {
            for (j = 0, jLen = this.map[i].length; j < jLen; ++j) {
                localList[this.map[i][j]] = i;
            }
        } else {
            localList[i] = i;
        }
    }

    var parameters = command.parameter.definition.render(command.operand, this.access),
        localListKeys = Object.keys(localList);
    /**
     * response from flow:
     * [1, 2, 3] => [3, 2, 1]
     * or
     * [1, 2, 3] => [[1, 2, 3], [3, 2, 1], [1, 2, 3]]
     *
     * response from flow with synonyms:
     * [1, 2, 3] => [
     *  {index: 3, synonyms: {test: root.test.1, big: root.big}}
     *  {index: 2, synonyms: {test: root.test.2, small: root.small}}
     * ] (mb without some element, 3rh in that case)
     * or
     * the same as above, but in nested arrays
     *
     * information saved as:
     * this.map: [
     *  5: [7, 9, 11],
     *  6: [8, 10, 12],
     *  7: [21, 25]
     * ]
     *
     * this.list: [
     *  7: {index: 5, synonyms: {test: root.test.1, big: root.big}},
     *  8: {index: 6, synonyms: {test: root.test.2, small: root.small}}
     * ]
     */

};
CTransformation.prototype.get = function(index) {

};
CTransformation.prototype.clear = function() {
    this.map = {};
    this.list = [];
};

function initFlowStatement(domParent, command) {
    command.flow = [{}];
    command.synonyms = {};
    if (command.statement.definition.init)
        command.statement.definition.init(command);
}

function initModelStatement(domParent, command) {
    var checkers = command.statement.definition.changes instanceof Array
        ? command.statement.definition.changes
        : [command.statement.definition.changes], i, iLen, checker, checkerName;
    command.checkers = {};
    for (i = 0, iLen = checkers.length; i < iLen; ++i) {
        checker = app.register.get('checker', checkers[i]);
        command.checkers[checker.name] = checker;
    }
    command.values = {};
    for (i = command.indexStart, iLen = command.indexEnd || command.indexStart; i <= iLen; ++i) {
        command.values[i] = {};

        for (checkerName in command.checkers) {
            if (!command.checkers.hasOwnProperty(checkerName)) continue;

            command.values[i][checkerName] =
                command.checkers[checkerName].definition.hash(domParent.childNodes[i]);
        }
    }
}

function initCommand(domParent, command) {
    switch (command.statement.type) {
        case 'flow':
            initFlowStatement(domParent, command);
            break;
        case 'model':
            initModelStatement(domParent, command);
            break;
        default:
            throw 'Unsupported statement type';
    }
}

function applyFlowStatement(domParent, command, access) {

}

function applyModelStatement(domParent, command, access) {

}

function init(domParent, plate, access) {
    var i, layout;

    plate.transformation = new CTransformation(access);

    for (i in plate.commands) {
        if (!plate.commands.hasOwnProperty(i)) continue;

        initCommand(domParent, plate.commands[i]);
    }

    layout = plate.layoutsFlow.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            applyFlowStatement(domParent, layout.commands[i], plate.transformation);
        }

        layout = layout.next;
    }

    layout = plate.layoutsModel.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            applyModelStatement(domParent, layout.commands[i], plate.transformation, access);
        }

        layout = layout.next;
    }
}

function getElementByPath(domElement, path) {
    for (var i = 0, iLen = path.length; i < iLen; ++i) {
        domElement = domElement.childNodes[path[i]];
    }
    return domElement;
}

function getValue(object, key, path) {
    if (!object.hasOwnProperty(key))
        return undefined;

    if (!path) {
        return object[key];
    }

    return app.common.object.getValueFromPath(object[key], path);
}

function setValue(object, key, path, value) {
    if (!path) {
        object[key] = value;
        return;
    }

    if (!object.hasOwnProperty(key))
        object[key] = {};
    app.common.object.setValueForPath(object[key], path, value);
}

module = function(domRoot, parsedRoot, object, key) {
    var plates = parsedRoot.plates;
    var access = {
        get: function(path) {
            return getValue(object, key, path);
        },
        set: function(path, value) {
            setValue(object, key, path, value);
        }
    };

    //todo: init dom root statements

    //todo: add layout logic, with flow operation and range transformations
    //todo: every flow can add transformation. need to implement function that will perform
    //todo: translation from init indexes to actual values

    for (var i = 0, iLen = plates.length; i < iLen; ++i) {
        init(getElementByPath(domRoot, plates[i].path), plates[i], access);
    }
};