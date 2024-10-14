import {spawn} from "child_process";
import inquirer from "inquirer";
import {createSpinner} from 'nanospinner'
import ConsoleLogs from "../console-logs/ConsoleLogs.js";
import fs from "fs";
import path from "path";
import {dirname} from "../dirname.js";
import chalk from "chalk";

export default class CreateApp {

    /**
     * Create a new django project with an admin setup
     * @param command the command flags
     * @returns {Promise<void>}
     */
    static async handleCommand(command) {

        let errorStatus = false

        try {
            if (command.length > 1) {
                throw new Error("Too many arguments given");
            }
            const name = await this.getName(command)
            let spinner = createSpinner(' Creating project').start();
            const com = spawn(`django-admin startproject ${name}`, {'shell':'powershell.exe'});


            com.stdout.on("data", data => {
            });

            com.stderr.on("data", data => {
                spinner.error({text: ` Error !`})
                ConsoleLogs.showErrorMessages(["Naming Error !", "Please choose another name"])
                errorStatus = true
            });

            com.on('error', (error) => {
                spinner.error({text: ` Error !`})
                ConsoleLogs.showErrorMessages(["Naming Error !", "Please choose another name"])
                errorStatus = true
            });

            com.on("close", code => {
                if (!errorStatus) {
                    spinner.success({text: ` created files !`})

                    spinner = createSpinner(' Creating base templates').start();
                    this.createTemplateFolder(name)
                    this.generateBaseTemplates(name)
                    spinner.success({text: ` created base templates !`})

                    spinner = createSpinner(' Creating base routing').start();
                    this.generateBaseRouting(name)
                    spinner.success({text: ` created routing !`})

                    spinner = createSpinner(' Creating public directory').start();
                    this.generatePublicDirectory(name)
                    spinner.success()

                        ConsoleLogs.showSuccessMessages(
                            [
                                `App created with success !`,
                                `Created at : ${process.cwd()}\\${name.replace(" ", "")}`,
                            ]
                        )
                    }
            });
        }
        catch(e) {
            ConsoleLogs.showErrorMessage(e.message)
        }

    }

    /**
     * take the list of flags and try to find one that would be with the '--name' format
     * if one is found it returns this flag
     * if none is found it asks the user for a name
     * @param command the array of flags
     * @return {Promise<*|string>} the name of the app
     */
    static async getName(command) {
        for (let i = 0; i < command.length; i++) {
            if ((/--.+/g).test(command[i])) {
                return command[i].replace("--", "")
            }
        }
        return await this.askName()
    }

    /**
     * ask for the name of the project
     * @return {Promise<string>} the name entered by the user
     * @throws InvalidInputError if the user input is invalid
     */
    static async askName() {
        const nameAnswer = await inquirer.prompt({
            name: 'name',
            type: 'input',
            message: ' What is the project name?',
            default() {
                return "";
            },
        })

        if (nameAnswer.name === "") {
            console.log(chalk.red("Please enter a valid name"))
            return await this.askName()
        }

        return nameAnswer.name.replace(" ", "");
    }

    /**
     * generate the Templates folder at the root of the project
     * @param appName the name of the app
     */
    static createTemplateFolder(appName){
        const settings = fs.readFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`).toString()
        const newDirUpdated = `'DIRS': ['Templates']`
        const newSettings = settings.replace(/'DIRS': \[(.*?)\]/m, newDirUpdated)
        fs.writeFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`, newSettings);
    }

    /**
     * rewrite the original urls.py to match with the cli
     * @param appName the app name
     */
    static generateBaseRouting(appName) {
        const urlsBaseTemplate = path.join(dirname, "./template-files/BareboneBaseUrls.txt");
        const newBase = fs.readFileSync(urlsBaseTemplate)
        fs.writeFileSync(`${process.cwd()}/${appName}/${appName}/urls.py`, newBase);
    }

    /**
     * generate a base templates for views inside the root folder
     * @param appName the app name
     */
    static generateBaseTemplates(appName) {
        fs.mkdirSync(`${process.cwd()}/${appName}/Templates`);
        const baseTemplate = fs.readFileSync(dirname + `/template-files/BareboneBaseTemplate.txt`).toString();
        fs.writeFileSync(`${process.cwd()}/${appName}/Templates/base.html`, baseTemplate.replace("%APP_BASE_NAME%", appName))
    }

    /**
     * generate a public directory to store pictures inside the root folder
     * @param appName the app name
     */
    static generatePublicDirectory(appName) {
        fs.mkdirSync(`${process.cwd()}/${appName}/public`);
        let settingsContent = fs.readFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`)
        fs.writeFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`, settingsContent + "\n\nPath(BASE_DIR, 'public')\nMEDIA_URL = '/public/'")
    }
}