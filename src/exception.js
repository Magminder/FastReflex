/**
 * Created by Alex Manko on 24.10.2015.
 */

module = {
    unsupportedBrowser: function() {
        throw 'You used an unsupported browser. Please, check browser supported list on https://github.com/Magminder/FastReflex';
    },
    doubleAppConnection: function() {
        throw 'Seems you connected library more then once';
    },
    busyAppNames: function() {
        throw 'FR is busy by another plugin';
    }
};