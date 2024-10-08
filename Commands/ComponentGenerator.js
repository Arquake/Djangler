import CreateView from "./file-generator/CreateView.js";
import CreateUnderApp from "./file-generator/CreateUnderApp.js";

export default class ComponentGenerator {

    static async handleCommand(command){
        if (command.length > 0){
            try {
                switch(command[0]){
                    case 'a':
                        await CreateUnderApp.handleCommand(command.slice(1));
                        break;
                    case 'v':
                        await CreateView.handleCommand(command.slice(1))
                        break;
                    case 'm':
                        console.log('Create Model')
                        break;
                    case 'md':
                        console.log('Create Middleware')
                        break;
                    default:
                        throw new Error("invalid parameters");
                }
            }
            catch (error) {
                throw error;
            }
        }

        else {
            console.log("Ask");
        }
    }
}