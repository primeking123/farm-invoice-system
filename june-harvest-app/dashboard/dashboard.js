/* ==========================================================================
   June Harvest — Dashboard JS
   Reads from all localStorage stores and renders live metrics.
   Seeds presentation demo data on first launch if empty.
   ========================================================================== */

function seedDemoDataIfEmpty() {
    try {
        let seasons = JSON.parse(localStorage.getItem('jh.seasons') || '[]');
        let buyers = JSON.parse(localStorage.getItem('jh.buyers') || '[]');
        let invoices = JSON.parse(localStorage.getItem('jh.invoices') || '[]');

        if (seasons.length === 0) {
            seasons = [
                { id: 's-q1-2026', name: 'Quarter 1–2026', status: 'completed', startDate: '2026-01-01', endDate: '2026-03-31' },
                { id: 's-q2-2026', name: 'Quarter 2–2026', status: 'active', startDate: '2026-04-01', endDate: '2026-06-30' },
                { id: 's-q3-2026', name: 'Quarter 3–2026', status: 'planned', startDate: '2026-07-01', endDate: '2026-09-30' },
                { id: 's-q4-2026', name: 'Quarter 4–2026', status: 'planned', startDate: '2026-10-01', endDate: '2026-12-31' }
            ];
            localStorage.setItem('jh.seasons', JSON.stringify(seasons));
        }

        if (buyers.length === 0) {
            buyers = [
                { id: 'b-kampala', name: 'Kampala Fresh Produce Ltd.', district: 'Kampala', contact: 'Grace Nansubuga', phone: '+256 772 123456', email: 'orders@kampalafresh.co.ug' },
                { id: 'b-jinja', name: 'Jinja Grain Traders', district: 'Jinja', contact: 'Peter Ssemanda', phone: '+256 783 441208', email: 'peter@jinjagrain.com' },
                { id: 'b-mbarara', name: 'Mbarara Produce Cooperative', district: 'Mbarara', contact: 'Sarah Atim', phone: '+256 701 665932', email: 'satim@mbararacoop.org' },
                { id: 'b-gulu', name: 'Gulu Agro Supplies', district: 'Gulu', contact: 'Daniel Ocen', phone: '+256 752 908314', email: 'supplies@guluagro.ug' }
            ];
            localStorage.setItem('jh.buyers', JSON.stringify(buyers));
        }

        if (invoices.length === 0) {
            invoices = [
                {
                    id: crypto.randomUUID(),
                    number: 'INV-2026-024',
                    seasonId: 's-q2-2026',
                    seasonName: 'Quarter 2–2026',
                    buyerId: 'b-mbarara',
                    buyerName: 'Mbarara Produce Cooperative',
                    issueDate: '2026-05-02',
                    dueDate: '2026-05-18',
                    status: 'outstanding',
                    subtotal: 8750000,
                    tax: 0,
                    total: 8750000,
                    items: [
                        { id: '1', description: 'Maize Grain', qty: '75', unit: 'bags', price: '70000', total: 5250000 },
                        { id: '2', description: 'Beans (Nabe 4)', qty: '50', unit: 'bags', price: '70000', total: 3500000 }
                    ],
                    payment: 'Stanbic Bank A/C 9030018492'
                },
                {
                    id: crypto.randomUUID(),
                    number: 'INV-2026-023',
                    seasonId: 's-q2-2026',
                    seasonName: 'Quarter 2–2026',
                    buyerId: 'b-gulu',
                    buyerName: 'Gulu Agro Supplies',
                    issueDate: '2026-04-12',
                    dueDate: '2026-04-26',
                    status: 'overdue',
                    subtotal: 1400000,
                    tax: 0,
                    total: 1400000,
                    items: [
                        { id: '1', description: 'Groundnuts', qty: '20', unit: 'bags', price: '70000', total: 1400000 }
                    ],
                    payment: 'MTN Mobile Money: 0772458910'
                },
                {
                    id: crypto.randomUUID(),
                    number: 'INV-2026-019',
                    seasonId: 's-q1-2026',
                    seasonName: 'Quarter 1–2026',
                    buyerId: 'b-jinja',
                    buyerName: 'Jinja Grain Traders',
                    issueDate: '2026-03-05',
                    dueDate: '2026-03-20',
                    status: 'paid',
                    subtotal: 4250000,
                    tax: 0,
                    total: 4250000,
                    items: [
                        { id: '1', description: 'Maize Grain', qty: '50', unit: 'bags', price: '75000', total: 3750000 },
                        { id: '2', description: 'Transport to Jinja Depot', qty: '1', unit: 'trip', price: '500000', total: 500000 }
                    ],
                    payment: 'Paid via Bank Transfer'
                },
                {
                    id: crypto.randomUUID(),
                    number: 'INV-2026-014',
                    seasonId: 's-q1-2026',
                    seasonName: 'Quarter 1–2026',
                    buyerId: 'b-kampala',
                    buyerName: 'Kampala Fresh Produce Ltd.',
                    issueDate: '2026-02-14',
                    dueDate: '2026-02-28',
                    status: 'paid',
                    subtotal: 2100000,
                    tax: 0,
                    total: 2100000,
                    items: [
                        { id: '1', description: 'Beans', qty: '30', unit: 'bags', price: '70000', total: 2100000 }
                    ],
                    payment: 'Paid via MTN MoMo Merchant'
                }
            ];
            localStorage.setItem('jh.invoices', JSON.stringify(invoices));
        }
    } catch (e) {
        console.error('Seeding error:', e);
    }
}

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

/* ---------- Main render ---------- */
function render() {
    seedDemoDataIfEmpty();

    const invoices = readKey('jh.invoices');
    const seasons  = readKey('jh.seasons');

    /* Active season label */
    const active = seasons.find(s => s.status === 'active');
    const labelEl = document.getElementById('activeSeasonLabel');
    if (labelEl) {
        labelEl.textContent = active ? `Active season: ${active.name}` : 'No active season set';
    }

    /* Invoice metrics */
    const paid        = invoices.filter(i => i.status === 'paid');
    const outstanding = invoices.filter(i => i.status === 'outstanding');
    const overdue     = invoices.filter(i => i.status === 'overdue');

    const totalEl = document.getElementById('dTotalInvoices');
    const paidEl = document.getElementById('dPaid');
    const outEl = document.getElementById('dOutstanding');
    const overEl = document.getElementById('dOverdue');

    if (totalEl) totalEl.textContent = invoices.filter(i => i.status !== 'draft').length;
    if (paidEl) paidEl.textContent = formatUGX(paid.reduce((s, i) => s + (i.total || 0), 0));
    if (outEl) outEl.textContent = formatUGX(outstanding.reduce((s, i) => s + (i.total || 0), 0));
    if (overEl) overEl.textContent = formatUGX(overdue.reduce((s, i) => s + (i.total || 0), 0));

    /* Revenue by season bar chart */
    renderBarChart(invoices, seasons);

    /* Recent invoices (last 5, excluding drafts) */
    renderRecentInvoices(invoices.filter(i => i.status !== 'draft').slice(0, 5));
}

/* ---------- Bar chart ---------- */
function renderBarChart(invoices, seasons) {
    const chart = document.getElementById('barChart');
    if (!chart) return;

    if (!seasons.length) {
        chart.innerHTML = '<div class="chart-empty">No seasons to display. Add seasons to see the chart.</div>';
        return;
    }

    // Aggregate revenue per season
    const revenueBySeasonId = {};
    for (const inv of invoices) {
        if (!inv.seasonId || inv.status === 'draft') continue;
        revenueBySeasonId[inv.seasonId] = (revenueBySeasonId[inv.seasonId] || 0) + (inv.total || 0);
    }

    const data   = seasons.map(s => ({ label: s.name, value: revenueBySeasonId[s.id] || 0 }));
    const maxVal = Math.max(...data.map(d => d.value), 1);

    chart.innerHTML = data.map(d => {
        const pct = Math.round((d.value / maxVal) * 100);
        const h   = Math.max(pct, 4); // minimum visual height
        return `
            <div class="bar-group">
                <div class="bar-value">${d.value ? formatUGX(d.value) : 'UGX 0'}</div>
                <div class="bar-wrap">
                    <div class="bar" style="height:${h}%" title="${escHtml(d.label)}: ${formatUGX(d.value)}"></div>
                </div>
                <div class="bar-label">${escHtml(d.label)}</div>
            </div>
        `;
    }).join('');
}

/* ---------- Recent invoices ---------- */
function renderRecentInvoices(invoices) {
    const tbody = document.getElementById('recentInvoices');
    if (!tbody) return;

    if (!invoices.length) {
        tbody.innerHTML = '<tr><td class="empty-state" colspan="4">No invoices yet.</td></tr>';
        return;
    }

    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td><strong>${escHtml(inv.number)}</strong></td>
            <td>${escHtml(inv.buyerName)}</td>
            <td><span class="status-chip chip-${escHtml(inv.status)}">${escHtml(inv.status)}</span></td>
            <td>${formatUGX(inv.total)}</td>
        </tr>
    `).join('');
}

/* ---------- Init ---------- */
render();
