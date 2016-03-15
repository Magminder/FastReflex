/**
 * Created by Alex Manko on 02.01.2016.
 */

function setValue(domObject, value) {
    if (domObject instanceof HTMLSelectElement) {
        if (domObject.multiple && value instanceof Array) {
            var map = {}, i, iLen;
            for (i = 0, iLen = value.length; i < iLen; ++i) {
                map[value[i].toString()] = true;
            }
            for (i = 0, iLen = domObject.options.length; i < iLen; ++i) {
                domObject.options[i].selected = map[domObject.options[i].value];
            }
        } else {
            domObject.value = value.toString();
        }
    } else {
        value = value == undefined ? undefined : value.toString();

        if (domObject instanceof HTMLInputElement) {
            switch (domObject.type) {
                case 'checkbox':
                    //todo: set value
                    break;
                case 'radio':
                    //todo: set value
                    break;
                case 'file':
                    //todo: need to define what to do
                    break;
                default:
                    domObject.value = value;
            }
        } else if (domObject instanceof HTMLTextAreaElement) {
            domObject.value = value;
        } else if (domObject instanceof HTMLElement) {
            domObject.textContent = value;
        }
    }
};

function getValue(domObject) {
    if (domObject instanceof HTMLSelectElement) {
        if (domObject.multiple) {
            var result = [], i, iLen;
            for (i = 0, iLen = domObject.selectedOptions.length; i < iLen; ++i) {
                result.push(domObject.selectedOptions[i].value);
            }
            return result;
        } else {
            return domObject.value;
        }
    } else if (domObject instanceof HTMLInputElement) {
        switch (domObject.type) {
            case 'checkbox':
                //todo: get value
                break;
            case 'radio':
                //todo: get value
                break;
            case 'file':
                //todo: need to define what to do
                break;
            default:
                return domObject.value;
        }
    } else if (domObject instanceof HTMLTextAreaElement) {
        return domObject.value;
    } else if (domObject instanceof HTMLElement) {
        return domObject.textContent;
    }
};

module = {
    setValue: setValue,
    getValue: getValue
};