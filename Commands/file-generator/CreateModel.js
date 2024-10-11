import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";

export default class CreateModel {

    static async handleCommand(command) {
        try {
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
        catch (error) {

        }
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
                return await this.askModelName();
            }
        }
        catch (error) {
            ConsoleLogs.showErrorMessage("Invalid name or no name given");
            throw Error("Invalid model name")
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

    static async askFieldsType(){
        const answer = await inquirer.prompt({
            name: 'field_type',
            type: 'input',
            message: 'What is the field type? [string]',
            default() {
                return "string"
            },
        })

        switch (answer.field_type) {
            case "text":
            case "string":
            case "int":
            case "posint":
            case "float":
            case "decimal":
            case "boolean":
            case "date":
            case "time":
            case "file":
            case "image":
            case "manyToOne":
            case "oneToOne":
            case "manyToMany":
            case "email":
            case "url":
            case "uuid":
            case "slug":
            case "ipAddress":
            case "ipAddressGeneric":
            case "json":
                return answer.field_type.toLowerCase();
            case "help":
                console.log(chalk.green(
                    "Available types : \n" +
                    "string" + "\t\t" + "text" + "\n\n" +
                    "int" + "\t\t" + "posint" + "\t\t" + "float" + "\t\t" + "decimal" + "\n\n" +
                    "boolean" + "\n\n" +
                    "date" + "\t\t" + "time" + "\n\n" +
                    "file" + "\t\t" + "image" + "\n\n" +
                    "manyToOne" + "\t" + "oneToOne" + "\t" + "manyToMany" + "\n\n" +
                    "email" + "\t\t" + "url" + "\n\n" +
                    "uuid" + "\t\t" + "slug" + "\n\n" +
                    "ipAddress" + "\t" + "ipAddressGeneric" + "\n\n" +
                    "json" + "\n"
                ))
                return this.askFieldsType();
            default:
                console.log(chalk.red("Invalid field type please retry"))
                return this.askFieldsType();
        }
    }

    static async makeNewField() {
        let name = await this.askFieldName();
        let type = await this.askFieldsType();
        let parameters = ""
        switch (type) {
            case "string":
            case "text":
            case "slug":
            case "email":
            case "url":
                parameters = ""
                break;
            case "decimal":
                break;
            case "file":
            case "image":
                break;
            default:
                break;
        }
        let nullable = await this.askIsNullable()
    }

    static async askModelName() {
        const answer = await inquirer.prompt({
            name: 'model_name',
            type: 'input',
            message: 'What is the Model name?',
            default() {
                return "";
            },
        })

        if (answer.model_name === "") {
            throw new InvalidInputError();
        }

        return answer.model_name.toLowerCase();
    }


    static async askIsNullable() {
        const answer = await inquirer.prompt({
            name: 'model_nullable',
            type: 'input',
            message: 'Is the field nullable? [no]',
            default() {
                return "";
            },
        })

        switch (answer.model_nullable){
            case "y":
            case "yes":
                return true
            case "":
            case "n":
            case "no":
                return false
            default:
                console.log(chalk.red("Please enter a valid value"))
                return this.askIsNullable()
        }
    }
}