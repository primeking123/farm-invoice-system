const inventoryStorageKey = "juneHarvest.inventory.v1";
const inventoryRows = document.getElementById("inventoryRows");
const inventoryForm = document.getElementById("inventoryForm");
const inventoryMessage = document.getElementById("inventoryMessage");
const inventorySearch = document.getElementById("inventorySearch");

const readInventory = () => {
    try {
        const value = JSON.parse(localStorage.getItem(inventoryStorageKey) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

let inventory = readInventory();

const saveInventory = () => localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
})[character]);
const formatQuantity = value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
const getStatus = item => item.quantity === 0 ? "out-of-stock" : item.quantity <= item.reorderAt ? "low-stock" : "in-stock";

function renderInventory() {
    const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= item.reorderAt).length;
    const outOfStock = inventory.filter(item => item.quantity === 0).length;
    document.getElementById("itemCountMetric").textContent = inventory.length;
    document.getElementById("lowStockMetric").textContent = lowStock;
    document.getElementById("outOfStockMetric").textContent = outOfStock;

    const query = inventorySearch.value.trim().toLocaleLowerCase();
    const visibleItems = inventory.filter(item => `${item.name} ${item.variety}`.toLocaleLowerCase().includes(query));
    inventoryRows.innerHTML = visibleItems.length ? visibleItems.map(item => {
        const status = getStatus(item);
        return `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.variety || "-")}</td>
                <td>${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}</td>
                <td>${formatQuantity(item.reorderAt)} ${escapeHtml(item.unit)}</td>
                <td><span class="status-chip status-${status}">${status.replaceAll("-", " ")}</span></td>
                <td>
                    <form class="stock-adjust-form" data-id="${escapeHtml(item.id)}" aria-label="Restock ${escapeHtml(item.name)}">
                        <input class="stock-adjust-input" name="quantity" type="number" min="0.01" step="0.01" placeholder="Qty" aria-label="Quantity to add" required>
                        <button class="button button-secondary button-small" type="submit">Add</button>
                        <button class="button button-danger button-small" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button>
                    </form>
                </td>
            </tr>
        `;
    }).join("") : `<tr><td class="empty-state" colspan="6">${query ? "No matching items." : "No inventory yet. Add an item to start tracking stock."}</td></tr>`;
}

inventoryForm.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(inventoryForm);
    const name = String(formData.get("name")).trim();
    const variety = String(formData.get("variety")).trim();
    const unit = String(formData.get("unit"));
    const quantity = Number(formData.get("quantity"));
    const reorderAt = Number(formData.get("reorderAt"));

    if (!name || quantity <= 0 || reorderAt < 0) {
        inventoryMessage.textContent = "Enter a crop and valid non-negative quantities.";
        return;
    }

    const existing = inventory.find(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase() && item.variety.toLocaleLowerCase() === variety.toLocaleLowerCase() && item.unit === unit);
    if (existing) {
        existing.quantity += quantity;
        existing.reorderAt = reorderAt;
    } else {
        inventory.push({ id: crypto.randomUUID(), name, variety, unit, quantity, reorderAt });
    }

    saveInventory();
    renderInventory();
    inventoryForm.reset();
    inventoryMessage.textContent = "Inventory saved.";
});

inventoryRows.addEventListener("submit", event => {
    const form = event.target.closest(".stock-adjust-form");
    if (!form) {
        return;
    }

    event.preventDefault();
    const item = inventory.find(record => record.id === form.dataset.id);
    const quantity = Number(new FormData(form).get("quantity"));
    if (!item || quantity <= 0) {
        return;
    }

    item.quantity += quantity;
    saveInventory();
    renderInventory();
    inventoryMessage.textContent = `${item.name} stock updated.`;
});

inventoryRows.addEventListener("click", event => {
    const button = event.target.closest('button[data-action="delete"]');
    if (!button) {
        return;
    }

    inventory = inventory.filter(item => item.id !== button.dataset.id);
    saveInventory();
    renderInventory();
});

inventorySearch.addEventListener("input", renderInventory);
renderInventory();