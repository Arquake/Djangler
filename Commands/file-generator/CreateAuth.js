import CreateUnderApp from "./CreateUnderApp.js";
import fs from "fs";
import {dirname} from "../../dirname.js";
import path from "node:path";
import ConsoleLogs from "../../console-logs/ConsoleLogs.js";


export default class CreateAuth {

    static async handleCommand() {
        await CreateUnderApp.createApp('authentication');
        this.addAuthToSettings();
        this.makeUrls();
        this.makeForms();
        this.makeModels();
        this.makeViews();
        this.generateTemplates();

        ConsoleLogs.showSuccessMessages(['Authentication created with success!','Run \'dja m migrate\' to migrate the changes'])
    }

    /**
     * add into settings.py the essentials variables to make authentication possible
     */
    static addAuthToSettings(){
        const content = '\n\n'+
            'LOGIN_URL = \'authentication_login\'\n' +
            'AUTH_USER_MODEL = \'authentication.User\''

        fs.appendFileSync(`${process.cwd()}/${path.basename(process.cwd())}/settings.py`, content)
    }

    /**
     * // overwrite the views.py with the 'BareboneViewsAuth.txt' content
     */
    static makeViews(){
        const content = fs.readFileSync(dirname+'/template-files/auth-template/BareboneViewsAuth.txt', 'utf8')
        fs.writeFileSync('authentication/views.py', content);
    }

    /**
     * overwrite the urls.py file with the 'BareboneUrlsAuth.txt' content
     * change the current '/authentication' routing inside the base/urls.py
     */
    static makeUrls(){
        const content = fs.readFileSync(dirname+'/template-files/auth-template/BareboneUrlsAuth.txt', 'utf8')
        fs.writeFileSync('authentication/urls.py', content);
    }

    /**
     * overwrite the forms.py file with the 'BareboneFormsAuth.txt' content
     */
    static makeForms(){
        const content = fs.readFileSync(dirname+'/template-files/auth-template/BareboneFormsAuth.txt', 'utf8')
        fs.writeFileSync('authentication/forms.py', content);
    }

    /**
     * overwrite the models.py file with the 'BareboneModelAuth.txt' content
     */
    static makeModels(){
        const content = fs.readFileSync(dirname+'/template-files/auth-template/BareboneModelAuth.txt', 'utf8')
        fs.writeFileSync('authentication/models.py', content);
    }

    /**
     * clear the template dir
     * generate the templates for the authentication
     */
    static generateTemplates(){
        fs.unlinkSync('authentication/Templates/authentication.index.html')
        fs.writeFileSync('authentication/Templates/authentication.register.html',fs.readFileSync(dirname + '/template-files/auth-template/Templates/authentication.register.txt','utf8'));
        fs.writeFileSync('authentication/Templates/authentication.login.html',fs.readFileSync(dirname + '/template-files/auth-template/Templates/authentication.login.txt','utf8'))
        fs.writeFileSync('authentication/Templates/authentication.home.html',fs.readFileSync(dirname + '/template-files/auth-template/Templates/authentication.home.txt','utf8'))
    }
}