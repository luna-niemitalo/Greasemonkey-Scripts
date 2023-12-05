// ==UserScript==
// @name         FlexHRM filler
// @version      1.3
// @description  Sets the value of valid elements to project on DOM updates after the page has loaded
// @author       Luna
// @match        https://aspia2.flexhosting.se/*
// @grant        none
// ==/UserScript==

(function() {
    const project = '1008 - Cloud'

    'use strict';
    // Function to validate selection based on criteria
    function validateSelection(element) {
        // Find a parent element with class 'row'
        const row = element.closest('.row');

        // Check if a parent row is found
        if (row) {
            // Find an element with class 'cell Tid readonly' within the row
            const cell = row.querySelector('.cell.Tid.readonly');

            // Check if the cell is found and its title has text
            return cell && cell.title.trim() !== '';
        }

        return false;
    }

    // Function to set the value of valid elements
    function setElementValue(element, value) {
        element.value = value;
        element.setAttribute('value',value);
        element.setAttribute('title',value);
        element.setAttribute('data-parsed', 'parsed');
        element.setAttribute('data-entitydescription', value);
        element.setAttribute('aria-invalid', false);
    }

    // Function to be executed when the DOM is updated
    function onDomUpdate(mutations) {
        console.log('DOM updated!');

        // Select all elements with 'Konteringar' in the ID that are not hidden and have an initial value of ''
        const elements = document.querySelectorAll('[id*="Konteringar"]:not([style*="display: none"]):not([type="hidden"])');
        console.log('Checking elements:', elements);

        // Check and set the value for each selected element
        elements.forEach(element => {
            const isValid = validateSelection(element);
            console.log('Element is valid:', isValid);

            if (isValid) {
                // Set the value to project
                setElementValue(element, project);
            } else {
                // Set the value to ''
                setElementValue(element, '');
            }
        });
    }

    // Configure and start the MutationObserver
    const observer = new MutationObserver(onDomUpdate);
    observer.observe(document.body, { childList: true, subtree: true });

})();
