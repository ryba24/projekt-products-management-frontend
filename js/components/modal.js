/**
 * Modal Component
 * Creates reusable modal dialogs
 */

/**
 * Create a modal dialog
 * @param {Object} options - Modal options
 * @returns {Object} - Modal control methods
 */
function createModal(options) {
    const defaultOptions = {
        id: 'dynamic-modal',
        title: 'Modal Title',
        content: '',
        size: 'medium', // small, medium, large
        backdrop: true,
        closeButton: true,
        footer: true,
        primaryButton: 'Save',
        secondaryButton: 'Cancel',
        onPrimary: null,
        onSecondary: null,
        onClose: null
    };

    // Merge default options with provided options
    const modalOptions = { ...defaultOptions, ...options };

    // Check if modal already exists
    let modalElement = document.getElementById(modalOptions.id);

    // Remove existing modal if it exists
    if (modalElement) {
        modalElement.remove();
    }

    // Create modal element
    modalElement = document.createElement('div');
    modalElement.id = modalOptions.id;
    modalElement.className = 'modal fade';
    modalElement.tabIndex = -1;
    modalElement.setAttribute('aria-labelledby', `${modalOptions.id}-label`);
    modalElement.setAttribute('aria-hidden', 'true');

    // Set backdrop option
    if (modalOptions.backdrop === false) {
        modalElement.setAttribute('data-bs-backdrop', 'static');
    }

    // Modal dialog
    const modalSizeClass =
        modalOptions.size === 'small' ? 'modal-sm' :
            modalOptions.size === 'large' ? 'modal-lg' : '';

    const modalDialog = document.createElement('div');
    modalDialog.className = `modal-dialog ${modalSizeClass}`;

    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitle = document.createElement('h5');
    modalTitle.className = 'modal-title';
    modalTitle.id = `${modalOptions.id}-label`;
    modalTitle.textContent = modalOptions.title;
    modalHeader.appendChild(modalTitle);

    if (modalOptions.closeButton) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.onclick = () => {
            if (modalOptions.onClose) {
                modalOptions.onClose();
            }
        };
        modalHeader.appendChild(closeButton);
    }

    modalContent.appendChild(modalHeader);

    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';

    // Add content (HTML or element)
    if (typeof modalOptions.content === 'string') {
        modalBody.innerHTML = modalOptions.content;
    } else if (modalOptions.content instanceof HTMLElement) {
        modalBody.appendChild(modalOptions.content);
    }

    modalContent.appendChild(modalBody);

    // Modal footer
    if (modalOptions.footer) {
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';

        // Secondary button (usually Cancel)
        const secondaryButton = document.createElement('button');
        secondaryButton.type = 'button';
        secondaryButton.className = 'btn btn-secondary';
        secondaryButton.setAttribute('data-bs-dismiss', 'modal');
        secondaryButton.textContent = modalOptions.secondaryButton;
        secondaryButton.onclick = () => {
            if (modalOptions.onSecondary) {
                modalOptions.onSecondary();
            }
        };
        modalFooter.appendChild(secondaryButton);

        // Primary button (usually Save/OK)
        const primaryButton = document.createElement('button');
        primaryButton.type = 'button';
        primaryButton.className = 'btn btn-primary';
        primaryButton.textContent = modalOptions.primaryButton;
        primaryButton.onclick = () => {
            if (modalOptions.onPrimary) {
                modalOptions.onPrimary();
            }
        };
        modalFooter.appendChild(primaryButton);

        modalContent.appendChild(modalFooter);
    }

    modalDialog.appendChild(modalContent);
    modalElement.appendChild(modalDialog);

    // Add modal to document
    document.body.appendChild(modalElement);

    // Initialize Bootstrap modal
    const bootstrapModal = new bootstrap.Modal(modalElement);

    // Return modal control methods
    return {
        show: () => bootstrapModal.show(),
        hide: () => bootstrapModal.hide(),
        toggle: () => bootstrapModal.toggle(),
        getElement: () => modalElement,
        setContent: (content) => {
            const modalBody = modalElement.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
                if (typeof content === 'string') {
                    modalBody.innerHTML = content;
                } else if (content instanceof HTMLElement) {
                    modalBody.appendChild(content);
                }
            }
        },
        setTitle: (title) => {
            const modalTitle = modalElement.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = title;
            }
        }
    };
}