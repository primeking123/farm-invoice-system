document.addEventListener('DOMContentLoaded', function () {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            navItems.forEach(function (nav) {
                nav.classList.remove('active');
            });
            this.classList.add('active');

            // Close mobile menu after selecting an item
            const sideMenu = document.querySelector('.side-menu');
            if (sideMenu) {
                sideMenu.classList.remove('open');
            }
        });
    });

    // Mobile toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const sideMenu = document.querySelector('.side-menu');

    if (mobileToggle && sideMenu) {
        mobileToggle.addEventListener('click', function () {
            sideMenu.classList.toggle('open');
        });
    }
});