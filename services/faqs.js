async function fetchData() {
    try {
        // Fetch business config first to get the correct FAQs URL
        const configResponse = await fetch("../business-data/business-config.json");
        
        if (!configResponse.ok) {
            throw new Error(`HTTP error! Status: ${configResponse.status}`);
        }

        const configData = await configResponse.json();
        
        // Get the FAQs URL from the first business entry
        const faqsUrl = configData.length > 0 ? configData[0].faqs : null;

        if (!faqsUrl) {
            throw new Error("FAQs URL not found in business-config.json");
        }

        // Fetch FAQs data using the retrieved URL
        const faqsResponse = await fetch(faqsUrl);

        if (!faqsResponse.ok) {
            throw new Error(`HTTP error! Status: ${faqsResponse.status}`);
        }

        const faqsData = await faqsResponse.json();
        
        console.log("Fetched FAQs Data:", faqsData);
        console.log("Fetched Business Config:", configData);

        // Get business name (assuming first object in array)
        const businessName = configData.length > 0 ? configData[0].business_name : "the business";

        console.log("Business Name:", businessName);

        const searchInput = document.getElementById("searchInput");
        const searchResults = document.getElementById("searchResults");
        const searchButton = document.getElementById("searchButton");

        if (!searchInput || !searchResults || !searchButton) {
            console.error("Search input or button not found!");
            return;
        }

        // Flatten all FAQ questions into an array, replacing `{{}}` with business name
        let allFAQs = [];
        faqsData.faqsData.forEach(category => {
            category.subCategories.forEach(subCategory => {
                subCategory.faqs.forEach(faq => {
                    allFAQs.push({
                        category: category.category,
                        subCategory: subCategory.title,
                        question: faq.question,
                        answer: faq.answer.replace(/{{}}/g, businessName) // Replace {{}} with business name
                    });
                });
            });
        });

        console.log("Processed FAQs with Business Name:", allFAQs);

        // Listen for input changes and filter results
        searchInput.addEventListener("input", function () {
            const query = this.value.toLowerCase().trim();
            searchResults.innerHTML = ""; // Clear previous results

            if (query.length > 1) {
                const filteredResults = allFAQs.filter(faq => 
                    faq.question.toLowerCase().includes(query) || 
                    faq.answer.toLowerCase().includes(query)
                );

                if (filteredResults.length === 0) {
                    searchResults.innerHTML = `<li class="list-group-item">No results found</li>`;
                } else {
                    filteredResults.forEach(faq => {
                        const listItem = document.createElement("li");
                        listItem.classList.add("list-group-item");

                        listItem.innerHTML = `
                            <strong>${faq.question}</strong>
                            <p class="text-muted small">${faq.category} > ${faq.subCategory}</p>
                            <p>${faq.answer.substring(0, 100)}...</p>
                        `;

                        searchResults.appendChild(listItem);
                    });
                }
            }
        });

        // Handle search button click (optional)
        searchButton.addEventListener("click", function () {
            searchInput.dispatchEvent(new Event("input"));
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Run the function after the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchData);