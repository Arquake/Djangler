import inquirer from "inquirer";
import fs from "fs";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import * as path from "node:path";
import {dirname} from "../../dirname.js";
import chalk from "chalk";
import {createSpinner} from "nanospinner";

export default class CreateView {

    /**
     * handle the view creating command
     * @param command the command the user gave
     */
    static async handleCommand(command) {
        const parameters = this.getParameters(command)

        if (parameters.error) {
            return;
        }

        const appName = await this.getAppName(parameters.appName);

        const viewName = await this.askViewName(parameters.viewName);

        let spinner = createSpinner(' Creating view').start();

        try {
            this.createView(appName, viewName)
            spinner.success();

            spinner = createSpinner(' Generating routing').start();
            this.routeView(appName, viewName)
            spinner.success();

            spinner = createSpinner(' Generating template').start();
            this.generateTemplateView(appName, viewName)
            spinner.success();

            ConsoleLogs.showSuccessMessage(viewName + " View generated with success !");
        }
        catch (_) {
            spinner.error();
        }
    }

    /**
     * create a new view in the selected app
     * @param appName the app name
     * @param viewName the view name
     */
    static createView(appName, viewName) {
        let viewContent = fs.readFileSync(`${appName}/views.py`, "utf8");

        if (new RegExp(`def\\s+${viewName.toLowerCase()}(?:\\s|\\(.*\\)):`, "").test(viewContent)) {
            ConsoleLogs.showErrorMessage("View already exist");
            throw new Error("View already exist");
        }

        let addedContent = fs.readFileSync(dirname+`/template-files/BareboneViewFunction.txt`, "utf8");
        addedContent = addedContent.replaceAll('{%ViewName%}', viewName.toLowerCase());
        addedContent = addedContent.replaceAll('{%ViewNameCapitalize%}', viewName);

        fs.appendFileSync(`${appName}/views.py`, '\n\n'+addedContent);
    }

    /**
     * ask the user for the view's name
     * @return {Promise<*|string>} the name the user gave
     * @throws InvalidInputError if the user did not use a valid name
     */
    static async askViewName(viewName) {

        if (viewName !== "") {
            return viewName.charAt(0).toUpperCase() + viewName.toLowerCase().slice(1);
        }

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

    /**
     * handle what parameters are used
     * @param command the command the user wrote
     * @return {{viewName: string, appName: string, error: boolean}} the viewName, the appName, if an error occurred
     */
    static getParameters(command) {
        const appNameRegExp = (/^-[a-zA-Z_]+$/g)
        const viewNameRegExp = (/^--[a-zA-Z]+$/g)
        let parameters = {appName: "", viewName: "", error: false}
        for (let i = 0; i < command.length; i++) {
            if (appNameRegExp.test(command[i]) && parameters.appName === "") {
                parameters = {...parameters, appName: command[i].replace("-", "")};
            }
            else if (viewNameRegExp.test(command[i]) && parameters.viewName === "") {
                parameters = {...parameters, viewName: command[i].replace("--", "")};
            }
            else {
                console.log(chalk.red(`${command[i]} flag does not exist or already in. Execute dja help for help`))
                return {...parameters, error: true}
            }
        }

        return parameters;
    }

    /**
     * generate the routing for the view
     * @param appName the app name
     * @param viewName the view name
     */
    static routeView(appName, viewName) {
        let currentUrls = fs.readFileSync(`${appName}/urls.py`, 'utf8');

        currentUrls = currentUrls.replace(']', `\tpath("${viewName.toLowerCase()}", views.${viewName.toLowerCase()}, name="${viewName.toLowerCase()}"),\n]`);

        fs.writeFileSync(`${appName}/urls.py`, currentUrls);
    }

    /**
     * generate templates for the view
     * @param appName the app name
     * @param viewName the view name
     */
    static generateTemplateView(appName, viewName) {
        let template = fs.readFileSync(dirname+`/template-files/BareboneTemplate.txt`, 'utf8');

        fs.mkdirSync(`${appName}/Templates/${viewName}`)

        fs.writeFileSync(`${appName}/Templates/${viewName}/${viewName.toLowerCase()}.html`, template);
    }
}