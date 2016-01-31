/**
 * Created by Alex Manko on 24.10.2015.
 */

var init = function(plateDomParent, plate, root) {
    var i, iLen, child;

    //convert indexes to nodes
    for (i = 0, iLen = plate.children.length; i < iLen; ++i) {
        child = plate.children[i];
        child.node = plateDomParent[child.index];
        if (child.needMarker)
            child.markerNode = plateDomParent[child.markerIndex];
    }

    //todo: init statements, save dependencies
    //app.common.object.init(domElement, {});
};

var link = function(domElement, object, key) {

};

var getElementByPath = function(domElement, path) {
    for (var i = 0, iLen = path.length; i < iLen; ++i) {
        domElement = domElement.childNodes[path[i]];
    }
    return domElement;
};

module = function(domRoot, parsedRoot, object, key) {
    var root = object.hasOwnProperty(key) ? object[key] : null;
    var plates = parsedRoot.plates;

    //todo: init dom root statements

    //todo: add layout logic, with flow operation and range transformations
    //todo: every flow can add transformation. need to implement function that will perform
    //todo: translation from init indexes to actual values

    for (var i = 0, iLen = plates.length; i < iLen; ++i) {
        init(getElementByPath(domRoot, plates[i].path), plates[i], root);
    }
};