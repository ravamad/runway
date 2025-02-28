async function fetchCarouselData() {
    try {
        // Example JSON file (replace with your actual path)
        const response = await fetch("../airline-data/carousel.json");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const carouselData = await response.json();
        console.log("Fetched Carousel Data:", carouselData);

        const swiperWrapper = document.querySelector(".swiper-wrapper");

        if (!swiperWrapper) {
            console.error("Swiper wrapper not found!");
            return;
        }

        // Populate Swiper slides
        carouselData.forEach(slide => {
            const slideItem = document.createElement("div");
            slideItem.classList.add("swiper-slide");

            slideItem.innerHTML = `
                <div class="carousel-slide" style="background: linear-gradient(90deg, #000000 0%, #3030ab77 100%), url('${slide.image}'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                    <div class="carousel-content">
                        <span class="badge">${slide.offer}</span>
                        <h2 style="margin-top: 1rem;">${slide.title}</h2>
                        <p>${slide.description}</p>
                        <a href="${slide.link}" class="primary-filled">Book now</a>
                    </div>
                </div>
            `;

            swiperWrapper.appendChild(slideItem);
        });

        // Initialize Swiper
        new Swiper(".hero-swiper", {
            loop: true,
            slidesPerView: 1,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                renderBullet: function (index, className) {
                    return `<span class="${className}"></span>`; // Ensures custom styling
                }
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            }
        });

    } catch (error) {
        console.error("Error fetching carousel data:", error);
    }
}

// Run function after DOM loads
document.addEventListener("DOMContentLoaded", fetchCarouselData);