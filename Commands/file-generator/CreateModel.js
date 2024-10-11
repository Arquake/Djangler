import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";

export default class CreateModel {

    static async handleCommand(command) {
        try {
            const appName = await this.getAppName(command)

            const modelName = await this.makeNewModel(command)

            const modelFile = path.join(process.cwd(), `${appName}/models.py`);

            let fileContent = fs.readFileSync(modelFile, "utf8");

            let modelContent = ""

            if ((new RegExp('\\bclass\\s+'+modelName+'\\s*', 'g')).test(fileContent)) {
                const regexGetClass = new RegExp(`class\\s+${modelName}\\s*\\s*([\\s\\S]*?)(?=\\n\\S|$)\\s*pass`, 'gm');
                modelContent = fileContent.match(regexGetClass)[0]
                ConsoleLogs.showSuccessMessages([`Model Already exist`,`Now editing the ${modelName} model`])
            }
            else {
                ConsoleLogs.showSuccessMessage(`Making new Model : ${modelName}`)
            }

            let fields = []

            let newField = ""

            while (true) {
                try {
                    newField = await this.makeNewField(appName, modelName);
                    fields.push(newField)
                }
                catch (error) {
                    break;
                }
            }

            let fieldItems = ""
            for (const field of fields) {
                fieldItems += "    " + field + "\n"
            }
            fieldItems += "    pass"

            let newContent = ""

            if (modelContent.length > 0) {
                console.log(fileContent)
                newContent = fileContent.replace(modelContent, modelContent.replace("    pass", fieldItems))
            }
            else {
                newContent = fileContent + `\n\nclass ${modelName}(models.Model):` + "\n"+fieldItems
            }

            fs.writeFileSync( `${appName}/models.py`, newContent)
        }
        catch (error) {
            console.error(error)
            ConsoleLogs.showErrorMessage("No model inside the selected directory!");
        }
    }

    static async makeNewModel(command) {
        try {
            if (command.length > 0) {
                for (let i = 0; i < command.length; i++) {
                    if ((/^--[a-zA-Z]+$/g).test(command[0])) {
                        return command[0].replace("--", "");
                    }
                }
            }
            return await this.askModelName();
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

        if (answer.field_name.match(/^[A-Za-z]+$/g)) {
            return answer.field_name.toLowerCase();
        }

        ConsoleLogs.showErrorMessages([
            "Invalid field name!",
            "Field names must be only alphanumeric characters.",
        ])

        await this.askFieldName()

    }

    static async askFieldsType(){
        const answer = await inquirer.prompt({
            name: 'field_type',
            type: 'input',
            message: 'What is the field type?',
            default() {
                return "string"
            },
        })

        switch (answer.field_type) {
            case "text":
                return "TextField";
            case "string":
                return "CharField";
            case "int":
                return "IntegerField";
            case "posint":
                return "PositiveIntegerField";
            case "float":
                return "FloatField";
            case "decimal":
                return "DecimalField";
            case "boolean":
                return "BooleanField";
            case "date":
                return "DateField";
            case "time":
                return "TimeField";
            case "dateTime":
                return "DateTimeField";
            case "file":
                return "FileField";
            case "image":
                return "ImageField";
            case "manyToOne":
                return "ForeignKeyField";
            case "oneToOne":
                return "OneToOneField";
            case "manyToMany":
                return "ManyToManyField";
            case "email":
                return "EmailField";
            case "url":
                return "URLField";
            case "uuid":
                return "UUIDField";
            case "slug":
                return "SlugField";
            case "ipAddress":
                return "IPAddressField";
            case "ipAddressGeneric":
                return "GenericIPAddressField";
            case "json":
                return "JSONField";
            case "help":
                console.log(chalk.green(
                    "Available types : \n" +
                    "string" + "\t\t" + "text" + "\n\n" +
                    "int" + "\t\t" + "posint" + "\t\t" + "float" + "\t\t" + "decimal" + "\n\n" +
                    "boolean" + "\n\n" +
                    "date" + "\t\t" + "time" + + "\t\t" + "dateTime" + "\n\n" +
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

    static async makeNewField(appName, modelName) {
        let name = await this.askFieldName();
        let type = await this.askFieldsType();
        let parameters = ""
        switch (type) {
            case "CharField":
            case "TextField":
            case "SlugField":
            case "EmailField":
            case "URLField":
                parameters = `max_length=${await this.askMaxLength()}`
                break;
            case "DecimalField":
                parameters = `max_digits=${await this.askDecimalBeforeComa()}, decimal_places=${await this.askDecimalAfterComa()}`;
                break;
            case "FileField":
            case "ImageField":
                parameters = `upload_to='${appName}/${modelName}/${name}'`;
                break;
            default:
                break;
        }
        let nullable = await this.askIsNullable()

        return `${name} = models.${type}(${parameters}${parameters.length>0 && nullable?',':''}blank=False${nullable?', null=True':''})`

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

        if((/^[a-zA-Z]+$/).test(answer.model_name)) {
            return answer.model_name.toLowerCase().charAt(0).toUpperCase() + answer.model_name.toLowerCase().slice(1)
        }

        ConsoleLogs.showErrorMessages([
            "Invalid model name!",
            "Names must be only alphanumeric characters.",
        ])

        return await this.askModelName();
    }

    static async askIsNullable() {
        const answer = await inquirer.prompt({
            name: 'model_nullable',
            type: 'input',
            message: 'Is the field nullable? [y/n]',
            default() {
                return "no";
            },
        })

        switch (answer.model_nullable){
            case "y":
            case "yes":
                return true
            case "n":
            case "no":
                return false
            default:
                console.log(chalk.red("Please enter a valid value"))
                return this.askIsNullable()
        }
    }

    static async askMaxLength(){
        const answer = await inquirer.prompt({
            name: 'max_length',
            type: 'input',
            message: 'What is the maximum length?',
            default() {
                return "255";
            },
        })

        if (Number.isInteger(Number(answer.max_length)) && Number(answer.max_length)>=1) {
            return answer.max_length
        }
        console.log(chalk.red("Please enter a value above 0"))
        return this.askMaxLength()
    }

    static async askDecimalBeforeComa(){
        const answer = await inquirer.prompt({
            name: 'decimal_before_coma',
            type: 'input',
            message: 'How many digit before the coma?',
            default() {
                return "10";
            },
        })

        if (Number.isInteger(Number(answer.decimal_before_coma)) && Number(answer.decimal_before_coma)>=1) {
            return answer.decimal_before_coma
        }
        console.log(chalk.red("Please enter a value above 0"))
        return this.askDecimalBeforeComa()
    }

    static async askDecimalAfterComa(){
        const answer = await inquirer.prompt({
            name: 'decimal_after_coma',
            type: 'input',
            message: 'How many digit after the coma?',
            default() {
                return "10";
            },
        })

        if (Number.isInteger(Number(answer.decimal_after_coma)) && Number(answer.decimal_after_coma)>=1) {
            return answer.decimal_after_coma
        }
        console.log(chalk.red("Please enter a value above 0"))
        return this.askDecimalAfterComa()
    }

    static async getAppName(command) {
        try {
            if (command.length > 0) {
                for (let i = 0; i < command.length; i++) {
                    if ((/^-[a-zA-Z]+$/g).test(command[i])) {
                        return command[i].replace("-", "");
                    }
                }
            }
            return await this.askAppName();

        }
        catch (error) {
            throw error
        }
    }

    /**
     * ask the user what is the application name
     * @return {Promise<string>} the application name
     * @throws Error if there's no application directory
     */
    static async askAppName(){
        const directoryList = fs.readdirSync(process.cwd()).filter((name) => {
            return fs.statSync(path.join(process.cwd(), name)).isDirectory() && !name.startsWith('.') && fs.existsSync(path.join(path.join(process.cwd(), name), 'models.py'));
        });

        if(directoryList.length === 0){
            throw new Error("No Directory Found");
        }

        let res = await inquirer.prompt({
            name: 'app_name',
            type: 'list',
            message: 'What is the application name?',
            choices: directoryList
        })

        return res.app_name
    }
}