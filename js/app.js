/**
 * Main application script – Products Management System
 */

const appState = {
    currentRoute: 'home',
    params: {},
};

const appContainer = document.getElementById('app-container');

function navigateTo(route, params = {}) {
    appState.currentRoute = route;
    appState.params = params;
    renderCurrentRoute();
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-route') === route) link.classList.add('active');
    });
    window.scrollTo(0, 0);
}

function renderCurrentRoute() {
    appContainer.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>`;
    switch (appState.currentRoute) {
        case 'home':       renderHomePage();            break;
        case 'products':   renderProductsPage();        break;
        case 'categories': renderCategoriesPage();      break;
        case 'warehouses': renderWarehousesPage();      break;
        case 'inventory':  renderInventoryPage();       break;
        case 'transfers':  renderTransfersPage();       break;
        case 'orders':     renderOrdersPage();          break;
        case 'invoices':   renderInvoicesPage();        break;
        case 'users':      renderUsersPage();           break;
        // legacy stubs (starter pages no longer used)
        case 'list':       renderProductsPage();        break;
        default:           renderNotFoundPage();
    }
}

function renderNotFoundPage() {
    appContainer.innerHTML = `
        <div class="empty-state mt-5">
            <i class="bi bi-exclamation-triangle"></i>
            <h5>Page Not Found</h5>
            <p>The page you're looking for doesn't exist.</p>
            <button class="btn btn-primary mt-2" onclick="navigateTo('home')">Go Home</button>
        </div>`;
}

function showError(message) {
    Swal.fire({ title: 'Error!', text: message, icon: 'error', confirmButtonText: 'OK', confirmButtonColor: '#0d1b2a' });
}

function showSuccess(message) {
    Swal.fire({ title: 'Success!', text: message, icon: 'success', confirmButtonText: 'OK', confirmButtonColor: '#0d1b2a', timer: 2000, timerProgressBar: true });
}

function confirmAction(message) {
    return Swal.fire({
        title: 'Are you sure?', text: message, icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'Cancel', confirmButtonColor: '#e74c3c', cancelButtonColor: '#6c757d'
    }).then(r => r.isConfirmed);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initApp() {
    document.querySelectorAll('[data-route]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(e.currentTarget.getAttribute('data-route'));
        });
    });
    renderCurrentRoute();
}

document.addEventListener('DOMContentLoaded', initApp);