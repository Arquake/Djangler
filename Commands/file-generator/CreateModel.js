import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import {dirname} from "../../dirname.js";
import {createSpinner} from "nanospinner";

export default class CreateModel {

    /**
     * handle model creation commands
     * @param command the flags of the command
     */
    static async handleCommand(command) {
        try {

            const parameters = this.getParameters(command)

            const appNameParameter = parameters.appName
            const modelNameParameter = parameters.modelName
            const errorParameter = parameters.error

            if (errorParameter) {return}

            const appName = await this.getAppName(appNameParameter)

            const modelName = await this.makeNewModel(modelNameParameter)

            const modelFile = path.join(process.cwd(), `${appName}/models.py`);

            let fileContent = fs.readFileSync(modelFile, "utf8");

            let modelContent = ""

            let isNewModel = true

            let fileCreationParameter = false

            let modelNamesInUse = []

            if ((new RegExp('\\bclass\\s+'+modelName+'\\s*', 'g')).test(fileContent)) {
                if (parameters.fileCreation) {console.log(chalk.yellow('\nParameter ---mf ignored because the model already exist\n'))}
                isNewModel = false
                const regexGetClass = new RegExp(`class\\s+${modelName}\\s*\\s*([\\s\\S]*?)(?=\\n\\S|$)\\s*pass`, 'gm');
                modelContent = fileContent.match(regexGetClass)[0]
                ConsoleLogs.showSuccessMessages([`Model Already exist`,`Now editing the ${modelName} model`])
                modelNamesInUse = this.getAllFieldNameOfModel(appName, modelName)
            }
            else {
                fileCreationParameter = await this.getFileCreation(parameters.fileCreation)

                ConsoleLogs.showSuccessMessage(`Making new Model : ${modelName}`)
            }

            let fields = []
            let fieldNames = []

            let newField = ""
            let fieldName = ""

            while (true) {
                try {
                    fieldName = await this.askFieldName();
                    if (fieldName === "") {
                        break;
                    }
                    if (modelNamesInUse.includes(fieldName)) {
                        console.log(chalk.red('This name is already used!'))
                        continue
                    }
                    newField = await this.makeNewField(appName, modelName, fieldName);
                    fields= [...fields, newField]
                    fieldNames = [...fieldNames, fieldName]
                    modelNamesInUse = [...modelNamesInUse, fieldName]
                }
                catch (_) {
                    return
                }
            }

            if(fieldNames.length === 0) {
                ConsoleLogs.showErrorMessage("No field entered");
                return
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
                if (fileCreationParameter) {
                    this.generateFormFiles(appName, modelName, fieldNames)
                }
            }

            fs.writeFileSync( `${appName}/models.py`, newContent)

            this.generateForm(appName, modelName, isNewModel);

            ConsoleLogs.showSuccessMessages(["Model updated successfully!", "Run 'dja m migrate' to migrate the changes"])
        }
        catch (error) {
            ConsoleLogs.showErrorMessage(error)
            ConsoleLogs.showErrorMessage("No model inside the selected directory!");
        }
    }

    /**
     * generate the model name
     * @param modelName the model name the user gave
     * @return {Promise<*|string>} the model's name
     */
    static async makeNewModel(modelName) {
        try {
            if (modelName !=="") {
                return modelName.charAt(0).toUpperCase() + modelName.toLowerCase().slice(1);
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

        if (answer.field_name === "" || answer.field_name.match(/^[A-Za-z]+$/g)) {
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
    static async askFieldType(){
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
                    "string" + "\t\t" + "text" + "\n" +
                    "int" + "\t\t" + "posint" + "\t\t" + "float" + "\t\t" + "decimal" + "\n" +
                    "boolean" + "\n" +
                    "date" + "\t\t" + "time" + "\t\t" + "dateTime" + "\n" +
                    "file" + "\t\t" + "image" + "\n" +
                    "manyToOne" + "\t" + "oneToOne" + "\t" + "manyToMany" + "\n" +
                    "email" + "\t\t" + "url" + "\n" +
                    "uuid" + "\t\t" + "slug" + "\n" +
                    "ipAddress" + "\t" + "ipAddressGeneric" + "\n" +
                    "json" + "\n"
                ))
                return this.askFieldType();
            default:
                console.log(chalk.red("Invalid field type please retry"))
                return this.askFieldType();
        }
    }

    /**
     * create a field
     * @param appName the app name
     * @param modelName the model name
     * @param fieldName the field name
     * @return {Promise<string>} the code to make the field
     */
    static async makeNewField(appName, modelName, fieldName) {
        const fieldType = await this.askFieldType()
        let parameters = ""
        switch (fieldType) {
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
                parameters = `upload_to='${appName}/${modelName}'`;
                break;
            case "ForeignKey":
            case "OneToOneField":
                parameters = await this.makeManyToField(appName, modelName, fieldName);
                break;
            case "ManyToManyField":
                parameters = await this.makeOneToOne(appName, modelName, fieldName);
                break;
            default:
                break;
        }
        let nullable = await this.askIsNullable()

        return `${fieldName} = models.${fieldType}(${parameters}${parameters.length>0?', ':''}blank=False${nullable?', null=True':''})`

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
     * @param givenAppName the app name given by the user
     * @return {Promise<*|string>} the app name
     */
    static async getAppName(givenAppName) {
        try {
            if (givenAppName !== "") {
                return givenAppName
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

    /**
     * generate the form for the model
     * @param appName the app name
     * @param modelName the model name
     * @param isNewModel if it's creating a new model or not
     */
    static generateForm(appName, modelName, isNewModel) {

        let fileContent = fs.readFileSync(`${appName}/models.py`, "utf8");
        // get the class associated ith the model
        const regexGetClass = new RegExp(`class\\s+${modelName}\\s*\\s*([\\s\\S]*?)(?=\\n\\S|$)\\s*pass`, 'gm');
        let modelContent = fileContent.match(regexGetClass)[0]

        let allVariables = modelContent.match(/(\w+\s*=\s*models\..*)\(/g)
        let variables = []

        let newContent = `class ${modelName}Form(forms.ModelForm):\n`+
            `\tclass Meta:\n`+
            `\t\tmodel = ${modelName}\n`+
            `\t\tfields = [ `;

        for (let i = 0; i < allVariables.length; i++) {
            variables = [...variables, {name: allVariables[i].match(/(\w+)\s*=/)[1], type: this.getAttrByType(allVariables[i].match(/models\.(.*)\(/)[1])}] ;
            newContent += `'${variables[i].name}'` + ", "
        }

        const lastCommaIndex = newContent.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
            newContent = newContent.slice(0, lastCommaIndex) + newContent.slice(lastCommaIndex + 1);
        }

        newContent += ']\n\n'

        newContent += '\t\twidgets = {\n'
        for (let i = 0; i < variables.length; i++) {
            newContent += `\t\t\t'${variables[i].name}': ${variables[i].type},\n`
        }
        newContent += '\t\t}\n\tpass\n\n'

        let formFileContent = fs.readFileSync(`${appName}/forms.py`, "utf8")
        if(!isNewModel) {
            formFileContent = formFileContent.replace(formFileContent.match(regexGetClass)[0], newContent)

            fs.writeFileSync(`${appName}/forms.py`, formFileContent)
        }
        else {

            formFileContent = `from \.models import ${modelName}\n` + formFileContent +`\n\n${newContent}`
            fs.writeFileSync(`${appName}/forms.py`, formFileContent)
        }

    }

    /**
     * generates all the forms for an out of the box uses
     * @param appName app name
     * @param modelName model name
     * @param fields app fields
     */
    static generateFormFiles(appName, modelName, fields) {

        const modelNameAllLowerCase = modelName.toLowerCase();

        let spinner = createSpinner(' Creating templates').start();

        fs.mkdirSync(`${appName}/Templates/${modelName}`)

        let createTemplate = fs.readFileSync(dirname+"/template-files/form-templates/front/CreateTemplate.txt", "utf-8");
        let editTemplate = fs.readFileSync(dirname+"/template-files/form-templates/front/EditTemplate.txt", "utf-8");
        let listTemplate = fs.readFileSync(dirname+"/template-files/form-templates/front/ListTemplate.txt", "utf-8");
        let showTemplate = fs.readFileSync(dirname+"/template-files/form-templates/front/ShowTemplate.txt", "utf-8");

        createTemplate = (createTemplate.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName);
        editTemplate = (editTemplate.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName);
        listTemplate = (listTemplate.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName);


        fs.writeFileSync(`${appName}/Templates/${modelName}/create.${modelNameAllLowerCase}.html`, createTemplate);
        fs.writeFileSync(`${appName}/Templates/${modelName}/edit.${modelNameAllLowerCase}.html`, editTemplate);
        fs.writeFileSync(`${appName}/Templates/${modelName}/index.${modelNameAllLowerCase}.html`, listTemplate);

        let modelProperties = "<div>"

        for (let i = 0; i < fields.length; i++) {
            modelProperties += `<p>${fields[i]} : {{ ${modelNameAllLowerCase}.${fields[i]} }}</p>`;
        }

        modelProperties += "</div>"

        showTemplate = ((showTemplate.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName)).replaceAll('{%ModelProperties%}', modelProperties);
        fs.writeFileSync(`${appName}/Templates/${modelName}/show.${modelNameAllLowerCase}.html`, showTemplate);

        spinner.success({text: ` Templates created successfully !`})

        spinner = createSpinner(' Generating urls').start();

        let newUrls = fs.readFileSync(dirname+"/template-files/form-templates/back/NewUrls.txt", "utf-8");

        newUrls = (newUrls.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName);

        let newContentUrls = (fs.readFileSync(`${appName}/urls.py`, "utf-8")).replace(/](?![^\[]*\])/, newUrls) + "\n]";
        fs.writeFileSync(`${appName}/urls.py`, newContentUrls);

        spinner.success({text: ` Urls generated successfully !`})

        spinner = createSpinner(' Generating views').start();

        let newViews = fs.readFileSync(dirname+"/template-files/form-templates/back/NewViews.txt", "utf-8");
        newViews = (newViews.replaceAll('{%ModelNameLowerCase%}', modelNameAllLowerCase)).replaceAll('{%ModelName%}', modelName);

        const oldViewData = fs.readFileSync(`${appName}/views.py`, "utf-8")
        const newViewData = `from .models import ${modelName}\nfrom .forms import ${modelName}Form\n` + oldViewData + '\n\n' + newViews;
        fs.writeFileSync(`${appName}/views.py`, newViewData)

        spinner.success({text: ` Views generated successfully !`})
    }

    /**
     * take parameters and returns an object filled with the values
     * @param command the flags given by the user
     * @return {{modelName: string, appName: string, fileCreation: boolean, error: boolean}} the model name, the app name, if the user want to create forms along with the model, if an error was encountered
     */
    static getParameters(command) {
        const appNameRegExp = (/^-[a-zA-Z_]+$/g)
        const modelNameRegExp = (/^--[a-zA-Z]+$/g)
        const fileCreation = (/^---mf$/g)
        let parameters = {appName: "", modelName: "", fileCreation: false, error: false}
        for (let i = 0; i < command.length; i++) {
            if (appNameRegExp.test(command[i]) && parameters.appName === "") {
                parameters = {...parameters, appName: command[i].replace("-", "")};
            }
            else if (modelNameRegExp.test(command[i]) && parameters.modelName === "") {
                parameters = {...parameters, modelName: command[i].replace("--", "")};
            }
            else if (fileCreation.test(command[i]) && !parameters.fileCreation) {
                parameters = {...parameters, fileCreation: true};
            }
            else {
                console.log(chalk.red(`${command[i]} flag does not exist or already in. Execute dja help for help`))
                return {...parameters, error: true}
            }
        }

        return parameters;
    }

    /**
     * verify if the user want to create forms html files with it
     * @param fileCreation if the user passed the ---mf flag or not
     * @return {Promise<boolean>} if the user want or not the option
     */
    static async getFileCreation(fileCreation) {
        try {
            if (fileCreation) {
                return true
            }
            return await this.askFileCreation();
        }
        catch (error) {
            throw error
        }
    }

    /**
     * ask the user if he wants to create forms html files
     * @return {Promise<boolean>} the user choice
     */
    static async askFileCreation(){
        let res = await inquirer.prompt({
            name: 'choice',
            type: 'list',
            message: 'Do you want to create default pages for the model?',
            choices: ['no','yes']
        })

        return res.choice==="yes"
    }

    /**
     * get the form attribute by the current field type of the model
     * @param type the model type
     * @return {string} the form type
     */
    static getAttrByType(type){
        switch (type) {
            case "TextField":
                return "forms.Textarea(attrs={'class': 'form-control'})"; // For multi-line text
            case "CharField":
                return "forms.TextInput(attrs={'class': 'form-control'})"; // For single-line text
            case "IntegerField":
                return "forms.NumberInput(attrs={'class': 'form-control'})"; // For integer input
            case "PositiveIntegerField":
                return "forms.NumberInput(attrs={'class': 'form-control', 'min': 0})"; // For positive integers
            case "FloatField":
                return "forms.NumberInput(attrs={'class': 'form-control', 'step': 'any'})"; // For float input
            case "DecimalField":
                return "forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'})"; // For decimal input
            case "BooleanField":
                return "forms.CheckboxInput(attrs={'class': 'form-check-input'})"; // For boolean (checkbox)
            case "DateField":
                return "forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})"; // For date input
            case "TimeField":
                return "forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'})"; // For time input
            case "DateTimeField":
                return "forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'})"; // For date and time
            case "FileField":
                return "forms.FileInput(attrs={'class': 'form-control'})"; // For file input
            case "ImageField":
                return "forms.ClearableFileInput(attrs={'class': 'form-control'})"; // For image input with clear option
            case "ForeignKey":
                return "forms.Select(attrs={'class': 'form-control'})"; // For foreign key dropdowns
            case "OneToOneField":
                return "forms.Select(attrs={'class': 'form-control'})"; // For one-to-one dropdowns
            case "ManyToManyField":
                return "forms.SelectMultiple(attrs={'class': 'form-control'})"; // For many-to-many relationships
            case "EmailField":
                return "forms.EmailInput(attrs={'class': 'form-control'})"; // For email input
            case "URLField":
                return "forms.URLInput(attrs={'class': 'form-control'})"; // For URL input
            case "UUIDField":
                return "forms.TextInput(attrs={'class': 'form-control'})"; // For UUID input (treated as string)
            case "SlugField":
                return "forms.TextInput(attrs={'class': 'form-control'})"; // For slug input (text input)
            case "IPAddressField":
                return "forms.TextInput(attrs={'class': 'form-control'})"; // For IP address input
            case "GenericIPAddressField":
                return "forms.TextInput(attrs={'class': 'form-control'})"; // For generic IP input (IPv4/IPv6)
            case "JSONField":
                return "forms.JSONField(widget=forms.Textarea(attrs={'class': 'form-control'}))"; // For JSON input
            default:
                return "forms.TextInput(attrs={'class': 'form-control'})"; // Default widget
        }
    }

    /**
     * return all the names of the selected model
     * @param appName the app name
     * @param modelName the model name
     * @return {*[]} an array with all the fields names
     */
    static getAllFieldNameOfModel(appName, modelName){
        let fileContent = fs.readFileSync(`${appName}/models.py`, "utf8");
        // get the class associated ith the model
        const regexGetClass = new RegExp(`class\\s+${modelName}\\s*\\s*([\\s\\S]*?)(?=\\n\\S|$)\\s*pass`, 'gm');
        let modelContent = fileContent.match(regexGetClass)[0]

        let allVariables = modelContent.match(/(\w+\s*=\s*models\..*)\(/g)
        let variables = []

        for (let i = 0; i < allVariables.length; i++) {
            variables = [...variables, allVariables[i].match(/(\w+)\s*=/)[1]] ;
        }
        return variables
    }
}