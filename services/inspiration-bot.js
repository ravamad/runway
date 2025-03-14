document.addEventListener('DOMContentLoaded', function () {
    const inspireForm = document.getElementById('inspire-form');
    const inspireInput = document.getElementById('inspire-ai-first-input');
    const aiModalChatContainer = document.getElementById('AI-modal-chat-container');
    const sendButton = document.getElementById('send-inspiration-input');
    const userInputField = document.getElementById('inspiration-user-input');

    const letsGoButton = document.querySelector('#inspire-form button');
    const askAiModal = new bootstrap.Modal(document.getElementById('askAiModal')); // Bootstrap modal instance

    // OpenAI API Configuration
    const OPENAI_API_KEY = '';
    const OPENAI_API_URL = 'https://altitude.openai.azure.com/';

    let conversationHistory = [
        { 
            role: 'system', 
            content: `
You are a conversational travel expert designed to inspire users with personalized travel suggestions. 
Ask thoughtful questions to refine their preferences (budget, travel dates, interests) and generate 3 tailored offers:

1️⃣ **Creative Adventure**: A unique destination or experience.
2️⃣ **Perfect Match**: A well-balanced option based on their details.
3️⃣ **Luxury Choice**: An upscale, high-end experience.

For each:
- Destination
- Image URL
- Flight details & price
- Hotel details & price
- Extra service tailored to their travel profile.

Be friendly, concise, and positive! 😊
`
        }
    ];

    // Event Listeners
    inspireForm.addEventListener('submit', startConversation);
    letsGoButton.addEventListener('click', startConversation); // Handles "Let's Go"
    sendButton.addEventListener('click', handleUserMessage);

    // Open modal and add initial message when "Enter" is pressed
    inspireInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const userInput = inspireInput.value.trim();
            if (userInput) {
                conversationHistory.push({ role: 'user', content: userInput });
                displayMessage('user', userInput);  
                askAiModal.show();  // Open the modal
                getAIResponse(userInput); // Continue the conversation
            }
        }
    });

    userInputField.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    function startConversation(event) {
        event.preventDefault();

        const userInput = inspireInput.value.trim();
        if (userInput) {
            conversationHistory.push({ role: 'user', content: userInput });
            displayMessage('user', userInput);  // Display user's initial input
            askAiModal.show(); // Open the modal
            getAIResponse(userInput);
        }
    }

    function handleUserMessage() {
        const userInput = userInputField.value.trim();
        if (!userInput) return;

        conversationHistory.push({ role: 'user', content: userInput });
        displayMessage('user', userInput);

        userInputField.value = ''; // Clear input field
        getAIResponse(userInput);
    }

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function getAIResponse(message, retries = 3, delayTime = 2000) {
        const profileData = JSON.parse(localStorage.getItem('loggedInUser'));
        const userSegment = profileData?.segmentData || {};

        const destinationData = await fetch('../business-data/destinations.json')
            .then(res => res.json())
            .catch(() => []);

        const offerData = await fetch('../business-data/offers.json')
            .then(res => res.json())
            .catch(() => []);

        const fullPrompt = `
User Info:
- Name: ${profileData?.user?.name || 'Guest'}
- Segment: ${profileData?.segmentData?.profile || 'Unknown'}
- Budget: ${profileData?.user?.averagePNRValue || 'Not Specified'}
- Preferred Device: ${profileData?.user?.preferredDevice || 'Any'}

Travel Preferences:
- Popular Destinations: Paris, Tokyo, New York, Rome
- Offer types: Unusual, Balanced, Premium

Question: ${message}
        `;

        for (let i = 0; i < retries; i++) {
            try {
                await delay(delayTime);  // Delay to prevent rate limits

                const response = await fetch(OPENAI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4-turbo',
                        messages: conversationHistory.concat({ role: 'user', content: fullPrompt }),
                        max_tokens: 300  // Reduced for efficiency
                    })
                });

                const data = await response.json();
                const aiResponse = data.choices && data.choices[0]?.message?.content;

                if (!aiResponse) {
                    displayMessage('assistant', "I'm still thinking... please try again in a moment.");
                    return;
                }

                conversationHistory.push({ role: 'assistant', content: aiResponse });
                displayMessage('assistant', aiResponse);

                break;

            } catch (error) {
                if (error.response?.status === 429 && i < retries - 1) {
                    console.warn(`Rate limit hit. Retrying in ${delayTime / 1000} seconds...`);
                } else {
                    console.error('Error fetching AI response:', error);
                    displayMessage('assistant', "Oops! Something went wrong. Please try again.");
                    break;
                }
            }
        }
    }

    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        aiModalChatContainer.appendChild(messageElement);
        aiModalChatContainer.scrollTop = aiModalChatContainer.scrollHeight;
    }
});