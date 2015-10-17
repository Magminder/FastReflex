/**
 * Created by Alex Manko on 17.10.2015.
 */

"use strict";

var checker = function() {

};

//set not enumerable value to object
var setValue = function(object, key, value) {
    Object.defineProperty(object, key, {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    });
};

//this - object. get value for comparison with ___oldValue
var getValue = function(key) {
    var key = this.hasOwnProperty('___' + key) ? '___' + key : key;
    if (typeof(this[key]) == 'object') {
        return Object.keys(this[key]);
    } else {
        return this[key];
    }
};

//this - object
var setInputValue = function(key, htmlElement, value) {
    htmlElement.value = value;
};

var insertAt = function(parent, node, index) {
    if (parent.childNodex.length <= index) {
        parent.appendChild(node);
    } else {
        parent.insertBefore(node, parent.childNodes[index]);
    }
};

//this - object
var setContainerValue = function(key, htmlElement, value) {
    if (typeof(value) != 'object') {
        htmlElement.textContent = value;
        return;
    }

    //todo: make struct
    var eli = 0, ellen = htmlElement.childNodes.length;

    for (var tpi = 0, tplen = htmlElement.__templateNodes.length; tpi < tplen; ++tpi) {

    }

    while (tpi < tplen) {
        var existsNode = eli < ellen ? htmlElement.childNodes[eli] : false;


        //insertAt
    }

    /*for (var i = 0, len = htmlElement.___templateNodes.length; i < len; ++i) {
     var child = htmoElement.___templateNodes[i].cloneNode();
     child.parent = htmlElement;
     }*/
};

//this - object
var onBindValueUpdate = function(key) {
    if (!this.___elements || !this.___elements[key] || !this.___elements[key].length) return;
    var value = getValue.call(this, key);
    var valueComparison = JSON.stringify(value);
    for (var i = 0; i < this.___elements[key].length; ++i) {
        var element = this.___elements[key][i];
        if (element.___oldValueComparison != valueComparison) {
            switch (element.tagName) {
                case 'INPUT':
                    setInputValue.call(this, key, element, value);
                    break;
                case 'SELECT':

                    break;
                default:
                    setContainerValue.call(this, key, element, value);
                    break;
            }
            element.___oldValue = value;
            element.___oldValueComparison = valueComparison;
        }
    }
};

//this - htmlElement
var onInputValueUpdate = function() {
    if (this.___oldValue != this.value) {
        this.___oldValue = this.value;
        this.___object[this.___key] = this.value;
        //todo: call watchers
        console.log('change to', this.value);
    }
};

var setTemplate = function() {
    setValue(this, '___templateNodes', []);
    while (this.childNodes.length) {
        var child = this.childNodes[0];
        this.___templateNodes.push(child.cloneNode());
        child.remove();
    }
};

//this - htmlElement
var linkHtmlElementWithObject = function(object, key) {
    setValue(this, '___oldValue', getValue.call(object, key));
    setValue(this, '___oldValueComparison', JSON.stringify(this.___oldValue));
    setValue(this, '___object', object);
    setValue(this, '___key', key);
    setTemplate.call(this);
    if (!object.hasOwnProperty('___elements')) {
        setValue(object, '___elements', []);
    }
    if (!object.___elements[key]) {
        object.___elements[key] = [];
    }
    object.___elements[key].push(this);
};

//this - htmlElement
var linkInputWithObject = function(object, key) {
    linkHtmlElementWithObject.call(this, object, key);
    setValue(this, '___onchange', onInputValueUpdate);
    setSetter(object, key);
    setInputValue.call(object, key, this, this.___oldValue);
};

//this - htmlElement
var linkContainerWithObject = function(object, key) {
    linkHtmlElementWithObject.call(this, object, key);
    setSetter(object, key);
    setContainerValue.call(object, key, this, this.___oldValue);
};

var setSetter = function(object, key) {
    var newKey = '___' + key;

    setValue(object, newKey, object[key]);
    delete object[key];

    var timeout;

    Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        get: function() {
            var value = object[newKey];
            if (typeof(value) == 'object') {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    onBindValueUpdate.call(object, key);
                }, 0);
            }
            console.log('get', value);
            return object[newKey];
        },
        set: function(value) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                onBindValueUpdate.call(object, key);
            }, 0);
            console.log('set', value);
            object[newKey] = value;
        }
    });
};

var bind = function(htmlElement, object, key, onlyModels) {
    switch (htmlElement.tagName) {
        case 'INPUT':
            linkInputWithObject.call(htmlElement, object, key);
            break;
        case 'SELECT':
            break;
        default:
            linkContainerWithObject.call(htmlElement, object, key);
            break;
    }
};

$(function() {
    console.log('start');

    var registerChange = function() {
        if (!this.___onchange) return;
        var _this = this;
        setTimeout(function() {
            _this.___onchange();
        }, 0);
    };

    //todo: process radio and checkboxes separately
    var inputSelector = 'input, textarea, select';
    $(document)
        .on('keydown', inputSelector, registerChange)
        .on('change', inputSelector, registerChange)
        .on('paste', inputSelector, registerChange)
        .on('cut', inputSelector, registerChange);

    /*var scope = {
     key: 555
     };
     window.scope = scope;

     var element = $('#npt').get(0);
     bind(element, scope, 'key');
     var element2 = $('#npt2').get(0);
     bind(element2, scope, 'key');
     var element3 = $('#npt3').get(0);
     bind(element3, scope, 'key');*/

    var scope2 = {
        view: {
            value: 2,
            value2: 'test'
        }
    };
    window.scope2 = scope2;

    var container = $('#assign-block').get(0);
    bind(container, scope2, 'view');
});