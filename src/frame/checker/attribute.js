/**
 * Created by Alex Manko on 10.11.2015.
 */

FR.register.checker('attribute', {
    hash: function(domObject) {
        var attribute, result = '';
        for (var i = 0, len = domObject.attributes.length; i < len; ++i) {
            attribute = domObject.attributes[i];
            result += attribute.name + ':' + attribute.value + '#';
        }
        return result;
    },
    get: function(domObject) {
        var attribute, result = {};
        for (var i = 0, len = domObject.attributes.length; i < len; ++i) {
            attribute = domObject.attributes[i];
            result[attribute.name] = attribute.value;
        }
        return result;
    },
    set: function(domObject, value) {
        var attribute, i, len;
        for (i = 0, len = domObject.attributes.length; i < len; ++i) {
            attribute = domObject.attributes[i];
            if (!value.hasOwnProperty(attribute.name))
                domObject.removeAttribute(attribute.name);
        }

        for (i in value) {
            if (!value.hasOwnProperty(i)) continue;
            domObject.setAttribute(i, value[i]);
        }
    }
});