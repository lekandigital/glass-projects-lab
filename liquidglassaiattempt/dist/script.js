// Self-executing anonymous function to encapsulate our code
(() => {
    // Get references to all the necessary elements from the DOM
    const menuTrigger = document.getElementById('menu-trigger');
    const menuHandle = document.querySelector('.menu-handle');
    const body = document.body;

    // Function to open the menu by adding a class to the body
    const openMenu = () => body.classList.add('menu-active');
    
    // Function to close the menu by removing the class
    const closeMenu = () => body.classList.remove('menu-active');

    // Attach the functions to the click events
    menuTrigger.addEventListener('click', openMenu);
    menuHandle.addEventListener('click', closeMenu);

    // Reusable function to set up a slider and its value display
    const setupSlider = (sliderId, valueId) => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        if (slider && valueDisplay) {
            // Update the display text whenever the slider value changes
            slider.addEventListener('input', (event) => {
                valueDisplay.textContent = event.target.value;
            });
        }
    };
    
    // Set up both sliders
    setupSlider('brightness-slider', 'brightness-value');
    setupSlider('volume-slider', 'volume-value');
})();