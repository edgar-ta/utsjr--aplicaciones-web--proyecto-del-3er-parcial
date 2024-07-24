function toggleNav() {
    let sidebar = document.getElementById("sidebar");
    let main = document.getElementById("main");
    let toggleBtn = document.querySelector(".togglebtn");

    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
        main.style.marginLeft = "0";
        toggleBtn.textContent = "Abrir Menú";
    } else {
        sidebar.style.width = "250px";
        main.style.marginLeft = "250px";
        toggleBtn.textContent = "Cerrar Menú";
    }
}

function mostrarSubmenu(id) {
    let submenu = document.getElementById(id);
    submenu.classList.toggle("show");
}
