/**
 * Created by Alex Manko on 24.10.2015.
 */

var renderQueue = [];
var processRenderQueue = function() {
    if (!renderQueue.length) return;

    var queueElement, domElement, value,
        rootValue = renderQueue[0].object[renderQueue[0].key];
    while (renderQueue.length) {
        queueElement = renderQueue.unshift();
        domElement = queueElement.domElement;
        value = queueElement.object[queueElement.key];

        //todo: execute statements
    }
};

module = {
    renderRootElement: function(domElement, object, key) {
        this.addToRenderQueue(domElement, object, key);
        processRenderQueue();
    },
    addToRenderQueue: function(domElement, object, key) {
        renderQueue.push({
            domElement: domElement,
            object: object,
            key: key
        });
    }
};