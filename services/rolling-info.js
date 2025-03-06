document.addEventListener("DOMContentLoaded", function () {
    fetch("../business-data/airline-data/rolling-info.json")
        .then(response => response.json())
        .then(data => {
            const newsItems = data.news;
            let currentIndex = 0;
            const infoLink = document.getElementById("info");
            const rollingInfoText = document.querySelector(".rolling-info-text");

            function updateNews() {
                if (newsItems.length > 0) {
                    // Fade out
                    rollingInfoText.style.opacity = "0";

                    setTimeout(() => {
                        // Update content after fade out
                        infoLink.textContent = newsItems[currentIndex].infoText;
                        infoLink.href = newsItems[currentIndex].infoLink;

                        // Fade in
                        rollingInfoText.style.opacity = "1";

                        // Move to the next news item
                        currentIndex = (currentIndex + 1) % newsItems.length;
                    }, 500); // Match the CSS transition duration
                }
            }

            updateNews(); // Initialize with first news item

            if (data.rotationInterval) {
                setInterval(updateNews, data.rotationInterval);
            }

            if (data.dismissible) {
                const closeButton = document.querySelector(".rolling-info-content .icon-button");
                if (closeButton) {
                    closeButton.addEventListener("click", function () {
                        document.getElementById("rolling-info").style.display = "none";
                    });
                }
            }
        })
        .catch(error => console.error("Error loading rolling-info.json:", error));
});