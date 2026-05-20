/**
 * Table Component
 * Creates a reusable data table with sorting and actions
 */

/**
 * Generate a table element with data and options
 * @param {Object[]} data - Array of data objects
 * @param {Object} options - Table configuration options
 * @returns {HTMLElement} - Table element
 */
function createTable(data, options) {
    const defaultOptions = {
        columns: [],
        tableClass: 'table table-striped table-hover',
        idField: 'id',
        actions: {
            view: true,
            edit: true,
            delete: true
        },
        onView: null,
        onEdit: null,
        onDelete: null
    };

    // Merge default options with provided options
    const tableOptions = { ...defaultOptions, ...options };

    // Create table element
    const table = document.createElement('table');
    table.className = tableOptions.tableClass;

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Add column headers
    tableOptions.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        if (column.width) {
            th.style.width = column.width;
        }
        headerRow.appendChild(th);
    });

    // Add actions header if any actions are enabled
    if (tableOptions.actions.view || tableOptions.actions.edit || tableOptions.actions.delete) {
        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Actions';
        actionsHeader.className = 'table-actions';
        headerRow.appendChild(actionsHeader);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    // Add data rows
    data.forEach(item => {
        const row = document.createElement('tr');

        // Add data cells
        tableOptions.columns.forEach(column => {
            const td = document.createElement('td');

            // Check if custom renderer exists
            if (column.render) {
                td.innerHTML = column.render(item[column.field], item);
            } else {
                td.textContent = item[column.field] || '';
            }

            row.appendChild(td);
        });

        // Add action buttons if enabled
        if (tableOptions.actions.view || tableOptions.actions.edit || tableOptions.actions.delete) {
            const actionCell = document.createElement('td');
            actionCell.className = 'd-flex gap-2';

            // View button
            if (tableOptions.actions.view) {
                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn btn-sm btn-info';
                viewBtn.innerHTML = '<i class="bi bi-eye"></i> View';
                viewBtn.onclick = () => {
                    if (tableOptions.onView) {
                        tableOptions.onView(item[tableOptions.idField], item);
                    }
                };
                actionCell.appendChild(viewBtn);
            }

            // Edit button
            if (tableOptions.actions.edit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm btn-warning';
                editBtn.innerHTML = '<i class="bi bi-pencil"></i> Edit';
                editBtn.onclick = () => {
                    if (tableOptions.onEdit) {
                        tableOptions.onEdit(item[tableOptions.idField], item);
                    }
                };
                actionCell.appendChild(editBtn);
            }

            // Delete button
            if (tableOptions.actions.delete) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
                deleteBtn.onclick = () => {
                    if (tableOptions.onDelete) {
                        tableOptions.onDelete(item[tableOptions.idField], item);
                    }
                };
                actionCell.appendChild(deleteBtn);
            }

            row.appendChild(actionCell);
        }

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Create table container with options
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    tableContainer.appendChild(table);

    // Add empty state message if no data
    if (data.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center my-4 text-muted';
        emptyState.innerHTML = '<p>No data available</p>';
        tableContainer.appendChild(emptyState);
    }

    return tableContainer;
}