import {spawn} from "child_process";
import InvalidInputError from "../Errors/InvalidInputError.js";
import inquirer from "inquirer";
import {createSpinner} from 'nanospinner'
import ConsoleLogs from "../console-logs/ConsoleLogs.js";
import fs from "fs";
import path from "path";
import {dirname} from "../dirname.js";

export default class CreateApp {

    /**
     * Create a new django project with an admin setup
     * @param command
     * @returns {Promise<void>}
     */
    static async handleCommand(command) {

        let errorStatus = false

        try {
            const name = await this.askName()
            let spinner = createSpinner(' Creating project').start();
            const com = spawn(`django-admin startproject ${name}`, {'shell':'powershell.exe'});

            com.stdout.on("data", data => {
            });

            com.stderr.on("data", data => {
                spinner.error({text: ` Error !`})
                ConsoleLogs.showErrorMessages(["Naming Error !", "Please choose another name"])
                this.errorStatus = true
            });

            com.on('error', (error) => {
                spinner.error({text: ` Error !`})
                ConsoleLogs.showErrorMessages(["Naming Error !", "Please choose another name"])
                this.errorStatus = true
            });

            com.on("close", code => {
                if (!this.errorStatus) {
                    spinner.success({text: ` created files !`})

                    spinner = createSpinner(' Creating os settings.py').start();
                    this.importingOsIntoSettings(name)
                    spinner.success({text: ` created os !`})

                    spinner = createSpinner(' Creating base routing').start();
                    this.generateBaseRouting(name)
                    spinner.success({text: ` created routing !`})

                    spinner = createSpinner(' Creating base templates').start();
                    this.generateBaseTemplates(name)
                    spinner.success({text: ` created base templates !`})

                        ConsoleLogs.showSuccessMessages(
                            [
                                `App created with success !`,
                                `Created at : ${process.cwd()}/${name.replace(" ", "")}`,
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
            throw new InvalidInputError();
        }

        return nameAnswer.name.replace(" ", "");
    }


    static importingOsIntoSettings(appName){
        const settings = fs.readFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`).toString()
        const newDirUpdated = `'DIRS': [os.path.join(BASE_DIR, 'Templates')]`
        const newSettings = "import os \n\n" + settings.replace(/'DIRS': \[(.*?)\]/m, newDirUpdated)
        fs.writeFileSync(`${process.cwd()}/${appName}/${appName}/settings.py`, newSettings);
    }

    static generateBaseRouting(appName) {
        const urlsBaseTemplate = path.join(dirname, "./template-files/BareboneBaseUrls.txt");
        const newBase = fs.readFileSync(urlsBaseTemplate)
        fs.writeFileSync(`${process.cwd()}/${appName}/${appName}/urls.py`, newBase);
    }

    static generateBaseTemplates(appName) {
        fs.mkdirSync(`${process.cwd()}/${appName}/Templates`);
        const baseTemplate = fs.readFileSync(dirname + `/template-files/BareboneBaseTemplate.txt`).toString();
        fs.writeFileSync(`${process.cwd()}/${appName}/Templates/base.html`, baseTemplate.replace("%APP_BASE_NAME%", appName))
    }
}