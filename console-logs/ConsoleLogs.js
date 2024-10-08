import chalk from "chalk";

const space = "    ".repeat(3)
export default class ConsoleLogs {

    /**
     * Display a stylized success message
     * @param msg the message to display
     */
    static showSuccessMessage(msg) {
        console.log(chalk.bgGreen.hex('#EEEEEE')(this.generateMessage(msg)));
    }

    /**
     * Display a stylized error message and adds 'Error: ' before it
     * @param msg the message to display
     */
    static showErrorMessage(msg) {
        msg = `Error: ${msg}`
        console.log(chalk.bgRed.hex('#EEEEEE')(this.generateMessage(msg)));
    }

    static generateMessage(msg){
        return (
            "\n" +
            (space + " ".repeat(msg.length) + space) + "\n" +
            (space + (msg) + space) + "\n" +
            (space + " ".repeat(msg.length) + space) + "\n"
        );
    }

    static showSuccessMessages(msgs) {
        console.log(chalk.bgGreen.hex('#EEEEEE')(this.generateMultpipleLinemsg(msgs)));
    }

    static showErrorMessages(msgs) {
        console.log(chalk.bgRed.hex('#EEEEEE')(this.generateMultpipleLinemsg(msgs)));
    }

    static generateMultpipleLinemsg(msgs) {
        let newMsg = ""
        let maxLength = 0
        msgs.forEach((msg) => {
            maxLength = maxLength<msg.length? msg.length : maxLength
        })

        if (maxLength%2 !== 0) {
            maxLength++;
        }

        msgs.forEach((msg) => {
            let currentMsg = ""
            let lackingSpace = (maxLength - msg.length)
            if (lackingSpace%2 !== 0) {
                currentMsg = space + (" ".repeat(Math.floor(lackingSpace/2)+1)) + msg + (" ".repeat(Math.floor(lackingSpace/2))) + space + "\n"
            }
            else {
                currentMsg = space + (" ".repeat(lackingSpace/2)) + msg + (" ".repeat(lackingSpace/2)) + space + "\n"
            }
            newMsg += currentMsg
        })

        return (
            (space + " ".repeat(maxLength) + space) + "\n" +
            (newMsg) +
            (space + " ".repeat(maxLength) + space) + "\n"
        )
    }
}