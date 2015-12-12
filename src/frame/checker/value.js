/**
 * Created by Alex Manko on 28.11.2015.
 */

//todo: implement value checker
FR.register.checker('value', {
    hash: function(domObject) {
        return '';
    },
    get: function(domObject) {
        return '';
    },
    set: function(domObject, value) {
        //set value
        value = value.toString();

        if (domObject instanceof HTMLSelectElement) {
        } else if (domObject instanceof HTMLInputElement) {
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
                    //todo: set value
            }
        } else if (domObject instanceof HTMLTextAreaElement) {
            //todo: set value
        } else if (domObject instanceof HTMLElement) {
            //todo: set text
        }
    }
});