document.addEventListener("DOMContentLoaded", function() {
  fetch('../business-data/business-config.json')
    .then(response => response.json())
    .then(config => {
      const destinationsUrl = config[0].destinations;

      fetch(destinationsUrl)
        .then(response => response.json())
        .then(data => {
          const destinations = data;
          const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];

          document.getElementById('destination-name').textContent = randomDestination.city_name;
          document.getElementById('destination-description').textContent = randomDestination.city_description;
          document.getElementById('destination-image').src = randomDestination.city_img;

          const activitiesList = document.getElementById('destination-activities-list');
          activitiesList.innerHTML = '';
          randomDestination.city_poi.split(', ').forEach(activity => {
            const listItem = document.createElement('li');
            listItem.textContent = activity;
            activitiesList.appendChild(listItem);
          });

          document.getElementById('another-destination').addEventListener('click', function() {
            location.reload();
          });

          document.getElementById('book-destination').addEventListener('click', function() {
            window.location.href = '#'; // Add booking URL here
          });
        });
    });
});