#!/usr/bin/env node

import Help from './Commands/Help.js';
import ComponentGenerator from "./Commands/ComponentGenerator.js";
import ConsoleLogs from "./console-logs/ConsoleLogs.js";
import CreateApp from "./Commands/CreateApp.js";
import Serve from "./Commands/Serve.js";

try {
    switch (process.argv[2]) {
        case 'g':
            await ComponentGenerator.handleCommand(process.argv.slice(3));
            break;
        case 'help':
            await Help.handleCommand(process.argv.slice(3))
            break;
        case 'new':
            await CreateApp.handleCommand(process.argv.slice(3));
            break;
        case 's':
            await Serve.handleCommand(process.argv.slice(3));
            break;
        default:
            throw new Error(`Error: Command don\'t exist`)
    }
}
catch (error) {
    ConsoleLogs.showErrorMessage(error.message)
}


