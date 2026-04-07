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


 
function openModal(product) {

    $("#modalImage").attr("src", product.image).attr("alt", product.title);
    $("#modalCategory").text(product.category.toUpperCase());
    $("#modalTitle").text(product.title);
    $("#modalDesc").text(product.description);
 

    const stars = buildStars(product.rating.rate);
    $("#modalRating").html(stars + " " + product.rating.rate + " / 5 (" + product.rating.count + " reviews)");
    $("#modalPrice").text("$" + product.price.toFixed(2));

    $("#modalOverlay").removeClass("hidden");
}
 
function closeModal() {
    $("#modalOverlay").addClass("hidden");
}
 

$("#modalClose").on("click", closeModal);
 

$("#modalOverlay").on("click", function (e) {
    if ($(e.target).is("#modalOverlay")) {
        closeModal();
    }
});
 

$(document).on("keydown", function (e) {
    if (e.key === "Escape") closeModal();
});
 
 

function buildStars(rate) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += i <= Math.round(rate) ? "★" : "☆";
    }
    return stars;
}
 
 

 
$.ajax({
    url:      "https://fakestoreapi.com/products?limit=10",
    method:   "GET",
    dataType: "json",
 

    success: function (products) {
 
        $("#loadingSpinner").hide();
 

        $("#trendingRow").empty();

        $.each(products, function (index, product) {
 

            var cardHTML =
                '<div class="songCard songCard-dynamic" data-index="' + index + '">' +
                    '<img class="card-img" src="' + product.image + '" alt="' + escapeHtml(product.title) + '">' +
                    '<div class="card-info">' +
                        '<p class="card-title">' + escapeHtml(truncate(product.title, 22)) + '</p>' +
                        '<p class="card-category">' + escapeHtml(product.category) + '</p>' +
                    '</div>' +
                    '<button class="quickViewBtn" data-index="' + index + '">Quick View</button>' +
                '</div>';
 
  
            $("#trendingRow").append(cardHTML);
        });
 


        $("#trendingRow").on("click", ".quickViewBtn", function () {
            var idx = $(this).data("index");
            openModal(products[idx]);
        });
    },


    error: function (xhr, status, error) {
        $("#loadingSpinner").hide();
        $("#trendingRow").html(
            '<p style="color:#b3b3b3; padding:20px;">Could not load Featured Deals. Please try again later.</p>'
        );
        console.error("AJAX error:", status, error);
    }
});
 
 
 

function truncate(str, maxLen) {
    return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
 

function escapeHtml(str) {
    return $("<div>").text(str).html();
}