const seasonStorageKey = "juneHarvest.seasons.v1";
const seasonForm = document.getElementById("seasonForm");
const seasonRows = document.getElementById("seasonRows");
const seasonMessage = document.getElementById("seasonMessage");

const readSeasons = () => {
    try {
        const value = JSON.parse(localStorage.getItem(seasonStorageKey) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

let seasons = readSeasons();

const saveSeasons = () => localStorage.setItem(seasonStorageKey, JSON.stringify(seasons));
const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function renderSeasons() {
    const activeSeason = seasons.find(season => season.status === "active");
    document.getElementById("activeSeasonMetric").textContent = activeSeason?.name || "None";
    document.getElementById("plannedSeasonMetric").textContent = seasons.filter(season => season.status === "planned").length;
    document.getElementById("completedSeasonMetric").textContent = seasons.filter(season => season.status === "completed").length;

    const orderedSeasons = [...seasons].sort((first, second) => first.start.localeCompare(second.start));
    seasonRows.innerHTML = orderedSeasons.length ? orderedSeasons.map(season => `
        <tr>
            <td>${escapeHtml(season.name)}</td>
            <td>${formatDate(season.start)}</td>
            <td>${formatDate(season.end)}</td>
            <td><span class="status-chip status-${season.status}">${season.status}</span></td>
            <td>
                ${season.status !== "active" ? `<button class="button button-secondary button-small" type="button" data-action="activate" data-id="${escapeHtml(season.id)}">Set active</button>` : ""}
                <button class="button button-danger button-small" type="button" data-action="delete" data-id="${escapeHtml(season.id)}" aria-label="Delete ${escapeHtml(season.name)}">Delete</button>
            </td>
        </tr>
    `).join("") : '<tr><td class="empty-state" colspan="5">No seasons yet. Add one to start planning.</td></tr>';
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

seasonForm.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(seasonForm);
    const start = String(formData.get("start"));
    const end = String(formData.get("end"));

    if (end < start) {
        seasonMessage.textContent = "End date must be on or after the start date.";
        return;
    }

    const season = {
        id: crypto.randomUUID(),
        name: String(formData.get("name")).trim(),
        start,
        end,
        status: String(formData.get("status"))
    };

    if (season.status === "active") {
        seasons = seasons.map(item => item.status === "active" ? { ...item, status: "planned" } : item);
    }

    seasons.push(season);
    saveSeasons();
    renderSeasons();
    seasonForm.reset();
    seasonMessage.textContent = "Season saved.";
});

seasonRows.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const season = seasons.find(item => item.id === button.dataset.id);
    if (!season) {
        return;
    }

    if (button.dataset.action === "activate") {
        seasons = seasons.map(item => ({ ...item, status: item.id === season.id ? "active" : item.status === "active" ? "planned" : item.status }));
    } else if (button.dataset.action === "delete") {
        seasons = seasons.filter(item => item.id !== season.id);
    }

    saveSeasons();
    renderSeasons();
});

renderSeasons();