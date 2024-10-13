import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import MakeMigration from "../migrations/MakeMigration.js";
import Migrate from "../migrations/Migrate.js";

export default class ManageMigration {

    /**
     * handle migration commands
     * @param command the flags of the command
     */
    static handleCommand(command) {
        if(command.length>0) {
            switch(command[0]) {
                case 'migrate':
                    MakeMigration.makeMigration();
                    break;
                case 'apply':
                    Migrate.migrate()
                    break;
                default:
                    ConsoleLogs.showErrorMessages(["Invalid command: 'dja m' " + command, "Try 'dja help' to get help"]);
            }
        }
        else {
            ConsoleLogs.showErrorMessages(["No flag found", "Run 'dja help' to get help"]);
        }
    }
}