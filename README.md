# Cartix 🛒

Cartix is a comprehensive web-based grocery and inventory management system designed to manage a digital catalog of daily household items and FMCG products. The platform includes an admin dashboard to efficiently track and manage diverse product categories, ranging from basic groceries to household cleaning supplies.

## 🚀 Features

*   **Admin Dashboard:** A dedicated interface (`admin.html`) to manage inventory, update stock, and monitor product listings.
*   **Structured Data Modeling:** Robust database architecture using a dedicated `Product.js` model to maintain organized product data.
*   **Diverse Catalog Management:** Easily categorize and manage a wide range of items, including:
    *   **Food & Groceries:** Bread, Besan, Chana Dal, Amul Milk, etc.
    *   **Spices:** Jeera, Hing, Garam Masala, Chilli Powder, etc.
    *   **Beverages:** Horlicks, Bournvita, Glucon-D, etc.
    *   **Household & Cleaning:** Ariel, Dettol, Harpic, Air Fresheners, etc.
*   **Secure Configuration:** Sensitive data and environment variables are securely managed via a `.env` file.

## 🛠️ Tech Stack

*   **Backend Environment:** Node.js
*   **Data Modeling:** Mongoose / Custom Schema (`models/Product.js`)
*   **Frontend:** HTML, CSS, JavaScript (`public/admin.html`)
*   **Package Management:** npm (`package.json`, `package-lock.json`)

## 📂 Project Structure

```text
cartix/
├── models/
│   └── Product.js         # Product data schema/model
├── public/
│   ├── images/            # Directory for product visuals
│   └── admin.html         # Administrator dashboard interface
├── .env                   # Environment variables (Port, DB URI, etc.)
├── .gitignore             # Files to be ignored by Git
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
