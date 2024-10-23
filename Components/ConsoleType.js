import * as os from "node:os";

export default class ConsoleType {
    /**
     * return the shell to use according to the os
     * @return {string} powershell for windows | bin/bash for linux or mac
     */
    static getShell() {
        const platform = os.platform();
        if (platform === 'win32') {
            return 'powershell.exe';
        } else if (platform === 'linux' || platform === 'darwin') {
            return '/bin/bash';
        } else {
            throw new Error(`Unsupported platform: ${platform}`);
        }
    }
}