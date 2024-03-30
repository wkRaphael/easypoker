import newAlert from './modules/alertModule.js';

const sendPOST = (route, dataToSend, callback) => {
    const options = {
        method: "POST",
        body: JSON.stringify(dataToSend),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    };
    fetch(route, options)
        .then(response => response.json())
        .then(data => callback(null, data))
        .catch(error => callback(error, null));
    
}

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
                console.log(`Logging in with account with username '${credentials.username}' failed!`);
                console.error(error);
            } else {
                /** @todo Ensure json property names are implemented correctly!*/ 
                if (response.loginSuccess) {
                    console.log(`Logging in with username '${credentials.username}' was successful!`);
                    localStorage.setItem("username", credentials.username);
                    sendToApp();
                } else {
                    console.log(`Logging in with username '${credentials.username}' failed!`);
                }
            }
        });
    } else {
        console.log("Credentials Invalid!")
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.querySelector('.Submit');
    loginButton.addEventListener('click', login);
});