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

    var parameters = command.parameter.definition.render(command, this.access),
        localListKeys = Object.keys(localList),
        lastSequenceIndex =
            localListKeys[localListKeys.length - 1] =
                Number(localListKeys[localListKeys.length - 1]);
    for (i = localListKeys.length - 2; i >= 0; --i) {
        localListKeys[i] = Number(localListKeys[i]);
        if (localListKeys[i] != localListKeys[i + 1] - 1) {
            this._apply(localListKeys[i + 1], lastSequenceIndex, parameters, command);
            lastSequenceIndex = localListKeys[i];
        }
    }
    this._apply(localListKeys[0], lastSequenceIndex, parameters, command);

    this._remap();
};
CTransformation.prototype._extend = function(index, sid, synonyms) {
    var newSynonyms = {}, listElement = this.list[index],
        existsSid, existCommandSynonyms, i,
        newCommandSynonyms;
    for (existsSid in listElement.synonyms) {
        if (!listElement.synonyms.hasOwnProperty(existsSid))
            continue;

        newCommandSynonyms = {};
        existCommandSynonyms = listElement.synonyms[existsSid];
        for (i in existCommandSynonyms) {
            if (!existCommandSynonyms.hasOwnProperty(i))
                continue;

            newCommandSynonyms[i] = existCommandSynonyms[i];
        }

        newSynonyms[existsSid] = newCommandSynonyms;
    }

    if (sid) {
        newCommandSynonyms = {};

        for (i in synonyms) {
            if (!synonyms.hasOwnProperty(i))
                continue;

            newCommandSynonyms[i] = synonyms[i];
        }

        newSynonyms[sid] = newCommandSynonyms;
    }

    return {
        index: this.list[index].index,
        synonyms: newSynonyms
    };
};
CTransformation.prototype._apply = function(indexStart, indexEnd, parameters, command) {
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
    transformation = command.statement.definition.apply(parameters, command.operand, sequence);
    for (i = 0, iLen = transformation.length; i < iLen; ++i) {
        if (transformation[i] instanceof Array) {
            for (j = 0, jLen = transformation[i].length; j < jLen; ++j) {
                if (transformation[i][j] instanceof Object) {
                    if (transformation[i][j].index instanceof Array) {
                        for (q = 0, qLen = transformation[i][j].index.length; q < qLen; ++q) {
                            newListSequence.push(this._extend(transformation[i][j].index[q],
                                command.sid,
                                transformation[i][j].synonyms));
                        }
                    } else {
                        newListSequence.push(this._extend(transformation[i][j].index,
                            command.sid,
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
                            command.sid,
                            transformation[i].synonyms));
                    }
                } else {
                    newListSequence.push(this._extend(transformation[i].index,
                        command.sid,
                        transformation[i].synonyms));
                }
            } else {
                newListSequence.push(this._extend(transformation[i], false, {}));
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
    this.hashMap = {};
    var hashObject;

    for (var i = 0; i < this.length; ++i) {
        this.map[i] = [i];
        this.list[i] = {index: i, synonyms: {}, hash: i + '|'};
        
        hashObject = {};
        hashObject[i] = true;
        this.hashMap[i + '|'] = hashObject;
    }
};

CTransformation.prototype._updateHash = function() {
    var i, iLen, sid, j, synonyms, listItem;

    this.hashMap = {};
    for (i = 0, iLen = this.list.length; i < iLen; ++i) {
        listItem = this.list[i];
        listItem.hash = listItem.index + '|';
        for (sid in listItem.synonyms) {
            if (!listItem.synonyms.hasOwnProperty(sid))
                continue;

            listItem.hash += sid + '=';
            synonyms = listItem.synonyms[sid];
            for (j in synonyms) {
                if (!synonyms.hasOwnProperty(j))
                    continue;

                listItem.hash += j + ':' + synonyms[j] + '~';
            }
        }
        if (!this.hashMap.hasOwnProperty(listItem.hash))
            this.hashMap[listItem.hash] = {};
        this.hashMap[listItem.hash][i] = true;
    }
};

CTransformation.prototype.applyChanges = function(domParent, template, oldTransformation) {
    this._updateHash();

    var i, iLen, j, jLen, listItem, hashIndex, hashValue, oldMap, newElement, added = [], changed = [], removed = [];
    for (i = 0, iLen = oldTransformation.list.length; i < iLen; ++i) {
        oldTransformation.list[i].domElement = domParent.childNodes[i];
    }

    listLoop:
    for (i = 0, iLen = this.list.length; i < iLen; ++i) {
        listItem = this.list[i];
        if (oldTransformation.hashMap[listItem.hash] && oldTransformation.hashMap[listItem.hash].hasOwnProperty(i)) {
            //dom element in needed place
            delete oldTransformation.hashMap[listItem.hash][i];
            continue;
        }

        for (hashIndex in oldTransformation.hashMap[listItem.hash]) {
            if (!oldTransformation.hashMap[listItem.hash].hasOwnProperty(hashIndex))
                continue;
            if (!this.hashMap[listItem.hash].hasOwnProperty(hashIndex)) {
                //dom element (copy of current) not used in same place in new list, it can be moved
                delete oldTransformation.hashMap[listItem.hash][hashIndex];
                domParent.insertBefore(oldTransformation.list[hashIndex].domElement, domParent.childNodes[i]);
                continue listLoop;
            }
        }

        //find element with the same structure, but not needed in new list. We need to update it then
        oldMap = oldTransformation.map[listItem.index];
        for (j = 0, jLen = oldMap.length; j < jLen; ++j) {
            hashIndex = oldMap[j];
            hashValue = oldTransformation.list[hashIndex].hash;
            //we already used that element
            if (!oldTransformation.hashMap[hashValue].hasOwnProperty(hashIndex))
                continue;
            if (!this.hashMap[oldTransformation.list[hashIndex].hash]) {
                //use element only if that hash fully not uses, do not risky
                delete oldTransformation.hashMap[oldTransformation.list[hashIndex].hash][hashIndex];
                if (!i || domParent.childNodes[i - 1] != oldTransformation.list[hashIndex].domElement)
                    domParent.insertBefore(oldTransformation.list[hashIndex].domElement, domParent.childNodes[i]);
                changed.push(i);
                continue listLoop;
            }
        }

        //need to add new element from template
        newElement = template.childNodes[listItem.index].cloneNode(true);
        domParent.insertBefore(newElement, domParent.childNodes[i]);
        added.push(i);
    }

    for (i in oldTransformation.hashMap) {
        if (!oldTransformation.hashMap.hasOwnProperty(i))
            continue;
        for (hashIndex in oldTransformation.hashMap[i]) {
            if (!oldTransformation.hashMap[i].hasOwnProperty(hashIndex))
                continue;
            domParent.removeChild(oldTransformation.list[hashIndex].domElement);
            removed.push(oldTransformation.list[hashIndex]);
        }
    }

    return {
        added: added,
        changed: changed,
        removed: removed
    };
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

function init(domParent, plate, access) {
    var i, layout, command, commandIndex, commandLastIndex, map, j, jLen, model;

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

    var oldTransformation = new CTransformation(access, domParent.childNodes.length);
    plate.transformation.applyChanges(domParent, plate.template, oldTransformation);

    layout = plate.layoutsModel.layoutFirst;
    while (layout) {
        for (i in layout.commands) {
            if (!layout.commands.hasOwnProperty(i)) continue;

            command = layout.commands[i];
            model = command.statement.definition;

            commandLastIndex = command.indexEnd ? command.indexEnd : command.indexStart;
            for (commandIndex = command.indexStart; commandIndex <= commandLastIndex; ++commandIndex) {
                map = plate.transformation.get(commandIndex);

                for (j = 0, jLen = map.length; j < jLen; ++j) {
                    model.apply(domParent.childNodes[map[j]], 'some value');
                }
            }
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

//todo: !!! cache this value on transformation level !!!
function getRealPath(command, path) {

}

function getValue(command, object, key, path) {
    if (!object.hasOwnProperty(key))
        return undefined;

    if (!path) {
        return object[key];
    }

    return app.common.object.getValueFromPath(object[key], path);
}

function setValue(command, object, key, path, value) {
    if (!path) {
        object[key] = value;
        return;
    }

    if (!object.hasOwnProperty(key))
        object[key] = {};
    app.common.object.setValueForPath(object[key], path, value);
}

module = function(domRoot, parsedRoot, object, key) {
    var platesList = [],
        access = {
            get: function(command, path) {
                return getValue(command, object, key, path);
            },
            set: function(command, path, value) {
                setValue(command, object, key, path, value);
            }
        }, platesObject, plateIndex, i, iLen, j, jLen, map, plate, plateRoot;

    //todo: init dom root statements

    //todo: add layout logic, with flow operation and range transformations
    //todo: every flow can add transformation. need to implement function that will perform
    //todo: translation from init indexes to actual values

    for (plateIndex in parsedRoot.plates) {
        if (!parsedRoot.plates.hasOwnProperty(plateIndex))
            continue;

        platesList.push({
            domElement: plateIndex < 0 ? domRoot : domRoot.childNodes[plateIndex],
            plates: parsedRoot.plates[plateIndex]
        })
    }

    while (platesObject = platesList.shift()) {
        for (i = 0, iLen = platesObject.plates.length; i < iLen; ++i) {
            plate = platesObject.plates[i];
            plateRoot = getElementByPath(platesObject.domElement, plate.path);
            init(plateRoot, plate, access);

            for (plateIndex in plate.plates) {
                if (!plate.plates.hasOwnProperty(plateIndex))
                    continue;

                map = plate.transformation.get(plateIndex);
                for (j = 0, jLen = map.length; j < jLen; ++j) {
                    platesList.push({
                        domElement: plateRoot.childNodes[map[j]],
                        plates: plate.plates[plateIndex]
                    });
                }
            }
        }
    }
};