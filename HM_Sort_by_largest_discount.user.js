// ==UserScript==
// @name     H&M Sort by largest discount (Discontinued / not working)
// @version  1.1
// @match        https://www2.hm.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js
// @grant    none
// ==/UserScript==


function sort_items() {
    // Select all the list items
    listItems = $("li.product-item");
    console.log("sorting")

    // Sort the list items based on the percentage marker value
    listItems.sort(function(a, b) {
        const aPercentage = parseFloat($(a).find(".percentage-marker").text());
        const bPercentage = parseFloat($(b).find(".percentage-marker").text());
        return aPercentage - bPercentage;
    });

    // Append the sorted list items back to their parent container
    listItems.appendTo(listItems.parent());
}

// Add option to the dropdown list and bind the sort function
function addSortOption() {
    // Create the new list item
    const listItem = $('<li class="inputwrapper"></li>');
    const input = $('<input class="custom-input" type="radio" data-name="sort" name="dropdown-sort" id="dropdown-sort-largestdiscount" value="largestDiscount">');
    const label = $('<label class="label" for="dropdown-sort-largestdiscount">Paras Alennus</label>');

    // Append the input and label to the list item
    listItem.append(input, label);

    // Bind the sort function to the new option
    input.on("click", function(event) {
        //$("#dropdown-sort-largestdiscount").prop('checked', true);
        event.preventDefault(); // Prevent the default action
        sort_items();
        setTimeout(() => {$("#dropdown-sort-largestdiscount").prop('checked', true);}, 100);
    });

    // Append the new list item to the dropdown list
    $(".dropdown-list").append(listItem);
    $("#dropdown-sort-largestdiscount").prop('checked', true);

}


// Flag to track if the scroll event is triggered by a script
let isScriptTriggeredScroll = false;

// Function to set the flag for script-triggered scroll
function triggerScriptScroll() {
    isScriptTriggeredScroll = true;

    // Call the function to sort items (replace with your own function name)
    const selectedSortOption = $('input[name="dropdown-sort"]:checked').val();
    console.log(selectedSortOption)
    if (selectedSortOption === "largestDiscount") {
        sort_items();
    }

    // Usage example
    waitForAjaxComplete().then(() => {
        // Reset the flag after a delay to allow normal scrolling behavior
        setTimeout(() => {
            isScriptTriggeredScroll = false;
        }, 100);
    });

}

let scrollPos = 0;
// Intercept the scroll event
window.addEventListener('scroll', function(event) {
    // Check if the event is triggered by a script
    if (isScriptTriggeredScroll) {
        // Prevent the default scrolling behavior
        event.preventDefault();
        event.stopPropagation();

        // Reset the scroll position to the top
        document.documentElement.scrollTop = scrollPos;
        setTimeout( () => {document.body.scrollTop = scrollPos;}, 100);
    }
}, { capture: true, passive: false });




// Attach event listener to the "load-more-products" button
document.addEventListener('click', function(e) {
    scrollPos = document.documentElement.scrollTop;
    if (e.target.matches('.button.js-load-more')) {
        triggerScriptScroll();
    }
});

// Function to re-add the "Paras Alennus" option after form changes
function readdSortOption() {
    // Check if the "Paras Alennus" option exists
    if ($("#dropdown-sort-largestdiscount").length === 0) {
        addSortOption();
        setTimeout(() => {$("#dropdown-sort-largestdiscount").prop('checked', true);}, 100)

    }
}

function waitForAjaxComplete() {
    return new Promise((resolve) => {
        const overlay = document.querySelector('.ajax-overlay');

        // Check if the overlay is already hidden
        if (!overlay || window.getComputedStyle(overlay).display === 'none') {
            resolve();
            return;
        }

        // Create a mutation observer to monitor changes in the overlay's style
        const observer = new MutationObserver(() => {
            if (window.getComputedStyle(overlay).display === 'none') {
                observer.disconnect(); // Stop observing
                resolve(); // Resolve the Promise
            }
        });

        // Start observing changes in the overlay's style
        observer.observe(overlay, { attributes: true });
    });
}



// Event listener for form changes
$('.js-product-filter-form').on('change', function() {
    readdSortOption();
});


// Add the 'Paras Alennus' option to the dropdown list
addSortOption();
// Move the load-more-products element above the products-listing element
$(".load-more-products").insertBefore(".products-listing");
