/**
 * Home Page – dashboard with stats and quick actions
 */
function renderHomePage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="row g-3 mb-4">
            <div class="col-12">
                <h1 class="page-title mb-0">
                    <span class="title-icon"><i class="bi bi-grid-1x2"></i></span>
                    Dashboard
                </h1>
                <p class="text-muted mt-1" style="font-size:0.9rem;">Overview of your inventory and operations</p>
            </div>
        </div>

        <!-- Stats row -->
        <div class="row g-3 mb-4" id="stats-row">
            <div class="col-6 col-md-3">
                <div class="stat-card navy">
                    <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
                    <div><div class="stat-value" id="stat-products">—</div><div class="stat-label">Products</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card amber">
                    <div class="stat-icon"><i class="bi bi-tags"></i></div>
                    <div><div class="stat-value" id="stat-categories">—</div><div class="stat-label">Categories</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card teal">
                    <div class="stat-icon"><i class="bi bi-building"></i></div>
                    <div><div class="stat-value" id="stat-warehouses">—</div><div class="stat-label">Warehouses</div></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card slate">
                    <div class="stat-icon"><i class="bi bi-arrow-left-right"></i></div>
                    <div><div class="stat-value" id="stat-transfers">—</div><div class="stat-label">Transfers</div></div>
                </div>
            </div>
        </div>

        <!-- Quick actions -->
        <div class="row g-3 mb-4">
            <div class="col-12"><h5 class="fw-bold" style="font-family:'Syne',sans-serif;color:var(--navy);">Quick Actions</h5></div>
            <div class="col-6 col-md-3">
                <div class="quick-action" data-qa="products">
                    <div class="quick-action-icon"><i class="bi bi-box-seam"></i></div>
                    <div class="quick-action-title">Products</div>
                    <div class="quick-action-desc">Browse & manage products</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="quick-action" data-qa="categories">
                    <div class="quick-action-icon"><i class="bi bi-tags"></i></div>
                    <div class="quick-action-title">Categories</div>
                    <div class="quick-action-desc">Manage product categories</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="quick-action" data-qa="warehouses">
                    <div class="quick-action-icon"><i class="bi bi-building"></i></div>
                    <div class="quick-action-title">Warehouses</div>
                    <div class="quick-action-desc">View warehouse locations</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="quick-action" data-qa="inventory">
                    <div class="quick-action-icon"><i class="bi bi-list-check"></i></div>
                    <div class="quick-action-title">Inventory</div>
                    <div class="quick-action-desc">Check stock levels</div>
                </div>
            </div>
        </div>

        <!-- Recent transfers + low stock -->
        <div class="row g-3">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header"><i class="bi bi-arrow-left-right me-2"></i>Recent Transfers</div>
                    <div class="card-body p-0" id="recent-transfers-container">
                        <div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header amber"><i class="bi bi-exclamation-triangle me-2"></i>Low Stock Alerts</div>
                    <div class="card-body p-0" id="low-stock-container">
                        <div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Quick action clicks
    document.querySelectorAll('[data-qa]').forEach(el => {
        el.addEventListener('click', () => navigateTo(el.getAttribute('data-qa')));
    });

    // Load stats
    Promise.allSettled([
        ApiService.getAllProducts(),
        ApiService.getAllCategories(),
        ApiService.getAllWarehouses(),
        ApiService.getAllTransfers(),
        ApiService.getAllInventory()
    ]).then(([products, categories, warehouses, transfers, inventory]) => {
        if (products.status === 'fulfilled')   document.getElementById('stat-products').textContent   = products.value.length;
        if (categories.status === 'fulfilled') document.getElementById('stat-categories').textContent = categories.value.length;
        if (warehouses.status === 'fulfilled') document.getElementById('stat-warehouses').textContent = warehouses.value.length;
        if (transfers.status === 'fulfilled')  document.getElementById('stat-transfers').textContent  = transfers.value.length;

        // Recent transfers
        const rtContainer = document.getElementById('recent-transfers-container');
        if (transfers.status === 'fulfilled' && transfers.value.length > 0) {
            const recent = transfers.value.slice(-5).reverse();
            rtContainer.innerHTML = `<ul class="list-group list-group-flush">` +
                recent.map(t => `
                    <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                        <span style="font-size:0.85rem"><i class="bi bi-arrow-right text-muted me-1"></i>
                        Warehouse ${t.fromWarehouseId} → ${t.toWarehouseId}</span>
                        <span class="transfer-status transfer-${t.status || 'PENDING'}">${t.status || 'PENDING'}</span>
                    </li>`).join('') + `</ul>`;
        } else {
            rtContainer.innerHTML = `<div class="empty-state py-4"><i class="bi bi-inbox"></i><p class="mb-0">No transfers yet</p></div>`;
        }

        // Low stock alerts
        const lsContainer = document.getElementById('low-stock-container');
        if (inventory.status === 'fulfilled') {
            const lowStock = inventory.value.filter(i => i.quantity <= (i.reorderThreshold || 5));
            if (lowStock.length > 0) {
                lsContainer.innerHTML = `<ul class="list-group list-group-flush">` +
                    lowStock.slice(0, 5).map(i => `
                        <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                            <span style="font-size:0.85rem"><i class="bi bi-box me-1 text-muted"></i>Product #${i.productId}</span>
                            <span class="low-stock">${i.quantity} units</span>
                        </li>`).join('') + `</ul>`;
            } else {
                lsContainer.innerHTML = `<div class="empty-state py-4"><i class="bi bi-check-circle text-success"></i><p class="mb-0 text-success fw-bold">All stock levels OK</p></div>`;
            }
        } else {
            lsContainer.innerHTML = `<div class="empty-state py-4"><p class="mb-0">Unable to load</p></div>`;
        }
    });
}