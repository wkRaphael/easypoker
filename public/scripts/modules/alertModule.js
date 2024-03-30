// Globals
let alertIndex = 0;

const removeAlert = (alertId) => {
    const alert = document.getElementById(alertId);
    if (alert){
        alert.remove();
    } else{
        console.error(`No alter with id '${alertId}`);
    }
}

export default (alertMsg, alertColor, alertLength) => {
    const borderRadius = '4px';
    // Create a new alertColumn if one doesn't already exist
    let alertColumn = document.querySelector('.AlertColumn');
    if (!alertColumn){
        alertColumn = document.createElement('div');
        alertColumn.className = 'AlertColumn';
        alertColumn.style.position = 'absolute';
        alertColumn.style.margin = '10px';
        alertColumn.style.bottom = '0';
        alertColumn.style.right = '0';
        alertColumn.style.display = 'flex';
        alertColumn.style.flexDirection = 'column';
        alertColumn.style.cursor = 'pointer';
    }

    let alertDiv = document.createElement('div');
    alertDiv.className = 'Alert';
    alertDiv.id = `Alert${alertIndex}`;
    alertDiv.style.display = 'flex';
    alertDiv.style.margin = '15px';
    alertDiv.style.position = 'relative';
    alertDiv.style.backgroundColor = '#525252';
    alertDiv.style.height = '100px'
    alertDiv.style.color = "#FFFFFF";
    alertDiv.onclick = () => {
        removeAlert(alertDiv.id)
    };
    alertDiv.style.borderRadius = borderRadius;
    alertColumn.appendChild(alertDiv);

    let alertProgressBar = document.createElement('div');
    alertProgressBar.className = 'AlertProgressBar';
    alertProgressBar.id = `AlertProgressBar${alertIndex}`;
    alertProgressBar.style.backgroundColor = alertColor;
    alertProgressBar.style.borderTopLeftRadius = borderRadius;
    alertProgressBar.style.borderBottomLeftRadius = borderRadius;
    alertProgressBar.style.height = alertDiv.style.offsetHeight;
    alertProgressBar.style.width = 'max(5px, 0.3vh)';
    alertDiv.appendChild(alertProgressBar);

    let alertWrapper = document.createElement('div');
    alertWrapper.className = 'AlertWrapper';
    alertWrapper.style.padding = '5px';
    alertWrapper.style.width = 'max(150px, 6vw)';
    alertWrapper.innerHTML = DOMPurify.sanitize(alertMsg);

    alertDiv.appendChild(alertWrapper);
    document.body.appendChild(alertColumn);

    let timer = alertLength; // Initial time (in seconds)
    timer = timer * 100; // Time in ms
    // Update timer every 1 milliseconds
    const interval = setInterval(() => {
        timer -= 1; // Decrease timer
        const previousHeight = parseInt(alertProgressBar.style.height, 10);
        if (previousHeight != Math.round(timer / alertLength)){
            alertProgressBar.style.height = `${Math.round(timer / alertLength)}%`;
        }
        if (timer <= 0) {
            alertDiv.remove();
            clearInterval(interval);
        }
    }, 10); // Interval in milliseconds

    alertIndex++;
}