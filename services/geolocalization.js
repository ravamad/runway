document.addEventListener("DOMContentLoaded", async () => {
    const consentKey = "geo_consent";
    const locationKey = "user_location";
    const nearestCityKey = "nearest_city";
    const nearestAirportKey = "nearest_airport";
    const configUrl = "../business-data/business-config.json";

    async function fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`❌ Error fetching JSON from ${url}:`, error);
            return null;
        }
    }

    function saveToStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getFromStorage(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const toRadians = (degree) => (degree * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    function findNearestCity(lat, lon, networkData) {
        let nearestCity = null;
        let minDistance = Infinity;

        Object.entries(networkData.continents).forEach(([continent, countries]) => {
            Object.entries(countries).forEach(([country, cities]) => {
                Object.entries(cities).forEach(([cityName, cityData]) => {
                    const { latitude, longitude } = cityData.geolocation;
                    const distance = calculateDistance(lat, lon, latitude, longitude);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCity = { name: cityName, country };
                    }
                });
            });
        });

        return nearestCity;
    }

    function findNearestAirport(cityData) {
        if (!cityData || !cityData.airports || cityData.airports.length === 0) return null;
        return cityData.airports[0]; // Pick the first airport in the city
    }

    async function fetchAndFindNearest(lat, lon) {
        console.log("🌍 Fetching business config...");
        const businessConfig = await fetchJson(configUrl);
        if (!businessConfig || !businessConfig[0].network) {
            console.error("❌ No network file found in business-config.json");
            return;
        }

        const networkFile = businessConfig[0].network;
        console.log(`🔗 Fetching network data from: ${networkFile}`);
        const networkData = await fetchJson(networkFile);
        if (!networkData) return;

        console.log("🔎 Finding nearest city...");
        const nearestCity = findNearestCity(lat, lon, networkData);

        if (!nearestCity) {
            console.error("⚠️ No nearby city found.");
            return;
        }

        console.log("🏙️ Nearest City Found:", nearestCity.name, nearestCity.country);

        // Update the UI with the nearest city
        const closestLocationElement = document.getElementById("closest-location");
        if (closestLocationElement && nearestCity) {
            closestLocationElement.textContent = `${nearestCity.name}, ${nearestCity.country}`;
        }

        // Find the continent in the JSON
        let foundContinent = null;
        for (const [continent, countries] of Object.entries(networkData.continents)) {
            if (countries[nearestCity.country]) {
                foundContinent = continent;
                break;
            }
        }

        if (!foundContinent) {
            console.error(`❌ Could not determine the continent for ${nearestCity.country}.`);
            return;
        }

        console.log(`🌎 Continent Found: ${foundContinent}`);

        const countryData = networkData.continents[foundContinent][nearestCity.country];
        if (!countryData || !countryData[nearestCity.name]) {
            console.error(`❌ City ${nearestCity.name} not found in ${nearestCity.country} (${foundContinent}).`);
            return;
        }

        const cityData = countryData[nearestCity.name];
        saveToStorage(nearestCityKey, nearestCity);

        console.log("🏙️ City Data Found:", cityData);

        // Find the nearest airport
        const nearestAirport = findNearestAirport(cityData);
        if (nearestAirport) {
            console.log("✈️ Nearest Airport Found:", nearestAirport.name, nearestAirport.iata_code);
            saveToStorage(nearestAirportKey, nearestAirport);
        } else {
            console.warn("⚠️ No airport found for", nearestCity.name);
        }
    }

    function askForGeolocation() {
        console.log("⏳ Requesting geolocation...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                saveToStorage(locationKey, { latitude, longitude });
                saveToStorage(consentKey, "granted");
    
                console.log("✅ Location granted:", latitude, longitude);
    
                await fetchAndFindNearest(latitude, longitude);
    
                // Prevent infinite refresh in incognito mode
                if (!getFromStorage("pageReloaded")) {
                    saveToStorage("pageReloaded", true);
                    setTimeout(() => location.reload(), 500);
                }
            },
            (error) => {
                console.error("❌ Geolocation error:", error.message);
                saveToStorage(consentKey, "denied");
            }
        );
    }

    async function checkConsent() {
        const consent = getFromStorage(consentKey);
        const closestLocationElement = document.getElementById("closest-location");
    
        if (consent === "granted") {
            console.log("🔄 Geolocation previously granted, fetching location...");
            askForGeolocation();
        } else if (consent === "denied") {
            console.log("🚫 Geolocation permission previously denied. Selecting a default city...");
    
            // Fetch business config and pick the first European city
            const businessConfig = await fetchJson(configUrl);
            if (!businessConfig || !businessConfig[0].network) {
                console.error("❌ No network file found in business-config.json");
                return;
            }
    
            const networkFile = businessConfig[0].network;
            console.log(`🔗 Fetching network data from: ${networkFile}`);
            const networkData = await fetchJson(networkFile);
            if (!networkData) return;
    
            const europe = networkData.continents.Europe;
            if (europe) {
                const firstCountry = Object.keys(europe)[0];
                if (firstCountry) {
                    const firstCity = Object.keys(europe[firstCountry])[0];
                    if (firstCity) {
                        console.log(`🌍 Defaulting to: ${firstCity}, ${firstCountry}`);
                        const nearestCity = { name: firstCity, country: firstCountry };
                        saveToStorage(nearestCityKey, nearestCity);
                        if (closestLocationElement) {
                            closestLocationElement.textContent = `${firstCity}, ${firstCountry}`;
                        }
                    }
                }
            }
        } else {
            console.log("🆕 Asking user for geolocation...");
            askForGeolocation();
        }
    }

    window.retryPermission = () => {
        console.log("🔄 Retrying geolocation request...");
        localStorage.removeItem(consentKey);
        checkConsent();
    };

    checkConsent();
});