/** @type {HTMLButtonElement[]} */
const carruselButtons = Array.of(...document.querySelectorAll("[data-id='about-us-carrusel-button']").values());

const carruselIndexProperty = "carrusel-index";

(() => {
    carruselButtons.forEach((button, index) => {
        button.addEventListener("click", (event) => {
            const root = document.querySelector(":root");
            root.style.setProperty(`--${carruselIndexProperty}`, index);

            carruselButtons.forEach(button => button.removeAttribute("data-is-selected"));
            button.setAttribute("data-is-selected", "true");
        })
    });
})();

