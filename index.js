#!/usr/bin/env node

import Help from './Commands/Help.js';
import ComponentGenerator from "./Commands/ComponentGenerator.js";
import ConsoleLogs from "./console-logs/ConsoleLogs.js";
import CreateApp from "./Commands/CreateApp.js";
import Serve from "./Commands/Serve.js";
import ManageMigration from "./Commands/file-generator/ManageMigration.js";
import chalk from "chalk";
import {dirname} from "./dirname.js";
import fs from "fs";

try {
    switch (process.argv[2]) {
        case 'g':
            await ComponentGenerator.handleCommand(process.argv.slice(3));
            break;
        case 'help':
            Help.handleCommand(process.argv.slice(3))
            break;
        case 'new':
            await CreateApp.handleCommand(process.argv.slice(3));
            break;
        case 's':
            Serve.handleCommand(process.argv.slice(3));
            break;
        case "m":
            ManageMigration.handleCommand(process.argv.slice(3));
            break;
        case "v":
            const version = fs.readFileSync(`${dirname}/package.json`, "utf8").match(/"version": "([0-9\\.]*)"/)[1];
            console.log(chalk.yellow(`Current version of Djangler : ${version}`))
            break;
        default:
            throw new Error(`Error: Command don\'t exist`)
    }
}
catch (error) {
    ConsoleLogs.showErrorMessage(error.message)
}


