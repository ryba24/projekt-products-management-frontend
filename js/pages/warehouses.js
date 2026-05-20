/**
 * Warehouses Page
 */
function renderWarehousesPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-building"></i></span>
                Warehouses
            </h1>
            <button class="btn btn-amber" id="create-warehouse-btn">
                <i class="bi bi-plus-circle me-1"></i>New Warehouse
            </button>
        </div>
        <div id="warehouses-content">
            <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading warehouses…</p></div>
        </div>
    `;
    document.getElementById('create-warehouse-btn').addEventListener('click', () => showWarehouseModal());
    loadWarehouses();
}

function loadWarehouses() {
    ApiService.getAllWarehouses()
        .then(warehouses => renderWarehousesGrid(warehouses))
        .catch(err => {
            document.getElementById('warehouses-content').innerHTML =
                `<div class="alert alert-danger"><strong>Failed to load:</strong> ${err.message}
                <button class="btn btn-sm btn-primary ms-3" onclick="loadWarehouses()">Retry</button></div>`;
        });
}

function renderWarehousesGrid(warehouses) {
    const container = document.getElementById('warehouses-content');
    if (!warehouses || warehouses.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-building"></i><h5>No warehouses yet</h5><p>Add your first warehouse to start tracking inventory.</p></div>`;
        return;
    }

    // Cards grid + table below
    const cardsHtml = warehouses.map(w => `
        <div class="col-md-4 col-lg-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-2">
                        <span style="font-size:1.8rem;color:var(--navy);"><i class="bi bi-building"></i></span>
                        <span class="badge bg-secondary">#${w.id}</span>
                    </div>
                    <h6 class="fw-bold mb-1" style="font-family:'Syne',sans-serif;">${w.name || '—'}</h6>
                    <p class="text-muted mb-2" style="font-size:0.82rem;"><i class="bi bi-geo-alt me-1"></i>${w.location || '—'}</p>
                    ${w.capacity != null ? `<div class="mt-2 pt-2 border-top" style="font-size:0.82rem;">
                        <i class="bi bi-boxes me-1 text-muted"></i>Capacity: <strong>${w.capacity.toLocaleString()}</strong>
                    </div>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="row g-3">${cardsHtml}</div>`;
}

function showWarehouseModal() {
    const fields = [
        { id: 'name',     label: 'Warehouse Name', type: 'text',   required: true, placeholder: 'e.g. Warsaw Central' },
        { id: 'location', label: 'Location',        type: 'text',   placeholder: 'e.g. Warsaw, Poland' },
        { id: 'capacity', label: 'Capacity (units)', type: 'number', placeholder: 'e.g. 5000', attributes: { min: '0' } }
    ];

    const form = createForm(fields, {
        id: 'warehouse-form',
        submitLabel: 'Create Warehouse',
        showCancel: false,
        initialValues: {},
        onSubmit: (data) => {
            data.capacity = data.capacity ? parseInt(data.capacity) : null;
            ApiService.createWarehouse(data)
                .then(() => { modal.hide(); showSuccess('Warehouse created!'); loadWarehouses(); })
                .catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'warehouse-form-modal',
        title: 'New Warehouse',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}