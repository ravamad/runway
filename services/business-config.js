async function fetchBusinessData() {
    try {
        // Fetch business config JSON
        const response = await fetch("../business-data/business-config.json");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Business Data:", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.error("Business JSON is empty or incorrectly formatted.");
            return;
        }

        const businessData = data[0];
        const businessName = businessData.business_name || "";
        const businessLogoUrl = businessData.business_logo || "";
        const faviconLogoUrl = businessData.favicon_logo || "";
        const loyaltyProgramName = businessData.loyalty_program || "Loyalty Program";
        const loyaltyProgramLogoUrl = businessData.loyalty_program_logo || "";
        const imageryPath = businessData.imagery || ""; // Get the path to imagery.json

        console.log("Business Name:", businessName);
        console.log("Business Logo URL:", businessLogoUrl);
        console.log("Favicon Logo URL:", faviconLogoUrl);
        console.log("Loyalty Program Name:", loyaltyProgramName);
        console.log("Loyalty Program Logo URL:", loyaltyProgramLogoUrl);
        console.log("Imagery Path:", imageryPath);

        // Initialize loginImageUrl variable
        let loginImageUrl = "";

        // Fetch imagery.json if the path is available
        if (imageryPath) {
            try {
                const imageryResponse = await fetch(imageryPath);

                if (!imageryResponse.ok) {
                    throw new Error(`Imagery fetch failed! Status: ${imageryResponse.status}`);
                }

                const imageryData = await imageryResponse.json();
                console.log("Fetched Imagery Data:", imageryData);

                if (Array.isArray(imageryData) && imageryData.length > 0) {
                    loginImageUrl = imageryData[0]["login-image"] || "";
                }
            } catch (imageryError) {
                console.error("Error fetching imagery data:", imageryError);
            }
        }

        console.log("Login Image URL:", loginImageUrl);

        // Update elements with fetched data
        document.querySelectorAll(".loyalty-id").forEach(element => {
            element.textContent = loyaltyProgramName;
        });

        document.querySelectorAll(".business-name").forEach(element => {
            element.innerHTML = businessName;
        });

        const businessFavicon = document.getElementById("chat-favicon");
        if (businessFavicon && faviconLogoUrl) {
            businessFavicon.src = faviconLogoUrl;
        }

        const loyaltyLogo = document.getElementById("loyalty-logo");
        if (loyaltyLogo && loyaltyProgramLogoUrl) {
            loyaltyLogo.src = loyaltyProgramLogoUrl;
        }

        const loyaltyMenuItem = document.querySelector("#site-menu .loyalty-id");
        if (loyaltyMenuItem) {
            loyaltyMenuItem.innerHTML = `${loyaltyProgramName}`;
        }

        // ✅ Update the login modal image from imagery.json
        const loginImage = document.getElementById("login-modal-image");
        if (loginImage && loginImageUrl) {
            loginImage.src = loginImageUrl;
        }

        const airlineLogo = document.getElementById("business-logo");
        if (airlineLogo && businessLogoUrl) {
            airlineLogo.src = businessLogoUrl;
        }

    } catch (error) {
        console.error("Error fetching business data:", error);
    }
}

// Run the function after the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchBusinessData);