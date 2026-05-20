# Web Application Frontend Starter

This is a starter project for the Web Application Development course. It provides a simple frontend implementation that can be connected to your Spring REST API backend.

## Project Structure

```
/
├── index.html              # Main entry point
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── app.js              # Application initialization
│   ├── api.js              # API connection service
│   ├── components/         # Reusable UI components
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
└── assets/                 # Static assets
    └── img/                # Images
```

## Features

- Simple vanilla JavaScript implementation without complex frameworks
- Basic routing system
- API service for communication with backend
- Reusable UI components (tables, forms, modals)
- Bootstrap for styling
- Example implementations for CRUD operations
- **Working example with mock API** for demonstration without backend

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser or use a local server
3. Explore the example implementation (click on "Example" in the navigation) to see the components in action
4. Configure the API endpoint in `js/api.js` to point to your Spring backend when ready

## How to Use

This starter provides implementations for:

- Displaying a list of items from the API
- Viewing details of a specific item
- Creating a new item
- Editing an existing item
- Deleting an item

You should adapt these examples to match your specific data model and API endpoints.

## Libraries Used

- [Bootstrap 5](https://getbootstrap.com/) - For styling
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library
- [SweetAlert2](https://sweetalert2.github.io/) - For better dialogs
- No heavy JavaScript frameworks

## Customization

To adapt this starter to your project:

1. Update the API endpoints in `js/api.js`
2. Modify the data models in the components
3. Adjust the form fields to match your entity structure
4. Update the table columns to display your entity properties
5. Remove the example implementation when no longer needed (see example/README.md)

## Notes

This project is intentionally kept simple to allow easy understanding and customization. It follows basic JavaScript patterns and aims to be accessible to students still learning web development concepts.