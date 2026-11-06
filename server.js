const express = require('express');
const path = require('path');
require('dotenv').config();
const { pool, testConnection } = require('./db');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:false}));
app.use('/api/products', productRoutes);

app.get('/api/dashboard', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS totalProducts,
        COUNT(DISTINCT category) AS totalCategories,
        COALESCE(SUM(quantity), 0) AS totalQuantity,
        COALESCE(SUM(price * quantity), 0) AS totalStockValue,
        COALESCE(SUM(CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END), 0) AS lowStockProducts
      FROM products
    `);
    const [lowStockItems] = await pool.query(
      'SELECT id, project_name, category, quantity, reorder_level FROM products WHERE quantity <= reorder_level ORDER BY quantity ASC, project_name ASC'
    );
    res.json({...rows[0], lowStockItems});
  } catch (error) { next(error); }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({status:'ok', database:'connected'});
  } catch (error) {
    res.status(503).json({status:'error', database:'disconnected', message:'Unable to connect to MySQL.'});
  }
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

app.use((req, res) => res.status(404).json({message:'Route not found.'}));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_DB_ERROR') {
    return res.status(500).json({message:'Database or products table not found. Run database/schema.sql in MySQL Workbench.'});
  }
  res.status(500).json({message:'Internal server error.'});
});

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => console.log(`Project Management System running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('Could not connect to MySQL. Check backend/.env and ensure MySQL Server is running.');
    console.error(error.message);
    process.exit(1);
  }
}
start();