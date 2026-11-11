/* ==========================================================================
   June Harvest — Inventory JS
   Manages crop inventory, reorder alerts, and stock adjustments.
   ========================================================================== */

const inventoryStorageKey = "jh.inventory.v1";
const inventoryRows = document.getElementById("inventoryRows");
const inventoryForm = document.getElementById("inventoryForm");
const inventoryMessage = document.getElementById("inventoryMessage");
const inventorySearch = document.getElementById("inventorySearch");

const readInventory = () => {
    try {
        const value = JSON.parse(localStorage.getItem(inventoryStorageKey) || "[]");
        if (Array.isArray(value) && value.length > 0) return value;
        // Seed default items for first time demo presentation
        const seed = [
            { id: crypto.randomUUID(), name: "Beans", variety: "Nabe 4", unit: "kg", quantity: 450, reorderAt: 100 },
            { id: crypto.randomUUID(), name: "Maize Grain", variety: "Longe 5", unit: "bags", quantity: 85, reorderAt: 20 },
            { id: crypto.randomUUID(), name: "Matooke", variety: "Mpologoma", unit: "crates", quantity: 12, reorderAt: 15 },
            { id: crypto.randomUUID(), name: "Coffee", variety: "Robusta", unit: "bags", quantity: 0, reorderAt: 10 }
        ];
        localStorage.setItem(inventoryStorageKey, JSON.stringify(seed));
        return seed;
    } catch {
        return [];
    }
};

let inventory = readInventory();

const saveInventory = () => localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
})[character]);

const formatQuantity = value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
const getStatus = item => item.quantity === 0 ? "out-of-stock" : item.quantity <= item.reorderAt ? "low-stock" : "in-stock";

function renderInventory() {
    if (!inventoryRows) return;

    const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= item.reorderAt).length;
    const outOfStock = inventory.filter(item => item.quantity === 0).length;

    const countEl = document.getElementById("itemCountMetric");
    const lowEl = document.getElementById("lowStockMetric");
    const outEl = document.getElementById("outOfStockMetric");

    if (countEl) countEl.textContent = inventory.length;
    if (lowEl) lowEl.textContent = lowStock;
    if (outEl) outEl.textContent = outOfStock;

    const query = inventorySearch ? inventorySearch.value.trim().toLocaleLowerCase() : "";
    const visibleItems = inventory.filter(item => `${item.name} ${item.variety || ""}`.toLocaleLowerCase().includes(query));

    inventoryRows.innerHTML = visibleItems.length ? visibleItems.map(item => {
        const status = getStatus(item);
        return `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${escapeHtml(item.variety || "—")}</td>
                <td>${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}</td>
                <td>${formatQuantity(item.reorderAt)} ${escapeHtml(item.unit)}</td>
                <td><span class="status-chip chip-${status}">${status.replaceAll("-", " ")}</span></td>
                <td>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <form class="stock-adjust-form" data-id="${escapeHtml(item.id)}" aria-label="Restock ${escapeHtml(item.name)}" style="display:inline-flex;gap:4px;">
                            <input class="search-input" style="width:65px;padding:4px 6px;font-size:0.8rem;" name="quantity" type="number" min="0.01" step="0.01" placeholder="+Qty" aria-label="Quantity to add" required>
                            <button class="btn btn-secondary btn-sm" type="submit">Add</button>
                        </form>
                        <button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("") : `<tr><td class="empty-state" colspan="6">${query ? "No matching items." : "No inventory yet. Add an item to start tracking stock."}</td></tr>`;
}

if (inventoryForm) {
    inventoryForm.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(inventoryForm);
        const name = String(formData.get("name")).trim();
        const variety = String(formData.get("variety") || "").trim();
        const unit = String(formData.get("unit"));
        const quantity = Number(formData.get("quantity"));
        const reorderAt = Number(formData.get("reorderAt"));

        if (!name || quantity <= 0 || reorderAt < 0) {
            if (inventoryMessage) {
                inventoryMessage.textContent = "Enter a crop and valid non-negative quantities.";
                inventoryMessage.className = "form-message error";
            }
            return;
        }

        const existing = inventory.find(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase() && (item.variety || "").toLocaleLowerCase() === variety.toLocaleLowerCase() && item.unit === unit);
        if (existing) {
            existing.quantity += quantity;
            existing.reorderAt = reorderAt;
        } else {
            inventory.unshift({ id: crypto.randomUUID(), name, variety, unit, quantity, reorderAt });
        }

        saveInventory();
        renderInventory();
        inventoryForm.reset();
        if (inventoryMessage) {
            inventoryMessage.textContent = `Stock saved for "${name}".`;
            inventoryMessage.className = "form-message success";
            setTimeout(() => { inventoryMessage.textContent = ""; }, 3000);
        }
    });
}

if (inventoryRows) {
    inventoryRows.addEventListener("submit", event => {
        const form = event.target.closest(".stock-adjust-form");
        if (!form) return;

        event.preventDefault();
        const item = inventory.find(record => record.id === form.dataset.id);
        const quantity = Number(new FormData(form).get("quantity"));
        if (!item || quantity <= 0) return;

        item.quantity += quantity;
        saveInventory();
        renderInventory();
        if (inventoryMessage) {
            inventoryMessage.textContent = `${item.name} stock replenished (+${quantity} ${item.unit}).`;
            inventoryMessage.className = "form-message success";
            setTimeout(() => { inventoryMessage.textContent = ""; }, 3000);
        }
    });

    inventoryRows.addEventListener("click", event => {
        const button = event.target.closest('button[data-action="delete"]');
        if (!button) return;

        const item = inventory.find(i => i.id === button.dataset.id);
        if (!item) return;
        if (!confirm(`Delete ${item.name} from inventory?`)) return;

        inventory = inventory.filter(i => i.id !== button.dataset.id);
        saveInventory();
        renderInventory();
    });
}

if (inventorySearch) {
    inventorySearch.addEventListener("input", renderInventory);
}

renderInventory();
