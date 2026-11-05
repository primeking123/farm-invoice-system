const sidebarUrl = new URL("../sidebar/sidebar.html", document.currentScript.src);

document.addEventListener("DOMContentLoaded", async () => {
    const sidebarContainer = document.getElementById("sidebar");
    if (!sidebarContainer) {
        return;
    }

    try {
        const response = await fetch(sidebarUrl);
        if (!response.ok) {
            throw new Error(`Failed to load sidebar (${response.status})`);
        }

        sidebarContainer.innerHTML = await response.text();

        const sideMenu = sidebarContainer.querySelector("#sideMenu");
        const mobileToggle = sidebarContainer.querySelector("#mobileToggle");
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
                if (item.querySelector('.nav-link[aria-disabled="true"]')) {
                    return;
                }

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

        sidebarContainer.dataset.sidebarReady = "true";
    } catch (error) {
        console.error("Error loading the sidebar:", error);
    }
});