// ==UserScript==
// @name         Remove Pinterest Image Blur
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Remove inline blur from images on Pinterest Finland site
// @author       Luna
// @match        https://fi.pinterest.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function removeBlur() {
    let images = document.querySelectorAll('img');
    console.log(images)
    images.forEach(img => {
      if (img.style.filter.includes('blur')) {
        img.style.filter = '';
      }
    });
  }

  function removeBlurRecursive(node) {
    if (node.childNodes.length > 0) {
      node.childNodes.forEach(child => {
        removeBlurRecursive(child);
      });
    }
    if (node.tagName === 'IMG') {
      if (node.style.filter.includes('blur')) {
        node.style.filter = '';
      }
    }
  }

  // Initial call to remove blur
  removeBlur();

  // Set up a MutationObserver to handle dynamically loaded images
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        console.log(mutation.addedNodes)
        mutation.addedNodes.forEach(node => {
          removeBlurRecursive(node);
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
