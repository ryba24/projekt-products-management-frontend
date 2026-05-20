/**
 * API Service – Products Management System
 * Base URL: http://localhost:8080/api
 */

const API_CONFIG = {
    baseUrl: 'http://localhost:8080/api',
    endpoints: {
        products:   '/products',
        categories: '/categories',
        warehouses: '/warehouses',
        inventory:  '/inventory',
        transfers:  '/transfers'
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
    createCategory:    function(data) { return this.post(API_CONFIG.endpoints.categories, data); },

    // ── Warehouses ──
    getAllWarehouses:  function() { return this.get(API_CONFIG.endpoints.warehouses); },
    createWarehouse:   function(data) { return this.post(API_CONFIG.endpoints.warehouses, data); },

    // ── Inventory ──
    getAllInventory:   function() { return this.get(API_CONFIG.endpoints.inventory); },
    createInventory:   function(data) { return this.post(API_CONFIG.endpoints.inventory, data); },

    // ── Stock Transfers ──
    getAllTransfers:   function() { return this.get(API_CONFIG.endpoints.transfers); },
    createTransfer:    function(data) { return this.post(API_CONFIG.endpoints.transfers, data); },
};