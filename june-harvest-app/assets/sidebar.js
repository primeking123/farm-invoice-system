document.addEventListener("DOMContentLoaded", () => {
    fetch('../sidebar/sidebar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load sidebar");
            }
            return response.text();
        })
        .then(data => {
            const sidebarContainer = document.getElementById('sidebar');
            sidebarContainer.innerHTML = data;

            // Attach active state switching after sidebar is loaded
            const navItems = sidebarContainer.querySelectorAll('.nav-item');
            navItems.forEach(function (item) {
                item.addEventListener('click', function () {
                    navItems.forEach(function (nav) {
                        nav.classList.remove('active');
                    });
                    this.classList.add('active');

                    // Close mobile menu after selecting an item
                    const sideMenu = sidebarContainer.querySelector('.side-menu');
                    if (sideMenu) {
                        sideMenu.classList.remove('open');
                    }
                });
            });

            // Mobile toggle
            const mobileToggle = sidebarContainer.querySelector('#mobileToggle');
            const sideMenu = sidebarContainer.querySelector('.side-menu');
            if (mobileToggle && sideMenu) {
                mobileToggle.addEventListener('click', function () {
                    sideMenu.classList.toggle('open');
                });
            }
        })
        .catch(error => console.error("Error loading the sidebar:", error));
});