/**
 * Details Page Controller
 * Displays detailed information about a specific item
 */

/**
 * Render the details page
 * @param {number} id - Item ID to display
 */
function renderDetailsPage(id) {
    if (!id) {
        showError('Item ID is required');
        navigateTo('list');
        return;
    }

    const appContainer = document.getElementById('app-container');

    // Set initial loading state
    appContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Item Details</h2>
            <div>
                <button class="btn btn-secondary me-2" id="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to List
                </button>
                <button class="btn btn-primary" id="edit-btn">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </div>
        </div>
        
        <div id="item-details-container">
            <div class="text-center my-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading item details...</p>
            </div>
        </div>
    `;

    // Add event listeners to buttons
    document.getElementById('back-btn').addEventListener('click', () => {
        navigateTo('list');
    });

    document.getElementById('edit-btn').addEventListener('click', () => {
        navigateTo('edit', { id });
    });

    // Fetch item details from API
    loadItemDetails(id);
}

/**
 * Load item details from the API
 * @param {number} id - Item ID to load
 */
function loadItemDetails(id) {
    const detailsContainer = document.getElementById('item-details-container');

    ApiService.getItemById(id)
        .then(item => {
            renderItemDetails(item);
        })
        .catch(error => {
            detailsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error Loading Item</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">The item may not exist or there could be a connection issue.</p>
                    <button class="btn btn-primary mt-3" id="retry-details-btn">
                        Retry
                    </button>
                </div>
            `;

            // Add retry button event listener
            document.getElementById('retry-details-btn').addEventListener('click', () => {
                loadItemDetails(id);
            });
        });
}

/**
 * Render the item details
 * @param {Object} item - Item object
 */
function renderItemDetails(item) {
    const detailsContainer = document.getElementById('item-details-container');

    // Create a card with item details
    detailsContainer.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Item #${item.id}</h5>
                <span class="status-badge ${item.active ? 'status-active' : 'status-inactive'}">
                    ${item.active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3 detail-label">Name:</div>
                    <div class="col-md-9">${item.name || '-'}</div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-3 detail-label">Description:</div>
                    <div class="col-md-9">${item.description || '-'}</div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-3 detail-label">Created Date:</div>
                    <div class="col-md-9">${formatDate(item.createdDate) || '-'}</div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-3 detail-label">Last Updated:</div>
                    <div class="col-md-9">${formatDate(item.lastUpdated) || '-'}</div>
                </div>
                
                <!-- Add any additional fields specific to your entity -->
            </div>
            <div class="card-footer d-flex justify-content-end">
                <button class="btn btn-danger me-2" id="delete-btn">
                    <i class="bi bi-trash"></i> Delete
                </button>
                <button class="btn btn-primary" id="edit-details-btn">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </div>
        </div>
    `;

    // Add event listeners to buttons
    document.getElementById('delete-btn').addEventListener('click', () => {
        confirmDeleteItemFromDetails(item.id, item.name);
    });

    document.getElementById('edit-details-btn').addEventListener('click', () => {
        navigateTo('edit', { id: item.id });
    });
}

/**
 * Format a date string
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateString;
    }
}

/**
 * Confirm and handle item deletion from details page
 * @param {number} id - Item ID
 * @param {string} itemName - Item name for confirmation
 */
function confirmDeleteItemFromDetails(id, itemName) {
    confirmAction(`Are you sure you want to delete "${itemName}"?`)
        .then(confirmed => {
            if (confirmed) {
                ApiService.deleteItem(id)
                    .then(() => {
                        showSuccess('Item deleted successfully');
                        navigateTo('list');
                    })
                    .catch(error => {
                        showError(`Failed to delete item: ${error.message}`);
                    });
            }
        });
}