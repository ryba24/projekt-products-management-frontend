/**
 * Stock Transfers Page
 */
let _trWarehouses = [];
let _trTransfers  = [];

function renderTransfersPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-arrow-left-right"></i></span>
                Stock Transfers
            </h1>
            <button class="btn btn-amber" id="create-transfer-btn">
                <i class="bi bi-plus-circle me-1"></i>New Transfer
            </button>
        </div>

        <!-- Filter bar -->
        <div class="card mb-3">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                        <select id="tr-status-filter" class="form-select form-select-sm">
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-primary w-100" id="tr-filter-btn">
                            <i class="bi bi-funnel me-1"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Transfer Records</div>
            <div class="card-body p-0" id="transfers-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading transfers…</p></div>
            </div>
        </div>
    `;

    document.getElementById('create-transfer-btn').addEventListener('click', () => showTransferModal());
    document.getElementById('tr-filter-btn').addEventListener('click', applyTransferFilters);

    Promise.allSettled([
        ApiService.getAllWarehouses(),
        ApiService.getAllTransfers()
    ]).then(([warehouses, transfers]) => {
        _trWarehouses = warehouses.status === 'fulfilled' ? warehouses.value : [];
        _trTransfers  = transfers.status  === 'fulfilled' ? transfers.value  : [];

        if (transfers.status === 'fulfilled') {
            renderTransfersTable(_trTransfers);
        } else {
            document.getElementById('transfers-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load transfers:</strong> ${transfers.reason?.message || 'Unknown error'}
                <button class="btn btn-sm btn-primary ms-3" onclick="renderTransfersPage()">Retry</button></div>`;
        }
    });
}

function getWName(id) {
    const w = _trWarehouses.find(x => x.id == id);
    return w ? w.name : `#${id}`;
}

function applyTransferFilters() {
    const status = document.getElementById('tr-status-filter').value;
    const filtered = status ? _trTransfers.filter(t => t.status === status) : _trTransfers;
    renderTransfersTable(filtered);
}

function renderTransfersTable(transfers) {
    const container = document.getElementById('transfers-table-container');
    if (!transfers || transfers.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-arrow-left-right"></i><h5>No transfers found</h5><p>Create a new transfer to move stock between warehouses.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',              title: 'ID',           width: '6%' },
        { field: 'fromWarehouseId', title: 'From',         render: v => `<strong>${getWName(v)}</strong>` },
        { field: 'toWarehouseId',   title: 'To',           render: v => `<strong>${getWName(v)}</strong>` },
        { field: 'status',          title: 'Status',       width: '12%', render: v => `<span class="transfer-status transfer-${v || 'PENDING'}">${v || 'PENDING'}</span>` },
        { field: 'requestedAt',     title: 'Requested',    width: '15%', render: v => formatDate(v) },
        { field: 'approvedAt',      title: 'Approved',     width: '15%', render: v => v ? formatDate(v) : '—' },
        { field: 'lines',           title: 'Lines',        width: '8%',  render: v => v ? `<span class="badge bg-secondary">${v.length}</span>` : '—' }
    ];

    const table = createTable(transfers, {
        columns,
        onView:   (id, item) => showTransferDetailsModal(item),
        onEdit:   false,
        onDelete: false,
        actions:  { view: true, edit: false, delete: false }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showTransferDetailsModal(transfer) {
    const linesHtml = transfer.lines && transfer.lines.length > 0
        ? `<table class="table table-sm mt-2">
            <thead><tr><th>Product ID</th><th>Quantity</th></tr></thead>
            <tbody>${transfer.lines.map(l => `<tr><td>${l.productId}</td><td>${l.quantity}</td></tr>`).join('')}</tbody>
           </table>`
        : `<p class="text-muted" style="font-size:0.85rem;">No line items</p>`;

    const content = `
        <div class="row mb-3">
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Transfer ID</span><span class="detail-value">${transfer.id}</span></div>
                <div class="detail-row"><span class="detail-label">From</span><span class="detail-value"><strong>${getWName(transfer.fromWarehouseId)}</strong></span></div>
                <div class="detail-row"><span class="detail-label">To</span><span class="detail-value"><strong>${getWName(transfer.toWarehouseId)}</strong></span></div>
            </div>
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="transfer-status transfer-${transfer.status || 'PENDING'}">${transfer.status || 'PENDING'}</span></span></div>
                <div class="detail-row"><span class="detail-label">Requested</span><span class="detail-value">${formatDate(transfer.requestedAt)}</span></div>
                <div class="detail-row"><span class="detail-label">Approved</span><span class="detail-value">${transfer.approvedAt ? formatDate(transfer.approvedAt) : '—'}</span></div>
            </div>
        </div>
        <div class="border-top pt-2">
            <span class="detail-label">Transfer Lines</span>
            ${linesHtml}
        </div>
    `;
    const modal = createModal({
        id: 'transfer-details-modal',
        title: `Transfer #${transfer.id}`,
        content, size: 'large', footer: true,
        primaryButton: 'Close',
        onPrimary: () => modal.hide()
    });
    modal.show();
}

function showTransferModal() {
    const warehouseOptions = _trWarehouses.map(w => ({ value: w.id, label: w.name || `#${w.id}` }));

    const fields = [
        { id: 'fromWarehouseId', label: 'From Warehouse', type: 'select', required: true, options: [{ value: '', label: '— Select source —' }, ...warehouseOptions] },
        { id: 'toWarehouseId',   label: 'To Warehouse',   type: 'select', required: true, options: [{ value: '', label: '— Select destination —' }, ...warehouseOptions] },
    ];

    const form = createForm(fields, {
        id: 'transfer-form',
        submitLabel: 'Create Transfer',
        showCancel: false,
        initialValues: {},
        onSubmit: (data) => {
            if (data.fromWarehouseId === data.toWarehouseId) {
                showError('Source and destination warehouse must be different.');
                return;
            }
            const payload = {
                fromWarehouseId: parseInt(data.fromWarehouseId),
                toWarehouseId:   parseInt(data.toWarehouseId),
                status: 'PENDING',
                lines: []
            };
            ApiService.createTransfer(payload)
                .then(created => {
                    modal.hide();
                    showSuccess('Transfer created!');
                    _trTransfers.push(created);
                    renderTransfersTable(_trTransfers);
                })
                .catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'transfer-form-modal',
        title: 'New Stock Transfer',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}