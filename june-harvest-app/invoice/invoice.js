/* ==========================================================================
   June Harvest — Invoice List JS
   Reads invoices from jh.invoices, renders list and detail view.
   ========================================================================== */

function readInvoices() {
    try {
        const val = JSON.parse(localStorage.getItem('jh.invoices') || '[]');
        return Array.isArray(val) ? val : [];
    } catch { return []; }
}

function saveInvoices(invoices) {
    localStorage.setItem('jh.invoices', JSON.stringify(invoices));
}

function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function formatUGX(amount) {
    return 'UGX ' + Number(amount || 0).toLocaleString('en-UG');
}

function formatDate(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- Render list ---------- */
function render() {
    const invoices  = readInvoices();
    const query     = document.getElementById('invoiceSearch').value.trim().toLowerCase();
    const statusFil = document.getElementById('filterStatus').value;

    // Metrics
    const paid        = invoices.filter(i => i.status === 'paid');
    const outstanding = invoices.filter(i => i.status === 'outstanding');
    const overdue     = invoices.filter(i => i.status === 'overdue');

    document.getElementById('metricTotal').textContent       = invoices.length;
    document.getElementById('metricPaid').textContent        = formatUGX(paid.reduce((s, i)        => s + (i.total || 0), 0));
    document.getElementById('metricOutstanding').textContent = formatUGX(outstanding.reduce((s, i) => s + (i.total || 0), 0));
    document.getElementById('metricOverdue').textContent     = formatUGX(overdue.reduce((s, i)     => s + (i.total || 0), 0));

    // Filter + search
    let filtered = invoices;
    if (statusFil) filtered = filtered.filter(i => i.status === statusFil);
    if (query)     filtered = filtered.filter(i =>
        `${i.number} ${i.buyerName} ${i.seasonName}`.toLowerCase().includes(query));

    const tbody = document.getElementById('invoiceTableBody');
    if (!filtered.length) {
        tbody.innerHTML = `<tr><td class="empty-state" colspan="8">${query || statusFil ? 'No invoices match your filter.' : 'No invoices yet. <a href="../create-invoice/create-invoice.html">Create your first invoice</a>.'}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(inv => `
        <tr>
            <td><strong>${escHtml(inv.number)}</strong></td>
            <td>${escHtml(inv.buyerName)}</td>
            <td>${escHtml(inv.seasonName)}</td>
            <td>${formatDate(inv.issueDate)}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td><span class="status-chip chip-${escHtml(inv.status)}">${escHtml(inv.status)}</span></td>
            <td>${formatUGX(inv.total)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" data-view="${escHtml(inv.id)}"
                    aria-label="View invoice ${escHtml(inv.number)}">View</button>
            </td>
        </tr>
    `).join('');
}

/* ---------- Detail view ---------- */
let currentDetailId = null;

function showDetail(id) {
    const invoices = readInvoices();
    const inv      = invoices.find(i => i.id === id);
    if (!inv) return;

    currentDetailId = id;

    document.getElementById('detail-heading').textContent =
        `Invoice details: ${inv.number}`;
    document.getElementById('detailSubheading').textContent =
        `${inv.buyerName}${inv.seasonName ? ' · ' + inv.seasonName : ''}`;

    // Items
    const detailBody = document.getElementById('detailBody');
    if (inv.items && inv.items.length) {
        detailBody.innerHTML = inv.items.map(item => `
            <tr>
                <td>${escHtml(item.description)}</td>
                <td>${escHtml(item.qty)}</td>
                <td>${escHtml(item.unit)}</td>
                <td>${formatUGX(item.price)}</td>
                <td>${formatUGX(item.total)}</td>
            </tr>
        `).join('');
    } else {
        detailBody.innerHTML = '<tr><td class="empty-state" colspan="5">No line items recorded.</td></tr>';
    }

    // Totals
    document.getElementById('detailSubtotal').textContent = formatUGX(inv.subtotal);
    document.getElementById('detailTax').textContent      = formatUGX(inv.tax);
    document.getElementById('detailTotal').textContent    = formatUGX(inv.total);

    // Meta
    const meta = [];
    if (inv.payment) meta.push(`Payment: ${inv.payment}`);
    if (inv.notes)   meta.push(`Notes: ${inv.notes}`);
    document.getElementById('detailMeta').textContent = meta.join('\n');

    document.getElementById('invoiceDetailPanel').hidden = false;
    document.getElementById('invoiceDetailPanel')
        .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- Delegation: view button ---------- */
document.getElementById('invoiceTableBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-view]');
    if (btn) showDetail(btn.dataset.view);
});

/* ---------- Close detail ---------- */
document.getElementById('closeDetailBtn').addEventListener('click', () => {
    document.getElementById('invoiceDetailPanel').hidden = true;
    currentDetailId = null;
});

/* ---------- Delete invoice ---------- */
document.getElementById('deleteInvoiceBtn').addEventListener('click', () => {
    if (!currentDetailId) return;
    const invoices = readInvoices();
    const inv      = invoices.find(i => i.id === currentDetailId);
    if (!inv) return;
    if (!confirm(`Delete invoice ${inv.number}? This cannot be undone.`)) return;

    saveInvoices(invoices.filter(i => i.id !== currentDetailId));
    document.getElementById('invoiceDetailPanel').hidden = true;
    currentDetailId = null;
    render();
    showToast('Invoice deleted.');
});

/* ---------- Filters ---------- */
document.getElementById('invoiceSearch').addEventListener('input', render);
document.getElementById('filterStatus').addEventListener('change', render);

/* ---------- Init ---------- */
render();
