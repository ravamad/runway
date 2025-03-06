async function fetchBusinessConfig() {
    try {
        const response = await fetch("../business-data/business-config.json");
        const businessConfig = await response.json();
        return {
            componentsPath: businessConfig[0].components,
            imageryPath: businessConfig[0].imagery
        };
    } catch (error) {
        console.error("Error fetching business-config.json:", error);
        return {};
    }
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
}

async function fetchAndRenderBanners() {
    try {
        const { componentsPath, imageryPath } = await fetchBusinessConfig();
        if (!componentsPath || !imageryPath) return;

        const [componentsData, imageryData] = await Promise.all([
            fetchData(componentsPath),
            fetchData(imageryPath)
        ]);

        if (!componentsData || !imageryData) return;

        const imageryBannersArray = imageryData.find(item => item.banners)?.banners;
        if (!imageryBannersArray) {
            console.error("No 'banners' array found in imagery.json");
            return;
        }

        componentsData.banners.forEach(bannerData => {
            const bannerElement = document.getElementById(bannerData.id);
            if (!bannerElement) return;

            // Find corresponding image from imagery.json
            const imageEntry = imageryBannersArray.find(img => img.id === bannerData.imagery_key);
            const imageUrl = imageEntry ? imageEntry.image : "https://via.placeholder.com/600x300?text=No+Image";

            console.log("Banner ID:", bannerData.id);
            console.log("Imagery Key:", bannerData.imagery_key);
            console.log("Image Entry:", imageEntry);
            console.log("Image URL:", imageUrl);

            // Populate image inside .banner-media-content
            const imgElement = bannerElement.querySelector(".banner-media-content img");
            if (imgElement) {
                imgElement.src = imageUrl;
                imgElement.alt = bannerData.id;
            }

            // Populate banner message inside .banner-text
            const bannerText = bannerElement.querySelector(".banner-text .banner-message");
            if (bannerText) bannerText.textContent = bannerData.message;

            // Populate banner subtitle inside .banner-text
            const bannerSubtitle = bannerElement.querySelector(".banner-text .banner-subtitle");
            if (bannerSubtitle) bannerSubtitle.textContent = bannerData.subtitle || "";

            // Populate CTA button inside .banner-cta
            const bannerCTA = bannerElement.querySelector(".banner-cta button");
            if (bannerCTA) {
                bannerCTA.textContent = bannerData.cta.text;
                bannerCTA.onclick = () => window.location.href = bannerData.cta.url;
            }

            // Ensure overlay is correctly styled
            const overlay = bannerElement.querySelector(".banner-media-content .overlay");
            if (overlay) {
                overlay.style.background = "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.2))";
            }
        });

    } catch (error) {
        console.error("Error fetching and rendering banners:", error);
    }
}

// Run script after DOM loads
document.addEventListener("DOMContentLoaded", fetchAndRenderBanners);