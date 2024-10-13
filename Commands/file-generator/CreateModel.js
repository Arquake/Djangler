import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";

export default class CreateModel {

    /**
     * handle model creation commands
     * @param command the flags of the command
     */
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
                newContent = fileContent.replace(modelContent, modelContent.replace("    pass", fieldItems))
            }
            else {
                newContent = fileContent + `\n\nclass ${modelName}(models.Model):` + "\n"+fieldItems
            }

            fs.writeFileSync( `${appName}/models.py`, newContent)

            ConsoleLogs.showSuccessMessages(["Model updated successfully!", "Run 'dja m migrate' to migrate the changes"])
        }
        catch (error) {
            ConsoleLogs.showErrorMessage("No model inside the selected directory!");
        }
    }

    /**
     * generate the model name
     * @param command the command the user gave
     * @return {Promise<*|string>} the model's name
     */
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

    /**
     * ask the user the name of the field
     * @return {Promise<string>} the name of the field
     * @throws InvalidInputError if the input is empty
     */
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

    /**
     * ask the user for the field type
     * @return {Promise<string|*|string>} the field type for the code
     */
    static async askFieldsType(){
        const answer = await inquirer.prompt({
            name: 'field_type',
            type: 'input',
            message: 'What is the field type? [help]',
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
                return "ForeignKey";
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
                    "date" + "\t\t" + "time" + "\t\t" + "dateTime" + "\n\n" +
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

    /**
     * create a field
     * @param appName the app name
     * @param modelName the model name
     * @return {Promise<string>} the code to make the field
     */
    static async makeNewField(appName, modelName) {
        let name = await this.askFieldName();
        let type = await this.askFieldsType();
        let parameters = ""
        switch (type) {
            case "CharField":
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
            case "ForeignKey":
            case "OneToOneField":
                parameters = await this.makeManyToField(appName, modelName, name);
                break;
            case "ManyToManyField":
                parameters = await this.makeOneToOne(appName, modelName, name);
                break;
            default:
                break;
        }
        let nullable = await this.askIsNullable()

        return `${name} = models.${type}(${parameters}${parameters.length>0 || nullable?', ':''}blank=False${nullable?', null=True':''})`

    }

    /**
     * ask the user for the model's name
     * @return {Promise<*|string>} the name the user gave
     * @throws InvalidInputError if the user did not use a valid name
     */
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

    /**
     * Ask the user if the field is nullable
     * @return {Promise<boolean|*|boolean|string>} true if it is nullable | false otherwise
     */
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

    /**
     * Ask the user for the length of a field
     * @return {Promise<any|string>} the length given by the user
     */
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

    /**
     * Ask the user how many digit should be before the coma
     * @return {Promise<any|string>} the number of digits before the coma (>=1)
     */
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

    /**
     * Ask the user how many digit should be after the coma
     * @return {Promise<any|string>} the number of digits after the coma (>=1)
     */
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

    /**
     * get the app name
     * if a flag like '-name' is found return the name
     * otherwise ask for the name
     * @param command the command given by the user
     * @return {Promise<*|string>} the app name
     */
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

    /**
     * return the parameters to make a many-to-one or many-to-many relation
     * @param appName the app name
     * @param modelName the model name
     * @param fieldName the field name
     * @return {Promise<string>} the parameter of the field
     */
    static async makeManyToField(appName, modelName, fieldName){
        let res = await inquirer.prompt({
            name: 'model_name',
            type: 'list',
            message: 'What is the target model?',
            choices: this.getAllClasses(appName, modelName)
        })

        return `"${res.model_name}", on_delete=models.CASCADE, related_name="${modelName.toLowerCase()}_${fieldName.toLowerCase()}s"`
    }

    /**
     * return the parameters to make a one-to-one relation
     * @param appName the app name
     * @param modelName the model name
     * @param fieldName the field name
     * @return {Promise<string>} the parameter of the field
     */
    static async makeOneToOne(appName, modelName, fieldName){
        let res = await inquirer.prompt({
            name: 'model_name',
            type: 'list',
            message: 'What is the target model?',
            choices: this.getAllClasses(appName, modelName)
        })

        return `\"${res.model_name}\", related_name="${modelName.toLowerCase()}_${fieldName.toLowerCase()}s"`
    }

    /**
     * get every available classes inside the Application's models.py selected
     * @param appName the app name
     * @param modelName the model name
     * @return {(string|null)[]}
     */
    static getAllClasses(appName, modelName){
        const modelFile = fs.readFileSync(`${process.cwd()}/${appName}/models.py`, "utf8");

        const availableModels = modelFile.match(new RegExp('class\\s+[a-zA-Z]+\\s*(.*)', 'gm'))

        const classNames = availableModels.map(line => {
            const match = line.match(/^class\s+(\w+)\s*\(/);
            return match ? match[1] : null;
        }).filter(name => name !== null);

        if(!classNames.includes(modelName)) {
            classNames.push(modelName)
        }

        return classNames
    }
}