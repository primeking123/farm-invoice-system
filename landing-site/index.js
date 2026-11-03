
const sections = [
    { id: "home", file: "home.html" },
    { id: "solution", file: "solution.html" },
    {id:"how-it-works", file: "how-it-works.html"},
    { id: "pricing", file: "pricing.html" },
    { id: "about", file: "about.html" },
    { id: "contact", file: "contact.html" },
    { id: "get-started", file: "get-started.html" }
];

async function loadSections() {
    for (const section of sections) {
        const container = document.getElementById(section.id);

        try {
            const response = await fetch(section.file);

            if (!response.ok) {
                throw new Error(`Could not load ${section.file}`);
            }

            container.innerHTML = await response.text();
        } catch (error) {
            console.error(error);
            container.textContent =
                "This section could not be loaded.";
        }
    }
}


const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  const isOpening = navLinks.classList.toggle('show');
  
  // Swap icons and update accessibility attributes smoothly
  menuToggle.textContent = isOpening ? '✕' : '☰';
  menuToggle.setAttribute('aria-expanded', isOpening);
});

navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
        navLinks.classList.remove('show');
        menuToggle.textContent = '☰';
        menuToggle.setAttribute('aria-expanded', 'false');
    }
});


loadSections();
