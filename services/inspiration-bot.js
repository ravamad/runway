document.addEventListener('DOMContentLoaded', function () {
    const inspireForm = document.getElementById('inspire-form');
    const inspireInput = document.getElementById('inspire-ai-first-input');
    const aiModalChatContainer = document.getElementById('AI-modal-chat-container');
    const sendButton = document.getElementById('send-inspiration-input');
    const userInputField = document.getElementById('inspiration-user-input');

    const letsGoButton = document.querySelector('#inspire-form button');
    const askAiModal = new bootstrap.Modal(document.getElementById('askAiModal'));

    // OpenAI API Configuration
    const OPENAI_API_KEY = ''; 
    const OPENAI_API_URL = ''; 


    // In-memory conversation
    let conversationHistory = [];

    // ----------------------------------
    // 1) Initialize Conversation History
    // ----------------------------------
    async function initializeConversationHistory(userInput = '') {
      const profileData = getUserProfile();
      const userName = profileData?.user?.name || 'Guest';

      // Fetch the airline data (destinations & offers)
      const destinationsData = await fetchDestinationsData();
      const offersData = await fetchOffersData();

      // Create short summaries to keep token usage in check
      const summarizedDestinations = summarizeDestinations(destinationsData);
      const summarizedOffers = summarizeOffers(offersData);

      // This system message sets the scene:
      const systemMessage = `
You are a helpful travel assistant for an airline. The user is logged in and has a known profile. 
They want short, dialog-driven inspiration for new trips. 
You must only recommend destinations and flight offers that appear in "Airline Destinations" and "Airline Offers."

Be concise and interactive. Ask clarifying questions (e.g., about travel dates or budget) before listing final offers. 
User Profile:
  Name: ${userName}
  Budget (approx): $${profileData?.user?.averagePNRValue || 'N/A'}
  Segment: ${profileData?.segmentData?.profile || 'Unknown'}

Airline Destinations (short summary):
${summarizedDestinations}

Airline Offers (short summary):
${summarizedOffers}

Please keep your conversation short, mention the user's name when appropriate, 
and only display final offers once enough information is gathered. 
      `;

      // Initialize the conversation
      conversationHistory = [
        { role: 'system', content: systemMessage }
      ];
    }

    // ----------------------------------
    // 2) Event Listeners / Form Handling
    // ----------------------------------
    inspireForm.addEventListener('submit', startConversation);
    letsGoButton.addEventListener('click', startConversation);
    sendButton.addEventListener('click', handleUserMessage);

    // If user presses Enter in the "first input" field
    inspireInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        startConversation(e);
      }
    });

    // If user presses Enter in the "inspiration-user-input" field (inside modal)
    userInputField.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        handleUserMessage();
      }
    });

    // This function triggers when the user first interacts with the form
    async function startConversation(event) {
      event.preventDefault();
      const userInput = inspireInput.value.trim();

      if (userInput) {
        // Setup system message + data
        await initializeConversationHistory();
        
        // Add the user's prompt to the conversation
        conversationHistory.push({ role: 'user', content: userInput });
        displayMessage('user', userInput);

        // Show the modal
        askAiModal.show();

        // Start AI response
        getAIResponse(userInput);

        // Clear the form input
        inspireInput.value = '';
      }
    }

    // ----------------------------------
    // 3) Chat Flow (subsequent messages)
    // ----------------------------------
    function handleUserMessage() {
      const userInput = userInputField.value.trim();
      if (!userInput) return;

      // Push user's message and display it
      conversationHistory.push({ role: 'user', content: userInput });
      displayMessage('user', userInput);

      // Clear the field
      userInputField.value = '';

      // Send to AI
      getAIResponse(userInput);
    }

    // Send entire conversation to OpenAI
    async function getAIResponse(userQuery, retries = 3, delayTime = 2000) {
      for (let i = 0; i < retries; i++) {
        try {
          // Optional small delay
          await delay(delayTime);

          const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4', // or your deployment name
              messages: conversationHistory,
              max_tokens: 300,
              temperature: 0.9
            })
          });

          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content;

          if (!aiResponse) {
            displayMessage('assistant', "I'm still thinking... please try again.");
            return;
          }

          // Save AI response and display
          conversationHistory.push({ role: 'assistant', content: aiResponse });
          displayMessage('assistant', aiResponse);

          break; // no need to retry if successful
        } catch (error) {
          console.error('Error fetching AI response:', error);
          if (i < retries - 1) {
            console.warn(`Retrying... (attempt ${i + 2} of ${retries})`);
          } else {
            displayMessage('assistant', "Oops! Something went wrong. Please try again.");
          }
        }
      }
    }

    // ----------------------------------
    // 4) Utility Functions
    // ----------------------------------
    function displayMessage(sender, message) {
      const messageElement = document.createElement('div');
      messageElement.className = `chat-message ${sender}`;
      messageElement.innerHTML = `
          <div class="message-content">${message}</div>
      `;
      aiModalChatContainer.appendChild(messageElement);
      aiModalChatContainer.scrollTop = aiModalChatContainer.scrollHeight;
    }

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fetch user profile from localStorage or use a default stub
    function getUserProfile() {
      // Adjust this as needed; the key might differ in real usage
      return JSON.parse(localStorage.getItem('loggedInUser')) || {
        user: { name: 'Guest', averagePNRValue: 1500 },
        segmentData: { profile: 'family_traveler' }
      };
    }

    // Fetch airline destinations data
    async function fetchDestinationsData() {
      try {
        const res = await fetch('../business-data/destinations.json');
        return await res.json();
      } catch (err) {
        console.error('Failed to load destinations.json:', err);
        return [];
      }
    }

    // Fetch airline offers data
    async function fetchOffersData() {
      try {
        const res = await fetch('../business-data/offers.json');
        return await res.json();
      } catch (err) {
        console.error('Failed to load offers.json:', err);
        return [];
      }
    }

    // Summarize for the system message (to keep it short)
    function summarizeDestinations(data) {
      if (!Array.isArray(data) || data.length === 0) return 'No destinations found.';
      return data
        .slice(0, 5)
        .map(d => `${d.city} (${d.iata || 'N/A'})`)
        .join(', ');
    }

    function summarizeOffers(data) {
      if (!Array.isArray(data) || data.length === 0) return 'No offers found.';
      return data
        .slice(0, 3)
        .map(o => `${o.offer_id}: ${o.title || 'Untitled Offer'}`)
        .join('; ');
    }
  });