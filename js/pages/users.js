/**
 * Users Page
 */
let _users = [];

function renderUsersPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">
                <span class="title-icon"><i class="bi bi-people"></i></span>
                Users
            </h1>
            <button class="btn btn-amber" id="create-user-btn">
                <i class="bi bi-person-plus me-1"></i>New User
            </button>
        </div>

        <!-- Filter bar -->
        <div class="card mb-3">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-3">
                        <select id="usr-role-filter" class="form-select form-select-sm">
                            <option value="">All roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="STAFF">Staff</option>
                            <option value="CUSTOMER">Customer</option>
                            <option value="GUEST">Guest</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="usr-search" class="form-control form-control-sm" placeholder="Search by name or email…">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-primary w-100" id="usr-filter-btn">
                            <i class="bi bi-funnel me-1"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><i class="bi bi-table me-2"></i>User Records</div>
            <div class="card-body p-0" id="users-table-container">
                <div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2 text-muted">Loading users…</p></div>
            </div>
        </div>
    `;

    document.getElementById('create-user-btn').addEventListener('click', () => showUserModal());
    document.getElementById('usr-filter-btn').addEventListener('click', applyUserFilters);
    document.getElementById('usr-search').addEventListener('keydown', e => { if (e.key === 'Enter') applyUserFilters(); });

    ApiService.getAllUsers()
        .then(users => {
            _users = users;
            renderUsersTable(_users);
        })
        .catch(err => {
            document.getElementById('users-table-container').innerHTML =
                `<div class="alert alert-danger m-3"><strong>Failed to load users:</strong> ${err.message}
                <button class="btn btn-sm btn-primary ms-3" onclick="renderUsersPage()">Retry</button></div>`;
        });
}

function applyUserFilters() {
    const role   = document.getElementById('usr-role-filter').value;
    const search = document.getElementById('usr-search').value.toLowerCase().trim();
    let filtered = _users;
    if (role)   filtered = filtered.filter(u => u.role === role);
    if (search) filtered = filtered.filter(u =>
        (u.firstName || '').toLowerCase().includes(search) ||
        (u.lastName  || '').toLowerCase().includes(search) ||
        (u.email     || '').toLowerCase().includes(search)
    );
    renderUsersTable(filtered);
}

function roleBadge(role) {
    const map = {
        ADMIN:    'danger',
        MANAGER:  'primary',
        STAFF:    'info',
        CUSTOMER: 'success',
        GUEST:    'secondary'
    };
    return `<span class="badge bg-${map[role] || 'secondary'}">${role || '—'}</span>`;
}

function renderUsersTable(users) {
    const container = document.getElementById('users-table-container');
    if (!users || users.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><h5>No users found</h5><p>Create the first user to get started.</p></div>`;
        return;
    }

    const columns = [
        { field: 'id',        title: 'ID',         width: '6%' },
        { field: 'firstName', title: 'Name',        render: (v, item) => {
            const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || '—';
            return `<strong>${name}</strong>`;
        }},
        { field: 'email',     title: 'Email',       render: v => v ? `<a href="mailto:${v}" class="text-decoration-none">${v}</a>` : '—' },
        { field: 'role',      title: 'Role',        width: '14%', render: v => roleBadge(v) }
    ];

    const table = createTable(users, {
        columns,
        onView:   (id, item) => showUserDetailsModal(item),
        onEdit:   (id, item) => showUserModal(item),
        onDelete: async (id) => {
            const ok = await confirmAction('Delete this user? This cannot be undone.');
            if (!ok) return;
            ApiService.deleteUser(id)
                .then(() => {
                    _users = _users.filter(u => u.id !== id);
                    renderUsersTable(_users);
                    showSuccess('User deleted.');
                })
                .catch(e => showError(e.message));
        },
        actions: { view: true, edit: true, delete: true }
    });
    container.innerHTML = '';
    container.appendChild(table);
}

function showUserDetailsModal(user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
    const content = `
        <div class="text-center mb-3">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--navy);color:#fff;
                        display:inline-flex;align-items:center;justify-content:center;font-size:1.6rem;">
                <i class="bi bi-person"></i>
            </div>
            <h5 class="mt-2 mb-0" style="font-family:'Syne',sans-serif;">${name}</h5>
            <div class="mt-1">${roleBadge(user.role)}</div>
        </div>
        <div class="row">
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">User ID</span><span class="detail-value">${user.id}</span></div>
                <div class="detail-row"><span class="detail-label">First Name</span><span class="detail-value">${user.firstName || '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Last Name</span><span class="detail-value">${user.lastName || '—'}</span></div>
            </div>
            <div class="col-6">
                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${user.email ? `<a href="mailto:${user.email}">${user.email}</a>` : '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Role</span><span class="detail-value">${roleBadge(user.role)}</span></div>
            </div>
        </div>
    `;
    const modal = createModal({
        id: 'user-details-modal',
        title: `User #${user.id}`,
        content, size: 'medium', footer: true,
        primaryButton: 'Close',
        onPrimary: () => modal.hide()
    });
    modal.show();
}

function showUserModal(existing) {
    const isEdit = !!existing;
    const fields = [
        { id: 'firstName', label: 'First Name', type: 'text',  required: true,  placeholder: 'e.g. Jan' },
        { id: 'lastName',  label: 'Last Name',  type: 'text',  required: true,  placeholder: 'e.g. Kowalski' },
        { id: 'email',     label: 'Email',      type: 'email', required: true,  placeholder: 'e.g. jan@example.com' },
        { id: 'role',      label: 'Role',       type: 'select', required: true,
          options: [
              { value: 'ADMIN',    label: 'Admin' },
              { value: 'MANAGER',  label: 'Manager' },
              { value: 'STAFF',    label: 'Staff' },
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'GUEST',    label: 'Guest' }
          ]
        }
    ];

    const form = createForm(fields, {
        id: 'user-form',
        submitLabel: isEdit ? 'Save Changes' : 'Create User',
        showCancel: false,
        initialValues: existing ? {
            firstName: existing.firstName,
            lastName:  existing.lastName,
            email:     existing.email,
            role:      existing.role
        } : {},
        onSubmit: (data) => {
            const call = isEdit
                ? ApiService.updateUser(existing.id, data)
                : ApiService.createUser(data);
            call.then(result => {
                modal.hide();
                showSuccess(isEdit ? 'User updated!' : 'User created!');
                if (isEdit) {
                    const idx = _users.findIndex(u => u.id === existing.id);
                    if (idx !== -1) _users[idx] = result;
                } else {
                    _users.push(result);
                }
                renderUsersTable(_users);
            }).catch(e => showError(e.message));
        }
    });

    const modal = createModal({
        id: 'user-form-modal',
        title: isEdit ? `Edit User #${existing.id}` : 'New User',
        content: form, size: 'medium', footer: false
    });
    modal.show();
}
