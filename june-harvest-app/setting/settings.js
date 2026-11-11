/* ==========================================================================
   June Harvest — Settings JS
   Tab switcher and localStorage persistence for Farm Settings.
   ========================================================================== */

const SETTINGS_KEY = 'jh.settings.v1';

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);

        if (data.farmName) document.getElementById('farm-name').value = data.farmName;
        if (data.location) document.getElementById('farm-location').value = data.location;
        if (data.manager) document.getElementById('farm-manager').value = data.manager;
        if (data.phone) document.getElementById('farm-phone').value = data.phone;
        if (data.size) document.getElementById('farm-size').value = data.size;

        if (data.currency) document.getElementById('currency').value = data.currency;
        if (data.defaultUnit) document.getElementById('default-unit').value = data.defaultUnit;

        if (data.prefix) document.getElementById('invoice-prefix').value = data.prefix;
        if (data.taxRate !== undefined) document.getElementById('tax-rate').value = data.taxRate;
        if (data.paymentInstructions) document.getElementById('default-payment').value = data.paymentInstructions;
    } catch (e) {
        console.error('Failed to parse settings:', e);
    }
}

function saveSettings() {
    const settings = {
        farmName: document.getElementById('farm-name')?.value.trim(),
        location: document.getElementById('farm-location')?.value.trim(),
        manager: document.getElementById('farm-manager')?.value.trim(),
        phone: document.getElementById('farm-phone')?.value.trim(),
        size: document.getElementById('farm-size')?.value,

        currency: document.getElementById('currency')?.value,
        defaultUnit: document.getElementById('default-unit')?.value,

        prefix: document.getElementById('invoice-prefix')?.value.trim(),
        taxRate: Number(document.getElementById('tax-rate')?.value) || 0,
        paymentInstructions: document.getElementById('default-payment')?.value.trim(),
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    showToast('Settings saved successfully.');
}

// Tab navigation
const tabBtns = document.querySelectorAll('.settings-nav-btn');
const panels = document.querySelectorAll('.settings-panel');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        tabBtns.forEach(b => {
            const isActive = b === btn;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', String(isActive));
        });

        panels.forEach(p => {
            const isMatch = p.id === `panel-${targetTab}`;
            p.classList.toggle('active', isMatch);
            p.hidden = !isMatch;
        });
    });
});

document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);

loadSettings();
