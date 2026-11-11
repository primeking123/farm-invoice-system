/* ==========================================================================
   June Harvest — Create Invoice JS
   Loads buyers + seasons from localStorage, manages line items,
   auto-calculates totals, and saves invoices to jh.invoices.
   ========================================================================== */

/* ---------- Storage helpers ---------- */
function readKey(key) {
    try {
        const val = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(val) ? val : [];
    } catch { return []; }
}

function readInvoices() { return readKey('jh.invoices'); }
function readSeasons()  { return readKey('jh.seasons'); }
function readBuyers()   { return readKey('jh.buyers'); }

function saveInvoices(invoices) {
    localStorage.setItem('jh.invoices', JSON.stringify(invoices));
}

/* ---------- Helpers ---------- */
function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function formatUGX(amount) {
    return 'UGX ' + Number(amount || 0).toLocaleString('en-UG');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- Invoice number generation ---------- */
function generateInvoiceNumber() {
    const invoices = readInvoices();
    const year     = new Date().getFullYear();
    const count    = invoices.filter(i => i.number && i.number.includes(String(year))).length + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
}

/* ---------- Populate selects ---------- */
function populateSelects() {
    const seasonSelect = document.getElementById('invoiceSeason');
    const buyerSelect  = document.getElementById('invoiceBuyer');

    const seasons = readSeasons().filter(s => s.status === 'active' || s.status === 'planned');
    const buyers  = readBuyers();

    // Seasons
    seasonSelect.innerHTML = '<option value="">Choose a season</option>' +
        seasons.map(s => `<option value="${escHtml(s.id)}">${escHtml(s.name)}</option>`).join('');

    // Buyers
    buyerSelect.innerHTML = '<option value="">Choose a buyer</option>' +
        buyers.map(b => `<option value="${escHtml(b.id)}">${escHtml(b.name)}</option>`).join('');
}

/* ---------- Line items ---------- */
let lineItems = [];

const UNITS = ['bags', 'kg', 'crates', 'tons', 'litres', 'pieces', 'boxes'];
const CROPS = ['Maize', 'Beans', 'Coffee', 'Matooke', 'Cassava', 'Groundnuts', 'Sorghum', 'Delivery'];

function addLineItem() {
    lineItems.push({ id: crypto.randomUUID(), description: '', qty: '', unit: 'bags', price: '', total: 0 });
    renderLineItems();
}

function removeLineItem(id) {
    lineItems = lineItems.filter(item => item.id !== id);
    renderLineItems();
    updateSummary();
}

function renderLineItems() {
    const tbody = document.getElementById('itemsBody');

    if (!lineItems.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="6">No items added yet. Click "Add item" to begin.</td></tr>';
        return;
    }

    tbody.innerHTML = lineItems.map(item => `
        <tr data-id="${escHtml(item.id)}">
            <td class="col-desc">
                <input type="text" value="${escHtml(item.description)}"
                    placeholder="e.g. Maize grain"
                    data-field="description"
                    aria-label="Item description"
                    list="cropSuggestions"
                    maxlength="80">
                <datalist id="cropSuggestions">
                    ${CROPS.map(c => `<option value="${escHtml(c)}">`).join('')}
                </datalist>
            </td>
            <td class="col-qty">
                <input type="number" value="${escHtml(item.qty)}" min="0.01" step="0.01"
                    data-field="qty"
                    aria-label="Quantity">
            </td>
            <td class="col-unit">
                <select data-field="unit" aria-label="Unit">
                    ${UNITS.map(u => `<option value="${u}" ${u === item.unit ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
            </td>
            <td class="col-price">
                <input type="number" value="${escHtml(item.price)}" min="0" step="1"
                    data-field="price"
                    aria-label="Unit price in UGX">
            </td>
            <td class="col-total">
                <input type="number" value="${item.total || ''}" readonly
                    aria-label="Line total in UGX">
            </td>
            <td class="col-rm">
                <button class="btn btn-danger btn-sm" type="button"
                    data-remove="${escHtml(item.id)}"
                    aria-label="Remove this item" title="Remove">
                    <i class="bi bi-x" aria-hidden="true"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateSummary() {
    const taxRate  = parseFloat(document.getElementById('taxRate').value) || 0;
    const subtotal = lineItems.reduce((sum, i) => sum + (i.total || 0), 0);
    const tax      = subtotal * taxRate / 100;
    const total    = subtotal + tax;

    document.getElementById('summarySubtotal').textContent = formatUGX(subtotal);
    document.getElementById('summaryTax').textContent      = formatUGX(tax);
    document.getElementById('summaryTotal').textContent    = formatUGX(total);

    return { subtotal, tax, total };
}

/* ---------- Line item input delegation ---------- */
document.getElementById('itemsBody').addEventListener('input', e => {
    const input = e.target;
    const row   = input.closest('tr[data-id]');
    if (!row) return;

    const id   = row.dataset.id;
    const item = lineItems.find(i => i.id === id);
    if (!item) return;

    const field = input.dataset.field;
    if (!field) return;

    item[field] = input.value;

    if (field === 'qty' || field === 'price') {
        const qty   = parseFloat(item.qty)   || 0;
        const price = parseFloat(item.price) || 0;
        item.total  = qty * price;

        // Update the readonly total cell in the same row
        const totalInput = row.querySelector('[aria-label="Line total in UGX"]');
        if (totalInput) totalInput.value = item.total || '';
    }

    updateSummary();
});

/* ---------- Remove item delegation ---------- */
document.getElementById('itemsBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (btn) removeLineItem(btn.dataset.remove);
});

/* ---------- Tax field triggers summary update ---------- */
document.getElementById('taxRate').addEventListener('input', updateSummary);

/* ---------- Add item button ---------- */
document.getElementById('addItemBtn').addEventListener('click', addLineItem);

/* ---------- Save (submit / draft) ---------- */
function buildInvoice(isDraft = false) {
    const seasonId   = document.getElementById('invoiceSeason').value;
    const buyerId    = document.getElementById('invoiceBuyer').value;
    const issueDate  = document.getElementById('issueDate').value;
    const dueDate    = document.getElementById('dueDate').value;
    const taxRate    = parseFloat(document.getElementById('taxRate').value) || 0;
    const payment    = document.getElementById('paymentInstructions').value.trim();
    const notes      = document.getElementById('invoiceNotes').value.trim();
    const status     = isDraft ? 'draft' : document.getElementById('invoiceStatus').value;

    const seasons = readSeasons();
    const buyers  = readBuyers();
    const season  = seasons.find(s => s.id === seasonId);
    const buyer   = buyers.find(b => b.id === buyerId);

    const { subtotal, tax, total } = updateSummary();

    return {
        id:         crypto.randomUUID(),
        number:     document.getElementById('invoiceNumber').value,
        seasonId,
        seasonName: season?.name || '',
        buyerId,
        buyerName:  buyer?.name  || '',
        issueDate,
        dueDate,
        taxRate,
        payment,
        notes,
        status,
        items:     lineItems.map(i => ({ ...i })),
        subtotal,
        tax,
        total,
        createdAt:  new Date().toISOString(),
    };
}

function validateForm() {
    const msgEl = document.getElementById('invoiceMessage');
    msgEl.className = 'form-message';

    if (!document.getElementById('invoiceSeason').value) {
        msgEl.textContent = 'Please choose a season.';
        msgEl.className = 'form-message error';
        return false;
    }
    if (!document.getElementById('invoiceBuyer').value) {
        msgEl.textContent = 'Please choose a buyer.';
        msgEl.className = 'form-message error';
        return false;
    }
    if (!document.getElementById('issueDate').value) {
        msgEl.textContent = 'Issue date is required.';
        msgEl.className = 'form-message error';
        return false;
    }
    if (!lineItems.length || lineItems.every(i => !i.description)) {
        msgEl.textContent = 'Add at least one item with a description.';
        msgEl.className = 'form-message error';
        return false;
    }
    return true;
}

document.getElementById('invoiceForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const invoices = readInvoices();
    invoices.unshift(buildInvoice(false));
    saveInvoices(invoices);
    showToast('Invoice saved.');
    setTimeout(() => { window.location.href = '../invoice/invoice.html'; }, 900);
});

document.getElementById('saveDraftBtn').addEventListener('click', () => {
    if (!document.getElementById('invoiceSeason').value || !document.getElementById('invoiceBuyer').value) {
        showToast('Choose a season and buyer before saving a draft.');
        return;
    }
    const invoices = readInvoices();
    invoices.unshift(buildInvoice(true));
    saveInvoices(invoices);
    showToast('Draft saved.');
    setTimeout(() => { window.location.href = '../invoice/invoice.html'; }, 900);
});

/* ---------- Init ---------- */
document.getElementById('invoiceNumber').value = generateInvoiceNumber();

// Set today as default issue date
const today = new Date().toISOString().split('T')[0];
document.getElementById('issueDate').value = today;

populateSelects();
addLineItem(); // start with one empty row
updateSummary();
