export default class InvalidInputError extends Error {

    constructor() {
        super("The input value is invalid");
    }

    toString() {
        return super.toString();
    }
}