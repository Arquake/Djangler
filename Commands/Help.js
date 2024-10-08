import chalk from "chalk";

export default class Help {
    static handleCommand(commands) {
        if(commands.length === 0) {
            console.log (chalk.green(
                'help : list all of the available commands' +
                '\n\n' +
                'new : ask you the name of the new project and generate it' +
                '\n\n' +
                's : run a local dev server' +
                '\n\n' +
                'new : generate a new project \n\n' +
                'g type -flag --component_name : generate a new component \n' +
                '\ta : generate a new app \n' +
                /*'\tv -app_name : generate a new view with its template\n' +*/
                '\n\n'
            ));
        }
    }

    static handleFlags(flags) {

    }
}