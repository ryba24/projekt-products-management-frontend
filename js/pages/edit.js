/**
 * Edit Page Controller
 * Handles creating a new item or editing an existing one
 */

/**
 * Render the edit page
 * @param {number} id - Item ID to edit (null for create mode)
 */
function renderEditPage(id) {
    const appContainer = document.getElementById('app-container');
    const isCreateMode = !id;

    // Set initial page structure
    appContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>${isCreateMode ? 'Create New Item' : 'Edit Item'}</h2>
            <button class="btn btn-secondary" id="back-btn">
                <i class="bi bi-arrow-left"></i> Back
            </button>
        </div>
        
        <div id="edit-form-container">
            ${isCreateMode ? '' : `
                <div class="text-center my-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading item data...</p>
                </div>
            `}
        </div>
    `;

    // Add event listener to back button
    document.getElementById('back-btn').addEventListener('click', () => {
        navigateTo(isCreateMode ? 'list' : 'details', isCreateMode ? {} : { id });
    });

    if (isCreateMode) {
        // Create mode - render empty form
        renderItemForm();
    } else {
        // Edit mode - load existing item first
        loadItemForEdit(id);
    }
}

/**
 * Load item data for editing
 * @param {number} id - Item ID to load
 */
function loadItemForEdit(id) {
    const formContainer = document.getElementById('edit-form-container');

    ApiService.getItemById(id)
        .then(item => {
            renderItemForm(item);
        })
        .catch(error => {
            formContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error Loading Item</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">The item may not exist or there could be a connection issue.</p>
                    <button class="btn btn-primary mt-3" id="retry-load-btn">
                        Retry
                    </button>
                </div>
            `;

            // Add retry button event listener
            document.getElementById('retry-load-btn').addEventListener('click', () => {
                loadItemForEdit(id);
            });
        });
}

/**
 * Render the item form
 * @param {Object} item - Item data for edit mode (null for create mode)
 */
function renderItemForm(item = null) {
    const formContainer = document.getElementById('edit-form-container');
    const isCreateMode = !item;

    // Define form fields
    const fields = [
        {
            id: 'name',
            name: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Enter item name',
            required: true,
            invalidFeedback: 'Name is required'
        },
        {
            id: 'description',
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter item description',
            rows: 4
        },
        {
            id: 'active',
            name: 'active',
            label: 'Status',
            type: 'checkbox',
            checkboxLabel: 'Active'
        }
        // Add more fields specific to your entity
    ];

    // Create the form with initial values
    const form = createForm(fields, {
        id: 'item-form',
        submitLabel: isCreateMode ? 'Create' : 'Save Changes',
        initialValues: item || { active: true },
        onSubmit: (formData) => handleFormSubmit(formData, isCreateMode ? null : item.id),
        onCancel: () => {
            navigateTo(isCreateMode ? 'list' : 'details', isCreateMode ? {} : { id: item.id });
        }
    });

    // Clear loading indicator and show form
    formContainer.innerHTML = '';

    // Create a card to contain the form
    const formCard = document.createElement('div');
    formCard.className = 'card';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.appendChild(form);

    formCard.appendChild(cardBody);
    formContainer.appendChild(formCard);
}

/**
 * Handle form submission
 * @param {Object} formData - Form data
 * @param {number} id - Item ID for edit mode (null for create mode)
 */
function handleFormSubmit(formData, id) {
    const isCreateMode = !id;

    // Process form data if needed
    // For example, convert string values to appropriate types
    if (formData.active === 'on') {
        formData.active = true;
    }

    // Show loading state
    const submitButton = document.querySelector('#item-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${isCreateMode ? 'Creating...' : 'Saving...'}
    `;

    // API call based on mode
    const apiPromise = isCreateMode
        ? ApiService.createItem(formData)
        : ApiService.updateItem(id, formData);

    apiPromise
        .then(savedItem => {
            showSuccess(`Item ${isCreateMode ? 'created' : 'updated'} successfully`);
            navigateTo('details', { id: savedItem.id });
        })
        .catch(error => {
            showError(`Failed to ${isCreateMode ? 'create' : 'update'} item: ${error.message}`);

            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        });
}