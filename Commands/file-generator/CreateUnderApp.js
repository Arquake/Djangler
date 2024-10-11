import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import fs from "fs";
import path from "node:path";
import {dirname} from "../../dirname.js";
import {spawn} from "child_process";
import inquirer from "inquirer";
import InvalidInputError from "../../Errors/InvalidInputError.js";
import {createSpinner} from "nanospinner";

export default class CreateUnderApp {
    static async handleCommand(command) {
        try {
            let viewName = "";
            if (command.length > 0) {
                if ((/--[a-zA-Z-]*/g).test(command[0])) {
                    viewName = command[0].replace("--", "");
                    this.createApp(viewName);
                }
                else {
                    throw new Error('Invalid Parameter')
                }
            }
            else {
                viewName = await this.askName();
                this.createApp(viewName);
            }
        }
        catch (error) {
            ConsoleLogs.showErrorMessage(error.message);
        }
    }

    static createApp(viewName) {

        viewName = viewName.toLowerCase()

        let errorStatus = false
        let spinner = createSpinner(' Creating project').start();
        let com = spawn(`python`, ['manage.py', 'startapp', `${viewName}`], {'shell':'powershell.exe', env: { ...process.env, PYTHONUNBUFFERED: '1' }});

        com.stdout.on("data", data => {
        });

        com.stderr.on("data", data => {
            spinner.error()
            ConsoleLogs.showErrorMessage(`Could not create an app named ${viewName}`)
            errorStatus = true
        });

        com.on('error', (error) => {
            spinner.error()
            ConsoleLogs.showErrorMessage(`Could not create an app named ${viewName}`)
            errorStatus = true
        });

        com.on("close", code => {
            try {
                if (!errorStatus) {
                    spinner.success({text: ` created !`})

                    spinner = createSpinner(' Creating urls').start();
                    this.createUrls(viewName)
                    spinner.success()

                    spinner = createSpinner(' Creating views').start();
                    this.generateBasicView(viewName)
                    spinner.success()

                    spinner = createSpinner(' Creating template directory').start();
                    this.generateTemplateDirectory(viewName)
                    spinner.success()

                    spinner = createSpinner(' Generating basic view').start();
                    this.generateBasicView(viewName)
                    spinner.success()

                    spinner = createSpinner(' Enabling templates').start();
                    this.allowTemplates(viewName)
                    spinner.success()

                    spinner = createSpinner(' Generating rooting').start();
                    this.generateRootRouting(viewName)
                    spinner.success()




                    const successMessage = viewName + " View generated with success !"
                    ConsoleLogs.showSuccessMessage(successMessage);
                }
            }
            catch (error) {
                spinner.error()
                ConsoleLogs.showErrorMessage(`Could not create an app named ${viewName} ` + error )
            }
        });
    }

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
            throw new InvalidInputError();
        }

        return controllerAnswers.app_name.toLowerCase();
    }


    static createUrls(viewName) {

        const currentDir = process.cwd();

        const fileContent = this.getUrlsContent();
        fs.writeFileSync(`${currentDir}/${viewName}/urls.py`, fileContent);
    }

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
        const viewContent = fs.readFileSync(viewTemplateLink, 'utf8').replace("{%VIEW_NAME%}", viewName);
        fs.writeFileSync(`${process.cwd()}/${viewName}/views.py`, viewContent);
    }

    static generateTemplateDirectory(viewName) {
        fs.mkdirSync(`${process.cwd()}/${viewName}/Templates`);
        const templateTemplateLink = path.join(dirname, './template-files/BareboneTemplate.txt');
        const templateTemplate = fs.readFileSync(templateTemplateLink, 'utf8');
        fs.writeFileSync(`${process.cwd()}/${viewName}/Templates/index.html`, templateTemplate)
    }

    static allowTemplates(viewName){
        const settings = fs.readFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`).toString();
        const currentTemplates = settings.match(/'DIRS': \[(.*?)\]/m)

        const newImport = `os.path.join(BASE_DIR, '${viewName}/Templates')`
        const newDirUpdated = `'DIRS': [${currentTemplates[1]}${currentTemplates[1].length>0? ",":""}${newImport}]`

        const newSettings = settings.replace(/'DIRS': \[(.*?)\]/m, newDirUpdated)
        fs.writeFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`, newSettings)
    }


    static generateRootRouting(viewName){
        const urls = fs.readFileSync(`${process.cwd()}/${path.basename(process.cwd())}/urls.py`).toString();
        const currentTemplates = urls.match(/urlpatterns\s*=\s*\[\s*([^\]]*?)\s*\]/m)

        const newUrl = `\npath('${viewName}/', include('${viewName}.urls'))`
        const newDirUpdated = `urlpatterns = [${currentTemplates[1]}${newUrl},\n]`

        const newUrls = urls.replace(/urlpatterns\s*=\s*\[\s*([^\]]*?)\s*\]/m, newDirUpdated)
        fs.writeFileSync(`${process.cwd()}/${path.basename(process.cwd())}/urls.py`, newUrls)
    }
}