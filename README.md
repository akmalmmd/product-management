# Project Management System

A responsive product-inventory dashboard built with HTML5, CSS3, JavaScript, Node.js, Express.js and MySQL.

## Features

- Create, read, update and delete products.
- Search by product name or category and filter by category.
- Dashboard statistics: products, categories, total units and low-stock count.
- Stock value calculated as `price × quantity`.
- Reorder alerts when `quantity <= reorder_level`.
- MySQL connection pool using `mysql2` and credentials stored in `backend/.env`.

## Requirements

- Node.js 18 or newer (LTS recommended).
- MySQL Server 8.x (or compatible MySQL server).
- MySQL Workbench (for running and inspecting SQL).

## 1. Create the database in MySQL Workbench

1. Open MySQL Workbench.
2. Click your local MySQL connection and sign in.
3. Choose **File → Open SQL Script** and select `database/schema.sql` from this project.
4. Click the lightning-bolt Execute button.
5. In the SCHEMAS panel, click Refresh. Expand `project_management_db` → **Tables** → `products`.
6. Right-click `products` → **Select Rows - Limit 1000**, or run:

```sql
USE project_management_db;
DESCRIBE products;
SELECT * FROM products;
```

The script creates the database and table and inserts five sample records if the table is empty. It is safe to execute again without duplicating the sample set when the table already contains records.

## 2. Configure the backend

Open a terminal in the project folder, then:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your environment file by copying `backend/.env.example` to `backend/.env`.

Windows Command Prompt:

```bat
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Open `backend/.env` and enter your own MySQL username and password. For example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=project_management_db
PORT=3000
```

Do not add quotation marks unless they are part of your password. Never share your `.env` file or commit it to a public repository.

## 3. Start the application

Make sure MySQL Server is running. From the `backend` folder run:

```bash
npm start
```

A successful start prints messages similar to:

```text
MySQL database connection successful.
Project Management System running at http://localhost:3000
```

Open **http://localhost:3000** in Chrome, Edge or Firefox. The Express server serves the frontend and API from the same origin; do not open `index.html` directly from File Explorer.

## 4. Verify the Node.js ↔ MySQL connection

While the server is running, open this URL:

`http://localhost:3000/api/health`

Expected response:

```json
{"status":"ok","database":"connected"}
```

The dashboard sidebar should also say **Connected to MySQL**. If the server cannot start, verify the MySQL service is running, database exists, port is correct, and credentials in `backend/.env` are correct.

## 5. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Add a product |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/health` | Database connection check |

Example POST body:

```json
{
  "project_name": "Webcam",
  "category": "Electronics",
  "price": 2500,
  "quantity": 6,
  "reorder_level": 2
}
```

## 6. Test CRUD and inventory features

1. Add a product using **Add product**.
2. Confirm it appears in the table and in MySQL Workbench with `SELECT * FROM products;`.
3. Click **Edit**, change a field and save. Confirm the database row changes.
4. Click **Delete** and confirm. Confirm the row is removed in Workbench.
5. Search using the search box and use the category dropdown.
6. Set a product quantity to the same as or lower than its reorder level. Its status should show **Reorder** and it should appear in the dashboard alerts.
7. Check stock value: price multiplied by quantity.

## Project structure

```text
project-management-system/
├── database/
│   └── schema.sql
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── routes/
│   │   └── productRoutes.js
│   ├── .env.example
│   ├── db.js
│   ├── package.json
│   └── server.js
└── README.md
```

## Troubleshooting

- **Access denied for user:** check `DB_USER` and `DB_PASSWORD` in `backend/.env`.
- **ECONNREFUSED:** start MySQL Server and verify `DB_HOST` and `DB_PORT`.
- **Unknown database:** execute `database/schema.sql` in Workbench.
- **Table doesn't exist:** check that `USE project_management_db;` and the `CREATE TABLE` statement ran successfully.
- **Port 3000 already in use:** set another port such as `PORT=3001` in `.env`, restart the server, and open `http://localhost:3001`.
- **npm is not recognized:** install Node.js LTS, reopen the terminal, and verify with `node -v` and `npm -v`.

## Notes

The application stores inventory records in MySQL. Search and category filtering are performed in the browser using the records returned by the API. All database writes use parameterized SQL queries.
