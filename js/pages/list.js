/**
 * List Page Controller
 * Displays a list of items from the API
 */

/**
 * Render the list page
 */
function renderListPage() {
    const appContainer = document.getElementById('app-container');

    // Set initial loading state
    appContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Items</h2>
            <button class="btn btn-success" id="create-new-btn">
                <i class="bi bi-plus-circle"></i> Create New
            </button>
        </div>
        
        <div id="items-table-container">
            <div class="text-center my-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading items...</p>
            </div>
        </div>
    `;

    // Add event listener to create button
    document.getElementById('create-new-btn').addEventListener('click', () => {
        navigateTo('create');
    });

    // Fetch items from API
    loadItems();
}

/**
 * Load items from the API
 */
function loadItems() {
    const tableContainer = document.getElementById('items-table-container');

    ApiService.getAllItems()
        .then(items => {
            renderItemsTable(items);
        })
        .catch(error => {
            tableContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error Loading Items</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Please check your API configuration and try again.</p>
                    <button class="btn btn-primary mt-3" id="retry-load-btn">
                        Retry
                    </button>
                </div>
            `;

            // Add retry button event listener
            document.getElementById('retry-load-btn').addEventListener('click', () => {
                loadItems();
            });
        });
}

/**
 * Render the items table
 * @param {Object[]} items - Array of item objects
 */
function renderItemsTable(items) {
    const tableContainer = document.getElementById('items-table-container');

    // Define table columns
    const columns = [
        {
            field: 'id',
            title: 'ID',
            width: '10%'
        },
        {
            field: 'name',
            title: 'Name',
            render: (value, item) => {
                return `<strong>${value}</strong>`;
            }
        },
        {
            field: 'description',
            title: 'Description',
            render: (value) => {
                // Truncate long descriptions
                if (value && value.length > 100) {
                    return value.substring(0, 100) + '...';
                }
                return value || '';
            }
        },
        {
            field: 'active',
            title: 'Status',
            width: '15%',
            render: (value) => {
                return value ?
                    '<span class="status-badge status-active">Active</span>' :
                    '<span class="status-badge status-inactive">Inactive</span>';
            }
        }
    ];

    // Create table with items
    const table = createTable(items, {
        columns: columns,
        onView: (id) => {
            navigateTo('details', { id });
        },
        onEdit: (id) => {
            navigateTo('edit', { id });
        },
        onDelete: (id, item) => {
            confirmDeleteItem(id, item.name);
        }
    });

    // Clear loading indicator and show table
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // Add empty state if no items
    if (items.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center my-5';
        emptyState.innerHTML = `
            <div class="mb-4">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            </div>
            <h4>No Items Found</h4>
            <p>There are no items to display. Get started by creating a new item.</p>
            <button class="btn btn-primary" id="create-empty-btn">
                Create First Item
            </button>
        `;

        tableContainer.appendChild(emptyState);

        // Add event listener to create button
        document.getElementById('create-empty-btn').addEventListener('click', () => {
            navigateTo('create');
        });
    }
}

/**
 * Confirm and handle item deletion
 * @param {number} id - Item ID
 * @param {string} itemName - Item name for confirmation
 */
function confirmDeleteItem(id, itemName) {
    confirmAction(`Are you sure you want to delete "${itemName}"?`)
        .then(confirmed => {
            if (confirmed) {
                ApiService.deleteItem(id)
                    .then(() => {
                        showSuccess('Item deleted successfully');
                        loadItems(); // Refresh the list
                    })
                    .catch(error => {
                        showError(`Failed to delete item: ${error.message}`);
                    });
            }
        });
}