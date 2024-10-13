import inquirer from "inquirer";
import fs from "fs";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import FileAlreadyExistError from "../../Errors/FileAlreadyExistError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import * as path from "node:path";
import {dirname} from "../../dirname.js";

export default class CreateView {
    static async handleCommand(command) {
        let controllerName = "";
        if (command.length > 0) {
            if ((/--[a-zA-Z-]*/g).test(command[0])) {
                controllerName = command[0].replace("--", "");
                await this.createView(controllerName);
            }
            else {
                ConsoleLogs.showErrorMessage("Parameters given don't exist");
            }
        }
        else {
            controllerName = await this.askName();
            await this.createView(controllerName);
        }

        controllerName = controllerName.charAt(0).toUpperCase() + controllerName.slice(1);
        const successMessage = controllerName + " View generated with success !"
        ConsoleLogs.showSuccessMessage(successMessage);
    }

    /**
     * ask for the name of the controller
     * @return {Promise<string>} the name entered by the user
     * @throws InvalidInputError if the user input is invalid
     */
    static async askName() {
        const controllerAnswers = await inquirer.prompt({
            name: 'view_name',
            type: 'input',
            message: 'What is the View name?',
            default() {
                return "";
            },
        })

        if (controllerAnswers.view_name === "") {
            throw new InvalidInputError();
        }

        return controllerAnswers.view_name;
    }

    /**
     * create the Controller
     * Create a directory named /Controllers if it does not exist
     * Create a Controller with the first letter set to an uppercase and Controller.js at the end
     * @param controllerName the controller name
     */
    static createView(controllerName) {

        const currentDir = process.cwd();

        controllerName = controllerName.charAt(0).toUpperCase() + controllerName.slice(1)

        if (!fs.existsSync(`${currentDir}/Controllers`)) {
            // If it doesn't exist, create the directory
            fs.mkdirSync(`${currentDir}/Controllers`);
        }

        if(!fs.existsSync(`${currentDir}/Controllers/${controllerName}Controller.ts`)) {

            const fileContent = this.getControllerContent(controllerName);
            // If it doesn't exist, create the file
            fs.writeFileSync(`${currentDir}/Controllers/${controllerName}Controller.ts`, fileContent);
        } else {
            throw new FileAlreadyExistError();
        }
    }

    /**
     * generate a string that contains what the Controller should have inside it
     * @param controllerName the controller name
     * @return {string} the controller code
     */
    static getControllerContent(controllerName) {
        const templateFilePath = path.join(dirname, './template-files/BareboneUrls.txt');

        // Read the template file
        const templateContent = fs.readFileSync(templateFilePath, 'utf8');

        // Replace placeholders with the actual controller name and path
        return templateContent
            .replace(/{%ControllerName%}/g, controllerName+"Controller")
            .replace(/{%path%}/g, controllerName.toLowerCase());
    }
}