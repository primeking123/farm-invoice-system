/* ==========================================================================
   June Harvest — Seasons JS
   localStorage CRUD for farming seasons.
   Storage key: jh.seasons (Array of season objects)
   ========================================================================== */

const STORAGE_KEY = 'jh.seasons';

/* ---------- Persistence ---------- */
function readSeasons() {
    try {
        const val = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(val) ? val : [];
    } catch {
        return [];
    }
}

function saveSeasons(seasons) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seasons));
}

/* ---------- Helpers ---------- */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- Render ---------- */
function render() {
    const seasons = readSeasons();

    // Metrics
    document.getElementById('activeCount').textContent    = seasons.filter(s => s.status === 'active').length;
    document.getElementById('plannedCount').textContent   = seasons.filter(s => s.status === 'planned').length;
    document.getElementById('completedCount').textContent = seasons.filter(s => s.status === 'completed').length;

    // Table
    const tbody = document.getElementById('seasonTableBody');
    if (!seasons.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="5">No seasons yet. Add your first season to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = seasons.map(s => `
        <tr>
            <td><strong>${escHtml(s.name)}</strong></td>
            <td>${formatDate(s.startDate)}</td>
            <td>${formatDate(s.endDate)}</td>
            <td><span class="status-chip chip-${escHtml(s.status)}">${escHtml(s.status)}</span></td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${escHtml(s.id)}" aria-label="Edit ${escHtml(s.name)}">Edit</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${escHtml(s.id)}" aria-label="Delete ${escHtml(s.name)}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ---------- Form ---------- */
const form        = document.getElementById('seasonForm');
const formPanel   = document.getElementById('seasonFormPanel');
const formHeading = document.getElementById('season-form-heading');
const msgEl       = document.getElementById('seasonMessage');
const editIdInput = document.getElementById('editSeasonId');

function openForm(season = null) {
    formPanel.hidden = false;
    msgEl.textContent = '';
    msgEl.className = 'form-message';

    if (season) {
        formHeading.textContent = 'Edit season';
        editIdInput.value = season.id;
        document.getElementById('seasonName').value   = season.name;
        document.getElementById('seasonStatus').value = season.status;
        document.getElementById('seasonStart').value  = season.startDate || '';
        document.getElementById('seasonEnd').value    = season.endDate   || '';
    } else {
        formHeading.textContent = 'Add a season';
        editIdInput.value = '';
        form.reset();
    }

    formPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('seasonName').focus();
}

function closeForm() {
    formPanel.hidden = true;
    form.reset();
    editIdInput.value = '';
}

document.getElementById('openAddSeasonBtn').addEventListener('click', () => openForm());
document.getElementById('cancelSeasonBtn').addEventListener('click', closeForm);

form.addEventListener('submit', e => {
    e.preventDefault();

    const name      = document.getElementById('seasonName').value.trim();
    const status    = document.getElementById('seasonStatus').value;
    const startDate = document.getElementById('seasonStart').value;
    const endDate   = document.getElementById('seasonEnd').value;

    if (!name) {
        msgEl.textContent = 'Season name is required.';
        msgEl.className = 'form-message error';
        document.getElementById('seasonName').focus();
        return;
    }

    if (startDate && endDate && endDate < startDate) {
        msgEl.textContent = 'End date must be on or after the start date.';
        msgEl.className = 'form-message error';
        return;
    }

    const seasons = readSeasons();
    const editId  = editIdInput.value;

    if (editId) {
        const idx = seasons.findIndex(s => s.id === editId);
        if (idx !== -1) {
            seasons[idx] = { ...seasons[idx], name, status, startDate, endDate };
        }
    } else {
        // Only one season can be active at a time
        if (status === 'active') {
            seasons.forEach(s => { if (s.status === 'active') s.status = 'planned'; });
        }
        seasons.unshift({ id: crypto.randomUUID(), name, status, startDate, endDate });
    }

    saveSeasons(seasons);
    render();
    closeForm();
    showToast(editId ? 'Season updated.' : 'Season saved.');
});

/* ---------- Table actions (edit / delete) ---------- */
document.getElementById('seasonTableBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id      = btn.dataset.id;
    const seasons = readSeasons();

    if (btn.dataset.action === 'delete') {
        const season = seasons.find(s => s.id === id);
        if (!season) return;
        if (!confirm(`Delete "${season.name}"? This cannot be undone.`)) return;
        saveSeasons(seasons.filter(s => s.id !== id));
        render();
        showToast('Season deleted.');
    }

    if (btn.dataset.action === 'edit') {
        const season = seasons.find(s => s.id === id);
        if (season) openForm(season);
    }
});

/* ---------- Init ---------- */
render();
