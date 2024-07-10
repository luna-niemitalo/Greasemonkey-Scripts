// popup.js

(function() {
    // Create the popup div
    const popup = document.createElement('div');
    popup.id = 'custom-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    popup.style.zIndex = '10000';

    // Add some text to the popup
    const popupText = document.createElement('p');
    popupText.textContent = 'Hello! This is your custom popup.';
    popup.appendChild(popupText);

    // Add a close button to the popup
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => document.body.removeChild(popup);
    popup.appendChild(closeButton);

    // Append the popup to the body
    document.body.appendChild(popup);
})();
