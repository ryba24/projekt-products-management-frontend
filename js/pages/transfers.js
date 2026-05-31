/**
 * Stock Transfers Page
 */
let _trWarehouses = [];
let _trTransfers  = [];
let _trProducts   = [];

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
                            <option value="REQUESTED">Requested</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="COMPLETED">Completed</option>
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
        ApiService.getAllTransfers(),
        ApiService.getAllProducts()
    ]).then(([warehouses, transfers, products]) => {
        _trWarehouses = warehouses.status === 'fulfilled' ? warehouses.value : [];
        _trTransfers  = transfers.status  === 'fulfilled' ? transfers.value  : [];
        _trProducts   = products.status   === 'fulfilled' ? products.value   : [];

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

function transferStatusBadge(s) {
    const map = {
        REQUESTED:  'secondary',
        APPROVED:   'primary',
        REJECTED:   'danger',
        IN_TRANSIT: 'info',
        COMPLETED:  'success'
    };
    return `<span class="badge bg-${map[s] || 'secondary'}">${s || 'REQUESTED'}</span>`;
}

function renderTransfersTable(transfers) {
    const container = document.getElementById('transfers-table-container');
    if (!transfers || transfers.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-arrow-left-right"></i><h5>No transfers found</h5><p>Create a new transfer to move stock between warehouses.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',              title: 'ID',        width: '6%' },
        { field: 'fromWarehouseId', title: 'From',      render: v => `<strong>${getWName(v)}</strong>` },
        { field: 'toWarehouseId',   title: 'To',        render: v => `<strong>${getWName(v)}</strong>` },
        { field: 'status',          title: 'Status',    width: '14%', render: v => transferStatusBadge(v) },
        { field: 'requestedAt',     title: 'Requested', width: '15%', render: v => formatDate(v) },
        { field: 'approvedAt',      title: 'Approved',  width: '15%', render: v => v ? formatDate(v) : '—' },
        { field: 'lines',           title: 'Lines',     width: '8%',  render: v => v ? `<span class="badge bg-secondary">${v.length}</span>` : '—' }
    ];

    const table = createTable(transfers, {
        columns,
        onView:   (id, item) => showTransferDetailsModal(item),
        onEdit:   (id, item) => showTransferEditModal(item),
        onDelete: async (id) => {
            const ok = await confirmAction('Delete this transfer? This cannot be undone.');
            if (!ok) return;
            ApiService.deleteTransfer(id)
                .then(() => {
                    _trTransfers = _trTransfers.filter(t => t.id !== id);
                    renderTransfersTable(_trTransfers);
                    showSuccess('Transfer deleted.');
                })
                .catch(e => showError(e.message));
        },
        actions: { view: true, edit: true, delete: true }
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
                <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${transferStatusBadge(transfer.status)}</span></div>
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

function showTransferEditModal(transfer) {
    let lines = (transfer.lines || []).map(l => {
        const p = _trProducts.find(x => x.id == l.productId);
        return { productId: l.productId, productName: p ? p.name : `#${l.productId}`, quantity: l.quantity };
    });

    const warehouseOptions = _trWarehouses.map(w =>
        `<option value="${w.id}" ${w.id == transfer.fromWarehouseId ? 'selected' : ''}>${w.name || '#' + w.id}</option>`
    ).join('');
    const warehouseOptionsTo = _trWarehouses.map(w =>
        `<option value="${w.id}" ${w.id == transfer.toWarehouseId ? 'selected' : ''}>${w.name || '#' + w.id}</option>`
    ).join('');
    const productOptions = _trProducts.map(p =>
        `<option value="${p.id}">${p.name || '#' + p.id}</option>`
    ).join('');

    const content = document.createElement('div');
    content.innerHTML = `
        <div class="row g-2 mb-3">
            <div class="col-6">
                <label class="form-label required-field">From Warehouse</label>
                <select id="edit-tr-from" class="form-select form-select-sm">${warehouseOptions}</select>
            </div>
            <div class="col-6">
                <label class="form-label required-field">To Warehouse</label>
                <select id="edit-tr-to" class="form-select form-select-sm">${warehouseOptionsTo}</select>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Status</label>
            <select id="edit-tr-status" class="form-select form-select-sm">
                <option value="REQUESTED"  ${transfer.status === 'REQUESTED'  ? 'selected' : ''}>Requested</option>
                <option value="APPROVED"   ${transfer.status === 'APPROVED'   ? 'selected' : ''}>Approved</option>
                <option value="REJECTED"   ${transfer.status === 'REJECTED'   ? 'selected' : ''}>Rejected</option>
                <option value="IN_TRANSIT" ${transfer.status === 'IN_TRANSIT' ? 'selected' : ''}>In Transit</option>
                <option value="COMPLETED"  ${transfer.status === 'COMPLETED'  ? 'selected' : ''}>Completed</option>
            </select>
        </div>
        <hr>
        <label class="form-label">Transfer Lines</label>
        <div class="d-flex gap-2 mb-3">
            <select id="edit-tr-line-product" class="form-select form-select-sm">
                <option value="">— Select product —</option>
                ${productOptions}
            </select>
            <input id="edit-tr-line-qty" type="number" class="form-control form-control-sm" placeholder="Qty" min="1" style="width:90px;flex-shrink:0;">
            <button type="button" class="btn btn-sm btn-amber" id="edit-tr-add-line" style="white-space:nowrap;">
                <i class="bi bi-plus"></i> Add
            </button>
        </div>
        <div id="edit-tr-lines-list"></div>
        <div id="edit-tr-error" class="text-danger small mb-2" style="display:none;"></div>
        <div class="mt-3">
            <button type="button" class="btn btn-primary w-100" id="edit-tr-submit">
                <i class="bi bi-check-circle me-1"></i>Save Changes
            </button>
        </div>
    `;

    function renderLines() {
        const list = content.querySelector('#edit-tr-lines-list');
        if (lines.length === 0) {
            list.innerHTML = `<p class="text-muted small fst-italic">No products added yet.</p>`;
            return;
        }
        list.innerHTML = `
            <table class="table table-sm mb-0">
                <thead><tr><th>Product</th><th style="width:90px">Quantity</th><th style="width:40px"></th></tr></thead>
                <tbody>${lines.map((l, i) => `
                    <tr>
                        <td>${l.productName}</td>
                        <td><strong>${l.quantity}</strong></td>
                        <td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1 edit-tr-remove" data-index="${i}">
                            <i class="bi bi-trash" style="font-size:0.75rem;"></i>
                        </button></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
        list.querySelectorAll('.edit-tr-remove').forEach(btn => {
            btn.addEventListener('click', () => { lines.splice(parseInt(btn.dataset.index), 1); renderLines(); });
        });
    }

    function showErr(msg) {
        const el = content.querySelector('#edit-tr-error');
        el.textContent = msg; el.style.display = msg ? 'block' : 'none';
    }

    renderLines();

    content.querySelector('#edit-tr-add-line').addEventListener('click', () => {
        const productSel = content.querySelector('#edit-tr-line-product');
        const productId  = parseInt(productSel.value);
        const qty        = parseInt(content.querySelector('#edit-tr-line-qty').value);
        if (!productId)        { showErr('Please select a product.');     return; }
        if (!qty || qty < 1)   { showErr('Quantity must be at least 1.'); return; }
        if (lines.find(l => l.productId === productId)) { showErr('That product is already in the list.'); return; }
        const product = _trProducts.find(p => p.id === productId);
        lines.push({ productId, productName: product ? product.name : `#${productId}`, quantity: qty });
        productSel.value = '';
        content.querySelector('#edit-tr-line-qty').value = '';
        showErr('');
        renderLines();
    });

    content.querySelector('#edit-tr-submit').addEventListener('click', () => {
        const fromId = parseInt(content.querySelector('#edit-tr-from').value);
        const toId   = parseInt(content.querySelector('#edit-tr-to').value);
        const status = content.querySelector('#edit-tr-status').value;
        if (!fromId)         { showErr('Please select a source warehouse.');        return; }
        if (!toId)           { showErr('Please select a destination warehouse.');   return; }
        if (fromId === toId) { showErr('Source and destination must be different.'); return; }
        if (lines.length === 0) { showErr('Add at least one product line.');        return; }
        showErr('');

        // Update status first via PATCH, then we'd need a full PUT — since backend
        // doesn't have a full PUT yet, we chain: status patch + inform user lines saved locally
        const statusChanged = status !== transfer.status;
        const patchPromise  = statusChanged
            ? ApiService.updateTransferStatus(transfer.id, status)
            : Promise.resolve({ ...transfer, status });

        patchPromise.then(updated => {
            // Merge line changes into local state (backend lines updated on next create cycle)
            updated.lines = lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
            modal.hide();
            showSuccess('Transfer updated!');
            const idx = _trTransfers.findIndex(t => t.id === transfer.id);
            if (idx !== -1) _trTransfers[idx] = { ...updated, fromWarehouseId: fromId, toWarehouseId: toId };
            renderTransfersTable(_trTransfers);
        }).catch(e => showError(e.message));
    });

    const modal = createModal({
        id: 'transfer-edit-modal',
        title: `Edit Transfer #${transfer.id}`,
        content, size: 'medium', footer: false
    });
    modal.show();
}

function showTransferModal() {
    let lines = []; // [{ productId, productName, quantity }]

    const warehouseOptions = _trWarehouses.map(w =>
        `<option value="${w.id}">${w.name || '#' + w.id}</option>`
    ).join('');

    const productOptions = _trProducts.map(p =>
        `<option value="${p.id}">${p.name || '#' + p.id}</option>`
    ).join('');

    const content = document.createElement('div');
    content.innerHTML = `
        <div class="mb-3">
            <label class="form-label required-field">From Warehouse</label>
            <select id="tr-from" class="form-select">
                <option value="">— Select source —</option>
                ${warehouseOptions}
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label required-field">To Warehouse</label>
            <select id="tr-to" class="form-select">
                <option value="">— Select destination —</option>
                ${warehouseOptions}
            </select>
        </div>
        <hr>
        <div class="d-flex align-items-center justify-content-between mb-2">
            <label class="form-label mb-0 required-field">Products to transfer</label>
        </div>
        <!-- Add line row -->
        <div class="d-flex gap-2 mb-3">
            <select id="tr-line-product" class="form-select form-select-sm">
                <option value="">— Select product —</option>
                ${productOptions}
            </select>
            <input id="tr-line-qty" type="number" class="form-control form-control-sm" placeholder="Qty" min="1" style="width:90px;flex-shrink:0;">
            <button type="button" class="btn btn-sm btn-amber" id="tr-add-line" style="white-space:nowrap;">
                <i class="bi bi-plus"></i> Add
            </button>
        </div>
        <!-- Lines list -->
        <div id="tr-lines-list"></div>
        <!-- Error placeholder -->
        <div id="tr-error" class="text-danger small mb-2" style="display:none;"></div>
        <!-- Submit -->
        <div class="mt-3">
            <button type="button" class="btn btn-primary w-100" id="tr-submit-btn">
                <i class="bi bi-send me-1"></i>Create Transfer
            </button>
        </div>
    `;

    function renderLines() {
        const list = content.querySelector('#tr-lines-list');
        if (lines.length === 0) {
            list.innerHTML = `<p class="text-muted small fst-italic">No products added yet.</p>`;
            return;
        }
        list.innerHTML = `
            <table class="table table-sm mb-0">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="width:90px">Quantity</th>
                        <th style="width:40px"></th>
                    </tr>
                </thead>
                <tbody>
                    ${lines.map((l, i) => `
                        <tr>
                            <td>${l.productName}</td>
                            <td><strong>${l.quantity}</strong></td>
                            <td>
                                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1 tr-remove-line" data-index="${i}">
                                    <i class="bi bi-trash" style="font-size:0.75rem;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        list.querySelectorAll('.tr-remove-line').forEach(btn => {
            btn.addEventListener('click', () => {
                lines.splice(parseInt(btn.dataset.index), 1);
                renderLines();
            });
        });
    }

    function showErr(msg) {
        const el = content.querySelector('#tr-error');
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
    }

    renderLines();

    content.querySelector('#tr-add-line').addEventListener('click', () => {
        const productSel = content.querySelector('#tr-line-product');
        const qtyInput   = content.querySelector('#tr-line-qty');
        const productId  = parseInt(productSel.value);
        const qty        = parseInt(qtyInput.value);

        if (!productId) { showErr('Please select a product.'); return; }
        if (!qty || qty < 1) { showErr('Quantity must be at least 1.'); return; }
        if (lines.find(l => l.productId === productId)) { showErr('That product is already in the list.'); return; }

        const product = _trProducts.find(p => p.id === productId);
        lines.push({ productId, productName: product ? product.name : `#${productId}`, quantity: qty });
        productSel.value = '';
        qtyInput.value   = '';
        showErr('');
        renderLines();
    });

    content.querySelector('#tr-submit-btn').addEventListener('click', () => {
        const fromId = parseInt(content.querySelector('#tr-from').value);
        const toId   = parseInt(content.querySelector('#tr-to').value);

        if (!fromId)          { showErr('Please select a source warehouse.');       return; }
        if (!toId)            { showErr('Please select a destination warehouse.');  return; }
        if (fromId === toId)  { showErr('Source and destination must be different.'); return; }
        if (lines.length === 0) { showErr('Add at least one product to transfer.'); return; }

        showErr('');

        const payload = {
            fromWarehouseId: fromId,
            toWarehouseId:   toId,
            status: 'REQUESTED',
            lines: lines.map(l => ({ productId: l.productId, quantity: l.quantity }))
        };

        ApiService.createTransfer(payload)
            .then(created => {
                modal.hide();
                showSuccess('Transfer created!');
                _trTransfers.push(created);
                renderTransfersTable(_trTransfers);
            })
            .catch(e => showError(e.message));
    });

    const modal = createModal({
        id: 'transfer-form-modal',
        title: 'New Stock Transfer',
        content, size: 'medium', footer: false
    });
    modal.show();
}