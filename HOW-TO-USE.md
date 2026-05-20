## Using the Example Implementation

The project includes a complete working example that demonstrates how to use all the components with a mock API:

1. Navigate to the "Example" page from the menu
2. Explore the Product Catalog implementation with:
   - Dashboard with statistics
   - Category visualization
   - Product table with custom rendering
   - Rating charts
   - CRUD operations (create, view, edit, delete products)

This example works without a real backend because it uses the mock API service in the `example/mock-api.js` file. You can use it as a reference for implementing your own pages.

### Removing the Example

When you're ready to implement your own application:

1. Remove the "Example" link from the navigation in `index.html`
2. Remove the script tags for `mock-api.js` and `example.js` from `index.html`
3. Remove the `case 'example':` routing from `app.js`
4. Delete the entire `example` folder# How to Use This Project

## Project Structure

The project has the following structure:

```
/
├── index.html              # Main page
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── app.js              # Application initialization
│   ├── api.js              # API communication service
│   ├── components/         # Reusable components
│   │   ├── table.js        # Table component
│   │   ├── form.js         # Form component
│   │   └── modal.js        # Modal dialog component
│   └── pages/              # Page controllers
│       ├── home.js         # Home page
│       ├── list.js         # List view
│       ├── details.js      # Details view
│       └── edit.js         # Edit/Create view
├── example/                # Example implementations (can be removed)
│   ├── mock-api.js         # Mock API service with sample data
│   ├── example.js          # Example page implementation
│   └── README.md           # Documentation for example module
├── .gitignore              # Files ignored by git
└── README.md               # Project documentation
```

## Getting Started

1. Clone this repository:
   ```
   git clone <repository-url>
   ```

2. Open the `index.html` file in your browser or use a local server.

3. Explore the Example page (click on "Example" in the navigation) to see a complete implementation with mock data.

4. When ready to connect to your backend, configure the API endpoint in the `js/api.js` file to point to your Spring backend:
   ```javascript
   const API_CONFIG = {
       baseUrl: 'http://localhost:8080/api', // Change to your backend URL
       endpoints: {
           items: '/items' // Change to your endpoint
       }
   };
   ```

## Customizing the Project for Your Needs

### 1. Changing the Entity

1. Edit the methods in `api.js` to match your API structure.
2. Adjust the form fields in `edit.js` to correspond to your entity structure.
3. Update the table columns in `list.js`.
4. Update the displayed fields in `details.js`.

### 2. Adding New Pages

1. Create a new JavaScript file in the `js/pages/` folder.
2. Add a new rendering function in the style:
   ```javascript
   function renderMyNewPage() {
       const appContainer = document.getElementById('app-container');
       appContainer.innerHTML = `
           <!-- Page content -->
       `;
       
       // Add event handlers
   }
   ```
3. Add a new route to the `renderCurrentRoute()` function in `app.js`:
   ```javascript
   switch (appState.currentRoute) {
       // ...
       case 'my-new-page':
           renderMyNewPage();
           break;
       // ...
   }
   ```
4. Add a link to the new page in the navigation or on another page:
   ```html
   <a class="nav-link" href="#" data-route="my-new-page">My New Page</a>
   ```

### 3. Customizing the Appearance

1. Edit `css/styles.css` to customize the look and feel.
2. Bootstrap 5 is used as the main CSS library, so you can use Bootstrap classes.

## Project Features

### Navigation

The application uses a simple navigation system with the `navigateTo()` function:

```javascript
// Navigate to the list page
navigateTo('list');

// Navigate to the details page with an ID parameter
navigateTo('details', { id: 123 });
```

### API Communication

The API service allows performing CRUD operations:

```javascript
// Get all items
ApiService.getAllItems()
    .then(items => {
        // Handle retrieved items
    })
    .catch(error => {
        // Handle error
    });

// Get a single item
ApiService.getItemById(id)
    .then(item => {
        // Handle retrieved item
    });

// Create a new item
ApiService.createItem(itemData)
    .then(createdItem => {
        // Handle created item
    });

// Update an item
ApiService.updateItem(id, itemData)
    .then(updatedItem => {
        // Handle updated item
    });

// Delete an item
ApiService.deleteItem(id)
    .then(() => {
        // Handle after deletion
    });
```

### UI Components

The project includes ready-to-use components:

#### Table

```javascript
const table = createTable(data, {
    columns: [
        { field: 'id', title: 'ID' },
        { field: 'name', title: 'Name' },
        // More columns...
    ],
    onView: (id) => {
        navigateTo('details', { id });
    },
    onEdit: (id) => {
        navigateTo('edit', { id });
    },
    onDelete: (id) => {
        // Handle deletion
    }
});

container.appendChild(table);
```

#### Form

```javascript
const form = createForm([
    {
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true
    },
    {
        id: 'description',
        label: 'Description',
        type: 'textarea'
    }
    // More fields...
], {
    initialValues: item, // Existing object or null
    onSubmit: (formData) => {
        // Handle form submission
    }
});

container.appendChild(form);
```

#### Modal

```javascript
const modal = createModal({
    title: 'Confirmation',
    content: 'Are you sure you want to delete this item?',
    onPrimary: () => {
        // Handle primary button click
    }
});

modal.show(); // Display the modal
```

## Tips

1. Start by understanding the project structure.
2. Study the example implementation to see how everything works together.
3. Adjust the `API_CONFIG` in `js/api.js` to your backend.
4. Modify the form fields, table columns, and details view to match your entity.
5. Add your own styles to `css/styles.css`.
6. Test the API communication, ensuring your backend returns appropriate data.
7. In case of problems, check the browser console (F12) to see errors.
8. Remember that the project is intentionally simple so it can be easily customized and extended.