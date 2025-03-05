async function loadComponents() {
    try {
        // Fetch business-config.json to get the correct paths
        const configResponse = await fetch("../business-data/business-config.json");
        if (!configResponse.ok) throw new Error(`HTTP error! Status: ${configResponse.status}`);

        const configData = await configResponse.json();
        console.log("Fetched Business Config:", configData);

        if (!Array.isArray(configData) || configData.length === 0) {
            console.error("Business JSON is empty or incorrectly formatted.");
            return;
        }

        const businessData = configData[0];

        // Extract paths for components.json and imagery.json
        const componentsPath = businessData.components || "";
        const imageryPath = businessData.imagery || "";

        if (!componentsPath || !imageryPath) {
            console.error("Missing paths for components.json or imagery.json");
            return;
        }

        // Fetch components.json and imagery.json
        await loadCarousel(componentsPath, imageryPath);

    } catch (error) {
        console.error("Error fetching business-config.json:", error);
    }
}

async function loadCarousel(componentsPath, imageryPath) {
    try {
        // Fetch components.json
        const componentsResponse = await fetch(componentsPath);
        if (!componentsResponse.ok) throw new Error(`HTTP error! Status: ${componentsResponse.status}`);
        const componentsData = await componentsResponse.json();

        // Fetch imagery.json
        const imageryResponse = await fetch(imageryPath);
        if (!imageryResponse.ok) throw new Error(`HTTP error! Status: ${imageryResponse.status}`);
        const imageryData = await imageryResponse.json();

        console.log("Fetched Components Data:", componentsData);
        console.log("Fetched Imagery Data:", imageryData);

        // Find carousel data
        if (!componentsData.carousels || componentsData.carousels.length === 0) {
            console.warn("No carousel data found.");
            return;
        }

        const carousel = componentsData.carousels[0]; // Using the first carousel
        const carouselId = carousel.id || "dynamicCarousel";
        const imageryKey = carousel.imagery_key;

        // Find matching imagery from imagery.json
        const imageryItem = imageryData.find(img => img.carousel === imageryKey);
        if (!imageryItem) {
            console.error(`No imagery found for carousel: ${imageryKey}`);
            return;
        }

        // Create carousel indicators and slides dynamically
        let indicatorsHtml = "";
        let slidesHtml = "";

        carousel.slides.forEach((slide, index) => {
            const imageUrl = imageryItem.images[index] || ""; // Get image from imagery.json

            indicatorsHtml += `
                <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" 
                        ${index === 0 ? 'class="active" aria-current="true"' : ""} 
                        aria-label="Slide ${index + 1}"></button>`;

            slidesHtml += `
                <div class="carousel-item ${index === 0 ? "active" : ""}">
                    <div class="overlay"></div>
                    <img src="${imageUrl}" class="d-block w-100" alt="${slide.title}">
                    <div class="carousel-caption d-none d-md-block">
                        <h2>${slide.title}</h2>
                        <p>${slide.description}</p>
                        ${slide.cta && slide.url ? `<a href="${slide.url}" class="button primary-filled">${slide.cta}</a>` : ""}
                    </div>
                </div>`;
        });

        // Create full Bootstrap carousel structure dynamically
        const carouselHtml = `
            <div id="${carouselId}" class="carousel carousel-fade slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                    ${indicatorsHtml}
                </div>
                <div class="carousel-inner">
                    ${slidesHtml}
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>`;

        // Append carousel to its container
        const carouselContainer = document.getElementById("carousel-container");
        if (carouselContainer) {
            carouselContainer.innerHTML = carouselHtml;
        } else {
            console.error("Carousel container not found!");
        }

    } catch (error) {
        console.error("Error loading carousel:", error);
    }
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", loadComponents);