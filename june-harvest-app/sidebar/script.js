(() => {
    const sideMenu = document.getElementById("sideMenu");
    const sidebarContainer = sideMenu?.closest("#sidebar") ?? sideMenu?.parentElement;
    const mobileToggle = sidebarContainer?.querySelector("#mobileToggle");

    if (!sideMenu || !sidebarContainer || !mobileToggle) {
        return;
    }

    const navItems = [...sidebarContainer.querySelectorAll(".nav-item")];
    const normalizePath = path => path.replace(/\/+$/, "") || "/";
    const currentPath = normalizePath(window.location.pathname);

    navItems.forEach(item => {
        const link = item.querySelector(".nav-link");
        const href = link?.getAttribute("href");
        const isCurrentPage = href && href !== "#" && normalizePath(new URL(href, window.location.href).pathname) === currentPath;

        item.classList.toggle("active", Boolean(isCurrentPage));
        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link?.removeAttribute("aria-current");
        }
    });

    const setMenuOpen = isOpen => {
        sideMenu.classList.toggle("open", isOpen);
        mobileToggle.setAttribute("aria-expanded", String(isOpen));
        mobileToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    };

    mobileToggle.addEventListener("click", () => {
        setMenuOpen(!sideMenu.classList.contains("open"));
    });

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(navItem => navItem.classList.remove("active"));
            item.classList.add("active");
            setMenuOpen(false);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            setMenuOpen(false);
        }
    });
})();