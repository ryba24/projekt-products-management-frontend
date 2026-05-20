/**
 * Categories Page
 */
function renderCategoriesPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-tags"></i></span>
                Categories
            </h1>
            <button class="btn btn-amber" id="create-category-btn">
                <i class="bi bi-plus-circle me-1"></i>New Category
            </button>
        </div>
        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>Category List</div>
            <div class="card-body p-0" id="categories-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading categories…</p></div>
            </div>
        </div>
    `;
    document.getElementById('create-category-btn').addEventListener('click', () => showCategoryModal(null));
    loadCategories();
}

function loadCategories() {
    ApiService.getAllCategories()
        .then(cats => renderCategoriesTable(cats))
        .catch(err => {
            document.getElementById('categories-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load:</strong> ${err.message}
                <button class="btn btn-sm btn-primary ms-3" onclick="loadCategories()">Retry</button></div>`;
        });
}

function renderCategoriesTable(categories) {
    const container = document.getElementById('categories-table-container');
    if (!categories || categories.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-tags"></i><h5>No categories yet</h5><p>Create your first category to organize products.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',          title: 'ID',          width: '8%' },
        { field: 'name',        title: 'Name',         render: v => `<strong>${v || ''}</strong>` },
        { field: 'description', title: 'Description',  render: v => v && v.length > 80 ? v.substring(0, 80) + '…' : (v || '—') }
    ];

    const table = createTable(categories, {
        columns,
        actions: { view: false, edit: false, delete: false }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showCategoryModal(category) {
    const isEdit = category != null;
    const fields = [
        { id: 'name',        label: 'Category Name', type: 'text',     required: true, placeholder: 'Enter category name' },
        { id: 'description', label: 'Description',   type: 'textarea', rows: 3,        placeholder: 'Optional description' }
    ];

    const form = createForm(fields, {
        id: 'category-form',
        submitLabel: 'Create Category',
        showCancel: false,
        initialValues: isEdit ? { ...category } : {},
        onSubmit: (data) => {
            ApiService.createCategory(data)
                .then(() => { modal.hide(); showSuccess('Category created!'); loadCategories(); })
                .catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'category-form-modal',
        title: 'New Category',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}