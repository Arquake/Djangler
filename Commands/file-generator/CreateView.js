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
     * create a new view in the selected app
     * @param appName the app name
     * @param viewName the view name
     */
    static createView(appName, viewName) {
        let viewContent = fs.readFileSync(`${appName}/views.py`, "utf8");

        if (new RegExp(`def ${viewName.toLowerCase()}`, "").test(viewContent)) {
            ConsoleLogs.showErrorMessage("View already exist");
            return
        }

        const addedContent = fs.readFileSync(`${appName}/views.py`, "utf8");
    }

    /**
     * ask the user for the view's name
     * @return {Promise<*|string>} the name the user gave
     * @throws InvalidInputError if the user did not use a valid name
     */
    static async askViewName() {
        const answer = await inquirer.prompt({
            name: 'view_name',
            type: 'input',
            message: 'What is the View name?',
            default() {
                return "";
            },
        })

        if (answer.view_name === "") {
            throw new InvalidInputError();
        }

        if((/^[a-zA-Z]+$/).test(answer.view_name)) {
            return answer.view_name.toLowerCase().charAt(0).toUpperCase() + answer.view_name.toLowerCase().slice(1)
        }

        ConsoleLogs.showErrorMessages([
            "Invalid view name!",
            "Names must be only alphanumeric characters.",
        ])

        return await this.askViewName();
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
}