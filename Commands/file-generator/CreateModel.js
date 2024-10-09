import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";

export default class CreateModel {

    static async handleCommand(command) {
        const modelName = await this.makeNewModel(command)
        console.log(chalk.bgGreen.black(`\n  Making new Model : ${modelName} !  \n`));

        let fields = []

        let newField = ""

        while (true) {
            try {
                newField = await this.makeNewField()
                fields.push(newField)
            }
            catch (error) {
                break;
            }
        }

        console.log(fields)
    }


    static async makeNewModel(command) {
        try {
            if (command.length > 0) {
                if ((/--[a-zA-Z-]*/g).test(command[0])) {
                    return command[0].replace("--", "");
                }
                else {
                    throw new Error('Invalid Parameter')
                }
            }
            else {
                return await this.askModelName();            }
        }
        catch (error) {
            ConsoleLogs.showErrorMessage(error.message);
        }
    }


    static async askFieldName(){
        const answer = await inquirer.prompt({
            name: 'field_name',
            type: 'input',
            message: 'What is the field name? [return to stop]',
            default() {
                return "";
            },
        })

        if (answer.field_name === "") {
            throw new InvalidInputError();
        }

        return answer.field_name.toLowerCase();
    }

    static async makeNewField() {
        return {
            name: await this.askFieldName()
        }
    }


    static async askModelName() {
        const answer = await inquirer.prompt({
            name: 'model_name',
            type: 'input',
            message: 'What is the App name?',
            default() {
                return "";
            },
        })

        if (answer.model_name === "") {
            throw new InvalidInputError();
        }

        return answer.model_name.toLowerCase();
    }
}