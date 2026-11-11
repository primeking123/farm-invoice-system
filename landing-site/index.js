/* ==========================================================================
   June Harvest — Landing Site JS
   Handles dynamic section loading, navigation state, interactive walkthrough,
   and contact form validation/feedback.
   ========================================================================== */

const sections = [
    { id: "hero", file: "hero.html" },
    { id: "solution", file: "solution.html" },
    { id: "how-it-works", file: "how-it-works.html" },
    { id: "pricing", file: "pricing.html" },
    { id: "about", file: "about.html" },
    { id: "contact", file: "contacts.html" },
    { id: "get-started", file: "get-started.html" }
];

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// 1. Dynamic Section Loading
async function loadSections() {
    for (const section of sections) {
        const container = document.getElementById(section.id);
        if (!container) continue;

        try {
            const response = await fetch(section.file);
            if (!response.ok) {
                throw new Error(`Could not load ${section.file} (${response.status})`);
            }
            container.innerHTML = await response.text();
        } catch (error) {
            console.error(error);
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">
                    <p>Section "${section.id}" could not be loaded directly over local file protocol.</p>
                </div>
            `;
        }
    }

    // Initialize all interactive modules once sections are in the DOM
    initNavigation();
    initWalkthroughTabs();
    initContactForm();
    initScrollSpy();
}

// 2. Navigation & Mobile Menu
function initNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navLinks');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    // Close menu when clicking navigation anchor
    navMenu.querySelectorAll('.nav-anchor').forEach(anchor => {
        anchor.addEventListener('click', () => {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// 3. Interactive Walkthrough Tab Switcher (How It Works)
function initWalkthroughTabs() {
    const tabs = document.querySelectorAll('.walkthrough-tab');
    const panes = document.querySelectorAll('.walkthrough-pane');

    if (!tabs.length || !panes.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const stage = tab.dataset.stage;

            // Update tab states
            tabs.forEach(t => {
                const isActive = t === tab;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', String(isActive));
            });

            // Update panel states
            panes.forEach(pane => {
                const isMatch = pane.id === `stage-panel-${stage}`;
                pane.classList.toggle('active', isMatch);
                pane.hidden = !isMatch;
            });
        });
    });
}

// 4. Contact Form Handler (Plain JS + localStorage)
function initContactForm() {
    const form = document.getElementById('contactForm');
    const feedback = document.getElementById('contactFeedback');

    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('contact-name')?.value.trim();
        const email = document.getElementById('contact-email')?.value.trim();
        const phone = document.getElementById('contact-phone')?.value.trim();
        const role = document.getElementById('contact-role')?.value;
        const message = document.getElementById('contact-message')?.value.trim();

        if (!name || !email || !message) {
            if (feedback) {
                feedback.textContent = 'Please fill in all required fields (Name, Email, Message).';
                feedback.className = 'contact-form-feedback error';
            }
            return;
        }

        // Store inquiry in localStorage
        try {
            const existing = JSON.parse(localStorage.getItem('jh.inquiries') || '[]');
            existing.unshift({
                id: crypto.randomUUID(),
                name,
                email,
                phone,
                role,
                message,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('jh.inquiries', JSON.stringify(existing));
        } catch (err) {
            console.error('Storage error:', err);
        }

        form.reset();

        if (feedback) {
            feedback.textContent = `Thank you, ${name}! Your inquiry has been logged. Our agricultural team will get back to you shortly.`;
            feedback.className = 'contact-form-feedback success';
        }

        showToast('Message sent successfully!');
    });
}

// 5. ScrollSpy to update active nav link on scroll
function initScrollSpy() {
    const navAnchors = document.querySelectorAll('.nav-anchor');
    const sectionIds = ['hero', 'solution', 'how-it-works', 'pricing', 'about', 'contact'];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navAnchors.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, {
        rootMargin: '-20% 0px -70% 0px'
    });

    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

// Kick off
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSections);
} else {
    loadSections();
}
