/* ==========================================================================
   June Harvest — Buyers JS
   localStorage CRUD for buyers.
   Storage key: jh.buyers (Array of buyer objects)
   ========================================================================== */

const STORAGE_KEY = 'jh.buyers';

/* ---------- Persistence ---------- */
function readBuyers() {
    try {
        const val = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(val) ? val : [];
    } catch {
        return [];
    }
}

function saveBuyers(buyers) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buyers));
}

/* ---------- Helpers ---------- */
function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function formatUGX(amount) {
    if (!amount) return 'UGX 0';
    return 'UGX ' + Number(amount).toLocaleString('en-UG');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- Compute invoice totals for each buyer ---------- */
function getBuyerInvoiceTotals() {
    try {
        const invoices = JSON.parse(localStorage.getItem('jh.invoices') || '[]');
        const totals   = {};
        for (const inv of invoices) {
            if (!inv.buyerId) continue;
            if (!totals[inv.buyerId]) totals[inv.buyerId] = { invoiced: 0, outstanding: 0 };
            totals[inv.buyerId].invoiced += Number(inv.total) || 0;
            if (inv.status === 'outstanding' || inv.status === 'overdue') {
                totals[inv.buyerId].outstanding += Number(inv.total) || 0;
            }
        }
        return totals;
    } catch {
        return {};
    }
}

/* ---------- Render ---------- */
function render() {
    const buyers  = readBuyers();
    const totals  = getBuyerInvoiceTotals();
    const query   = document.getElementById('buyerSearch').value.trim().toLowerCase();

    // Metrics
    let totalInvoiced    = 0;
    let totalOutstanding = 0;
    for (const b of buyers) {
        const t = totals[b.id] || {};
        totalInvoiced    += t.invoiced    || 0;
        totalOutstanding += t.outstanding || 0;
    }

    document.getElementById('totalBuyers').textContent      = buyers.length;
    document.getElementById('totalInvoiced').textContent    = formatUGX(totalInvoiced);
    document.getElementById('totalOutstanding').textContent = formatUGX(totalOutstanding);

    // Filtered list
    const filtered = query
        ? buyers.filter(b => `${b.name} ${b.district} ${b.contact}`.toLowerCase().includes(query))
        : buyers;

    const tbody = document.getElementById('buyerTableBody');
    if (!filtered.length) {
        tbody.innerHTML = `<tr><td class="empty-state" colspan="6">${query ? 'No buyers match your search.' : 'No buyers yet. Add your first buyer to get started.'}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => {
        const t = totals[b.id] || {};
        return `
            <tr>
                <td>
                    <strong>${escHtml(b.name)}</strong>
                </td>
                <td>
                    ${b.contact ? escHtml(b.contact) + '<br>' : ''}
                    ${b.phone   ? `<a href="tel:${escHtml(b.phone)}">${escHtml(b.phone)}</a>` : '—'}
                </td>
                <td>${escHtml(b.district) || '—'}</td>
                <td>${formatUGX(t.invoiced)}</td>
                <td>${formatUGX(t.outstanding)}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${escHtml(b.id)}" aria-label="Edit ${escHtml(b.name)}">Edit</button>
                        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${escHtml(b.id)}" aria-label="Delete ${escHtml(b.name)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/* ---------- Form ---------- */
const form        = document.getElementById('buyerForm');
const formPanel   = document.getElementById('buyerFormPanel');
const formHeading = document.getElementById('buyer-form-heading');
const msgEl       = document.getElementById('buyerMessage');
const editIdInput = document.getElementById('editBuyerId');

function openForm(buyer = null) {
    formPanel.hidden = false;
    msgEl.textContent = '';
    msgEl.className = 'form-message';

    if (buyer) {
        formHeading.textContent = 'Edit buyer';
        editIdInput.value = buyer.id;
        document.getElementById('buyerName').value    = buyer.name    || '';
        document.getElementById('buyerDistrict').value = buyer.district || '';
        document.getElementById('buyerContact').value = buyer.contact || '';
        document.getElementById('buyerPhone').value   = buyer.phone   || '';
        document.getElementById('buyerEmail').value   = buyer.email   || '';
        document.getElementById('buyerNotes').value   = buyer.notes   || '';
    } else {
        formHeading.textContent = 'Add a buyer';
        editIdInput.value = '';
        form.reset();
    }

    formPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('buyerName').focus();
}

function closeForm() {
    formPanel.hidden = true;
    form.reset();
    editIdInput.value = '';
}

document.getElementById('openAddBuyerBtn').addEventListener('click', () => openForm());
document.getElementById('cancelBuyerBtn').addEventListener('click', closeForm);

form.addEventListener('submit', e => {
    e.preventDefault();

    const name     = document.getElementById('buyerName').value.trim();
    const district = document.getElementById('buyerDistrict').value.trim();
    const contact  = document.getElementById('buyerContact').value.trim();
    const phone    = document.getElementById('buyerPhone').value.trim();
    const email    = document.getElementById('buyerEmail').value.trim();
    const notes    = document.getElementById('buyerNotes').value.trim();

    if (!name) {
        msgEl.textContent = 'Buyer name is required.';
        msgEl.className = 'form-message error';
        document.getElementById('buyerName').focus();
        return;
    }

    const buyers = readBuyers();
    const editId = editIdInput.value;

    if (editId) {
        const idx = buyers.findIndex(b => b.id === editId);
        if (idx !== -1) {
            buyers[idx] = { ...buyers[idx], name, district, contact, phone, email, notes };
        }
    } else {
        buyers.unshift({ id: crypto.randomUUID(), name, district, contact, phone, email, notes });
    }

    saveBuyers(buyers);
    render();
    closeForm();
    showToast(editId ? 'Buyer updated.' : 'Buyer saved.');
});

/* ---------- Table actions ---------- */
document.getElementById('buyerTableBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id     = btn.dataset.id;
    const buyers = readBuyers();

    if (btn.dataset.action === 'delete') {
        const buyer = buyers.find(b => b.id === id);
        if (!buyer) return;
        if (!confirm(`Delete "${buyer.name}"? This cannot be undone.`)) return;
        saveBuyers(buyers.filter(b => b.id !== id));
        render();
        showToast('Buyer deleted.');
    }

    if (btn.dataset.action === 'edit') {
        const buyer = buyers.find(b => b.id === id);
        if (buyer) openForm(buyer);
    }
});

/* ---------- Search ---------- */
document.getElementById('buyerSearch').addEventListener('input', render);

/* ---------- Init ---------- */
render();
