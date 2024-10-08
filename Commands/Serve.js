import {spawn} from "child_process";
import ConsoleLogs from "../console-logs/ConsoleLogs.js";
import chalk from "chalk";

export default class Serve {

    static handleCommand(command) {
        let com = spawn(`python`, ['manage.py', 'runserver'], {'shell':'powershell.exe', env: { ...process.env, PYTHONUNBUFFERED: '1' }});

        com.stdout.on("data", data => {
            process.stdout.write(data);
        });

        com.stderr.on("data", data => {
            process.stderr.write(data);
        });

        com.on('error', (error) => {
            ConsoleLogs.showErrorMessage("An error occurred while starting the server")
        });

        com.on("close", code => {
            console.log(chalk.yellow(`Shutting down the server`));
        });
    }
}