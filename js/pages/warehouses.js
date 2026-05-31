/**
 * Warehouses Page
 */
let _warehouses = [];

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
        .then(warehouses => { _warehouses = warehouses; renderWarehousesContent(_warehouses); })
        .catch(err => {
            document.getElementById('warehouses-content').innerHTML =
                `<div class="alert alert-danger"><strong>Failed to load:</strong> ${err.message}
                <button class="btn btn-sm btn-primary ms-3" onclick="loadWarehouses()">Retry</button></div>`;
        });
}

function renderWarehousesContent(warehouses) {
    const container = document.getElementById('warehouses-content');
    if (!warehouses || warehouses.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-building"></i><h5>No warehouses yet</h5><p>Add your first warehouse to start tracking inventory.</p></div>`;
        return;
    }

    const cardsHtml = warehouses.map(w => `
        <div class="col-md-4 col-lg-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-2">
                        <span style="font-size:1.8rem;color:var(--navy);"><i class="bi bi-building"></i></span>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="showWarehouseModal(_warehouses.find(x=>x.id==${w.id}))" title="Edit">
                                <i class="bi bi-pencil" style="font-size:0.75rem;"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteWarehouse(${w.id})" title="Delete">
                                <i class="bi bi-trash" style="font-size:0.75rem;"></i>
                            </button>
                        </div>
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

async function deleteWarehouse(id) {
    const ok = await confirmAction('Delete this warehouse? This cannot be undone.');
    if (!ok) return;
    ApiService.deleteWarehouse(id)
        .then(() => {
            _warehouses = _warehouses.filter(w => w.id !== id);
            renderWarehousesContent(_warehouses);
            showSuccess('Warehouse deleted.');
        })
        .catch(e => showError(e.message));
}

function showWarehouseModal(existing) {
    const isEdit = !!existing;
    const fields = [
        { id: 'name',     label: 'Warehouse Name',  type: 'text',   required: true, placeholder: 'e.g. Warsaw Central' },
        { id: 'location', label: 'Location',         type: 'text',   placeholder: 'e.g. Warsaw, Poland' },
        { id: 'capacity', label: 'Capacity (units)', type: 'number', placeholder: 'e.g. 5000', attributes: { min: '0' } }
    ];

    const form = createForm(fields, {
        id: 'warehouse-form',
        submitLabel: isEdit ? 'Save Changes' : 'Create Warehouse',
        showCancel: false,
        initialValues: isEdit ? { name: existing.name, location: existing.location, capacity: existing.capacity } : {},
        onSubmit: (data) => {
            data.capacity = data.capacity ? parseInt(data.capacity) : null;
            const call = isEdit
                ? ApiService.updateWarehouse(existing.id, data)
                : ApiService.createWarehouse(data);
            call.then(result => {
                modal.hide();
                showSuccess(isEdit ? 'Warehouse updated!' : 'Warehouse created!');
                if (isEdit) {
                    const idx = _warehouses.findIndex(w => w.id === existing.id);
                    if (idx !== -1) _warehouses[idx] = result;
                } else {
                    _warehouses.push(result);
                }
                renderWarehousesContent(_warehouses);
            }).catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'warehouse-form-modal',
        title: isEdit ? `Edit Warehouse` : 'New Warehouse',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}
