function toggleSidebar() {
    const button = document.querySelector("[data-id='toggle-button']");
    const sidebar = document.querySelector("[data-id='sidebar']");

    const isOpen = sidebar.getAttribute("data-state") == "open";
    if (isOpen) {
        // close it
        sidebar.setAttribute("data-state", "closed");
        button.textContent = "Abrir Menú";
    } else {
        // open it
        sidebar.setAttribute("data-state", "open");
        button.textContent = "Cerrar Menú";
    }
}

