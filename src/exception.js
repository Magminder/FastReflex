/**
 * Created by Alex Manko on 24.10.2015.
 */

module = {
    unsupportedBrowser: function() {
        throw new Exception('You used an unsupported browser. Please, check browser supported list on https://github.com/Magminder/FastReflex');
    },
    doubleAppConnection: function() {
        throw new Exception('Seems you connected library more then once');
    },
    busyAppNames: function() {
        throw new Exception('FR or FastReflex is busy by another plugin');
    }
};