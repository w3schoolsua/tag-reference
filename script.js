const JSON_URL = 'html-elements.json';

const state = {
    allElements: [],
    filteredElements: [],
    filterStatus: 'all',
    searchQuery: '',
    sortKey: 'tag',
    sortDir: 'asc'
};

const tableBody = document.getElementById('elements-table-body');
const searchInput = document.getElementById('search');
const filterChips = document.querySelectorAll('.filter-chip');
const elementsCount = document.getElementById('elements-count');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleIcon = themeToggleBtn.querySelector('.theme-toggle-icon');
const themeToggleLabel = themeToggleBtn.querySelector('.theme-toggle-label');
const tableHeaders = document.querySelectorAll('th[data-sort-key]');

/* ------------------------- ТЕМА ------------------------- */

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        themeToggleIcon.textContent = '☀️';
        themeToggleLabel.textContent = 'Світла тема';
    } else {
        themeToggleIcon.textContent = '🌙';
        themeToggleLabel.textContent = 'Темна тема';
    }
}

(function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        applyTheme(saved);
    } else {
        const prefersDark = window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
})();

themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
});

/* ------------------------- РЕНДЕР ------------------------- */

function createStatusPill(status) {
    const span = document.createElement('span');
    span.className = 'status-pill ' + status;

    const dot = document.createElement('span');
    dot.className = 'status-dot';

    const label = document.createElement('span');
    label.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    span.appendChild(dot);
    span.appendChild(label);
    return span;
}

function createCategoryPill(category) {
    const span = document.createElement('span');
    span.className = 'category-pill';
    span.textContent = category || '—';
    return span;
}

function renderTable() {
    tableBody.innerHTML = '';

    state.filteredElements.forEach(el => {
        const tr = document.createElement('tr');

        const tdTag = document.createElement('td');
        const code = document.createElement('span');
        code.className = 'tag-code';
        code.textContent = `<${el.tag}>`;
        tdTag.appendChild(code);

        const tdStatus = document.createElement('td');
        tdStatus.appendChild(createStatusPill(el.status));

        const tdCategory = document.createElement('td');
        tdCategory.appendChild(createCategoryPill(el.category));

        const tdDesc = document.createElement('td');
        tdDesc.className = 'description';
        tdDesc.textContent = el.description || '';

        tr.appendChild(tdTag);
        tr.appendChild(tdStatus);
        tr.appendChild(tdCategory);
        tr.appendChild(tdDesc);

        tableBody.appendChild(tr);
    });

    elementsCount.textContent = `Елементів: ${state.filteredElements.length}`;
}

/* ------------------------- СОРТУВАННЯ ------------------------- */

function sortElements() {
    const { sortKey, sortDir } = state;
    const dir = sortDir === 'asc' ? 1 : -1;

    state.filteredElements.sort((a, b) => {
        const va = (a[sortKey] || '').toString().toLowerCase();
        const vb = (b[sortKey] || '').toString().toLowerCase();
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });
}

tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.sortKey;

        if (state.sortKey === key) {
            state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortKey = key;
            state.sortDir = 'asc';
        }

        tableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

        sortElements();
        renderTable();
    });
});

/* ------------------------- ФІЛЬТРИ ------------------------- */

function applyFilters() {
    const query = state.searchQuery.trim().toLowerCase();
    const status = state.filterStatus;

    state.filteredElements = state.allElements.filter(el => {
        const matchesStatus = status === 'all' ? true : el.status === status;
        const matchesSearch =
            !query ||
            el.tag.toLowerCase().includes(query) ||
            (el.description && el.description.toLowerCase().includes(query)) ||
            (el.category && el.category.toLowerCase().includes(query));

        return matchesStatus && matchesSearch;
    });

    sortElements();
    renderTable();
}

function setFilterStatus(newStatus) {
    state.filterStatus = newStatus;

    filterChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.status === newStatus);
    });

    applyFilters();
}

searchInput.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    applyFilters();
});

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        setFilterStatus(chip.dataset.status);
    });
});

/* ------------------------- JSON ------------------------- */

async function loadJson() {
    try {
        const res = await fetch(JSON_URL, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error('Не вдалося завантажити JSON: ' + res.status);
        }

        const data = await res.json();

        if (!data || !Array.isArray(data.html_elements)) {
            throw new Error('Невірний формат JSON (очікується html_elements[])');
        }

        state.allElements = data.html_elements
            .map(el => ({
                tag: el.tag,
                status: el.status || 'standard',
                category: el.category || 'інше',
                description: el.description || ''
            }))
            .sort((a, b) => a.tag.localeCompare(b.tag));

        state.filteredElements = [...state.allElements];
        renderTable();

    } catch (err) {
        console.error(err);
        tableBody.innerHTML =
            '<tr><td colspan="4" class="description">Помилка завантаження JSON. Перевір шлях до файлу.</td></tr>';
        elementsCount.textContent = 'Елементів: 0';
    }
}

loadJson();