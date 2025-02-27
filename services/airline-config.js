async function fetchAirlineData() {
    try {
        // Fetch JSON from the correct file path
        const response = await fetch("../airline-data/airline-config.json");

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

        // Extract loyalty program name and login image
        const airlineData = data[0];
        const loyaltyProgramName = airlineData.loyalty_program || "Loyalty Program";
        const loginImageUrl = airlineData["login-image"];

        console.log("Loyalty Program Name:", loyaltyProgramName); // ✅ Verify program name
        console.log("Login Image URL:", loginImageUrl); // ✅ Verify image URL

        // ✅ Update all elements with class 'loyalty-id'
        document.querySelectorAll(".loyalty-id").forEach(element => {
            element.textContent = loyaltyProgramName;
        });

        // ✅ Update loyalty link in the navigation menu
        const loyaltyMenuItem = document.querySelector("#site-menu .loyalty-id");
        if (loyaltyMenuItem) {
            loyaltyMenuItem.innerHTML = `<a class="no-dec" href="#">${loyaltyProgramName}</a>`;
        }

        // ✅ Update the login modal image
        const loginImage = document.getElementById("login-modal-image");
        if (loginImage) {
            loginImage.src = loginImageUrl;
        }

    } catch (error) {
        console.error("Error fetching airline data:", error);
    }
}

// Run the function after the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchAirlineData);