// ==UserScript==
// @name         Custom CSS Injector
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Inject custom CSS per domain
// @author       Luna
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const KEY_COMBINATION = ["AltLeft", "ControlLeft", "KeyS"]; // Example: Ctrl+Alt+C+S

  let pressedKeys = new Set();

  // Create the text box with Save and Close buttons
  function createTextBox() {
    const container = document.createElement('div');
    container.id = 'custom-css-container';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.width = '320px';
    container.style.height = '260px';
    container.style.zIndex = '10000';
    container.style.backgroundColor = '#fff';
    container.style.border = '1px solid #ccc';
    container.style.padding = '10px';
    container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    container.style.display = 'none';

    const textBox = document.createElement('textarea');
    textBox.id = 'custom-css-textbox';
    textBox.style.width = '300px';
    textBox.style.height = '200px';
    textBox.style.marginBottom = '10px';
    textBox.style.fontSize = '14px';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.marginRight = '10px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';

    container.appendChild(textBox);
    container.appendChild(saveButton);
    container.appendChild(closeButton);
    document.body.appendChild(container);

    // Load existing CSS if any
    const savedCSS = localStorage.getItem(location.origin);
    if (savedCSS) {
      textBox.value = savedCSS;
    }

    saveButton.addEventListener('click', () => {
      const css = textBox.value;
      localStorage.setItem(location.origin, css);
      applyCSS(css);
      container.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
      container.style.display = 'none';
    });

    return container;
  }

  // Apply the CSS to the page
  function applyCSS(css) {
    let styleElement = document.getElementById('custom-css-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-css-style';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  }

  // Apply saved CSS on page load
  function applySavedCSS() {
    const savedCSS = localStorage.getItem(location.origin);
    if (savedCSS) {
      applyCSS(savedCSS);
    }
  }

  // Listen for keydown and keyup events
  document.addEventListener('keydown', (event) => {
    pressedKeys.add(event.code);
    if (KEY_COMBINATION.every(key => pressedKeys.has(key))) {
      const container = document.getElementById('custom-css-container') || createTextBox();
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
      if (container.style.display === 'block') {
        container.querySelector('#custom-css-textbox').focus();
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    pressedKeys.delete(event.code);
  });

  // Apply the saved CSS when the page loads
  applySavedCSS();
})();
