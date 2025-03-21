document.addEventListener('DOMContentLoaded', function () {
  // DOM references for the initial form (outside the modal)
  const inspireForm = document.getElementById('inspire-form');
  const inspireFirstInput = document.getElementById('inspire-ai-first-input');

  // DOM references for the modal
  const aiModalChatContainer = document.getElementById('AI-modal-chat-container');
  const userInputField = document.getElementById('inspiration-user-input');
  const sendButton = document.getElementById('send-inspiration-input');

  // Track the conversation
  let conversationHistory = [];
  let userMessageCount = 0;   // We'll allow 4 total user messages

  // We'll store the user's chosen season (summer, winter, etc.) if detected
  let userSelectedSeason = 'flexible';
  let userSelectedContinent = null;

  // OpenAI config
  const OPENAI_API_KEY = '';
  const OPENAI_API_URL = '';

  // ================================
  // 1) Event Listeners
  // ================================
  // If user presses Enter in the first input
  inspireFirstInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      startConversation();
    }
  });

  // If user *clicks* the "Let’s go" button in the form (type="button"), 
  // the modal opens via data-bs-toggle="modal", so we just start the conversation:
  inspireForm.addEventListener('submit', function (e) {
    // In case there's a submit event - we prevent form submission
    e.preventDefault();
  });
  document.querySelector('#inspire-form button').addEventListener('click', startConversation);
  // Inside the modal: user can press Enter or click "Send" (#send-inspiration-input)
  sendButton.addEventListener('click', handleModalUserMessage);
  userInputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleModalUserMessage();
    }
  });

  // ================================
  // 2) Start the Conversation
  // ================================
  async function startConversation() {
    const userText = inspireFirstInput.value.trim();
    if (!userText) return;

    // Re-initialize the conversation (system prompt)
    await initializeConversationHistory();

    // Push the first user message
    conversationHistory.push({ role: 'user', content: userText });
    displayMessage('user', userText);
    userMessageCount++;

    // Clear the input
    inspireFirstInput.value = '';

    // Call the AI for a response
    getAIResponse(userText);
  }

  // ================================
  // 3) Handle Messages in the Modal
  // ================================
  function handleModalUserMessage() {
    const userText = userInputField.value.trim();
    if (!userText) return;

    // Add user's message
    conversationHistory.push({ role: 'user', content: userText });
    displayMessage('user', userText);
    userMessageCount++;
    userInputField.value = '';

    // Attempt to detect season and continent keywords in user’s text
    detectSeason(userText);
    detectContinent(userText);

    // If we've reached 4 total user messages, skip AI and show final offers
    if (userMessageCount >= 4) {
      displayMessage('assistant', "<em>Great! I have enough info to show you some options.</em>");
      showFinalOffers();
    } else {
      // Otherwise, continue the chat
      getAIResponse(userText);
    }
  }

  // ================================
  // 4) System Prompt & Conversation Reset
  // ================================
  async function initializeConversationHistory() {
    // Grab user profile from localStorage
    const userProfile = getUserProfile();
    const nearestAirport = getNearestAirport();
    const name = userProfile?.name || 'Guest';
    const budget = userProfile?.averagePNRValue || 1500;

    // Optionally summarize some destinations for the system prompt
    const destinationsData = await fetchDestinationsData();
    const shortList = destinationsData.slice(0,5).map(d => d.city_name).join(', ');

    // System message
    const systemMessage = `
You are a helpful travel assistant, friendly and concise in your replies.
User: ${name} (very important), approximate budget $${budget}, nearest airport: ${nearestAirport?.name || '???'}.
Your goal is to prompt users with questions (max 4, step-by-step, not all questions in one single message), identify the continent, the countries, the city, the season, and the activities expressed by the user in the conversations, and produce a set of three offer proposals as outcome.
Destinations are available in Asia, Europe, North America, South America and Africa.
Potential destinations: ${shortList}.
    `;
    conversationHistory = [{ role: 'system', content: systemMessage }];
    userMessageCount = 0;
    userSelectedSeason = 'flexible';
    userSelectedContinent = null;
  }

  // ================================
  // 5) Fetch AI Response
  // ================================
  async function getAIResponse(userText, retries = 3, delayTime = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await delay(delayTime);

        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: conversationHistory,
            max_tokens: 300,
            temperature: 0.9
          })
        });

        const data = await response.json();
        const aiText = data?.choices?.[0]?.message?.content;
        if (!aiText) {
          displayMessage('assistant', "I'm still thinking... please try again.");
          return;
        }

        conversationHistory.push({ role: 'assistant', content: aiText });
        displayMessage('assistant', aiText);

        break;
      } catch (err) {
        console.error('Error calling AI:', err);
        if (i < retries - 1) {
          console.warn(`Retrying AI call (attempt ${i+2})...`);
        } else {
          displayMessage('assistant', "Sorry, something went wrong. Please try again later.");
        }
      }
    }
  }

  // ================================
  // 6) Show Final 3 Offers
  // ================================
  async function showFinalOffers() {
    const userProfile = getUserProfile();
    const nearest = getNearestAirport();

    // Fetch the full destinations data
    const allDests = await fetchDestinationsData();
    if (!allDests.length) {
      displayMessage('assistant', "No destinations found in data!");
      return;
    }

    // Filter destinations based on user-selected continent
    const filteredDests = userSelectedContinent
      ? allDests.filter(dest => dest.city_continent.toLowerCase() === userSelectedContinent.toLowerCase())
      : allDests;

    // Shuffle & pick 3
    const finalThree = shuffleArray(filteredDests).slice(0, 3);

    // Titles
    const titles = ["Within Budget", "Surprise", "Premium"];
    // Generate date range from userSelectedSeason
    const dateRange = generateRoundTripDates(userSelectedSeason);

    const offerCardsHtml = finalThree.map((dest, idx) => {
      let multiplier = 1;
      if (idx === 1) multiplier = 1.2;  // surprise
      if (idx === 2) multiplier = 1.5;  // premium

      const base = userProfile.averagePNRValue || 1500;
      const fromPrice = Math.round(base * multiplier);

      // Build offer data
      const offerCardData = {
        title: titles[idx],
        image: dest.city_img,
        cityName: dest.city_name,
        origin: `${nearest.name} (${nearest.iata_code})`,
        destination: `${dest.city_airport || '???'}`,
        dates: `${dateRange.start} → ${dateRange.end}`,
        activities: (dest.city_poi || '').split(',').map(a => a.trim()),
        fromPrice: `$${fromPrice}`
      };

      // Return the HTML for the offer card
      return `
        <div class="offer-card">
          <div class="offer-container">
            <div class="offer-content">
              <div class="offer-type">${offerCardData.title}</div>
              <div class="offer-OnD">${offerCardData.origin} → ${offerCardData.destination}</div>
              <div class="destination-title">${offerCardData.cityName}</div>
              <div class="destination-description">${offerCardData.city_description}</div>
              <div class="offer-details-container">
                <div class="offer-details-content">
                  <div class="trip-dates-container">
                    <div class="trip-dates-content">${offerCardData.dates}</div>
                  </div>
                  <div class="trip-activities-container">
                    <div class="trip-activities-content">${offerCardData.activities.join(', ')}</div>
                  </div>
                  <div class="offer-call-to-actions">
                    <button onclick="saveOfferForLater(${idx})" class="primary-filled"><i class="ri-heart-add-fill"></i> Save</button>
                    <button onclick="shareOffer(${idx})" class="primary-filled"> <i class="ri-share-forward-fill"></i> Share</button>
                    <button onclick="bookNow(${idx})" class="primary-filled"><i class="ri-shopping-cart-fill"></i> Book</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="destination-image">
              <div class="image-overlay"></div>
              <img src="${offerCardData.image}" alt="Destination">
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Display the combined offer cards in a single message
    displayMessage('assistant', `<div id="message-content-offers">${offerCardsHtml}</div>`);
  }

  // ================================
  // 7) Season and Continent Detection + Date Generation
  // ================================
  function detectSeason(text) {
    const lower = text.toLowerCase();
    if (lower.includes('summer') || lower.includes('july') || lower.includes('august')) {
      userSelectedSeason = 'summer';
    } else if (lower.includes('winter') || lower.includes('december') || lower.includes('january') || lower.includes('february')) {
      userSelectedSeason = 'winter';
    } else if (lower.includes('spring') || lower.includes('march') || lower.includes('april') || lower.includes('may')) {
      userSelectedSeason = 'spring';
    } else if (lower.includes('autumn') || lower.includes('fall') || lower.includes('september') || lower.includes('october') || lower.includes('november')) {
      userSelectedSeason = 'autumn';
    }
  }

  function detectContinent(text) {
    const lower = text.toLowerCase();
  
    // Europe
    if (
      lower.includes('europe') ||
      lower.includes('france') || lower.includes('germany') || lower.includes('italy') ||
      lower.includes('spain') || lower.includes('portugal') || lower.includes('greece') ||
      lower.includes('netherlands') || lower.includes('sweden') || lower.includes('norway') ||
      lower.includes('switzerland') || lower.includes('austria') || lower.includes('poland')
    ) {
      userSelectedContinent = 'Europe';
    }
    // North America
    else if (
      lower.includes('north america') || lower.includes('usa') || lower.includes('america') ||
      lower.includes('canada') || lower.includes('mexico')
    ) {
      userSelectedContinent = 'North America';
    }
    // South America
    else if (
      lower.includes('south america') ||
      lower.includes('brazil') || lower.includes('argentina') || lower.includes('chile') ||
      lower.includes('colombia') || lower.includes('peru') || lower.includes('venezuela')
    ) {
      userSelectedContinent = 'South America';
    }
    // Asia
    else if (
      lower.includes('asia') ||
      lower.includes('china') || lower.includes('japan') || lower.includes('india') ||
      lower.includes('thailand') || lower.includes('vietnam') || lower.includes('indonesia') ||
      lower.includes('malaysia') || lower.includes('philippines') || lower.includes('south korea')
    ) {
      userSelectedContinent = 'Asia';
    }
    // Africa
    else if (
      lower.includes('africa') ||
      lower.includes('south africa') || lower.includes('egypt') || lower.includes('kenya') ||
      lower.includes('morocco') || lower.includes('nigeria') || lower.includes('tanzania') ||
      lower.includes('ghana') || lower.includes('ethiopia') || lower.includes('zimbabwe')
    ) {
      userSelectedContinent = 'Africa';
    }
    // Australia/Oceania
    else if (
      lower.includes('australia') || lower.includes('oceania') ||
      lower.includes('new zealand') || lower.includes('fiji') || lower.includes('papua new guinea')
    ) {
      userSelectedContinent = 'Australia';
    }
  }

  function generateRoundTripDates(season) {
    if (season === 'summer') {
      return { start: '2025-07-10', end: '2025-07-20' };
    } else if (season === 'winter') {
      return { start: '2025-01-15', end: '2025-01-25' };
    } else if (season === 'spring') {
      return { start: '2025-04-10', end: '2025-04-20' };
    } else if (season === 'autumn') {
      return { start: '2025-10-10', end: '2025-10-20' };
    }
    // fallback
    return { start: '2025-06-01', end: '2025-06-10' };
  }

  // ================================
  // 8) Utility
  // ================================
  function displayMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    aiModalChatContainer.appendChild(msgDiv);
    aiModalChatContainer.scrollTop = aiModalChatContainer.scrollHeight;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Stub for "Save", "Share", "Book" actions
  window.saveOfferForLater = function(idx) {
    alert(`Offer #${idx+1} saved for later!`);
  };
  window.shareOffer = function(idx) {
    alert(`Offer #${idx+1} shared with friends!`);
  };
  window.bookNow = function(idx) {
    alert(`Proceeding to booking for Offer #${idx+1}...`);
  };

  // ================================
  // 9) LocalStorage + Data
  // ================================
  function getUserProfile() {
    const raw = localStorage.getItem('loggedInUser');
    if (!raw) {
      return {
        name: "Guest",
        averagePNRValue: 1500
      };
    }
    return JSON.parse(raw);
  }
  
  function getNearestAirport() {
    const raw = localStorage.getItem('nearest_airport');
    if (!raw) {
      return { name: "Nice Côte d'Azur Airport", iata_code: "NCE" };
    }
    return JSON.parse(raw);
  }

  async function fetchDestinationsData() {
    try {
      const res = await fetch('../business-data/airline-data/destinations.json');
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch destinations.json:', err);
      return [];
    }
  }
});     