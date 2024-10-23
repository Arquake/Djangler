import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import fs from "fs";
import path from "node:path";
import {dirname} from "../../dirname.js";
import {spawn} from "child_process";
import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import {createSpinner} from "nanospinner";
import chalk from "chalk";
import ConsoleType from "../../Components/ConsoleType.js";

export default class CreateUnderApp {

    /**
     * handle the creation of the app
     * @param command the flags
     */
    static async handleCommand(command) {
        let viewName = "";
        if (command.length > 0) {
            if ((/--[a-zA-Z]+/g).test(command[0])) {
                viewName = command[0].replace("--", "");
                this.createApp(viewName);
            }
            else {
                ConsoleLogs.showErrorMessages(["Invalid name", "The name should only be composed of letters from A -> Z"]);
            }
        }
        else {
            viewName = await this.askName();
            await this.createApp(viewName);
        }
    }

    /**
     * create the app with the given name
     * @param appName the app name
     */
    static createApp(appName) {
        return new Promise((resolve, reject) => {
            appName = appName.toLowerCase();

            let errorStatus = false;
            let spinner = createSpinner('Creating project').start();
            let com = spawn(`python`, ['manage.py', 'startapp', `${appName}`], { 'shell': ConsoleType.getShell(), env: { ...process.env, PYTHONUNBUFFERED: '1' } });

            com.stdout.on("data", data => {
                process.stdout.write(data);
            });

            com.stderr.on("data", data => {
                process.stdout.write(data);
                spinner.error();
                ConsoleLogs.showErrorMessages([`Could not create an app named ${appName}`, `Make sure you are in your project directory`]);
                errorStatus = true;
            });

            com.on('error', (error) => {
                spinner.error();
                ConsoleLogs.showErrorMessages([`Could not create an app named ${appName}`, `Make sure you are in your project directory`]);
                errorStatus = true;
                reject(error);  // Reject the promise on error
            });

            com.on("close", code => {
                try {
                    if (!errorStatus) {
                        spinner.success({ text: `created!` });

                        spinner = createSpinner('Creating urls').start();
                        this.createUrls(appName);
                        spinner.success();

                        spinner = createSpinner('Creating views').start();
                        this.generateBasicView(appName);
                        spinner.success();

                        spinner = createSpinner('Creating template directory').start();
                        this.generateTemplateDirectory(appName);
                        spinner.success();

                        spinner = createSpinner('Generating basic view').start();
                        this.generateBasicView(appName);
                        spinner.success();

                        spinner = createSpinner('Enabling templates').start();
                        this.allowTemplates(appName);
                        spinner.success();

                        spinner = createSpinner('Generating rooting').start();
                        this.generateRootRouting(appName);
                        spinner.success();

                        spinner = createSpinner('Installing the application').start();
                        this.installingTheApp(appName);
                        spinner.success();

                        spinner = createSpinner('Generating BareboneFormsAuth.txt file').start();
                        this.generateFormFile(appName);
                        spinner.success();

                        ConsoleLogs.showSuccessMessage(appName + " View generated with success!");

                        resolve();  // Resolve the promise when everything is done
                    } else {
                        reject(new Error(`Error occurred while creating app ${appName}`));
                    }
                } catch (error) {
                    spinner.error();
                    ConsoleLogs.showErrorMessage(`Could not create an app named ${appName} ` + error);
                    reject(error);  // Reject the promise on exception
                }
            });
        });
    }

    /**
     * ask the user for the app name
     * @return {Promise<*|string>} the app name
     */
    static async askName() {
        const controllerAnswers = await inquirer.prompt({
            name: 'app_name',
            type: 'input',
            message: 'What is the App name?',
            default() {
                return "";
            },
        })

        if (controllerAnswers.app_name === "") {
            console.log(chalk.red("Please enter a valid name with only letters A -> Z"));
            return await this.askName()
        }

        return controllerAnswers.app_name.toLowerCase();
    }

    /**
     * overwrite the content of the current view/urls.py
     * @param viewName
     */
    static createUrls(viewName) {
        const currentDir = process.cwd();
        const fileContent = this.getUrlsContent().replaceAll("{%ViewName%}", viewName);
        fs.writeFileSync(`${currentDir}/${viewName}/urls.py`, fileContent);
    }

    /**
     * get the BarebonesUrls.txt content
     * @return {string} BarebonesUrls.txt content
     */
    static getUrlsContent() {
        const urlsFilePath = path.join(dirname, './template-files/BareboneUrls.txt');
        return fs.readFileSync(urlsFilePath, 'utf8');
    }

    /**
     * created a view for the given name
     * @param viewName the name of the view
     */
    static generateBasicView(viewName) {
        const viewTemplateLink = path.join(dirname, './template-files/BareboneViews.txt');
        const viewContent = fs.readFileSync(viewTemplateLink, 'utf8').replaceAll("{%VIEW_NAME%}", viewName);
        fs.writeFileSync(`${process.cwd()}/${viewName}/views.py`, viewContent);
    }

    /**
     * create a template directory for the app and a basic template that extends from the one in the root/Templates folder
     * @param viewName the view name
     */
    static generateTemplateDirectory(viewName) {
        fs.mkdirSync(`${process.cwd()}/${viewName}/Templates`);
        const templateTemplateLink = path.join(dirname, './template-files/BareboneTemplate.txt');
        const templateTemplate = fs.readFileSync(templateTemplateLink, 'utf8');
        fs.writeFileSync(`${process.cwd()}/${viewName}/Templates/${viewName}.index.html`, templateTemplate)
    }

    /**
     * Allow the creation of template for the app in the settings.py app
     * @param appName the app name
     */
    static allowTemplates(appName){
        const settings = fs.readFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`).toString();
        const currentTemplates = settings.match(/'DIRS': \[(.*?)\]/m)

        const newDirUpdated = `'DIRS': [${currentTemplates[1]}${currentTemplates[1].length>0? ",":""}'${appName}/Templates']`

        const newSettings = settings.replace(/'DIRS': \[(.*?)\]/m, newDirUpdated)
        fs.writeFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`, newSettings)
    }

    /**
     * generate a rooting in the urls.py file
     * @param viewName the app name
     */
    static generateRootRouting(viewName){
        const urls = fs.readFileSync(`${process.cwd()}/${path.basename(process.cwd())}/urls.py`).toString();
        const currentTemplates = urls.match(/urlpatterns\s*=\s*\[\s*([^\]]*?)\s*\]/m)

        const newUrl = `\npath('${viewName}/', include('${viewName}.urls'))`
        const newRooting = `urlpatterns = [${currentTemplates[1]}${newUrl},\n]`

        const newUrls = urls.replace(/urlpatterns\s*=\s*\[\s*([^\]]*?)\s*\]/m, newRooting)
        fs.writeFileSync(`${process.cwd()}/${path.basename(process.cwd())}/urls.py`, newUrls)
    }

    /**
     * Install the app in the settings.py file
     * @param appName the app name
     */
    static installingTheApp(appName) {
        const settings = fs.readFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`).toString();
        let reg = /INSTALLED_APPS\s*=\s*\[\s*((?:.|\r|\n)*?)\s*\]/
        const currentTemplates = settings.match(reg)

        const newSettingsUpdated = `INSTALLED_APPS = [\n    ${currentTemplates[1]}${currentTemplates[1].length>0? "\n    ":""}'${appName}',\n]`

        const newSettings = settings.replace(reg, newSettingsUpdated)
        fs.writeFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`, newSettings)
    }

    /**
     * generate the BareboneFormsAuth.txt file for the app
     * @param appName the app name
     */
    static generateFormFile(appName) {
        fs.writeFileSync(`${process.cwd()}/${appName}/forms.py`, 'from django import forms');
    }
}