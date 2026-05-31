/**
 * Invoices Page
 */
let _invoices = [];
let _invOrders = [];

function renderInvoicesPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-receipt"></i></span>
                Invoices
            </h1>
            <button class="btn btn-amber" id="create-invoice-btn">
                <i class="bi bi-plus-circle me-1"></i>New Invoice
            </button>
        </div>

        <!-- Summary cards -->
        <div class="row g-3 mb-3" id="inv-summary-row">
            <div class="col-6 col-md-3">
                <div class="stat-card navy">
                    <div class="stat-icon"><i class="bi bi-receipt"></i></div>
                    <div><div class="stat-value" id="inv-stat-total">—</div><div class="stat-label">Total Invoices</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card teal">
                    <div class="stat-icon"><i class="bi bi-currency-dollar"></i></div>
                    <div><div class="stat-value" id="inv-stat-amount">—</div><div class="stat-label">Total Amount</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card amber">
                    <div class="stat-icon"><i class="bi bi-calendar-week"></i></div>
                    <div><div class="stat-value" id="inv-stat-month">—</div><div class="stat-label">This Month</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card slate">
                    <div class="stat-icon"><i class="bi bi-graph-up"></i></div>
                    <div><div class="stat-value" id="inv-stat-avg">—</div><div class="stat-label">Avg Invoice</div></div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Invoice Records</div>
            <div class="card-body p-0" id="invoices-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading invoices…</p></div>
            </div>
        </div>
    `;

    document.getElementById('create-invoice-btn').addEventListener('click', () => showInvoiceModal());

    Promise.allSettled([
        ApiService.getAllInvoices(),
        ApiService.getAllOrders()
    ]).then(([invoices, orders]) => {
        _invoices  = invoices.status === 'fulfilled' ? invoices.value : [];
        _invOrders = orders.status   === 'fulfilled' ? orders.value   : [];

        if (invoices.status === 'fulfilled') {
            updateInvoiceStats(_invoices);
            renderInvoicesTable(_invoices);
        } else {
            document.getElementById('invoices-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load invoices:</strong> ${invoices.reason?.message || 'Unknown error'}
                <button class="btn btn-sm btn-primary ms-3" onclick="renderInvoicesPage()">Retry</button></div>`;
        }
    });
}

function updateInvoiceStats(invoices) {
    const total      = invoices.length;
    const totalAmt   = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const now        = new Date();
    const thisMonth  = invoices.filter(i => {
        if (!i.issueDate) return false;
        const d = new Date(i.issueDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const avg = total > 0 ? totalAmt / total : 0;

    document.getElementById('inv-stat-total').textContent  = total;
    document.getElementById('inv-stat-amount').textContent = `$${totalAmt.toFixed(0)}`;
    document.getElementById('inv-stat-month').textContent  = thisMonth;
    document.getElementById('inv-stat-avg').textContent    = `$${avg.toFixed(0)}`;
}

function getOrderLabel(orderId) {
    const o = _invOrders.find(x => x.id == orderId);
    if (!o) return `Order #${orderId}`;
    const status = o.status ? ` (${o.status})` : '';
    return `Order #${orderId}${status}`;
}

function renderInvoicesTable(invoices) {
    const container = document.getElementById('invoices-table-container');
    if (!invoices || invoices.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-receipt"></i><h5>No invoices found</h5><p>Create a new invoice linked to an order.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',          title: 'ID',          width: '6%' },
        { field: 'issueDate',   title: 'Issue Date',  width: '16%', render: v => formatDate(v) },
        { field: 'orderId',     title: 'Order',       width: '20%', render: v => v
            ? `<span class="badge bg-light text-dark border"><i class="bi bi-cart3 me-1"></i>${getOrderLabel(v)}</span>`
            : '—'
        },
        { field: 'totalAmount', title: 'Amount',      width: '15%', render: v => v != null
            ? `<strong class="text-success">$${Number(v).toFixed(2)}</strong>`
            : '—'
        }
    ];

    const table = createTable(invoices, {
        columns,
        onView:   (id, item) => showInvoiceDetailsModal(item),
        onEdit:   (id, item) => showInvoiceModal(item),
        onDelete: async (id) => {
            const ok = await confirmAction('Delete this invoice? This cannot be undone.');
            if (!ok) return;
            ApiService.deleteInvoice(id)
                .then(() => {
                    _invoices = _invoices.filter(i => i.id !== id);
                    updateInvoiceStats(_invoices);
                    renderInvoicesTable(_invoices);
                    showSuccess('Invoice deleted.');
                })
                .catch(e => showError(e.message));
        },
        actions: { view: true, edit: true, delete: true }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showInvoiceDetailsModal(invoice) {
    const order = _invOrders.find(o => o.id == invoice.orderId);
    const orderLines = order && order.orderLines ? order.orderLines : [];

    const linesHtml = orderLines.length > 0
        ? `<table class="table table-sm mt-2">
            <thead><tr><th>Product ID</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
            <tbody>${orderLines.map(l =>
                `<tr><td>#${l.productId}</td><td>${l.quantity}</td><td>$${(l.unitPrice||0).toFixed(2)}</td><td>$${(l.subtotal||0).toFixed(2)}</td></tr>`
            ).join('')}</tbody>
           </table>`
        : `<p class="text-muted" style="font-size:0.85rem;">No line items on linked order</p>`;

    const content = `
        <div class="row mb-3">
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Invoice ID</span><span class="detail-value">${invoice.id}</span></div>
                <div class="detail-row"><span class="detail-label">Issue Date</span><span class="detail-value">${formatDate(invoice.issueDate)}</span></div>
                <div class="detail-row"><span class="detail-label">Total Amount</span><span class="detail-value"><strong class="text-success">$${(invoice.totalAmount||0).toFixed(2)}</strong></span></div>
            </div>
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Linked Order</span><span class="detail-value">${invoice.orderId ? getOrderLabel(invoice.orderId) : '—'}</span></div>
                ${order ? `<div class="detail-row"><span class="detail-label">Order Status</span><span class="detail-value">${order.status || '—'}</span></div>` : ''}
                ${order ? `<div class="detail-row"><span class="detail-label">Payment</span><span class="detail-value">${order.paymentStatus || '—'}</span></div>` : ''}
            </div>
        </div>
        <div class="border-top pt-2">
            <span class="detail-label">Order Lines</span>
            ${linesHtml}
        </div>
    `;

    const modal = createModal({
        id: 'invoice-details-modal',
        title: `Invoice #${invoice.id}`,
        content, size: 'large', footer: true,
        primaryButton: 'Close',
        onPrimary: () => modal.hide()
    });
    modal.show();
}

function showInvoiceModal(existing) {
    const isEdit = !!existing;
    const orderOptions = _invOrders.map(o => ({ value: o.id, label: `Order #${o.id}${o.status ? ' – ' + o.status : ''}` }));

    const fields = [
        { id: 'orderId',     label: 'Linked Order',  type: 'select', required: true,
          options: [{ value: '', label: '— Select an order —' }, ...orderOptions]
        },
        { id: 'totalAmount', label: 'Total Amount ($)', type: 'number', required: true, placeholder: 'e.g. 150.00' },
        { id: 'issueDate',   label: 'Issue Date',    type: 'date',   required: false }
    ];

    const form = createForm(fields, {
        id: 'invoice-form',
        submitLabel: isEdit ? 'Save Changes' : 'Create Invoice',
        showCancel: false,
        initialValues: existing ? {
            orderId:     existing.orderId,
            totalAmount: existing.totalAmount,
            issueDate:   existing.issueDate ? new Date(existing.issueDate).toISOString().split('T')[0] : ''
        } : {},
        onSubmit: (data) => {
            if (!data.orderId) { showError('Please select an order.'); return; }
            const payload = {
                orderId:     parseInt(data.orderId),
                totalAmount: parseFloat(data.totalAmount),
                issueDate:   data.issueDate ? new Date(data.issueDate).toISOString() : new Date().toISOString()
            };

            const call = isEdit
                ? ApiService.updateInvoice(existing.id, payload)
                : ApiService.createInvoice(payload);

            call.then(result => {
                modal.hide();
                showSuccess(isEdit ? 'Invoice updated!' : 'Invoice created!');
                if (isEdit) {
                    const idx = _invoices.findIndex(i => i.id === existing.id);
                    if (idx !== -1) _invoices[idx] = result;
                } else {
                    _invoices.push(result);
                }
                updateInvoiceStats(_invoices);
                renderInvoicesTable(_invoices);
            }).catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'invoice-form-modal',
        title: isEdit ? `Edit Invoice #${existing.id}` : 'New Invoice',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}
