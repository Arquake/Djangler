export default class FileAlreadyExistError extends Error {

    constructor() {
        super("The filename is already used");
    }

    toString() {
        return super.toString();
    }
}