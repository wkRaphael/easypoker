import newAlert from './modules/alertModule.js';
import sendPOST from './modules/network.js';

const sendToApp = () => {
    window.location.href = "/play";
}

const login = () => {
    const username = document.getElementById("UsernameInput").value;
    const password = document.getElementById("PasswordInput").value;
    // Validate input
    const conditionalArray = [typeof username == "string", typeof password == "string",
        password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
    if (!conditionalArray.includes(false)){
        const route = "/login";
        const credentials = {
            username: username,
            password: password
        };
        sendPOST(route, credentials, (error, response) => {
            if (error) {
                newAlert(`Login failed with error ${error}`, '#FF0000', 5);
                console.error(error);
            } else {
                if (response.loginSuccess) {
                    newAlert(`Logging in with username '${credentials.username}' was successful!`, '#00FF02', 1);
                    localStorage.setItem("username", credentials.username);
                    sendToApp();
                } else {
                    newAlert(`Incorrect password for user '${credentials.username}'`, '#FF8A00', 4);
                }
            }
        });
    } else {
        newAlert("Credentials Invalid!", '#FF8A00', 4);
    }
}
const signup = () => {

   window.location.href = window.location.origin + "/sign-up"
}
document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.querySelector('#login');
    loginButton.addEventListener('click', login);
});