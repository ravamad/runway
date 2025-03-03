async function fetchBusinessData() {
    try {
        // Fetch JSON from the correct file path
        const response = await fetch("../business-data/business-config.json");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // ✅ Parse JSON response
        const data = await response.json();
        console.log("Fetched Data:", data); // ✅ Debugging log

        // Ensure data is an array and contains at least one object
        if (!Array.isArray(data) || data.length === 0) {
            console.error("JSON is empty or incorrectly formatted.");
            return;
        }

        // Extract data
        const businessData = data[0];
        const businessName = businessData.business_name || "";
        const businessLogoUrl = businessData.business_logo || "";
        const faviconLogoUrl = businessData.favicon_logo || "";
        const loyaltyProgramName = businessData.loyalty_program || "Loyalty Program";
        const loyaltyProgramLogoUrl = businessData.loyalty_program_logo || "";
        const loginImageUrl = businessData["login-image"] || "";

        console.log("Business Name:", businessName); // ✅ Verify logo URL
        console.log("Business Logo URL:", businessLogoUrl); // ✅ Verify logo URL
        console.log("Favicon Logo URL:", faviconLogoUrl); // ✅ Verify favicon URL
        console.log("Loyalty Program Name:", loyaltyProgramName); // ✅ Verify program name
        console.log("Loyalty Program Logo URL:", loyaltyProgramLogoUrl); // ✅ Verify logo URL
        console.log("Login Image URL:", loginImageUrl); // ✅ Verify image URL

        // ✅ Update all elements with class 'loyalty-id'
        document.querySelectorAll(".loyalty-id").forEach(element => {
            element.textContent = loyaltyProgramName;
        });

        // ✅ Update all elements with class 'business-name'
        document.querySelectorAll(".business-name").forEach(element => {
            element.innerHTML = businessName;
        });
        
        // ✅ Update loyalty program logo
        const businessFavicon = document.getElementById("chat-favicon");
        if (businessFavicon && faviconLogoUrl) {
            businessFavicon.src = faviconLogoUrl;
        }

        // ✅ Update loyalty program logo
        const loyaltyLogo = document.getElementById("loyalty-logo");
        if (loyaltyLogo && loyaltyProgramLogoUrl) {
            loyaltyLogo.src = loyaltyProgramLogoUrl;
        }

        // ✅ Update loyalty link in the navigation menu
        const loyaltyMenuItem = document.querySelector("#site-menu .loyalty-id");
        if (loyaltyMenuItem) {
            loyaltyMenuItem.innerHTML = `${loyaltyProgramName}`;
        }

        // ✅ Update the login modal image
        const loginImage = document.getElementById("login-modal-image");
        if (loginImage && loginImageUrl) {
            loginImage.src = loginImageUrl;
        }

        // ✅ Update airline logo
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