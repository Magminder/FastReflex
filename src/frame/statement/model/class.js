/**
 * Created by Alex Manko on 07.11.2015.
 */

FR.register.model('class', {
    changes: 'class',
    parameters: 'object',
    apply: function(domObject, parameters) {
        //skip text nodes and so on
        if (!(domObject instanceof HTMLElement))
            return;
        var classList = domObject.classList, newClassList = [], i, iLen;
        for (i = 0, iLen = classList.length; i < iLen; ++i) {
            //add if no such class in parameter or value is equals to true
            if (!parameters.value.hasOwnProperty(classList[i]) || parameters.value[classList[i]]) {
                newClassList.push(classList[i]);
            }
        }
        domObject.className = newClassList.join(' ');
    }
});