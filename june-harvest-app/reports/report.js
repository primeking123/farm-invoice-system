/* ==========================================================================
   June Harvest — Reports JS
   Reads invoices, seasons, inventory from localStorage and renders reports.
   Provides formal export capabilities for Excel (CSV) and PDF.
   ========================================================================== */

function readKey(key) {
    try {
        const val = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(val) ? val : [];
    } catch { return []; }
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
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* ---------- Season filter select ---------- */
function populateSeasonFilter(seasons) {
    const sel = document.getElementById('reportSeasonFilter');
    const curr = sel.value;
    sel.innerHTML = '<option value="">All seasons</option>' +
        seasons.map(s => `<option value="${escHtml(s.id)}" ${s.id === curr ? 'selected' : ''}>${escHtml(s.name)}</option>`).join('');
}

/* ---------- Main render ---------- */
function render() {
    const seasonFilter = document.getElementById('reportSeasonFilter').value;
    const allInvoices  = readKey('jh.invoices').filter(i => i.status !== 'draft');
    const seasons      = readKey('jh.seasons');
    const inventory    = readKey('jh.inventory.v1');

    populateSeasonFilter(seasons);

    // Apply season filter
    const invoices = seasonFilter
        ? allInvoices.filter(i => i.seasonId === seasonFilter)
        : allInvoices;

    /* ----- Top metrics ----- */
    const paid        = invoices.filter(i => i.status === 'paid');
    const unpaid      = invoices.filter(i => i.status === 'outstanding' || i.status === 'overdue');
    const revenue     = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const paidTotal   = paid.reduce((s, i) => s + (i.total || 0), 0);
    const unpaidTotal = unpaid.reduce((s, i) => s + (i.total || 0), 0);

    document.getElementById('rRevenue').textContent  = formatUGX(revenue);
    document.getElementById('rInvoices').textContent = invoices.length;
    document.getElementById('rPaid').textContent     = formatUGX(paidTotal);
    document.getElementById('rUnpaid').textContent   = formatUGX(unpaidTotal);

    /* ----- Season comparison ----- */
    renderSeasonComparison(allInvoices, seasons);

    /* ----- Buyer breakdown ----- */
    renderBuyerBreakdown(invoices);

    /* ----- Invoice aging ----- */
    renderAging(invoices);

    /* ----- Inventory snapshot ----- */
    renderInventorySnapshot(inventory);
}

/* ---------- Season comparison ---------- */
function renderSeasonComparison(allInvoices, seasons) {
    const tbody = document.getElementById('seasonComparisonBody');

    if (!seasons.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="6">No seasons added yet.</td></tr>';
        return;
    }

    tbody.innerHTML = seasons.map(s => {
        const sinv = allInvoices.filter(i => i.seasonId === s.id);
        const total  = sinv.reduce((acc, i) => acc + (i.total || 0), 0);
        const paid   = sinv.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || 0), 0);
        const unpaid = sinv.filter(i => i.status === 'outstanding' || i.status === 'overdue')
                           .reduce((acc, i) => acc + (i.total || 0), 0);
        return `
            <tr>
                <td><strong>${escHtml(s.name)}</strong></td>
                <td><span class="status-chip chip-${escHtml(s.status)}">${escHtml(s.status)}</span></td>
                <td>${sinv.length}</td>
                <td>${formatUGX(total)}</td>
                <td>${formatUGX(paid)}</td>
                <td>${formatUGX(unpaid)}</td>
            </tr>
        `;
    }).join('');
}

/* ---------- Buyer breakdown ---------- */
function renderBuyerBreakdown(invoices) {
    const tbody = document.getElementById('buyerBreakdownBody');

    if (!invoices.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="5">No invoices to analyse.</td></tr>';
        return;
    }

    // Group by buyer
    const map = {};
    for (const inv of invoices) {
        const key = inv.buyerId || 'unknown';
        if (!map[key]) map[key] = { name: inv.buyerName || '(Unknown)', count: 0, total: 0, paid: 0, unpaid: 0 };
        map[key].count++;
        map[key].total += inv.total || 0;
        if (inv.status === 'paid') map[key].paid += inv.total || 0;
        if (inv.status === 'outstanding' || inv.status === 'overdue') map[key].unpaid += inv.total || 0;
    }

    const rows = Object.values(map).sort((a, b) => b.total - a.total);

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td><strong>${escHtml(r.name)}</strong></td>
            <td>${r.count}</td>
            <td>${formatUGX(r.total)}</td>
            <td>${formatUGX(r.paid)}</td>
            <td>${formatUGX(r.unpaid)}</td>
        </tr>
    `).join('');
}

/* ---------- Invoice aging ---------- */
function renderAging(invoices) {
    const tbody = document.getElementById('agingBody');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aged = invoices
        .filter(i => (i.status === 'outstanding' || i.status === 'overdue') && i.dueDate)
        .map(i => {
            const due  = new Date(i.dueDate);
            const days = Math.floor((today - due) / (1000 * 60 * 60 * 24));
            return { ...i, daysOverdue: days };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

    if (!aged.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="5">No overdue or outstanding invoices.</td></tr>';
        return;
    }

    tbody.innerHTML = aged.map(inv => {
        const days = inv.daysOverdue;
        const label = days > 0 ? `${days} days` : days === 0 ? 'Due today' : 'Not yet due';
        const cls   = days > 60 ? 'chip-overdue' : days > 30 ? 'chip-outstanding' : 'chip-planned';
        return `
            <tr>
                <td><strong>${escHtml(inv.number)}</strong></td>
                <td>${escHtml(inv.buyerName)}</td>
                <td>${formatDate(inv.dueDate)}</td>
                <td>${formatUGX(inv.total)}</td>
                <td><span class="status-chip ${cls}">${escHtml(label)}</span></td>
            </tr>
        `;
    }).join('');
}

/* ---------- Inventory snapshot ---------- */
function renderInventorySnapshot(inventory) {
    const tbody = document.getElementById('inventorySnapshotBody');

    if (!inventory.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="4">No inventory recorded.</td></tr>';
        return;
    }

    const getStatus = item =>
        item.quantity === 0 ? 'out-of-stock' :
        item.quantity <= item.reorderAt ? 'low-stock' : 'in-stock';

    tbody.innerHTML = inventory.map(item => {
        const status = getStatus(item);
        const qty    = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(item.quantity);
        return `
            <tr>
                <td><strong>${escHtml(item.name)}</strong></td>
                <td>${escHtml(item.variety || '—')}</td>
                <td>${qty} ${escHtml(item.unit)}</td>
                <td><span class="status-chip chip-${status}">${status.replace(/-/g, ' ')}</span></td>
            </tr>
        `;
    }).join('');
}

/* ---------- Export Functionality ---------- */

// Helper to sanitize CSV cells
function csvCell(value) {
    const s = String(value ?? '').replace(/"/g, '""');
    return `"${s}"`;
}

// Export as Excel-compatible CSV file
function exportExcel() {
    const seasonFilter = document.getElementById('reportSeasonFilter').value;
    const allInvoices  = readKey('jh.invoices').filter(i => i.status !== 'draft');
    const seasons      = readKey('jh.seasons');
    const inventory    = readKey('jh.inventory.v1');

    const selectedSeason = seasons.find(s => s.id === seasonFilter);
    const seasonLabel    = selectedSeason ? selectedSeason.name : 'All Seasons';
    const invoices       = seasonFilter ? allInvoices.filter(i => i.seasonId === seasonFilter) : allInvoices;

    const paid        = invoices.filter(i => i.status === 'paid');
    const unpaid      = invoices.filter(i => i.status === 'outstanding' || i.status === 'overdue');
    const revenue     = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const paidTotal   = paid.reduce((s, i) => s + (i.total || 0), 0);
    const unpaidTotal = unpaid.reduce((s, i) => s + (i.total || 0), 0);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-GB');

    const lines = [];

    // Header block
    lines.push([csvCell('JUNE HARVEST — FARM INVOICE & FINANCIAL REPORT')].join(','));
    lines.push([csvCell(`Generated on: ${dateFormatted}`), csvCell(`Reporting Period: ${seasonLabel}`)].join(','));
    lines.push([]);

    // 1. Executive Summary
    lines.push([csvCell('1. FINANCIAL EXECUTIVE SUMMARY')].join(','));
    lines.push([csvCell('Metric'), csvCell('Amount (UGX) / Count')].join(','));
    lines.push([csvCell('Total Revenue'), csvCell(revenue)].join(','));
    lines.push([csvCell('Total Invoices Count'), csvCell(invoices.length)].join(','));
    lines.push([csvCell('Paid Invoices Amount'), csvCell(paidTotal)].join(','));
    lines.push([csvCell('Outstanding / Overdue Amount'), csvCell(unpaidTotal)].join(','));
    lines.push([]);

    // 2. Season Comparison
    lines.push([csvCell('2. SEASON COMPARISON')].join(','));
    lines.push([
        csvCell('Season'),
        csvCell('Status'),
        csvCell('Invoices'),
        csvCell('Total Invoiced (UGX)'),
        csvCell('Paid (UGX)'),
        csvCell('Outstanding (UGX)')
    ].join(','));

    if (seasons.length) {
        seasons.forEach(s => {
            const sinv = allInvoices.filter(i => i.seasonId === s.id);
            const total = sinv.reduce((acc, i) => acc + (i.total || 0), 0);
            const p = sinv.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || 0), 0);
            const u = sinv.filter(i => i.status === 'outstanding' || i.status === 'overdue').reduce((acc, i) => acc + (i.total || 0), 0);
            lines.push([
                csvCell(s.name),
                csvCell(s.status),
                csvCell(sinv.length),
                csvCell(total),
                csvCell(p),
                csvCell(u)
            ].join(','));
        });
    } else {
        lines.push([csvCell('No seasons recorded')].join(','));
    }
    lines.push([]);

    // 3. Sales By Buyer
    lines.push([csvCell('3. SALES BY BUYER')].join(','));
    lines.push([
        csvCell('Buyer Name'),
        csvCell('Invoices'),
        csvCell('Total Invoiced (UGX)'),
        csvCell('Paid (UGX)'),
        csvCell('Outstanding (UGX)')
    ].join(','));

    const buyerMap = {};
    for (const inv of invoices) {
        const k = inv.buyerId || 'unknown';
        if (!buyerMap[k]) buyerMap[k] = { name: inv.buyerName || '(Unknown)', count: 0, total: 0, paid: 0, unpaid: 0 };
        buyerMap[k].count++;
        buyerMap[k].total += inv.total || 0;
        if (inv.status === 'paid') buyerMap[k].paid += inv.total || 0;
        if (inv.status === 'outstanding' || inv.status === 'overdue') buyerMap[k].unpaid += inv.total || 0;
    }

    const buyerRows = Object.values(buyerMap).sort((a, b) => b.total - a.total);
    if (buyerRows.length) {
        buyerRows.forEach(r => {
            lines.push([
                csvCell(r.name),
                csvCell(r.count),
                csvCell(r.total),
                csvCell(r.paid),
                csvCell(r.unpaid)
            ].join(','));
        });
    } else {
        lines.push([csvCell('No buyer sales for this filter')].join(','));
    }
    lines.push([]);

    // 4. Invoice Aging & Overdue
    lines.push([csvCell('4. INVOICE AGING & UNPAID BALANCES')].join(','));
    lines.push([
        csvCell('Invoice Number'),
        csvCell('Buyer'),
        csvCell('Due Date'),
        csvCell('Amount (UGX)'),
        csvCell('Days Overdue')
    ].join(','));

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const aged = invoices
        .filter(i => (i.status === 'outstanding' || i.status === 'overdue') && i.dueDate)
        .map(i => {
            const due = new Date(i.dueDate);
            const days = Math.floor((todayDate - due) / (1000 * 60 * 60 * 24));
            return { ...i, daysOverdue: days };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

    if (aged.length) {
        aged.forEach(inv => {
            lines.push([
                csvCell(inv.number),
                csvCell(inv.buyerName),
                csvCell(inv.dueDate),
                csvCell(inv.total),
                csvCell(inv.daysOverdue > 0 ? `${inv.daysOverdue} days` : 'Due today/Future')
            ].join(','));
        });
    } else {
        lines.push([csvCell('No outstanding or overdue invoices')].join(','));
    }
    lines.push([]);

    // 5. Inventory Snapshot
    lines.push([csvCell('5. INVENTORY STOCK SNAPSHOT')].join(','));
    lines.push([
        csvCell('Crop'),
        csvCell('Variety'),
        csvCell('Quantity On Hand'),
        csvCell('Unit'),
        csvCell('Stock Status')
    ].join(','));

    if (inventory.length) {
        inventory.forEach(item => {
            const st = item.quantity === 0 ? 'out-of-stock' : (item.quantity <= item.reorderAt ? 'low-stock' : 'in-stock');
            lines.push([
                csvCell(item.name),
                csvCell(item.variety || '—'),
                csvCell(item.quantity),
                csvCell(item.unit),
                csvCell(st)
            ].join(','));
        });
    } else {
        lines.push([csvCell('No inventory items recorded')].join(','));
    }

    // Prepend UTF-8 BOM so Microsoft Excel correctly displays currency and characters
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filename = `June_Harvest_Report_${seasonLabel.replace(/[\s–—]+/g, '_')}_${now.toISOString().split('T')[0]}.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Report exported as Excel CSV.');
}

// Export as PDF via browser print dialogue
function exportPdf() {
    const seasonFilter = document.getElementById('reportSeasonFilter').value;
    const seasons      = readKey('jh.seasons');
    const selectedSeason = seasons.find(s => s.id === seasonFilter);
    const seasonLabel = selectedSeason ? selectedSeason.name : 'All Seasons';

    const prevTitle = document.title;
    document.title = `June Harvest — Financial Report — ${seasonLabel} (${new Date().toISOString().split('T')[0]})`;

    showToast('Opening print / PDF export dialog...');
    setTimeout(() => {
        window.print();
        document.title = prevTitle;
    }, 250);
}

/* ---------- Attach Export Event Listeners ---------- */
document.getElementById('exportExcelBtn')?.addEventListener('click', exportExcel);
document.getElementById('exportPdfBtn')?.addEventListener('click', exportPdf);

/* ---------- Season filter ---------- */
document.getElementById('reportSeasonFilter').addEventListener('change', render);

/* ---------- Init ---------- */
render();
