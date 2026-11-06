const API = '/api';
const $ = (id) => document.getElementById(id);
let products = [];
let toastTimer;

document.addEventListener('DOMContentLoaded', () => {
  $('today').textContent = new Date().toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric', year:'numeric'});
  $('add-product-top').addEventListener('click', () => openModal());
  $('add-product-main').addEventListener('click', () => openModal());
  $('close-modal').addEventListener('click', closeModal);
  $('cancel-modal').addEventListener('click', closeModal);
  $('product-modal').addEventListener('click', (e) => { if (e.target === $('product-modal')) closeModal(); });
  $('product-form').addEventListener('submit', saveProduct);
  $('search-input').addEventListener('input', renderProducts);
  $('category-filter').addEventListener('change', renderProducts);
  $('refresh-btn').addEventListener('click', loadAll);
  loadAll();
});

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {'Content-Type':'application/json', ...(options.headers || {})}
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

async function loadAll() {
  try {
    const [productData, dashboard] = await Promise.all([request('/products'), request('/dashboard')]);
    products = productData;
    $('connection-status').textContent = 'Connected to MySQL';
    $('total-products').textContent = dashboard.totalProducts.toLocaleString();
    $('total-categories').textContent = dashboard.totalCategories.toLocaleString();
    $('total-quantity').textContent = dashboard.totalQuantity.toLocaleString();
    $('low-stock-count').textContent = dashboard.lowStockProducts.toLocaleString();
    $('stock-value').textContent = formatMoney(dashboard.totalStockValue);
    renderAlerts(dashboard.lowStockItems || []);
    updateCategoryOptions();
    renderProducts();
  } catch (error) {
    $('connection-status').textContent = 'Database unavailable';
    $('products-body').innerHTML = `<tr><td colspan="8" class="empty-state">${escapeHtml(error.message)}<br>Check that the backend and MySQL server are running.</td></tr>`;
    showToast(error.message);
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', minimumFractionDigits:2}).format(Number(value || 0));
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function updateCategoryOptions() {
  const select = $('category-filter');
  const selected = select.value;
  const categories = [...new Set(products.map(p => p.category))].sort((a,b) => a.localeCompare(b));
  select.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(selected)) select.value = selected;
}
function renderProducts() {
  const search = $('search-input').value.trim().toLowerCase();
  const category = $('category-filter').value;
  const filtered = products.filter(p => (!category || p.category === category) &&
    (!search || p.project_name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)));
  $('results-count').textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
  if (!filtered.length) {
    $('products-body').innerHTML = '<tr><td colspan="8" class="empty-state">No products found. Try another search or add a product.</td></tr>';
    return;
  }
  $('products-body').innerHTML = filtered.map(p => {
    const low = Number(p.quantity) <= Number(p.reorder_level);
    return `<tr>
      <td><span class="product-name">${escapeHtml(p.project_name)}</span></td>
      <td><span class="category-pill">${escapeHtml(p.category)}</span></td>
      <td class="money">${formatMoney(p.price)}</td>
      <td>${Number(p.quantity).toLocaleString()}</td>
      <td>${Number(p.reorder_level).toLocaleString()}</td>
      <td class="money">${formatMoney(Number(p.price) * Number(p.quantity))}</td>
      <td><span class="stock-badge ${low ? 'low' : 'good'}">${low ? 'Reorder' : 'In stock'}</span></td>
      <td><div class="action-group"><button class="action-btn" data-action="edit" data-id="${p.id}">Edit</button><button class="action-btn delete" data-action="delete" data-id="${p.id}">Delete</button></div></td>
    </tr>`;
  }).join('');
  $('products-body').querySelectorAll('button[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') editProduct(id); else deleteProduct(id);
  }));
}
function renderAlerts(items) {
  $('alert-count').textContent = `${items.length} alert${items.length === 1 ? '' : 's'}`;
  $('alert-list').innerHTML = items.length ? items.slice(0,5).map(p =>
    `<div class="alert-item"><b>${escapeHtml(p.project_name)}</b>${Number(p.quantity)} left · reorder at ${Number(p.reorder_level)}</div>`
  ).join('') : '<div class="empty-state">All products are above their reorder levels.</div>';
}
function openModal(product = null) {
  $('product-form').reset();
  $('form-error').textContent = '';
  $('product-id').value = product?.id || '';
  $('modal-title').textContent = product ? 'Edit product' : 'Add new product';
  $('save-btn').textContent = product ? 'Update product' : 'Save product';
  if (product) {
    $('project-name').value = product.project_name;
    $('category').value = product.category;
    $('price').value = product.price;
    $('quantity').value = product.quantity;
    $('reorder-level').value = product.reorder_level;
  }
  $('product-modal').hidden = false;
  $('project-name').focus();
}
function closeModal() { $('product-modal').hidden = true; }
async function editProduct(id) {
  try { openModal(await request(`/products/${id}`)); }
  catch (error) { showToast(error.message); }
}
async function saveProduct(event) {
  event.preventDefault();
  const id = $('product-id').value;
  const payload = {
    project_name: $('project-name').value.trim(),
    category: $('category').value.trim(),
    price: $('price').value,
    quantity: $('quantity').value,
    reorder_level: $('reorder-level').value
  };
  $('save-btn').disabled = true;
  $('form-error').textContent = '';
  try {
    await request(id ? `/products/${id}` : '/products', {method:id ? 'PUT' : 'POST', body:JSON.stringify(payload)});
    closeModal();
    showToast(id ? 'Product updated successfully.' : 'Product added successfully.');
    await loadAll();
  } catch (error) { $('form-error').textContent = error.message; }
  finally { $('save-btn').disabled = false; }
}
async function deleteProduct(id) {
  const product = products.find(p => Number(p.id) === id);
  if (!product || !confirm(`Delete "${product.project_name}"? This cannot be undone.`)) return;
  try {
    await request(`/products/${id}`, {method:'DELETE'});
    showToast('Product deleted successfully.');
    await loadAll();
  } catch (error) { showToast(error.message); }
}
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
