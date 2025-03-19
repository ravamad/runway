
  document.addEventListener("DOMContentLoaded", function() {
    fetch('../business-data/business-config.json')
      .then(response => response.json())
      .then(config => {
        const componentsUrl = config[0].components;
        const imageryUrl = config[0].imagery;
  
        Promise.all([
          fetch(componentsUrl).then(response => response.json()),
          fetch(imageryUrl).then(response => response.json())
        ]).then(([components, imagery]) => {
          const mosaicData = components.mosaic;
          const mosaicContainer = document.getElementById('mosaic');
          const row = mosaicContainer.querySelector('.row');
  
          // Add title and subtitle
          const title = document.createElement('h2');
          title.textContent = mosaicData.title;
          mosaicContainer.insertBefore(title, row);
  
          const subtitle = document.createElement('p');
          subtitle.textContent = mosaicData.subtitle;
          mosaicContainer.insertBefore(subtitle, row);
  
          mosaicData.items.forEach(item => {
            const imageUrl = imagery.find(img => img.mosaic && img.mosaic.find(m => m.id === item.imagery_key)).mosaic.find(m => m.id === item.imagery_key).image;
            const card = document.createElement('div');
            card.className = 'd-flex justify-space-evenly col-lg-4 col-md-4 col-sm-12 mb-4';
            card.innerHTML = `
              <div class="card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${item.title}">
                <div class="card-body">
                  <h5 class="card-title">${item.title}</h5>
                  <p class="card-text">${item.description}</p>
                  <a href="${item.link}" class="button primary-filled">Learn More</a>
                </div>
              </div>
            `;
            row.appendChild(card);
          });
        });
      });
  });