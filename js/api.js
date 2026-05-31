/**
 * API Service – Products Management System
 * Base URL: http://localhost:8080/api
 */

const API_CONFIG = {
    baseUrl: 'http://localhost:8765/api',
    endpoints: {
        products:   '/products',
        categories: '/categories',
        warehouses: '/warehouses',
        inventory:  '/inventory',
        transfers:  '/transfers',
        orders:     '/orders',
        invoices:   '/invoices',
        users:      '/users'
    }
};

const ApiService = {
    get: async function(endpoint) {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response.json();
    },

    post: async function(endpoint, data) {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response.json();
    },

    put: async function(endpoint, data) {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response.json();
    },

    delete: async function(endpoint) {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return true;
    },

    // ── Products ──
    getAllProducts:    function() { return this.get(API_CONFIG.endpoints.products); },
    getProductById:    function(id) { return this.get(`${API_CONFIG.endpoints.products}/${id}`); },
    createProduct:     function(data) { return this.post(API_CONFIG.endpoints.products, data); },
    updateProduct:     function(id, data) { return this.put(`${API_CONFIG.endpoints.products}/${id}`, data); },
    deleteProduct:     function(id) { return this.delete(`${API_CONFIG.endpoints.products}/${id}`); },

    // ── Categories ──
    getAllCategories:  function() { return this.get(API_CONFIG.endpoints.categories); },
    createCategory:   function(data) { return this.post(API_CONFIG.endpoints.categories, data); },
    updateCategory:   function(id, data) { return this.put(`${API_CONFIG.endpoints.categories}/${id}`, data); },
    deleteCategory:   function(id) { return this.delete(`${API_CONFIG.endpoints.categories}/${id}`); },

    // ── Warehouses ──
    getAllWarehouses:  function() { return this.get(API_CONFIG.endpoints.warehouses); },
    createWarehouse:  function(data) { return this.post(API_CONFIG.endpoints.warehouses, data); },
    updateWarehouse:  function(id, data) { return this.put(`${API_CONFIG.endpoints.warehouses}/${id}`, data); },
    deleteWarehouse:  function(id) { return this.delete(`${API_CONFIG.endpoints.warehouses}/${id}`); },

    // ── Inventory ──
    getAllInventory:   function() { return this.get(API_CONFIG.endpoints.inventory); },
    createInventory:  function(data) { return this.post(API_CONFIG.endpoints.inventory, data); },
    updateInventory:  function(id, data) { return this.put(`${API_CONFIG.endpoints.inventory}/${id}`, data); },
    deleteInventory:  function(id) { return this.delete(`${API_CONFIG.endpoints.inventory}/${id}`); },

    // ── Stock Transfers ──
    getAllTransfers:        function() { return this.get(API_CONFIG.endpoints.transfers); },
    createTransfer:        function(data) { return this.post(API_CONFIG.endpoints.transfers, data); },
    deleteTransfer:        function(id) { return this.delete(`${API_CONFIG.endpoints.transfers}/${id}`); },
    updateTransferStatus:  function(id, status) {
        return fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transfers}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
    },

    // ── Orders ──
    getAllOrders:      function() { return this.get(API_CONFIG.endpoints.orders); },
    getOrderById:      function(id) { return this.get(`${API_CONFIG.endpoints.orders}/${id}`); },
    createOrder:       function(data) { return this.post(API_CONFIG.endpoints.orders, data); },
    updateOrder:       function(id, data) { return this.put(`${API_CONFIG.endpoints.orders}/${id}`, data); },
    deleteOrder:       function(id) { return this.delete(`${API_CONFIG.endpoints.orders}/${id}`); },

    // ── Invoices ──
    getAllInvoices:    function() { return this.get(API_CONFIG.endpoints.invoices); },
    getInvoiceById:   function(id) { return this.get(`${API_CONFIG.endpoints.invoices}/${id}`); },
    createInvoice:    function(data) { return this.post(API_CONFIG.endpoints.invoices, data); },
    updateInvoice:    function(id, data) { return this.put(`${API_CONFIG.endpoints.invoices}/${id}`, data); },
    deleteInvoice:    function(id) { return this.delete(`${API_CONFIG.endpoints.invoices}/${id}`); },

    // ── Users ──
    getAllUsers:       function() { return this.get(API_CONFIG.endpoints.users); },
    getUserById:       function(id) { return this.get(`${API_CONFIG.endpoints.users}/${id}`); },
    createUser:        function(data) { return this.post(API_CONFIG.endpoints.users, data); },
    updateUser:        function(id, data) { return this.put(`${API_CONFIG.endpoints.users}/${id}`, data); },
    deleteUser:        function(id) { return this.delete(`${API_CONFIG.endpoints.users}/${id}`); },
};