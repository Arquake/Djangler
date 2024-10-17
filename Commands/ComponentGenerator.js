import CreateView from "./file-generator/CreateView.js";
import CreateUnderApp from "./file-generator/CreateUnderApp.js";
import CreateModel from "./file-generator/CreateModel.js";
import ConsoleLogs from "../console-logs/ConsoleLogs.js";
import inquirer from "inquirer";

export default class ComponentGenerator {

    /**
     * handle the creation of component creation
     * @param command the command with only what is after 'dja g'
     */
    static async handleCommand(command){
        if (command.length > 0){
            await this.makeComponent(command)
        }

        else {
            let choice = await inquirer.prompt({
                name: 'type',
                type: 'list',
                message: 'What do you want to create?',
                choices: ["application","model","view"]
            })

            let choiceAbreviation = ""

            switch (choice.type){
                case "application":
                    choiceAbreviation = "a"
                    break;
                case "model":
                    choiceAbreviation = "m"
                    break;
                case "view":
                    choiceAbreviation = "v"
                    break;
                default:
                    break;
            }

            await this.makeComponent([choiceAbreviation])
        }
    }

    /**
     * send the request to the correct component generator
     * @param command the command given by the user
     */
    static async makeComponent(command) {
        switch(command[0]){
            // Handle app creation commands
            case 'a':
                await CreateUnderApp.handleCommand(command.slice(1));
                break;
            // Handle view creation commands
            case 'v':
                await CreateView.handleCommand(command.slice(1))
                break;
            // Handle model creation commands
            case 'm':
                await CreateModel.handleCommand(command.slice(1));
                break;
            default:
                ConsoleLogs.showErrorMessages(["The command don't exist", "Run 'dja help' to get help"])
                break;
        }
    }
}