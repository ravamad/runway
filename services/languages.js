async function fetchLanguages() {
    try {
        const response = await fetch("../business-data/languages.json"); // Adjust path if necessary
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Language Data:", data); // Debugging log

        const countrySelect = document.getElementById("countrySelect");
        const languageSelect = document.getElementById("languageSelect");

        if (!countrySelect || !languageSelect) {
            console.error("Dropdown elements not found!");
            return;
        }

        // Populate Country Dropdown
        data.forEach(country => {
            const option = document.createElement("option");
            option.value = country.code;
            option.textContent = country.country;
            countrySelect.appendChild(option);
        });

        // Handle Country Selection Change
        countrySelect.addEventListener("change", function () {
            const selectedCountryCode = this.value;
            const selectedCountry = data.find(c => c.code === selectedCountryCode);

            // Reset and enable language dropdown
            languageSelect.innerHTML = "";
            languageSelect.disabled = false;

            // Populate Language Dropdown
            if (selectedCountry) {
                selectedCountry.languages.forEach(language => {
                    const langOption = document.createElement("option");
                    langOption.value = language.code;
                    langOption.textContent = language.name;
                    languageSelect.appendChild(langOption);
                });
            }
        });

    } catch (error) {
        console.error("Error fetching languages:", error);
    }
}

// Run the function after the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchLanguages);