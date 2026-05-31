/**
 * Orders Page
 */
let _orders = [];
let _orderProducts = [];
let _orderUsers    = [];

function renderOrdersPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-cart3"></i></span>
                Orders
            </h1>
            <button class="btn btn-amber" id="create-order-btn">
                <i class="bi bi-plus-circle me-1"></i>New Order
            </button>
        </div>

        <!-- Filter bar -->
        <div class="card mb-3">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-3">
                        <select id="ord-status-filter" class="form-select form-select-sm">
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="ord-payment-filter" class="form-select form-select-sm">
                            <option value="">All payment statuses</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-primary w-100" id="ord-filter-btn">
                            <i class="bi bi-funnel me-1"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Order Records</div>
            <div class="card-body p-0" id="orders-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading orders…</p></div>
            </div>
        </div>
    `;

    document.getElementById('create-order-btn').addEventListener('click', () => showOrderModal());
    document.getElementById('ord-filter-btn').addEventListener('click', applyOrderFilters);

    Promise.allSettled([
        ApiService.getAllOrders(),
        ApiService.getAllProducts(),
        ApiService.getAllUsers()
    ]).then(([orders, products, users]) => {
        _orders        = orders.status    === 'fulfilled' ? orders.value    : [];
        _orderProducts = products.status  === 'fulfilled' ? products.value  : [];
        _orderUsers    = users.status     === 'fulfilled' ? users.value     : [];

        if (orders.status === 'fulfilled') {
            renderOrdersTable(_orders);
        } else {
            document.getElementById('orders-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load orders:</strong> ${orders.reason?.message || 'Unknown error'}
                <button class="btn btn-sm btn-primary ms-3" onclick="renderOrdersPage()">Retry</button></div>`;
        }
    });
}

function applyOrderFilters() {
    const status  = document.getElementById('ord-status-filter').value;
    const payment = document.getElementById('ord-payment-filter').value;
    let filtered  = _orders;
    if (status)  filtered = filtered.filter(o => o.status === status);
    if (payment) filtered = filtered.filter(o => o.paymentStatus === payment);
    renderOrdersTable(filtered);
}

function paymentBadge(ps) {
    const map = { UNPAID: 'danger', PARTIAL: 'warning', PAID: 'success' };
    const color = map[ps] || 'secondary';
    return `<span class="badge bg-${color}">${ps || 'UNPAID'}</span>`;
}

function orderStatusBadge(s) {
    const map = { PENDING: 'secondary', CONFIRMED: 'primary', SHIPPED: 'info', DELIVERED: 'success', CANCELLED: 'danger' };
    const color = map[s] || 'secondary';
    return `<span class="badge bg-${color}">${s || 'PENDING'}</span>`;
}

function renderOrdersTable(orders) {
    const container = document.getElementById('orders-table-container');
    if (!orders || orders.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-cart3"></i><h5>No orders found</h5><p>Create a new order to get started.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',            title: 'ID',             width: '6%' },
        { field: 'orderDate',     title: 'Order Date',     width: '15%', render: v => formatDate(v) },
        { field: 'customerId',    title: 'Customer',       width: '14%', render: v => {
                if (!v) return '—';
                const u = _orderUsers.find(u => u.id == v);
                const label = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : `User #${v}`;
                return `<span class="badge bg-light text-dark border">${label}</span>`;
            }},
        { field: 'status',        title: 'Status',         width: '14%', render: v => orderStatusBadge(v) },
        { field: 'paymentStatus', title: 'Payment',        width: '12%', render: v => paymentBadge(v) },
        { field: 'orderLines',    title: 'Lines',          width: '8%',  render: v => `<span class="badge bg-secondary">${v ? v.length : 0}</span>` },
        { field: 'orderLines',    title: 'Total',          width: '12%', render: v => {
                if (!v || v.length === 0) return '—';
                const total = v.reduce((sum, l) => sum + (l.subtotal || (l.unitPrice * l.quantity) || 0), 0);
                return total > 0 ? `<strong>$${total.toFixed(2)}</strong>` : '—';
            }}
    ];

    const table = createTable(orders, {
        columns,
        onView:   (id, item) => showOrderDetailsModal(item),
        onEdit:   (id, item) => showOrderEditModal(item),
        onDelete: async (id) => {
            const ok = await confirmAction('Delete this order? This cannot be undone.');
            if (!ok) return;
            ApiService.deleteOrder(id)
                .then(() => {
                    _orders = _orders.filter(o => o.id !== id);
                    renderOrdersTable(_orders);
                    showSuccess('Order deleted.');
                })
                .catch(e => showError(e.message));
        },
        actions: { view: true, edit: true, delete: true }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showOrderDetailsModal(order) {
    const linesHtml = order.orderLines && order.orderLines.length > 0
        ? `<table class="table table-sm mt-2">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
            <tbody>${order.orderLines.map(l => {
            const p = _orderProducts.find(p => p.id == l.productId);
            const name = p ? p.name : `#${l.productId}`;
            return `<tr><td>${name}</td><td>${l.quantity}</td><td>$${(l.unitPrice||0).toFixed(2)}</td><td><strong>$${(l.subtotal||0).toFixed(2)}</strong></td></tr>`;
        }).join('')}</tbody>
           </table>`
        : `<p class="text-muted" style="font-size:0.85rem;">No line items</p>`;

    const total = order.orderLines
        ? order.orderLines.reduce((s, l) => s + (l.subtotal || 0), 0)
        : 0;

    const content = `
        <div class="row mb-3">
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${order.id}</span></div>
                <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(order.orderDate)}</span></div>
                <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">${order.customerId ? (() => { const u = _orderUsers.find(u => u.id == order.customerId); return u ? `${u.firstName||''} ${u.lastName||''}`.trim() || u.email : `User #${order.customerId}`; })() : '—'}</span></div>
            </div>
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${orderStatusBadge(order.status)}</span></div>
                <div class="detail-row"><span class="detail-label">Payment</span><span class="detail-value">${paymentBadge(order.paymentStatus)}</span></div>
                <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value"><strong>$${total.toFixed(2)}</strong></span></div>
            </div>
        </div>
        <div class="border-top pt-2">
            <span class="detail-label">Order Lines</span>
            ${linesHtml}
        </div>
    `;

    const modal = createModal({
        id: 'order-details-modal',
        title: `Order #${order.id}`,
        content, size: 'large', footer: true,
        primaryButton: 'Close',
        onPrimary: () => modal.hide()
    });
    modal.show();
}

function showOrderModal() {
    let lines = []; // [{ productId, productName, unitPrice, quantity, subtotal }]

    const userOptions = _orderUsers.map(u => {
        const label = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User #${u.id}`;
        return `<option value="${u.id}">${label}</option>`;
    }).join('');

    const productOptions = _orderProducts.map(p =>
        `<option value="${p.id}" data-price="${p.unitPrice || 0}">${p.name || '#' + p.id}</option>`
    ).join('');

    const content = document.createElement('div');
    content.innerHTML = `
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <label class="form-label required-field">Customer</label>
                <select id="ord-customer" class="form-select">
                    <option value="">— Select customer —</option>
                    ${userOptions}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label required-field">Status</label>
                <select id="ord-status" class="form-select">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label required-field">Payment</label>
                <select id="ord-payment" class="form-select">
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                </select>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Order Date</label>
            <input id="ord-date" type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <hr>
        <label class="form-label required-field">Order Lines</label>
        <div class="d-flex gap-2 mb-3">
            <select id="ord-line-product" class="form-select form-select-sm">
                <option value="">— Select product —</option>
                ${productOptions}
            </select>
            <input id="ord-line-qty" type="number" class="form-control form-control-sm" placeholder="Qty" min="1" style="width:80px;flex-shrink:0;">
            <input id="ord-line-price" type="number" class="form-control form-control-sm" placeholder="Unit price" min="0" step="0.01" style="width:110px;flex-shrink:0;">
            <button type="button" class="btn btn-sm btn-amber" id="ord-add-line" style="white-space:nowrap;">
                <i class="bi bi-plus"></i> Add
            </button>
        </div>
        <div id="ord-lines-list"></div>
        <div id="ord-total-row" class="text-end fw-bold mb-2" style="display:none;"></div>
        <div id="ord-error" class="text-danger small mb-2" style="display:none;"></div>
        <div class="mt-3">
            <button type="button" class="btn btn-primary w-100" id="ord-submit-btn">
                <i class="bi bi-cart-check me-1"></i>Create Order
            </button>
        </div>
    `;

    // Auto-fill unit price when product is selected
    content.querySelector('#ord-line-product').addEventListener('change', function() {
        const opt = this.options[this.selectedIndex];
        const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
        content.querySelector('#ord-line-price').value = price > 0 ? price.toFixed(2) : '';
    });

    function calcSubtotal(qty, price) { return Math.round(qty * price * 100) / 100; }

    function renderLines() {
        const list    = content.querySelector('#ord-lines-list');
        const totRow  = content.querySelector('#ord-total-row');
        if (lines.length === 0) {
            list.innerHTML = `<p class="text-muted small fst-italic">No products added yet.</p>`;
            totRow.style.display = 'none';
            return;
        }
        const total = lines.reduce((s, l) => s + l.subtotal, 0);
        list.innerHTML = `
            <table class="table table-sm mb-1">
                <thead><tr><th>Product</th><th style="width:70px">Qty</th><th style="width:100px">Unit Price</th><th style="width:100px">Subtotal</th><th style="width:40px"></th></tr></thead>
                <tbody>
                    ${lines.map((l, i) => `
                        <tr>
                            <td>${l.productName}</td>
                            <td>${l.quantity}</td>
                            <td>$${l.unitPrice.toFixed(2)}</td>
                            <td><strong>$${l.subtotal.toFixed(2)}</strong></td>
                            <td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1 ord-remove-line" data-index="${i}">
                                <i class="bi bi-trash" style="font-size:0.75rem;"></i>
                            </button></td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        totRow.textContent = `Total: $${total.toFixed(2)}`;
        totRow.style.display = 'block';

        list.querySelectorAll('.ord-remove-line').forEach(btn => {
            btn.addEventListener('click', () => {
                lines.splice(parseInt(btn.dataset.index), 1);
                renderLines();
            });
        });
    }

    function showErr(msg) {
        const el = content.querySelector('#ord-error');
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
    }

    renderLines();

    content.querySelector('#ord-add-line').addEventListener('click', () => {
        const productSel = content.querySelector('#ord-line-product');
        const qty        = parseInt(content.querySelector('#ord-line-qty').value);
        const unitPrice  = parseFloat(content.querySelector('#ord-line-price').value);
        const productId  = parseInt(productSel.value);

        if (!productId)              { showErr('Please select a product.');         return; }
        if (!qty || qty < 1)         { showErr('Quantity must be at least 1.');     return; }
        if (isNaN(unitPrice) || unitPrice < 0) { showErr('Enter a valid unit price.'); return; }
        if (lines.find(l => l.productId === productId)) { showErr('That product is already in the list.'); return; }

        const product = _orderProducts.find(p => p.id === productId);
        lines.push({
            productId,
            productName: product ? product.name : `#${productId}`,
            quantity:    qty,
            unitPrice:   unitPrice,
            subtotal:    calcSubtotal(qty, unitPrice)
        });
        productSel.value = '';
        content.querySelector('#ord-line-qty').value   = '';
        content.querySelector('#ord-line-price').value = '';
        showErr('');
        renderLines();
    });

    content.querySelector('#ord-submit-btn').addEventListener('click', () => {
        const customerId = parseInt(content.querySelector('#ord-customer').value);
        const status     = content.querySelector('#ord-status').value;
        const payment    = content.querySelector('#ord-payment').value;
        const dateVal    = content.querySelector('#ord-date').value;

        if (!customerId)      { showErr('Please select a customer.'); return; }
        if (lines.length === 0) { showErr('Add at least one product line.'); return; }

        showErr('');

        const payload = {
            customerId,
            status,
            paymentStatus: payment,
            orderDate: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
            orderLines: lines.map(l => ({
                productId: l.productId,
                quantity:  l.quantity,
                unitPrice: l.unitPrice,
                subtotal:  l.subtotal
            }))
        };

        ApiService.createOrder(payload)
            .then(result => {
                modal.hide();
                showSuccess('Order created!');
                _orders.push(result);
                renderOrdersTable(_orders);
            })
            .catch(e => showError(e.message));
    });

    const modal = createModal({
        id: 'order-form-modal',
        title: 'New Order',
        content, size: 'large', footer: false
    });
    modal.show();
}

function showOrderEditModal(order) {
    let lines = (order.orderLines || []).map(l => {
        const p = _orderProducts.find(x => x.id == l.productId);
        return {
            productId:   l.productId,
            productName: p ? p.name : `#${l.productId}`,
            quantity:    l.quantity,
            unitPrice:   l.unitPrice  || 0,
            subtotal:    l.subtotal   || 0
        };
    });

    const userOptions = _orderUsers.map(u => {
        const label = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User #${u.id}`;
        return `<option value="${u.id}" ${u.id == order.customerId ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const productOptions = _orderProducts.map(p =>
        `<option value="${p.id}" data-price="${p.unitPrice || 0}">${p.name || '#' + p.id}</option>`
    ).join('');

    const content = document.createElement('div');
    content.innerHTML = `
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <label class="form-label">Customer</label>
                <select id="edit-ord-customer" class="form-select">
                    <option value="">— Select customer —</option>
                    ${userOptions}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Status</label>
                <select id="edit-ord-status" class="form-select">
                    <option value="PENDING"   ${order.status === 'PENDING'   ? 'selected' : ''}>Pending</option>
                    <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                    <option value="SHIPPED"   ${order.status === 'SHIPPED'   ? 'selected' : ''}>Shipped</option>
                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                    <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Payment</label>
                <select id="edit-ord-payment" class="form-select">
                    <option value="UNPAID"  ${order.paymentStatus === 'UNPAID'  ? 'selected' : ''}>Unpaid</option>
                    <option value="PARTIAL" ${order.paymentStatus === 'PARTIAL' ? 'selected' : ''}>Partial</option>
                    <option value="PAID"    ${order.paymentStatus === 'PAID'    ? 'selected' : ''}>Paid</option>
                </select>
            </div>
        </div>
        <hr>
        <label class="form-label">Order Lines</label>
        <div class="d-flex gap-2 mb-3">
            <select id="edit-ord-line-product" class="form-select form-select-sm">
                <option value="">— Select product —</option>
                ${productOptions}
            </select>
            <input id="edit-ord-line-qty"   type="number" class="form-control form-control-sm" placeholder="Qty"   min="1"    style="width:80px;flex-shrink:0;">
            <input id="edit-ord-line-price" type="number" class="form-control form-control-sm" placeholder="Price" min="0" step="0.01" style="width:100px;flex-shrink:0;">
            <button type="button" class="btn btn-sm btn-amber" id="edit-ord-add-line" style="white-space:nowrap;">
                <i class="bi bi-plus"></i> Add
            </button>
        </div>
        <div id="edit-ord-lines-list"></div>
        <div id="edit-ord-total-row" class="text-end fw-bold mb-2" style="display:none;"></div>
        <div id="edit-ord-error" class="text-danger small mb-2" style="display:none;"></div>
        <div class="mt-3">
            <button type="button" class="btn btn-primary w-100" id="edit-ord-submit">
                <i class="bi bi-check-circle me-1"></i>Save Changes
            </button>
        </div>
    `;

    content.querySelector('#edit-ord-line-product').addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];
        const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
        content.querySelector('#edit-ord-line-price').value = price > 0 ? price.toFixed(2) : '';
    });

    function renderLines() {
        const list   = content.querySelector('#edit-ord-lines-list');
        const totRow = content.querySelector('#edit-ord-total-row');
        if (lines.length === 0) {
            list.innerHTML = `<p class="text-muted small fst-italic">No products added yet.</p>`;
            totRow.style.display = 'none';
            return;
        }
        const total = lines.reduce((s, l) => s + l.subtotal, 0);
        list.innerHTML = `
            <table class="table table-sm mb-1">
                <thead><tr><th>Product</th><th style="width:70px">Qty</th><th style="width:100px">Unit Price</th><th style="width:100px">Subtotal</th><th style="width:40px"></th></tr></thead>
                <tbody>${lines.map((l, i) => `
                    <tr>
                        <td>${l.productName}</td>
                        <td>${l.quantity}</td>
                        <td>$${l.unitPrice.toFixed(2)}</td>
                        <td><strong>$${l.subtotal.toFixed(2)}</strong></td>
                        <td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1 edit-ord-remove" data-index="${i}">
                            <i class="bi bi-trash" style="font-size:0.75rem;"></i>
                        </button></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
        totRow.textContent = `Total: $${total.toFixed(2)}`;
        totRow.style.display = 'block';
        list.querySelectorAll('.edit-ord-remove').forEach(btn => {
            btn.addEventListener('click', () => { lines.splice(parseInt(btn.dataset.index), 1); renderLines(); });
        });
    }

    function showErr(msg) {
        const el = content.querySelector('#edit-ord-error');
        el.textContent = msg; el.style.display = msg ? 'block' : 'none';
    }

    renderLines();

    content.querySelector('#edit-ord-add-line').addEventListener('click', () => {
        const productSel = content.querySelector('#edit-ord-line-product');
        const productId  = parseInt(productSel.value);
        const qty        = parseInt(content.querySelector('#edit-ord-line-qty').value);
        const unitPrice  = parseFloat(content.querySelector('#edit-ord-line-price').value);
        if (!productId)                    { showErr('Please select a product.');         return; }
        if (!qty || qty < 1)               { showErr('Quantity must be at least 1.');     return; }
        if (isNaN(unitPrice)||unitPrice<0) { showErr('Enter a valid unit price.');        return; }
        if (lines.find(l => l.productId === productId)) { showErr('That product is already in the list.'); return; }
        const product = _orderProducts.find(p => p.id === productId);
        lines.push({
            productId,
            productName: product ? product.name : `#${productId}`,
            quantity:    qty,
            unitPrice,
            subtotal:    Math.round(qty * unitPrice * 100) / 100
        });
        productSel.value = '';
        content.querySelector('#edit-ord-line-qty').value   = '';
        content.querySelector('#edit-ord-line-price').value = '';
        showErr('');
        renderLines();
    });

    content.querySelector('#edit-ord-submit').addEventListener('click', () => {
        const customerId = parseInt(content.querySelector('#edit-ord-customer').value);
        if (!customerId)      { showErr('Please select a customer.'); return; }
        if (lines.length===0) { showErr('Add at least one product line.'); return; }
        showErr('');

        const payload = {
            customerId,
            status:        content.querySelector('#edit-ord-status').value,
            paymentStatus: content.querySelector('#edit-ord-payment').value,
            orderLines: lines.map(l => ({
                productId: l.productId,
                quantity:  l.quantity,
                unitPrice: l.unitPrice,
                subtotal:  l.subtotal
            }))
        };

        ApiService.updateOrder(order.id, payload)
            .then(result => {
                modal.hide();
                showSuccess('Order updated!');
                const idx = _orders.findIndex(o => o.id === order.id);
                if (idx !== -1) _orders[idx] = result;
                renderOrdersTable(_orders);
            })
            .catch(e => showError(e.message));
    });

    const modal = createModal({
        id: 'order-edit-modal',
        title: `Edit Order #${order.id}`,
        content, size: 'large', footer: false
    });
    modal.show();
}