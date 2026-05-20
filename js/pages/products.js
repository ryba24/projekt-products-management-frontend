/**
 * Products Page – full CRUD
 */

let _allCategories = [];

function renderProductsPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-box-seam"></i></span>
                Products
            </h1>
            <button class="btn btn-amber" id="create-product-btn">
                <i class="bi bi-plus-circle me-1"></i>New Product
            </button>
        </div>

        <!-- Search / Filter bar -->
        <div class="card mb-3">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-5">
                        <input type="text" id="product-search" class="form-control form-control-sm" placeholder="Search by name or description…">
                    </div>
                    <div class="col-md-3">
                        <select id="product-category-filter" class="form-select form-select-sm">
                            <option value="">All categories</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="product-status-filter" class="form-select form-select-sm">
                            <option value="">All statuses</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-primary w-100" id="product-filter-btn">
                            <i class="bi bi-funnel me-1"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Product List</div>
            <div class="card-body p-0" id="products-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading products…</p></div>
            </div>
        </div>
    `;

    document.getElementById('create-product-btn').addEventListener('click', () => showProductModal(null));
    document.getElementById('product-filter-btn').addEventListener('click', () => applyProductFilters());
    document.getElementById('product-search').addEventListener('keyup', e => { if (e.key === 'Enter') applyProductFilters(); });

    // Load categories for filter dropdown, then load products
    ApiService.getAllCategories()
        .then(cats => {
            _allCategories = cats;
            const sel = document.getElementById('product-category-filter');
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                sel.appendChild(opt);
            });
        })
        .catch(() => {})
        .finally(() => loadProducts());
}

let _allProducts = [];

function loadProducts() {
    const container = document.getElementById('products-table-container');
    ApiService.getAllProducts()
        .then(products => {
            _allProducts = products;
            renderProductsTable(products);
        })
        .catch(err => {
            container.innerHTML = `<div class="alert alert-danger m-3">
                <strong>Failed to load products:</strong> ${err.message}
                <button class="btn btn-sm btn-primary ms-3" onclick="loadProducts()">Retry</button>
            </div>`;
        });
}

function applyProductFilters() {
    const search   = document.getElementById('product-search').value.toLowerCase();
    const catId    = document.getElementById('product-category-filter').value;
    const status   = document.getElementById('product-status-filter').value;

    let filtered = _allProducts;
    if (search)  filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search));
    if (catId)   filtered = filtered.filter(p => String(p.categoryId) === catId);
    if (status !== '') filtered = filtered.filter(p => String(p.active) === status);

    renderProductsTable(filtered);
}

function getCategoryName(id) {
    const cat = _allCategories.find(c => c.id == id);
    return cat ? cat.name : (id ? `#${id}` : '—');
}

function renderProductsTable(products) {
    const container = document.getElementById('products-table-container');
    if (!products || products.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-box-seam"></i><h5>No products found</h5><p>Try adjusting your filters or add a new product.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',          title: 'ID',          width: '6%' },
        { field: 'name',        title: 'Name',         render: (v) => `<strong>${v || ''}</strong>` },
        { field: 'description', title: 'Description',  render: (v) => v && v.length > 60 ? v.substring(0, 60) + '…' : (v || '—') },
        { field: 'unitPrice',   title: 'Unit Price',   width: '10%', render: (v) => v != null ? `<strong>$${parseFloat(v).toFixed(2)}</strong>` : '—' },
        { field: 'categoryId',  title: 'Category',     width: '13%', render: (v) => `<span class="badge bg-secondary">${getCategoryName(v)}</span>` },
        { field: 'minStockThreshold', title: 'Min Stock', width: '10%', render: (v) => v != null ? v : '—' },
        { field: 'active',      title: 'Status',       width: '9%',  render: (v) => v ? `<span class="badge-active">Active</span>` : `<span class="badge-inactive">Inactive</span>` }
    ];

    const table = createTable(products, {
        columns,
        onView:   (id, item) => showProductDetailsModal(item),
        onEdit:   (id, item) => showProductModal(item),
        onDelete: (id, item) => confirmAction(`Delete product "${item.name}"?`)
            .then(ok => { if (ok) ApiService.deleteProduct(id).then(() => { showSuccess('Product deleted'); loadProducts(); }).catch(e => showError(e.message)); })
    });

    container.innerHTML = '';
    container.appendChild(table);
}

function showProductDetailsModal(product) {
    const catName = getCategoryName(product.categoryId);
    const content = `
        <div class="row">
            <div class="col-md-6">
                <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value">${product.id}</span></div>
                <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value"><strong>${product.name}</strong></span></div>
                <div class="detail-row"><span class="detail-label">Unit Price</span><span class="detail-value">$${product.unitPrice != null ? parseFloat(product.unitPrice).toFixed(2) : '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${catName}</span></div>
            </div>
            <div class="col-md-6">
                <div class="detail-row"><span class="detail-label">Min Stock</span><span class="detail-value">${product.minStockThreshold ?? '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${product.active ? '<span class="badge-active">Active</span>' : '<span class="badge-inactive">Inactive</span>'}</span></div>
            </div>
        </div>
        <div class="mt-3">
            <span class="detail-label">Description</span>
            <p class="mt-1 mb-0" style="font-size:0.88rem;color:#374151;">${product.description || '<em class="text-muted">No description</em>'}</p>
        </div>
    `;
    const modal = createModal({
        id: 'product-details-modal', title: `Product: ${product.name}`,
        content, size: 'large', footer: true,
        primaryButton: 'Edit', secondaryButton: 'Close',
        onPrimary: () => { modal.hide(); showProductModal(product); }
    });
    modal.show();
}

function showProductModal(product) {
    const isEdit = product != null;
    const categoryOptions = _allCategories.map(c => ({ value: c.id, label: c.name }));

    const fields = [
        { id: 'name',              label: 'Product Name',     type: 'text',   required: true, placeholder: 'Enter product name' },
        { id: 'description',       label: 'Description',      type: 'textarea', rows: 3, placeholder: 'Enter description' },
        { id: 'unitPrice',         label: 'Unit Price ($)',    type: 'number', required: true, placeholder: '0.00', attributes: { step: '0.01', min: '0' } },
        { id: 'categoryId',        label: 'Category',         type: 'select', options: [{ value: '', label: '— Select category —' }, ...categoryOptions] },
        { id: 'minStockThreshold', label: 'Min Stock Threshold', type: 'number', placeholder: 'e.g. 10', attributes: { min: '0' } },
        { id: 'active',            label: 'Status',           type: 'checkbox', checkboxLabel: 'Active' }
    ];

    const form = createForm(fields, {
        id: 'product-form',
        submitLabel: isEdit ? 'Save Changes' : 'Create Product',
        showCancel: false,
        initialValues: isEdit ? { ...product } : { active: true },
        onSubmit: (data) => {
            data.unitPrice = parseFloat(data.unitPrice) || null;
            data.minStockThreshold = data.minStockThreshold ? parseInt(data.minStockThreshold) : null;
            data.categoryId = data.categoryId ? parseInt(data.categoryId) : null;
            const action = isEdit
                ? ApiService.updateProduct(product.id, data)
                : ApiService.createProduct(data);
            action
                .then(() => { modal.hide(); showSuccess(isEdit ? 'Product updated!' : 'Product created!'); loadProducts(); })
                .catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'product-form-modal',
        title: isEdit ? `Edit Product: ${product.name}` : 'New Product',
        content: form, size: 'large', footer: false
    });
    modal.show();
}