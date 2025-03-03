document.addEventListener("DOMContentLoaded", async function () {
    const menuContainer = document.getElementById("site-menu");
    const logoElement = document.getElementById("business-logo");

    // ✅ Fetch the `menu.json` URL & Business Logo from `business-config.json`
    async function fetchBusinessConfig() {
        try {
            const response = await fetch("../business-data/business-config.json");
            if (!response.ok) throw new Error("Failed to fetch business-config.json");

            const configData = await response.json();
            return configData.length > 0 ? configData[0] : null;
        } catch (error) {
            console.error("Error fetching business-config.json:", error);
            return null;
        }
    }

    // ✅ Fetch and build the menu dynamically
    async function loadNavbar() {
        const configData = await fetchBusinessConfig();
        if (!configData || !configData.menu) {
            console.error("No menu URL found in business-config.json");
            return;
        }

        // ✅ Update logo dynamically
        if (configData.business_logo) {
            logoElement.src = configData.business_logo;
        }

        try {
            const response = await fetch(configData.menu);
            if (!response.ok) throw new Error("Failed to fetch menu.json");

            const menuData = await response.json();
            buildMenu(menuData.menu, configData.loyalty_program);
        } catch (error) {
            console.error("Error fetching menu.json:", error);
        }
    }

    function buildMenu(menuItems, loyaltyProgramName) {
        menuContainer.innerHTML = ""; // Clear existing menu

        menuItems.forEach(item => {
            const li = document.createElement("li");

            const link = document.createElement("a");
            link.classList.add("no-dec");
            link.href = item.link;
            link.textContent = item.title;

            // ✅ If it's the Loyalty menu, insert program name
            if (item.title === "Loyalty" && loyaltyProgramName) {
                link.innerHTML = `<span class="loyalty-id">${loyaltyProgramName}</span>`;
            }

            li.appendChild(link);

            // ✅ If there are submenus, create dropdown structure with an arrow icon
            if (item.submenu && item.submenu.length > 0) {
                li.classList.add("has-submenu");

                // Create arrow icon (Remix Icon)
                const dropdownIcon = document.createElement("i");
                dropdownIcon.classList.add("ri-arrow-down-s-fill");
                dropdownIcon.style.marginLeft = "5px";
                link.appendChild(dropdownIcon); // Append icon next to the link

                const subMenu = document.createElement("ul");
                subMenu.classList.add("submenu");

                item.submenu.forEach(subItem => {
                    const subLi = document.createElement("li");
                    const subLink = document.createElement("a");
                    subLink.href = subItem.link;
                    subLink.textContent = subItem.title;
                    subLi.appendChild(subLink);
                    subMenu.appendChild(subLi);
                });

                li.appendChild(subMenu);
            }

            menuContainer.appendChild(li);
        });
    }

    // ✅ Load the navbar on page load
    loadNavbar();
});