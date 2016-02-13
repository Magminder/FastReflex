/**
 * Created by Alex Manko on 24.10.2015.
 */

function CTransformation() {};
CTransformation.prototype.add = function() {

};
CTransformation.prototype.get = function(index) {

};


function initCommand(domParent, command) {
    switch (command.statement.type) {
        case 'flow':
            command.flow = [{}];
            command.synonyms = {};
            if (command.statement.definition.init)
                command.statement.definition.init(command);
            break;
        case 'model':
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
            break;
        default:
            throw 'Unsupported statement type';
    }
}

function applyCommand(domParent, command, access) {

}

function init(domParent, plate, access) {
    var i, layout;

    for (i in plate.commands) {
        if (!plate.commands.hasOwnProperty(i)) continue;

        initCommand(domParent, plate.commands[i]);
    }

    layout = plate.layouts.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            applyCommand(domParent, layout.commands[i], access);
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