const navbarToggleButton = document.querySelector("[data-id='navbar-toggle-button']");
const navbarMenuWrapper = document.querySelector("[data-id='navbar-menu-wrapper']");

navbarToggleButton.addEventListener("click", () => {
    navbarMenuWrapper.toggleAttribute("data-is-open");
});

