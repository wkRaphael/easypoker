import newAlert from './modules/alertModule.js';
import sendPOST from './modules/network.js';

const sendToApp = () => {
    window.location.href = "/play";
}

const createAccount = () => {
    const username = document.getElementById("UsernameInput").value;
    const email = document.getElementById("EmailInput").value;
    const password = document.getElementById("PasswordInput").value;
    // Validate input
    const conditionalArray = [typeof username == "string", typeof password == "string",
        password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
    if (!conditionalArray.includes(false)){
        const route = "/sign-up";
        const credentials = {
            username: username,
            email: email,
            password: password
        };
        sendPOST(route, credentials, (error, response) => {
            if (error) {
                newAlert(`Attempt to create account with username '${credentials.username}', email '${credentials.email}', and a password failed!`, '#FF0000', 5);
                console.error(error);
            } else {
                if (response.wasCreated) {
                newAlert(`Account Created!`, '#00FF02', 1);
                    sendToApp();
                } else {
                    newAlert(`<span style="color: #FF6767;"><strong>${response.error}</strong></span>`, '#FF8A00', 4);
                }
            }
        });
    } else {
        newAlert("Credentials Invalid!", '#FF8A00', 4);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.querySelector('#signup');
    loginButton.addEventListener('click', createAccount);
});