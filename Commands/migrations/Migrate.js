import {spawn} from "child_process";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";
import ConsoleType from "../../Components/ConsoleType.js";

export default class Migrate {

    /**
     * apply all the migrations in the project in the database
     */
    static migrate(){
        let err = false;

        let com = spawn(ConsoleType.getPythonType(), ['manage.py', 'migrate'], {'shell': ConsoleType.getShell(), env: { ...process.env, PYTHONUNBUFFERED: '1' }});

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
                ConsoleLogs.showErrorMessage("An error occurred while applying the migrations")
            }
            else {
                ConsoleLogs.showSuccessMessage("Migrations applied successfully !")
            }
        });
    }
}