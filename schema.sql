CREATE DATABASE IF NOT EXISTS project_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE project_management_db;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  reorder_level INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the sample records only when the table is empty.
INSERT INTO products (project_name, category, price, quantity, reorder_level)
SELECT * FROM (
  SELECT 'Laptop' AS project_name, 'Electronics' AS category, 45000.00 AS price, 10 AS quantity, 3 AS reorder_level
  UNION ALL SELECT 'Keyboard', 'Accessories', 800.00, 20, 5
  UNION ALL SELECT 'Mouse', 'Accessories', 500.00, 4, 5
  UNION ALL SELECT 'Monitor', 'Electronics', 12000.00, 8, 2
  UNION ALL SELECT 'Office Chair', 'Furniture', 5000.00, 2, 3
) AS sample
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);