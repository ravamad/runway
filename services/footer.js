async function loadFooter() {
    try {
        const configResponse = await fetch('../business-data/business-config.json');
        const configData = await configResponse.json();

        const footerPath = configData[0].footer;

        const footerResponse = await fetch(footerPath);
        const footerData = await footerResponse.json();

        const footerContainer = document.getElementById('footer-container');
        footerContainer.innerHTML = '';

        Object.entries(footerData).forEach(([sectionTitle, links]) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'col-12 col-md-2 mb-4 footer-menu-content';

            const heading = document.createElement('h5');
            heading.textContent = sectionTitle;
            sectionDiv.appendChild(heading);

            const list = document.createElement('ul');
            list.className = 'list-unstyled';

            links.forEach(item => {
                const listItem = document.createElement('li');

                if (typeof item === 'string') {
                    listItem.textContent = item;
                } else {
                    const link = document.createElement('a');
                    link.href = item.url || '#';
                    link.textContent = item.title;

                    if (item.external) {
                        link.innerHTML += ' <span>&#8599;</span>';
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    }

                    listItem.appendChild(link);
                }

                list.appendChild(listItem);
            });

            sectionDiv.appendChild(list);
            footerContainer.appendChild(sectionDiv);
        });
    } catch (error) {
        console.error('Error loading footer data:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadFooter);