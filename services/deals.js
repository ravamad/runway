document.addEventListener("DOMContentLoaded", async function () {
    const configUrl = "../business-data/business-config.json";

    async function fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`❌ Error fetching JSON from ${url}:`, error);
            return null;
        }
    }

    async function loadDeals() {
        console.log("🌍 Fetching business config...");
        const businessConfig = await fetchJson(configUrl);
        if (!businessConfig || !businessConfig[0].deals) {
            console.error("❌ No deals file found in business-config.json");
            return;
        }

        const dealsFile = businessConfig[0].deals;
        console.log(`🔗 Fetching deals data from: ${dealsFile}`);
        const dealsData = await fetchJson(dealsFile);
        if (!dealsData || !dealsData.deals) {
            console.error("❌ No deals found in deals.json");
            return;
        }

        const swiperWrapper = document.querySelector(".swiper-wrapper");
        swiperWrapper.innerHTML = ""; // Clear previous content

        dealsData.deals.forEach((deal) => {
            const slide = document.createElement("div");
            slide.classList.add("swiper-slide");
            slide.innerHTML = `
                <div class="deal-card">
                    <img src="${deal.image}" alt="${deal.destination}">
                    <div class="deal-content">
                        <span class="trip-type">${deal.trip_type}</span>
                        <h3>${deal.destination}</h3>
                        <p>From <strong>${deal.from_price}</strong> or <span>${deal.miles_price}</span></p>
                    </div>
                </div>
            `;
            swiperWrapper.appendChild(slide);
        });

        // Initialize Swiper.js after dynamically adding slides
        new Swiper(".swiper-container", {
            slidesPerView: "auto",
            centeredSlides: false,
            spaceBetween: 10,
            loop: true,
            // navigation: {
            //     nextEl: ".swiper-button-next",
            //     prevEl: ".swiper-button-prev"
            // },
            pagination: {
                el: ".swiper-pagination",
                clickable: true
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1440: { slidesPerView: 4 }
            }
        });
    }

    loadDeals();
});