document.addEventListener("DOMContentLoaded", async function () {
    const chatContainer = document.querySelector(".AI-assistant-chat-container");
    const triggerButton = document.getElementById("AI-assistant-trigger-button");
    const hideButton = document.getElementById("hide-chat");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-input");
    const chatMainContent = document.querySelector(".AI-assistant-chat-main-content");

    const API_KEY = ""; // Replace with your actual OpenAI API key

    triggerButton?.addEventListener("click", () => chatContainer.style.display = "block");
    hideButton?.addEventListener("click", () => chatContainer.style.display = "none");

    // ✅ FIX: Added `fetchBusinessConfig()` back
    async function fetchBusinessConfig() {
        try {
            const response = await fetch("../business-data/business-config.json");
            if (!response.ok) throw new Error("Failed to fetch business-config.json");

            const configData = await response.json();
            return configData.length > 0 ? configData[0].faqs : null;
        } catch (error) {
            console.error("Error fetching business-config.json:", error);
            return null;
        }
    }

    function handleUserInput() {
        const userText = userInput.value.trim();
        if (userText === "") return;

        console.log("User message:", userText);
        displayUserMessage(userText);
        userInput.value = "";

        const loader = showLoadingAnimation();

        setTimeout(async () => {
            const faqsUrl = await fetchBusinessConfig(); // ✅ NOW IT EXISTS!
            if (!faqsUrl) {
                removeLoadingAnimation(loader);
                displayAIMessage("Sorry, I couldn't access FAQs at the moment.");
                return;
            }
            await processUserQuery(userText, faqsUrl, loader);
        }, 500);
    }

    sendButton.addEventListener("click", handleUserInput);
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleUserInput();
        }
    });

    function showLoadingAnimation() {
        const loaderDiv = document.createElement("div");
        loaderDiv.classList.add("AI-response-container");
        loaderDiv.innerHTML = `
            <div class="AI-response-content">
                <div class="AI-response-bubble">
                    <div style="
                        width: 24px; 
                        height: 8px; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;">
                        <span style="
                            width: 6px; 
                            height: 6px; 
                            background-color: #70a1ff; 
                            border-radius: 50%; 
                            display: inline-block; 
                            animation: typing-indicator 1.5s infinite ease-in-out;
                            animation-delay: 0s;"></span>
                        <span style="
                            width: 6px; 
                            height: 6px; 
                            background-color: #70a1ff; 
                            border-radius: 50%; 
                            display: inline-block; 
                            animation: typing-indicator 1.5s infinite ease-in-out;
                            animation-delay: 0.2s;"></span>
                        <span style="
                            width: 6px; 
                            height: 6px; 
                            background-color: #70a1ff; 
                            border-radius: 50%; 
                            display: inline-block; 
                            animation: typing-indicator 1.5s infinite ease-in-out;
                            animation-delay: 0.4s;"></span>
                    </div>
                </div>
            </div>
        `;
        chatMainContent.appendChild(loaderDiv);
        return loaderDiv;
    }

    function removeLoadingAnimation(loader) {
        if (loader) loader.remove();
    }

    async function processUserQuery(userText, faqsUrl, loader) {
        try {
            const response = await fetch(faqsUrl);
            if (!response.ok) throw new Error("Failed to fetch faqs.json");

            const faqs = await response.json();
            console.log("FAQ JSON response:", faqs);

            const allFAQs = [];
            faqs.faqsData.forEach(category => {
                category.subCategories.forEach(subCat => {
                    subCat.faqs.forEach(q => {
                        allFAQs.push(q);
                    });
                });
            });

            console.log("Extracted FAQs:", allFAQs);

            const matchedFAQ = allFAQs.find(faq =>
                userText.toLowerCase().includes(faq.question.toLowerCase()) ||
                faq.question.toLowerCase().includes(userText.toLowerCase())
            );

            if (matchedFAQ) {
                removeLoadingAnimation(loader);
                console.log("FAQ match found:", matchedFAQ);
                displayAIMessage(matchedFAQ.answer);
            } else {
                console.log("No FAQ match, querying GPT-4o Mini...");
                const gptResponse = await getAIResponse(userText, loader);
                removeLoadingAnimation(loader);
                displayAIMessage(gptResponse);
            }
        } catch (error) {
            console.error("Error processing user query:", error);
            removeLoadingAnimation(loader);
            displayAIMessage("Sorry, I couldn't retrieve the information. Please try again.");
        }
    }

    async function getAIResponse(userText, loader, attempt = 1) {
        if (attempt > 3) {
            removeLoadingAnimation(loader);
            return "I'm unable to fetch AI-generated responses at the moment.";
        }

        const url = "https://api.openai.com/v1/chat/completions";
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        };

        const body = JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a customer support assistant." },
                { role: "user", content: userText }
            ],
            max_tokens: 150
        });

        try {
            console.log(`Sending request to OpenAI API... Attempt ${attempt}`);
            const response = await fetch(url, { method: "POST", headers, body });

            if (response.status === 429) {
                console.warn(`Rate limited! Retrying in ${attempt * 2} seconds...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                return await getAIResponse(userText, loader, attempt + 1);
            }

            if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

            const data = await response.json();
            console.log("GPT-4o Mini Response:", data);

            return data.choices[0]?.message?.content || "I'm not sure how to answer that.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "I'm unable to fetch AI-generated responses at the moment.";
        }
    }

    function displayUserMessage(text) {
        const userBubble = document.createElement("div");
        userBubble.classList.add("user-input-container");
        userBubble.innerHTML = `
            <div class="user-input-content">
                <div class="timing"><span>You wrote - ${new Date().toLocaleTimeString()}</span></div>
                <div class="user-input-bubble">
                    <div class="user-input-text">${text}</div>
                </div>
            </div>
        `;
        chatMainContent.appendChild(userBubble);
        chatMainContent.scrollTop = chatMainContent.scrollHeight;
    }

    function displayAIMessage(text) {
        const aiBubble = document.createElement("div");
        aiBubble.classList.add("AI-response-container");
        aiBubble.innerHTML = `
            <div class="AI-response-content">
                <div class="timing"><span>AI assistant - ${new Date().toLocaleTimeString()}</span></div>
                <div class="AI-response-bubble">
                    <div class="AI-response-text">${text}</div>
                </div>
            </div>
        `;
        chatMainContent.appendChild(aiBubble);
        chatMainContent.scrollTop = chatMainContent.scrollHeight;
    }
});