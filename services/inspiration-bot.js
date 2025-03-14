document.addEventListener('DOMContentLoaded', function () {
    const inspireForm = document.getElementById('inspire-form');
    const inspireInput = document.getElementById('inspire-ai-first-input');
    const aiModalChatContainer = document.getElementById('AI-modal-chat-container');
    const sendButton = document.getElementById('send-inspiration-input');
    const userInputField = document.getElementById('inspiration-user-input');

    // OpenAI API Configuration
    const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';  // Replace with your actual key
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    // Conversation context storage
    let conversationHistory = [
        { role: 'system', content: "You are a helpful travel AI assistant that inspires users with creative travel ideas." }
    ];

    // Event Listeners
    inspireForm.addEventListener('submit', startConversation);
    sendButton.addEventListener('click', handleUserMessage);
    userInputField.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleUserMessage();
    });

    function startConversation(event) {
        event.preventDefault();
        const userInput = inspireInput.value.trim();
        if (userInput) {
            conversationHistory.push({ role: 'user', content: userInput });
            displayMessage('user', userInput);
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

    async function getAIResponse(message) {
        const profileData = JSON.parse(localStorage.getItem('loggedInUser'));
        const userSegment = profileData?.segmentData || {};

        const destinationData = await fetch('../business-data/destinations.json')
            .then(res => res.json())
            .catch(() => []);

        const offerData = await fetch('../business-data/offers.json')
            .then(res => res.json())
            .catch(() => []);

        const fullPrompt = `
            User Info: ${JSON.stringify(profileData)}
            Segment Info: ${JSON.stringify(userSegment)}
            Available Destinations: ${JSON.stringify(destinationData)}
            Available Offers: ${JSON.stringify(offerData)}

            Question: ${message}

            Please suggest 3 travel offers:
            - One unusual destination
            - One balanced/matching option
            - One premium/luxurious option

            Each should include:
            - Destination name
            - Destination image URL
            - Flight details with price
            - Hotel details with price
            - One additional service tailored to the user's profile.
        `;

        try {
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: conversationHistory.concat({ role: 'user', content: fullPrompt }),
                    max_tokens: 500
                })
            });

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            conversationHistory.push({ role: 'assistant', content: aiResponse });
            displayMessage('assistant', aiResponse);

        } catch (error) {
            console.error('Error fetching AI response:', error);
            displayMessage('assistant', "Oops! Something went wrong. Please try again.");
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