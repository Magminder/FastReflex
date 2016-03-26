/**
 * Created by Alex Manko on 21.03.16.
 */

function CPathSaver() {
    this.commands = {};
    this.paths = {};
}
CPathSaver.prototype.watch = function(path, command, transformation) {
    var info = {
        path: path,
        command: command,
        transformation: transformation
        }, uid = transformation.id + '-' + command.sid;

    if (!this.paths[path])
        this.paths[path] = {};
    if (!this.commands[uid])
        this.commands[uid] = {};

    this.paths[path][uid] = info;
    this.commands[uid][path] = info;
};
CPathSaver.prototype.unwatch = function(path, command, transformation) {
    var uid = transformation.id + '-' + command.sid;
    if (this.paths[path]) {
        delete this.paths[path][uid];
    }
    if (this.commands[uid]) {
        delete this.commands[uid][path];
    }
};

function reactor(parsedObject, object, key, path, type, valueNew, valueOld) {
    console.log(path, type, valueNew, valueOld);
}

function getWatcher(parsedObject, object, key) {
    return function(path, type, valueNew, valueOld) {
        reactor(parsedObject, object, key, path, type, valueNew, valueOld);
    };
}

module = getWatcher;