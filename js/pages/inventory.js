/**
 * Inventory Page
 */
let _invProducts   = [];
let _invWarehouses = [];
let _invItems      = [];

function renderInventoryPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-list-check"></i></span>
                Inventory
            </h1>
            <button class="btn btn-amber" id="add-inventory-btn">
                <i class="bi bi-plus-circle me-1"></i>Add Inventory Entry
            </button>
        </div>

        <!-- Filter bar -->
        <div class="card mb-3">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                        <select id="inv-warehouse-filter" class="form-select form-select-sm">
                            <option value="">All warehouses</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="inv-stock-filter" class="form-select form-select-sm">
                            <option value="">All stock levels</option>
                            <option value="low">Low stock only</option>
                            <option value="ok">OK stock only</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-primary w-100" id="inv-filter-btn">
                            <i class="bi bi-funnel me-1"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Inventory Records</div>
            <div class="card-body p-0" id="inventory-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading inventory…</p></div>
            </div>
        </div>
    `;

    document.getElementById('add-inventory-btn').addEventListener('click', () => showInventoryModal());
    document.getElementById('inv-filter-btn').addEventListener('click', applyInventoryFilters);

    Promise.allSettled([
        ApiService.getAllProducts(),
        ApiService.getAllWarehouses(),
        ApiService.getAllInventory()
    ]).then(([products, warehouses, inventory]) => {
        _invProducts   = products.status   === 'fulfilled' ? products.value   : [];
        _invWarehouses = warehouses.status === 'fulfilled' ? warehouses.value : [];
        _invItems      = inventory.status  === 'fulfilled' ? inventory.value  : [];

        // Populate warehouse filter
        const wSel = document.getElementById('inv-warehouse-filter');
        _invWarehouses.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id; opt.textContent = w.name || `Warehouse #${w.id}`;
            wSel.appendChild(opt);
        });

        if (inventory.status === 'fulfilled') {
            renderInventoryTable(_invItems);
        } else {
            document.getElementById('inventory-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load inventory:</strong> ${inventory.reason?.message || 'Unknown error'}
                <button class="btn btn-sm btn-primary ms-3" onclick="renderInventoryPage()">Retry</button></div>`;
        }
    });
}

function getProductName(id) {
    const p = _invProducts.find(x => x.id == id);
    return p ? p.name : `Product #${id}`;
}
function getWarehouseName(id) {
    const w = _invWarehouses.find(x => x.id == id);
    return w ? w.name : `Warehouse #${id}`;
}

function applyInventoryFilters() {
    const wId       = document.getElementById('inv-warehouse-filter').value;
    const stockMode = document.getElementById('inv-stock-filter').value;
    let filtered = _invItems;
    if (wId) filtered = filtered.filter(i => String(i.warehouseId) === wId);
    if (stockMode === 'low') filtered = filtered.filter(i => i.quantity <= (i.reorderThreshold || 5));
    if (stockMode === 'ok')  filtered = filtered.filter(i => i.quantity >  (i.reorderThreshold || 5));
    renderInventoryTable(filtered);
}

function renderInventoryTable(items) {
    const container = document.getElementById('inventory-table-container');
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-list-check"></i><h5>No inventory records</h5><p>Add an inventory entry to get started.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',               title: 'ID',         width: '6%' },
        { field: 'productId',        title: 'Product',    render: (v) => `<strong>${getProductName(v)}</strong>` },
        { field: 'warehouseId',      title: 'Warehouse',  render: (v) => `<span class="badge bg-secondary">${getWarehouseName(v)}</span>` },
        { field: 'quantity',         title: 'Quantity',   width: '10%', render: (v, item) => {
            const low = v <= (item.reorderThreshold || 5);
            return low ? `<span class="low-stock"><i class="bi bi-exclamation-triangle me-1"></i>${v}</span>` : `<span class="ok-stock">${v}</span>`;
        }},
        { field: 'reorderThreshold', title: 'Reorder At', width: '11%', render: (v) => v != null ? v : '—' }
    ];

    const table = createTable(items, {
        columns,
        actions: { view: false, edit: false, delete: false }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showInventoryModal() {
    const productOptions   = _invProducts.map(p => ({ value: p.id, label: p.name || `#${p.id}` }));
    const warehouseOptions = _invWarehouses.map(w => ({ value: w.id, label: w.name || `#${w.id}` }));

    const fields = [
        { id: 'productId',        label: 'Product',           type: 'select', required: true, options: [{ value: '', label: '— Select product —' }, ...productOptions] },
        { id: 'warehouseId',      label: 'Warehouse',         type: 'select', required: true, options: [{ value: '', label: '— Select warehouse —' }, ...warehouseOptions] },
        { id: 'quantity',         label: 'Quantity',          type: 'number', required: true, placeholder: '0', attributes: { min: '0' } },
        { id: 'reorderThreshold', label: 'Reorder Threshold', type: 'number', placeholder: 'e.g. 10', attributes: { min: '0' } }
    ];

    const form = createForm(fields, {
        id: 'inventory-form',
        submitLabel: 'Add Inventory Entry',
        showCancel: false,
        initialValues: {},
        onSubmit: (data) => {
            data.productId        = parseInt(data.productId);
            data.warehouseId      = parseInt(data.warehouseId);
            data.quantity         = parseInt(data.quantity);
            data.reorderThreshold = data.reorderThreshold ? parseInt(data.reorderThreshold) : null;
            ApiService.createInventory(data)
                .then(created => {
                    modal.hide();
                    showSuccess('Inventory entry added!');
                    _invItems.push(created);
                    renderInventoryTable(_invItems);
                })
                .catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'inventory-form-modal',
        title: 'Add Inventory Entry',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}