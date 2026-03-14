const hamburger = document.getElementById("hamburgerBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenuBtn")

hamburger.addEventListener("click", () => {

    hamburger.classList.toggle("active");
    mobileMenu.classList.add("open");

});

closeMenu.addEventListener("click", () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("open");
});