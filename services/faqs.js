async function fetchData() {
    try {
        // Fetch both airline data and FAQ data
        const [faqsResponse, airlineResponse] = await Promise.all([
            fetch("../airline-data/faqs.json"),
            fetch("../airline-data/airline-config.json")
        ]);

        if (!faqsResponse.ok || !airlineResponse.ok) {
            throw new Error(`HTTP error! Status: ${faqsResponse.status} / ${airlineResponse.status}`);
        }

        // Parse responses
        const faqsData = await faqsResponse.json();
        const airlineData = await airlineResponse.json();
        
        console.log("Fetched FAQs Data:", faqsData);
        console.log("Fetched Airline Data:", airlineData);

        // Get airline name (assuming first object in array)
        const airlineName = airlineData.length > 0 ? airlineData[0].airline_name : "the airline";

        console.log("Airline Name:", airlineName);

        const searchInput = document.getElementById("searchInput");
        const searchResults = document.getElementById("searchResults");
        const searchButton = document.getElementById("searchButton");

        if (!searchInput || !searchResults || !searchButton) {
            console.error("Search input or button not found!");
            return;
        }

        // Flatten all FAQ questions into an array, replacing `{{}}` with airline name
        let allFAQs = [];
        faqsData.faqsData.forEach(category => {
            category.subCategories.forEach(subCategory => {
                subCategory.faqs.forEach(faq => {
                    allFAQs.push({
                        category: category.category,
                        subCategory: subCategory.title,
                        question: faq.question,
                        answer: faq.answer.replace(/{{}}/g, airlineName) // Replace {{}} with airline name
                    });
                });
            });
        });

        console.log("Processed FAQs with Airline Name:", allFAQs);

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