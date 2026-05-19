const hamburger = document.getElementById("hamburgerBtn") as HTMLButtonElement;
const mobileMenu = document.getElementById("mobileMenu") as HTMLElement;
const closeMenu = document.getElementById("closeMenuBtn") as HTMLButtonElement;

hamburger.addEventListener("click", () => {

    hamburger.classList.toggle("active");
    mobileMenu.classList.add("open");

});

closeMenu.addEventListener("click", () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("open");
});

// Auto-hide alerts
const alerts = document.querySelectorAll('.alert');
alerts.forEach(alert => {
    setTimeout(() => {
        (alert as HTMLElement).style.display = 'none';
    }, 5000);
});