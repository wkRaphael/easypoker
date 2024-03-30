sendPOST = (route, dataToSend, callback) => {
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

sendToApp = () => {
    window.location.href = "/play";
}

createAccount = () => {
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
                console.log(`Attempt to create account with username '${credentials.username}', email '${credentials.email}', and a password failed!`);
                console.error(error);
            } else {
                /** @todo Ensure json property names are implemented correctly!*/ 
                if (response.createAccountSuccess) {
                    console.log(`Attempt to create account with username '${credentials.username}', email '${credentials.email}', and a password succeeded!`);
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