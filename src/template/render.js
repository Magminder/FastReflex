/**
 * Created by Alex Manko on 24.10.2015.
 */

function CTransformation(access, length) {
    this.access = access;
    this.length = length;
    this.clear();
}

CTransformation.prototype.add = function(command) {
    var localList = [], i, iEnd, j, jLen;
    for (i = command.indexStart, iEnd = command.indexEnd ? command.indexEnd : command.indexStart; i <= iEnd; ++i) {
        for (j = 0, jLen = this.map[i].length; j < jLen; ++j) {
            localList[this.map[i][j]] = true;
        }
    }

    var parameters = command.parameter.definition.render(command.operand, this.access),
        localListKeys = Object.keys(localList),
        lastSequenceIndex = localListKeys[localListKeys.length - 1];
    for (i = localListKeys.length - 2; i >= 0; --i) {
        if (localListKeys[i] != localListKeys[i + 1] - 1) {
            this._apply(i + 1, lastSequenceIndex, parameters, command.operand, command.statement.definition.apply);
            lastSequenceIndex = localListKeys[i];
        }
    }
    this._apply(0, lastSequenceIndex, parameters, command.operand, command.statement.definition.apply);

    this._remap();
};
CTransformation.prototype._extend = function(index, synonyms) {
    var newSynonyms = {}, listElement = this.list[index], i;
    for (i in listElement.synonyms) {
        if (!listElement.synonyms.hasOwnProperty(i))
            continue;

        newSynonyms[i] = listElement.synonyms[i];
    }
    for (i in synonyms) {
        if (!synonyms.hasOwnProperty(i))
            continue;
        newSynonyms[i] = synonyms[i];
    }
    return {
        index: this.list[index].index,
        synonyms: newSynonyms
    };
};
CTransformation.prototype._apply = function(indexStart, indexEnd, parameters, operand, apply) {
    var sequence = [], newListSequence = [indexStart, indexEnd - indexStart + 1],
        i, iLen, j, jLen, q, qLen, transformation;
    for (i = indexStart; i <= indexEnd; ++i) {
        sequence.push(i);
    }
    /**
     * response from flow:
     * [1, 2, 3] => [3, 2, 1]
     * or
     * [1, 2, 3] => [[1, 2, 3], [3, 2, 1], [1, 2, 3]]
     *
     * response from flow with synonyms:
     * [1, 2, 3] => [
     *  {index: 3, synonyms: {test: root.test.1, big: root.big}},
     *  {index: 2, synonyms: {test: root.test.2, small: root.small}}
     * ] (mb without some element, 3rh in that case)
     * or
     * [1, 2, 3] => [
     *  {index: [1, 2, 3], synonyms: {test: root.test.1, big: root.big}},
     *  {index: [3, 2, 1], synonyms: {test: root.test.2, small: root.small}}
     * ]
     */
    transformation = apply(parameters, operand, sequence);
    for (i = 0, iLen = transformation.length; i < iLen; ++i) {
        if (transformation[i] instanceof Array) {
            for (j = 0, jLen = transformation[i].length; j < jLen; ++j) {
                if (transformation[i][j] instanceof Object) {
                    if (transformation[i][j].index instanceof Array) {
                        for (q = 0, qLen = transformation[i][j].index.length; q < qLen; ++q) {
                            newListSequence.push(this._extend(transformation[i][j].index[q],
                                transformation[i][j].synonyms));
                        }
                    } else {
                        newListSequence.push(this._extend(transformation[i][j].index,
                            transformation[i][j].synonyms));
                    }
                } else {
                    newListSequence.push(transformation[i][j], {});
                }
            }
        } else {
            if (transformation[i] instanceof Object) {
                if (transformation[i].index instanceof Array) {
                    for (q = 0, qLen = transformation[i].index.length; q < qLen; ++q) {
                        newListSequence.push(this._extend(transformation[i].index[q],
                            transformation[i].synonyms));
                    }
                } else {
                    newListSequence.push(this._extend(transformation[i].index,
                        transformation[i].synonyms));
                }
            } else {
                newListSequence.push(this._extend(transformation[i], {}));
            }
        }
    }
    Array.prototype.splice.apply(this.list, newListSequence);
};

CTransformation.prototype._remap = function() {
    this.map = [];

    var i, iLen;

    for (i = 0; i < this.length; ++i) {
        this.map[i] = [];
    }
    for (i = 0, iLen = this.list.length; i < iLen; ++i) {
        this.map[this.list[i].index].push(i);
    }
};

CTransformation.prototype.get = function(index) {
    return this.map[index];
};

CTransformation.prototype.clear = function() {
   /**
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
    this.map = [];
    this.list = [];

    for (var i = 0; i < this.length; ++i) {
        this.map[i] = [i];
        this.list[i] = {index: i, synonyms: {}};
    }
};

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

function applyModelStatement(domParent, command, access) {

}

function init(domParent, plate, access) {
    var i, layout, command;

    plate.transformation = new CTransformation(access, domParent.childNodes.length);

    layout = plate.layoutsModel.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            initModelStatement(domParent, layout.commands[i]);
        }

        layout = layout.next;
    }

    layout = plate.layoutsFlow.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            command = layout.commands[i];

            plate.transformation.add(command);
        }

        layout = layout.next;
    }

    //todo: implement diff between old and new transformation
    //var oldTransformation = new CTransformation(access, domParent.childNodes.length);
    //var newItems = plate.transformation.apply(oldTransformation, domParent);

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