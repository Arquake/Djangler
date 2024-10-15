import chalk from "chalk";
import ConsoleLogs from "../console-logs/ConsoleLogs.js";

/**
 * the list of all available commands
 * @type {{help: string, new: string, s: string, g: string, m: string}}
 */
const commandList = {
    help: 'help : list all of the available commands\n'+
        '\t--command_name : help on the given command name',
    new: 'new : ask you the name of the new project and generate it',
    s: 's : run a local dev server',
    g: 'g {type} : generate a new component\n' +
        '\t{type} :\n' +
        '\ta : generate a new app\n' +
        '\t\t-app_name : The application name\n' +
        '\tm : generate a new model\n' +
        '\t\t-app_name : The application in which you want to modify models\n' +
        '\t\t--model_name : The model name to create or update\n' +
        '\t\t---mf : If it has to create forms and routing for the model',
    m: 'm : migrations commands\n' +
        '\tmigrate : make a migration for the project\n' +
        '\tapply : apply migrations to the database'
}


export default class Help {

    /**
     * handler of the help command
     * if no parameter given print in the console all the available commands
     * if flags are detected calls handleFlag()
     * if more flags are detected print in the console an error message
     * @param commands the flags given
     */
    static handleCommand(commands) {
        if(commands.length === 0) {
            let allHelp = ""
            for(const [key, value] of Object.entries(commandList)) {
                allHelp += `\n${value}\n`
            }
            console.log(chalk.green(allHelp));
        }
        else if (commands.length === 1) {
            this.handleFlags(commands[0])
        }
        else {
            ConsoleLogs.showErrorMessages("Too many parameters given")
        }
    }

    /**
     * handle the flags :
     * --name with the name of the component to provide help on
     * @param flags all of the available flags
     */
    static handleFlags(flags) {
        if ((/^--[a-zA-Z]+$/).test(flags)){
            const commandName = flags.replace("--","")
            if(commandList[commandName] && commandName.length !== 0){
                console.log(chalk.green("\n" + commandList[commandName] + "\n"));
            }
            else {
                ConsoleLogs.showErrorMessages([`No command named '${commandName}'`, `See all commands available with 'dja help'`])
            }
        }
        else {
            ConsoleLogs.showErrorMessages(['Invalid flag','Try \'dja help --command_name\''])
        }
    }
}