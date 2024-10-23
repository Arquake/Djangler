import {spawn} from "child_process";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import chalk from "chalk";
import ConsoleType from "../../Components/ConsoleType.js";

export default class MakeMigration {

    /**
     * make a migration of the models in the project
     */
    static makeMigration() {
        let err = false;

        let com = spawn(`python3`, ['manage.py', 'makemigrations'], {'shell': ConsoleType.getShell(), env: { ...process.env, PYTHONUNBUFFERED: '1' }});

        com.stdout.on("data", data => {
            process.stdout.write(data);
        });

        com.stderr.on("data", data => {
            process.stderr.write(data);
            err = true
        });

        com.on('error', (error) => {
            process.stderr.write(error);
            err = true
        });

        com.on("close", code => {
            if(err) {
                ConsoleLogs.showErrorMessage("An error occurred while making the migrations")
            }
            else {
                ConsoleLogs.showSuccessMessages(["Migration made successfully !", "Run 'dja m apply' to apply the migrations"])
            }
        });
    }
}