// popup.js

(function() {
    let globalAction = null;

    // Function to set the global action
    window.setAction = function(action) {
        if (typeof action === 'function') {
            globalAction = action;
        }
    };

    // Create the popup container
    const popup = document.createElement('div');
    popup.id = 'custom-popup';
    popup.style.position = 'fixed';
    popup.style.bottom = '0';
    popup.style.right = '-300px'; // Start off-screen
    popup.style.width = '300px';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    popup.style.transition = 'right 0.3s';
    popup.style.zIndex = '10000';

    // Slide in/out button
    const slideButton = document.createElement('button');
    slideButton.textContent = 'Slide In/Out';
    slideButton.style.position = 'absolute';
    slideButton.style.left = '-100px';
    slideButton.style.top = '50%';
    slideButton.style.transform = 'translateY(-50%)';
    slideButton.onclick = () => {
        if (popup.style.right === '0px') {
            popup.style.right = '-300px';
        } else {
            popup.style.right = '0px';
        }
    };
    document.body.appendChild(slideButton);

    // Text box
    const textBox = document.createElement('input');
    textBox.type = 'text';
    textBox.placeholder = 'Enter text here...';
    textBox.style.width = '100%';
    popup.appendChild(textBox);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-around';
    buttonsContainer.style.marginTop = '10px';
    popup.appendChild(buttonsContainer);

    // Function to create a button
    window.createButton = function(title, callback) {
        const button = document.createElement('button');
        button.textContent = title;
        button.onclick = callback;
        buttonsContainer.appendChild(button);
    };

    // Append the popup to the body
    document.body.appendChild(popup);
})();
