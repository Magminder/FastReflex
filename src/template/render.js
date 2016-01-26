/**
 * Created by Alex Manko on 24.10.2015.
 */

var init = function(domElement, plate, root) {
    //todo: init statements, save dependencies
    app.common.object.init(domElement, {});
};

var link = function(domElement, object, key) {

};

var getElementByPath = function(domElement, path) {
    for (var i = 0, iLen = path.length; i < iLen; ++i) {
        domElement = domElement.childNodes[path[i]];
    }
    return domElement;
};

module = function(domRoot, object, key) {
    var root = object.hasOwnProperty(key) ? object[key] : null;
    var plates = domRoot.$FR.plates;

    //todo: init dom root statements

    for (var i = 0, iLen = plates.length; i < iLen; ++i) {
        init(getElementByPath(domRoot, plates[i].path), plates[i], root);
    }
};