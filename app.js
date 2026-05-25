const MONEY = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const LOW_STOCK = 5;

const icons = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/></svg>',
  products: '<svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></svg>',
  inventory: '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4V7Zm3-4h10l3 4H4l3-4Zm2 9h6"/></svg>',
  purchases: '<svg viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Zm4 7h8M10 13h8M10 17h5"/></svg>',
  invoices: '<svg viewBox="0 0 24 24"><path d="M7 3h10l4 4v14H7V3Zm10 0v5h4M3 7h4M3 12h4M3 17h4M10 13h8"/></svg>',
  sales: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18M7 15l4-4 3 3 6-7"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  reports: '<svg viewBox="0 0 24 24"><path d="M4 19.5V4a2 2 0 0 1 2-2h12v20H6a2 2 0 0 1-2-2.5Zm4-13.5h6M8 10h8M8 14h5"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><path d="M4 19V5M9 19v-8M14 19V3M19 19v-5"/></svg>',
};

const modules = [
  { id: "dashboard", label: "Dashboard", icon: icons.dashboard, roles: ["admin", "operator"] },
  { id: "products", label: "Productos", icon: icons.products, roles: ["admin", "operator"] },
  { id: "inventory", label: "Inventario", icon: icons.inventory, roles: ["admin", "operator"] },
  { id: "purchases", label: "Compras", icon: icons.purchases, roles: ["admin", "operator"] },
  { id: "invoices", label: "Facturación", icon: icons.invoices, roles: ["admin", "operator"] },
  { id: "sales", label: "Ventas", icon: icons.sales, roles: ["admin", "operator"] },
  { id: "users", label: "Usuarios", icon: icons.users, roles: ["admin"] },
  { id: "reports", label: "Reportes", icon: icons.reports, roles: ["admin"] },
  { id: "stats", label: "Estadísticas", icon: icons.stats, roles: ["admin"] },
];

const defaultState = {
  users: [
    { id: uid(), name: "Administrador Jireh", username: "admin", password: "admin123", role: "admin", active: true },
    { id: uid(), name: "Operador Principal", username: "operador", password: "operador123", role: "operator", active: true },
  ],
  products: [
    {
      id: uid(),
      name: "Concentrado Premium Canino",
      type: "quintal",
      description: "Alimento balanceado para perros adultos.",
      status: "Activo",
      warehouse: 12,
      display: 3,
      unitStock: 0,
      purchasePrice: 315,
      prices: { quintal: 385, medio: 198, arroba: 102, libra: 4.25, onza: 0.4, unidad: 0 },
      createdAt: todayISO(),
    },
    {
      id: uid(),
      name: "Vitaminas Bovinas 500 ml",
      type: "unidad",
      description: "Suplemento veterinario.",
      status: "Activo",
      warehouse: 0,
      display: 0,
      unitStock: 26,
      purchasePrice: 48,
      prices: { quintal: 0, medio: 0, arroba: 0, libra: 0, onza: 0, unidad: 72 },
      createdAt: todayISO(),
    },
  ],
  purchases: [],
  invoices: [],
  sales: [],
  movements: [],
  history: [],
  activeUser: null,
  dailyReset: todayISO(),
};

let state = loadState();
let activePage = "dashboard";

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const content = document.querySelector("#content");
const modal = document.querySelector("#modal");
const modalBody = document.querySelector("#modalBody");

document.addEventListener("DOMContentLoaded", () => {
  bindChrome();
  if (!state.activeUser) {
    clearLoginFields();
    setTimeout(clearLoginFields, 150);
  }
  if (state.activeUser) bootApp();
});

function bindChrome() {
  document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.querySelector("#loginUser").value.trim();
    const password = document.querySelector("#loginPass").value;
    const user = state.users.find((item) => item.username === username && item.password === password);
    if (!user || !user.active) return toast("Usuario o contraseña inválidos, o usuario inactivo.", "error");
    state.activeUser = user.id;
    logAction("Inicio de sesión", `Usuario ${user.username}`);
    saveState();
    bootApp();
  });

  document.querySelector("#logoutBtn").addEventListener("click", () => {
    logAction("Cierre de sesión", currentUser().username);
    state.activeUser = null;
    saveState();
    clearLoginFields();
    appView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  document.querySelector("#menuToggle").addEventListener("click", () => {
    document.querySelector("#sidebar").classList.toggle("open");
  });

  document.querySelector("#quickSearch").addEventListener("input", (event) => {
    const value = event.target.value.trim();
    if (!value) return;
    activePage = "products";
    render();
    setTimeout(() => {
      const localSearch = document.querySelector("[data-product-search]");
      if (localSearch) {
        localSearch.value = value;
        localSearch.dispatchEvent(new Event("input"));
      }
    });
  });

  document.querySelector("#notificationBtn").addEventListener("click", showNotifications);
}

function bootApp() {
  resetDailyCountersIfNeeded();
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  const user = currentUser();
  document.querySelector("#currentUserName").textContent = user.name;
  document.querySelector("#currentUserRole").textContent = user.role === "admin" ? "Administrador" : "Operador";
  renderNav();
  render();
}

function renderNav() {
  const role = currentUser().role;
  document.querySelector("#navMenu").innerHTML = modules.map((item) => {
    const allowed = item.roles.includes(role);
    return `
      <button class="nav-item ${activePage === item.id ? "active" : ""} ${allowed ? "" : "locked"}" data-page="${item.id}">
        ${item.icon}<span>${item.label}</span>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.page;
      if (!canAccess(target)) return toast("Módulo restringido para este rol.", "error");
      activePage = target;
      document.querySelector("#sidebar").classList.remove("open");
      render();
    });
  });
}

function render() {
  resetDailyCountersIfNeeded();
  if (!canAccess(activePage)) activePage = "dashboard";
  renderNav();
  updateNotifications();
  const renderers = {
    dashboard: renderDashboard,
    products: renderProducts,
    inventory: renderInventory,
    purchases: renderPurchases,
    invoices: renderInvoices,
    sales: renderSales,
    users: renderUsers,
    reports: renderReports,
    stats: renderStats,
  };
  renderers[activePage]();
}

function renderDashboard() {
  const metrics = getMetrics();
  const dailySales = getDailySales();
  content.innerHTML = `
    ${pageHead("Dashboard principal", "Resumen del día actual. El historial completo se conserva para reportes en Excel.", "")}
    <div class="stats-grid">
      ${stat("Ventas del día", money(metrics.dailySales), "Se reinicia a las 12:00 AM")}
      ${stat("Ganancias del día", money(metrics.dailyProfit), "Sin borrar historial")}
      ${stat("Productos vendidos hoy", metrics.dailyQty, "Unidades equivalentes")}
      ${stat("Bajo inventario", metrics.lowStock.length, "Requieren revisión")}
      ${stat("Compras del día", money(metrics.dailyPurchases), "Entradas registradas")}
      ${stat("Productos registrados", state.products.length, "Activos e inactivos")}
      ${stat("Total de facturas", state.invoices.length, "Emitidas")}
      ${stat("Total de existencias", metrics.totalStock, "Bodega + exhibición")}
    </div>
    <div class="dashboard-grid">
      <div class="panel">
        <h3>Ventas de hoy</h3>
        ${barChart(groupSalesByDate("total", dailySales), true)}
      </div>
      <div class="panel">
        <h3>Productos más vendidos hoy</h3>
        ${miniList(bestSellers(dailySales), "producto", "vendido")}
      </div>
      <div class="panel">
        <h3>Ganancias de hoy</h3>
        ${barChart(groupSalesByDate("profit", dailySales), true)}
      </div>
      <div class="panel">
        <h3>Productos con bajo inventario</h3>
        ${miniList(metrics.lowStock.map((p) => ({ label: p.name, value: totalStock(p) })), "producto", "existencia")}
      </div>
    </div>
  `;
}

function renderProducts() {
  content.innerHTML = `
    ${pageHead("Lista de productos", "Administra alimentos, productos veterinarios y existencias.", `
      <button class="btn primary" data-action="new-product">Nuevo producto</button>
      <button class="btn" data-action="export-products">Exportar Excel</button>
    `)}
    <div class="filters">
      <input data-product-search placeholder="Buscar producto" />
      <select data-product-filter>
        <option value="all">Todos</option>
        <option value="quintal">Productos por quintal</option>
        <option value="unidad">Productos por unidad</option>
        <option value="low">Bajo stock</option>
      </select>
    </div>
    <div class="table-wrap"><table>
      <thead>
        <tr>
          <th>Nombre del producto</th><th>Tipo</th><th>Bodega</th><th>Exhibición</th><th>Total</th>
          <th>Precio quintal</th><th>Medio quintal</th><th>Arroba</th><th>Libra</th><th>Onza</th><th>Unidad</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody id="productRows"></tbody>
    </table></div>
  `;
  document.querySelector("[data-action='new-product']").addEventListener("click", () => openProductForm());
  document.querySelector("[data-action='export-products']").addEventListener("click", exportExcel);
  document.querySelector("[data-product-search]").addEventListener("input", drawProductRows);
  document.querySelector("[data-product-filter]").addEventListener("change", drawProductRows);
  drawProductRows();
}

function drawProductRows() {
  const q = document.querySelector("[data-product-search]")?.value.toLowerCase() || "";
  const filter = document.querySelector("[data-product-filter]")?.value || "all";
  const rows = state.products
    .filter((p) => p.name.toLowerCase().includes(q))
    .filter((p) => filter === "all" || p.type === filter || (filter === "low" && totalStock(p) <= LOW_STOCK))
    .map((p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.description || "")}</small></td>
        <td>${p.type === "quintal" ? "Producto por quintal" : "Producto por unidad"}</td>
        <td>${p.type === "quintal" ? p.warehouse : "-"}</td>
        <td>${p.type === "quintal" ? p.display : "-"}</td>
        <td>${totalStock(p)}</td>
        <td>${p.type === "quintal" ? money(p.prices.quintal) : "-"}</td>
        <td>${p.type === "quintal" ? money(p.prices.medio) : "-"}</td>
        <td>${p.type === "quintal" ? money(p.prices.arroba) : "-"}</td>
        <td>${p.type === "quintal" ? money(p.prices.libra) : "-"}</td>
        <td>${p.type === "quintal" ? money(p.prices.onza) : "-"}</td>
        <td>${p.type === "unidad" ? money(p.prices.unidad) : "-"}</td>
        <td><span class="badge ${p.status === "Activo" ? "" : "danger"}">${p.status}</span></td>
        <td><div class="row-actions">
          <button class="btn" data-edit-product="${p.id}">Editar</button>
          <button class="btn danger" data-delete-product="${p.id}">Eliminar</button>
        </div></td>
      </tr>
    `).join("");
  document.querySelector("#productRows").innerHTML = rows || `<tr><td colspan="13">No hay productos para mostrar.</td></tr>`;
  document.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => openProductForm(button.dataset.editProduct)));
  document.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct)));
}

function openProductForm(id = null) {
  const product = id ? state.products.find((p) => p.id === id) : null;
  const isEdit = Boolean(product);
  modalBody.innerHTML = `
    <h2>${isEdit ? "Editar producto" : "Crear nuevo producto"}</h2>
    <form id="productForm" class="form-grid" data-product-id="${product?.id || ""}">
      <label class="span-2">Nombre del producto<input name="name" value="${escapeAttr(product?.name || "")}" required /></label>
      <label>Tipo
        <select name="type">
          <option value="quintal" ${product?.type === "quintal" ? "selected" : ""}>Producto por quintal</option>
          <option value="unidad" ${product?.type === "unidad" ? "selected" : ""}>Producto por unidad</option>
        </select>
      </label>
      <label>Estado
        <select name="status">
          <option ${product?.status !== "Inactivo" ? "selected" : ""}>Activo</option>
          <option ${product?.status === "Inactivo" ? "selected" : ""}>Inactivo</option>
        </select>
      </label>
      <label class="span-4">Descripción<textarea name="description">${escapeHtml(product?.description || "")}</textarea></label>
      <div class="span-4" id="dynamicPrices"></div>
      ${!isEdit ? `
        <h3 class="span-4">Compra inicial opcional</h3>
        <label>Cantidad comprada<input name="initialQty" type="number" min="0" step="0.01" /></label>
        <label>Proveedor<input name="supplier" /></label>
        <label>Fecha<input name="date" type="date" value="${todayISO()}" /></label>
        <label>Precio compra<input name="purchasePrice" type="number" min="0" step="0.01" /></label>
      ` : `<label>Precio compra actual<input name="purchasePrice" type="number" min="0" step="0.01" value="${product.purchasePrice}" /></label>`}
      <div class="span-4 actions">
        <button class="btn primary" type="submit">Guardar</button>
        <button class="btn" type="button" data-close>Cancelar</button>
      </div>
    </form>
  `;
  const form = document.querySelector("#productForm");
  const renderPrices = () => {
    const type = form.type.value;
    const prices = product?.prices || {};
    document.querySelector("#dynamicPrices").innerHTML = type === "quintal" ? `
      <div class="form-grid">
        <label>Precio venta por quintal<input name="price_quintal" type="number" step="0.01" min="0" value="${prices.quintal || ""}" required /></label>
        <label>Precio medio quintal<input name="price_medio" type="number" step="0.01" min="0" value="${prices.medio || ""}" required /></label>
        <label>Precio arroba<input name="price_arroba" type="number" step="0.01" min="0" value="${prices.arroba || ""}" required /></label>
        <label>Precio libra<input name="price_libra" type="number" step="0.01" min="0" value="${prices.libra || ""}" required /></label>
        <label>Precio onza<input name="price_onza" type="number" step="0.01" min="0" value="${prices.onza || ""}" required /></label>
      </div>
    ` : `
      <div class="form-grid">
        <label>Precio venta por unidad<input name="price_unidad" type="number" step="0.01" min="0" value="${prices.unidad || ""}" required /></label>
      </div>
    `;
  };
  form.type.addEventListener("change", renderPrices);
  renderPrices();
  form.addEventListener("submit", saveProduct);
  document.querySelector("[data-close]").addEventListener("click", () => modal.close());
  modal.showModal();
}

function saveProduct(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const formId = form.dataset.productId;
  const existing = formId ? state.products.find((p) => p.id === formId) : null;
  const type = data.type;
  const product = {
    id: existing?.id || uid(),
    name: data.name,
    type,
    description: data.description,
    status: data.status,
    warehouse: existing?.warehouse || 0,
    display: existing?.display || 0,
    unitStock: existing?.unitStock || 0,
    purchasePrice: number(data.purchasePrice),
    prices: {
      quintal: number(data.price_quintal),
      medio: number(data.price_medio),
      arroba: number(data.price_arroba),
      libra: number(data.price_libra),
      onza: number(data.price_onza),
      unidad: number(data.price_unidad),
    },
    createdAt: existing?.createdAt || todayISO(),
  };

  if (existing) Object.assign(existing, product);
  else state.products.push(product);

  const initialQty = number(data.initialQty);
  if (!existing && initialQty > 0) {
    addPurchase(product.id, data.supplier || "Sin proveedor", data.date || todayISO(), initialQty, product.purchasePrice, false);
  }

  logAction(existing ? "Producto editado" : "Producto creado", product.name);
  saveState();
  modal.close();
  toast("Producto guardado correctamente.");
  render();
}

function deleteProduct(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`¿Eliminar ${product.name}? Esta acción quedará registrada en historial.`)) return;
  state.products = state.products.filter((p) => p.id !== id);
  logAction("Producto eliminado", product.name);
  saveState();
  toast("Producto eliminado.");
  render();
}

function renderPurchases() {
  content.innerHTML = `
    ${pageHead("Compras", "Registra entradas y actualiza precios de venta cuando cambie el costo.", `
      <button class="btn primary" data-action="new-purchase">Nueva compra</button>
    `)}
    <div class="table-wrap"><table>
      <thead><tr><th>Producto</th><th>Proveedor</th><th>Fecha</th><th>Cantidad</th><th>Precio compra</th><th>Usuario</th></tr></thead>
      <tbody>${state.purchases.map((p) => `
        <tr><td>${productName(p.productId)}</td><td>${escapeHtml(p.supplier)}</td><td>${p.date}</td><td>${p.quantity}</td><td>${money(p.purchasePrice)}</td><td>${p.user}</td></tr>
      `).join("") || `<tr><td colspan="6">Sin compras registradas.</td></tr>`}</tbody>
    </table></div>
  `;
  document.querySelector("[data-action='new-purchase']").addEventListener("click", openPurchaseForm);
}

function openPurchaseForm() {
  modalBody.innerHTML = `
    <h2>Nueva compra</h2>
    <form id="purchaseForm" class="form-grid">
      <label class="span-2">Producto
        <select name="productId" required>${state.products.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select>
      </label>
      <label>Proveedor<input name="supplier" required /></label>
      <label>Fecha<input name="date" type="date" value="${todayISO()}" required /></label>
      <label>Cantidad<input name="quantity" type="number" min="0.01" step="0.01" required /></label>
      <label>Precio compra<input name="purchasePrice" type="number" min="0" step="0.01" required /></label>
      <div class="span-4 actions">
        <button class="btn primary" type="submit">Guardar compra</button>
        <button class="btn" type="button" data-close>Cancelar</button>
      </div>
    </form>
  `;
  document.querySelector("#purchaseForm").addEventListener("submit", savePurchase);
  document.querySelector("[data-close]").addEventListener("click", () => modal.close());
  modal.showModal();
}

function savePurchase(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const product = state.products.find((p) => p.id === data.productId);
  const newCost = number(data.purchasePrice);
  if (product.purchasePrice && product.purchasePrice !== newCost) {
    const update = confirm("El costo de compra cambió. ¿Desea actualizar los precios de venta?");
    if (update) openPriceUpdateAfterPurchase(data, product, newCost);
    else {
      addPurchase(data.productId, data.supplier, data.date, number(data.quantity), newCost, true);
      toast("Los precios anteriores continuarán activos y pueden afectar las ganancias futuras.", "error");
      modal.close();
      render();
    }
    return;
  }
  addPurchase(data.productId, data.supplier, data.date, number(data.quantity), newCost, true);
  modal.close();
  toast("Compra registrada e inventario actualizado.");
  render();
}

function openPriceUpdateAfterPurchase(data, product, newCost) {
  modalBody.innerHTML = `
    <h2>Actualizar precios de venta</h2>
    <p class="notice">Nuevo costo de compra: ${money(newCost)}. Los precios se aplicarán a ganancias futuras.</p>
    <form id="priceUpdateForm" class="form-grid">
      ${product.type === "quintal" ? `
        <label>Precio quintal<input name="quintal" type="number" step="0.01" value="${product.prices.quintal}" required /></label>
        <label>Medio quintal<input name="medio" type="number" step="0.01" value="${product.prices.medio}" required /></label>
        <label>Arroba<input name="arroba" type="number" step="0.01" value="${product.prices.arroba}" required /></label>
        <label>Libra<input name="libra" type="number" step="0.01" value="${product.prices.libra}" required /></label>
        <label>Onza<input name="onza" type="number" step="0.01" value="${product.prices.onza}" required /></label>
      ` : `<label>Precio por unidad<input name="unidad" type="number" step="0.01" value="${product.prices.unidad}" required /></label>`}
      <div class="span-4 actions"><button class="btn primary" type="submit">Guardar precios</button></div>
    </form>
  `;
  document.querySelector("#priceUpdateForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const prices = Object.fromEntries(new FormData(event.target).entries());
    Object.keys(prices).forEach((key) => product.prices[key] = number(prices[key]));
    addPurchase(data.productId, data.supplier, data.date, number(data.quantity), newCost, true);
    logAction("Precios de venta actualizados", product.name);
    saveState();
    modal.close();
    toast("Compra y nuevos precios guardados.");
    render();
  });
}

function addPurchase(productId, supplier, date, quantity, purchasePrice, shouldSave) {
  const product = state.products.find((p) => p.id === productId);
  product.purchasePrice = purchasePrice;
  if (product.type === "quintal") product.warehouse += quantity;
  else product.unitStock += quantity;
  const purchase = { id: uid(), productId, supplier, date, quantity, purchasePrice, user: currentUser()?.username || "Sistema", createdAt: nowStamp() };
  state.purchases.unshift(purchase);
  addMovement(productId, "Entrada", quantity, "Compra registrada");
  logAction("Compra registrada", `${product.name} - ${quantity}`);
  if (shouldSave) saveState();
}

function renderInventory() {
  const quintal = state.products.filter((p) => p.type === "quintal");
  const unidad = state.products.filter((p) => p.type === "unidad");
  content.innerHTML = `
    ${pageHead("Inventario", "Control separado por quintal y unidad, con traslados a exhibición.", "")}
    <div class="dashboard-grid">
      <div class="panel">
        <h3>Inventario por quintal</h3>
        ${inventoryTable(quintal, true)}
      </div>
      <div class="panel">
        <h3>Inventario por unidad</h3>
        ${inventoryTable(unidad, false)}
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Historial de inventario</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Tipo</th><th>Producto</th><th>Cantidad</th><th>Detalle</th><th>Fecha</th><th>Hora</th><th>Usuario</th></tr></thead>
        <tbody>${state.movements.map((m) => `<tr><td>${m.type}</td><td>${productName(m.productId)}</td><td>${m.quantity}</td><td>${m.detail}</td><td>${m.date}</td><td>${m.time}</td><td>${m.user}</td></tr>`).join("") || `<tr><td colspan="7">Sin movimientos.</td></tr>`}</tbody>
      </table></div>
    </div>
  `;
  document.querySelectorAll("[data-display]").forEach((button) => button.addEventListener("click", () => sendToDisplay(button.dataset.display)));
}

function inventoryTable(products, hasDisplay) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Producto</th>${hasDisplay ? "<th>Bodega</th><th>Exhibición</th>" : "<th>Cantidad</th><th>Unidad</th>"}<th>Existencia total</th><th>Acciones</th></tr></thead>
    <tbody>${products.map((p) => `<tr>
      <td>${escapeHtml(p.name)}</td>
      ${hasDisplay ? `<td>${p.warehouse}</td><td>${p.display}</td>` : `<td>${p.unitStock}</td><td>Unidad</td>`}
      <td>${totalStock(p)}</td>
      <td>${hasDisplay ? `<button class="btn warn" data-display="${p.id}">Enviar a exhibición</button>` : "-"}</td>
    </tr>`).join("") || `<tr><td colspan="5">Sin productos.</td></tr>`}</tbody>
  </table></div>`;
}

function sendToDisplay(id) {
  const product = state.products.find((p) => p.id === id);
  const qty = number(prompt("Cantidad a trasladar a exhibición", "1"));
  if (!qty || qty <= 0) return;
  if (qty > product.warehouse) return toast("No hay suficiente producto en bodega.", "error");
  product.warehouse -= qty;
  product.display += qty;
  addMovement(id, "Traslado a exhibición", qty, "Movimiento manual sin duplicar producto");
  logAction("Traslado a exhibición", `${product.name} - ${qty}`);
  saveState();
  toast("Producto enviado a exhibición.");
  render();
}

function renderInvoices() {
  content.innerHTML = `
    ${pageHead("Facturación", "La factura genera ventas, descuenta inventario y actualiza ganancias.", `
      <button class="btn primary" data-action="new-invoice">Crear factura</button>
    `)}
    <div class="table-wrap"><table>
      <thead><tr><th>Número factura</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Usuario</th><th>Acciones</th></tr></thead>
      <tbody>${state.invoices.map((i) => `<tr>
        <td>${i.number}</td><td>${i.date}</td><td>${escapeHtml(i.customer || "Consumidor Final")}</td><td>${money(i.total)}</td><td>${i.user}</td>
        <td><button class="btn" data-view-invoice="${i.id}">Ver / imprimir</button></td>
      </tr>`).join("") || `<tr><td colspan="6">Sin facturas.</td></tr>`}</tbody>
    </table></div>
  `;
  document.querySelector("[data-action='new-invoice']").addEventListener("click", openInvoiceForm);
  document.querySelectorAll("[data-view-invoice]").forEach((button) => button.addEventListener("click", () => showInvoice(button.dataset.viewInvoice)));
}

function openInvoiceForm() {
  modalBody.innerHTML = `
    <h2>Crear factura</h2>
    <form id="invoiceForm" class="form-grid">
      <label>Cliente
        <select name="customerType">
          <option value="final">Consumidor final</option>
          <option value="manual">Cliente manual</option>
          <option value="registered">Cliente registrado</option>
        </select>
      </label>
      <label class="span-2">Nombre del cliente<input name="customer" placeholder="Opcional" /></label>
      <label>Fecha<input name="date" type="date" value="${todayISO()}" required /></label>
      <div class="span-4 panel">
        <h3>Productos</h3>
        <div id="invoiceItems"></div>
        <button class="btn warn" type="button" data-add-item>Agregar producto</button>
      </div>
      <div class="span-4"><strong>Total: <span id="invoiceTotal">Q0.00</span></strong></div>
      <div class="span-4 actions"><button class="btn primary" type="submit">Guardar factura</button><button class="btn" type="button" data-close>Cancelar</button></div>
    </form>
  `;
  const addItem = () => {
    const host = document.querySelector("#invoiceItems");
    const index = host.children.length;
    const row = document.createElement("div");
    row.className = "form-grid";
    row.innerHTML = `
      <label class="span-2">Producto
        <select name="productId">${state.products.filter((p) => p.status === "Activo").map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select>
      </label>
      <label>Unidad
        <select name="unit"></select>
      </label>
      <label>Cantidad<input name="quantity" type="number" min="0.01" step="0.01" value="1" /></label>
      <button class="btn danger" type="button" data-remove-item="${index}">Quitar</button>
    `;
    host.appendChild(row);
    const productSelect = row.querySelector("[name='productId']");
    const unitSelect = row.querySelector("[name='unit']");
    const refreshUnits = () => {
      const p = state.products.find((item) => item.id === productSelect.value);
      unitSelect.innerHTML = p.type === "quintal"
        ? `<option value="quintal">Quintal</option><option value="medio">Medio quintal</option><option value="arroba">Arroba</option><option value="libra">Libra</option><option value="onza">Onza</option>`
        : `<option value="unidad">Unidad</option>`;
      calculateInvoiceTotal();
    };
    productSelect.addEventListener("change", refreshUnits);
    unitSelect.addEventListener("change", calculateInvoiceTotal);
    row.querySelector("[name='quantity']").addEventListener("input", calculateInvoiceTotal);
    row.querySelector("[data-remove-item]").addEventListener("click", () => {
      row.remove();
      calculateInvoiceTotal();
    });
    refreshUnits();
  };
  document.querySelector("[data-add-item]").addEventListener("click", addItem);
  document.querySelector("[data-close]").addEventListener("click", () => modal.close());
  document.querySelector("#invoiceForm").addEventListener("submit", saveInvoice);
  addItem();
  modal.showModal();
}

function calculateInvoiceTotal() {
  let total = 0;
  document.querySelectorAll("#invoiceItems > .form-grid").forEach((row) => {
    const product = state.products.find((p) => p.id === row.querySelector("[name='productId']").value);
    const unit = row.querySelector("[name='unit']").value;
    const qty = number(row.querySelector("[name='quantity']").value);
    total += (product?.prices[unit] || 0) * qty;
  });
  document.querySelector("#invoiceTotal").textContent = money(total);
}

function saveInvoice(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const items = [];
  let total = 0;
  let profit = 0;
  for (const row of document.querySelectorAll("#invoiceItems > .form-grid")) {
    const product = state.products.find((p) => p.id === row.querySelector("[name='productId']").value);
    const unit = row.querySelector("[name='unit']").value;
    const qty = number(row.querySelector("[name='quantity']").value);
    const price = product.prices[unit];
    const stockNeeded = unitToStock(unit, qty);
    const available = product.type === "quintal" ? product.display : product.unitStock;
    if (stockNeeded > available) {
      const msg = product.type === "quintal"
        ? "Producto insuficiente en exhibición. Traslade otro quintal manualmente."
        : "Producto insuficiente en inventario.";
      return toast(`${product.name}: ${msg}`, "error");
    }
    const subtotal = price * qty;
    const itemProfit = (price - purchaseCostForUnit(product, unit)) * qty;
    items.push({ productId: product.id, name: product.name, unit, quantity: qty, price, subtotal, profit: itemProfit, stockNeeded });
    total += subtotal;
    profit += itemProfit;
  }

  items.forEach((item) => {
    const product = state.products.find((p) => p.id === item.productId);
    if (product.type === "quintal") product.display -= item.stockNeeded;
    else product.unitStock -= item.stockNeeded;
    addMovement(product.id, "Salida", item.stockNeeded, `Factura ${state.invoices.length + 1}`);
  });

  const invoice = {
    id: uid(),
    number: `AJ-${String(state.invoices.length + 1).padStart(5, "0")}`,
    date: data.date,
    customer: data.customer?.trim() || "Consumidor Final",
    items,
    total,
    profit,
    user: currentUser().username,
    createdAt: nowStamp(),
  };
  state.invoices.unshift(invoice);
  state.sales.unshift({ id: uid(), invoiceId: invoice.id, number: invoice.number, date: invoice.date, customer: invoice.customer, items, total, profit, user: invoice.user });
  logAction("Factura creada", `${invoice.number} - ${money(total)}`);
  saveState();
  modal.close();
  toast("Factura guardada. Venta, inventario y dashboard actualizados.");
  showInvoice(invoice.id);
  render();
}

function showInvoice(id) {
  const invoice = state.invoices.find((i) => i.id === id);
  modalBody.innerHTML = `
    <div class="invoice-box">
      <h2>Agropecuaria Jireh</h2>
      <p>Más que alimento, es cuidado para tus mascotas.</p>
      <p><strong>Número factura:</strong> ${invoice.number}<br><strong>Fecha:</strong> ${invoice.date}<br><strong>Cliente:</strong> ${escapeHtml(invoice.customer)}</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Unidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
        <tbody>${invoice.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${unitLabel(item.unit)}</td><td>${money(item.price)}</td><td>${money(item.subtotal)}</td></tr>`).join("")}</tbody>
      </table></div>
      <h3>Total: ${money(invoice.total)}</h3>
      <div class="actions"><button class="btn primary" onclick="window.print()">Imprimir factura</button><button class="btn" onclick="downloadInvoice('${invoice.id}')">Descargar PDF</button></div>
    </div>
  `;
  modal.showModal();
}

function renderSales() {
  content.innerHTML = `
    ${pageHead("Ventas", "Consulta automática generada únicamente desde facturación.", "")}
    <div class="filters">
      <select data-sales-date><option value="all">Todo</option><option value="today">Hoy</option><option value="yesterday">Ayer</option><option value="week">Esta semana</option><option value="month">Este mes</option></select>
      <input data-sales-query placeholder="Cliente, producto o factura" />
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Número factura</th><th>Fecha</th><th>Cliente</th><th>Productos vendidos</th><th>Cantidades</th><th>Total</th><th>Ganancia</th><th>Usuario</th></tr></thead>
      <tbody id="salesRows"></tbody>
    </table></div>
  `;
  document.querySelector("[data-sales-date]").addEventListener("change", drawSalesRows);
  document.querySelector("[data-sales-query]").addEventListener("input", drawSalesRows);
  drawSalesRows();
}

function drawSalesRows() {
  const period = document.querySelector("[data-sales-date]").value;
  const q = document.querySelector("[data-sales-query]").value.toLowerCase();
  const rows = state.sales.filter((sale) => matchPeriod(sale.date, period)).filter((sale) => {
    const text = `${sale.number} ${sale.customer} ${sale.items.map((i) => i.name).join(" ")}`.toLowerCase();
    return text.includes(q);
  }).map((sale) => `<tr>
    <td>${sale.number}</td><td>${sale.date}</td><td>${escapeHtml(sale.customer)}</td>
    <td>${sale.items.map((i) => escapeHtml(i.name)).join("<br>")}</td>
    <td>${sale.items.map((i) => `${i.quantity} ${unitLabel(i.unit)}`).join("<br>")}</td>
    <td>${money(sale.total)}</td><td>${money(sale.profit)}</td><td>${sale.user}</td>
  </tr>`).join("");
  document.querySelector("#salesRows").innerHTML = rows || `<tr><td colspan="8">Sin ventas para el filtro seleccionado.</td></tr>`;
}

function renderUsers() {
  content.innerHTML = `
    ${pageHead("Usuarios", "Control de roles, permisos y estado de acceso.", `<button class="btn primary" data-new-user>Nuevo usuario</button>`)}
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${state.users.map((u) => `<tr>
        <td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.username)}</td><td>${u.role === "admin" ? "Administrador" : "Operador"}</td>
        <td><span class="badge ${u.active ? "" : "danger"}">${u.active ? "Activo" : "Inactivo"}</span></td>
        <td><div class="row-actions"><button class="btn" data-edit-user="${u.id}">Editar</button><button class="btn warn" data-toggle-user="${u.id}">${u.active ? "Desactivar" : "Activar"}</button><button class="btn danger" data-delete-user="${u.id}">Eliminar</button></div></td>
      </tr>`).join("")}</tbody>
    </table></div>
  `;
  document.querySelector("[data-new-user]").addEventListener("click", () => openUserForm());
  document.querySelectorAll("[data-edit-user]").forEach((b) => b.addEventListener("click", () => openUserForm(b.dataset.editUser)));
  document.querySelectorAll("[data-toggle-user]").forEach((b) => b.addEventListener("click", () => toggleUser(b.dataset.toggleUser)));
  document.querySelectorAll("[data-delete-user]").forEach((b) => b.addEventListener("click", () => deleteUser(b.dataset.deleteUser)));
}

function openUserForm(id = null) {
  const user = id ? state.users.find((u) => u.id === id) : null;
  modalBody.innerHTML = `
    <h2>${user ? "Editar usuario" : "Nuevo usuario"}</h2>
    <form id="userForm" class="form-grid two">
      <label>Nombre<input name="name" value="${escapeAttr(user?.name || "")}" required /></label>
      <label>Usuario<input name="username" value="${escapeAttr(user?.username || "")}" required /></label>
      <label>Contraseña<input name="password" value="${escapeAttr(user?.password || "")}" required /></label>
      <label>Rol<select name="role"><option value="admin" ${user?.role === "admin" ? "selected" : ""}>Administrador</option><option value="operator" ${user?.role === "operator" ? "selected" : ""}>Operador</option></select></label>
      <div class="span-2 actions"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-close>Cancelar</button></div>
    </form>
  `;
  document.querySelector("#userForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    if (user) Object.assign(user, data);
    else state.users.push({ id: uid(), ...data, active: true });
    logAction(user ? "Usuario editado" : "Usuario creado", data.username);
    saveState();
    modal.close();
    toast("Usuario guardado.");
    render();
  });
  document.querySelector("[data-close]").addEventListener("click", () => modal.close());
  modal.showModal();
}

function toggleUser(id) {
  const user = state.users.find((u) => u.id === id);
  user.active = !user.active;
  logAction(user.active ? "Usuario activado" : "Usuario desactivado", user.username);
  saveState();
  render();
}

function deleteUser(id) {
  const user = state.users.find((u) => u.id === id);
  if (user.id === state.activeUser) return toast("No puedes eliminar tu propio usuario conectado.", "error");
  if (!confirm(`¿Eliminar usuario ${user.username}?`)) return;
  state.users = state.users.filter((u) => u.id !== id);
  logAction("Usuario eliminado", user.username);
  saveState();
  render();
}

function renderReports() {
  const metrics = getMetrics();
  content.innerHTML = `
    ${pageHead("Reportes", "Resumen del día actual. El Excel conserva el historial por días, semanas y mes.", `<button class="btn primary" data-export>Exportar Historial_Agropecuaria_Jireh.xlsx</button>`)}
    <div class="stats-grid">
      ${stat("Ventas del día", money(metrics.dailySales), "")}
      ${stat("Ganancias del día", money(metrics.dailyProfit), "")}
      ${stat("Productos vendidos", metrics.dailyQty, "")}
      ${stat("Bajo stock", metrics.lowStock.length, "")}
    </div>
    <div class="dashboard-grid">
      <div class="panel"><h3>Compras recientes</h3>${miniList(state.purchases.slice(0, 6).map((p) => ({ label: productName(p.productId), value: money(p.purchasePrice * p.quantity) })), "producto", "total")}</div>
      <div class="panel"><h3>Historial reciente</h3>${miniList(state.history.slice(0, 8).map((h) => ({ label: h.action, value: `${h.date} ${h.time}` })), "acción", "fecha")}</div>
    </div>
  `;
  document.querySelector("[data-export]").addEventListener("click", exportExcel);
}

function renderStats() {
  const dailySales = getDailySales();
  content.innerHTML = `
    ${pageHead("Estadísticas", "Gráficas del día actual. Los datos históricos permanecen en el Excel.", "")}
    <div class="dashboard-grid">
      <div class="panel"><h3>Ventas de hoy</h3>${barChart(groupSalesByDate("total", dailySales), true)}</div>
      <div class="panel"><h3>Productos más vendidos hoy</h3>${barChart(bestSellers(dailySales).map((x) => ({ label: x.label, value: x.value })))}</div>
      <div class="panel"><h3>Ganancias de hoy</h3>${barChart(groupSalesByDate("profit", dailySales), true)}</div>
      <div class="panel"><h3>Bajo stock</h3>${miniList(getMetrics().lowStock.map((p) => ({ label: p.name, value: totalStock(p) })), "producto", "stock")}</div>
    </div>
  `;
}

function exportExcel() {
  const sheets = buildReportWorkbookSheets();
  const blob = createXlsxWorkbook(sheets);
  downloadBlob("Historial_Agropecuaria_Jireh.xlsx", blob);
  logAction("Exportación Excel", "Historial_Agropecuaria_Jireh.xlsx");
  saveState();
  toast("Libro de Excel generado con historial completo.");
}

function buildReportWorkbookSheets() {
  return {
    Reporte_Mensual: buildMonthlyReportRows(),
    Facturas: state.invoices.slice().reverse().map((invoice) => ({
      Factura: invoice.number,
      Fecha: invoice.date,
      Dia: dayName(invoice.date),
      Cliente: invoice.customer,
      Productos: invoice.items.map((item) => `${item.name} (${item.quantity} ${unitLabel(item.unit)})`).join(", "),
      Total: invoice.total,
      Ganancia: invoice.profit,
      Usuario: invoice.user,
    })),
    Productos_Vendidos: state.sales.slice().reverse().flatMap((sale) => sale.items.map((item) => ({
      Fecha: sale.date,
      Dia: dayName(sale.date),
      Factura: sale.number,
      Producto: item.name,
      Cantidad: item.quantity,
      Unidad: unitLabel(item.unit),
      Total: item.subtotal,
      Ganancia: item.profit,
    }))),
    Historial: state.history.slice().reverse(),
  };
}

function buildMonthlyReportRows() {
  if (!state.sales.length) {
    return [
      ["Agropecuaria Jireh"],
      ["Reporte mensual"],
      [""],
      ["Sin ventas registradas"],
    ];
  }

  const sortedSales = state.sales.slice().sort((a, b) => a.date.localeCompare(b.date));
  const months = groupBy(sortedSales, (sale) => sale.date.slice(0, 7));
  const rows = [["Agropecuaria Jireh"], ["Más que alimento, es cuidado para tus mascotas."], [""]];

  Object.entries(months).forEach(([monthKey, sales]) => {
    rows.push([`Resumen del mes: ${monthLabel(monthKey)}`]);
    rows.push([""]);
    const weeks = groupBy(sales, (sale) => weekOfMonth(sale.date));
    Object.keys(weeks).map(Number).sort((a, b) => a - b).forEach((weekNumber) => {
      rows.push([`Semana ${weekNumber} del mes`]);
      rows.push(["Día", "Fecha", "Cantidad de ventas", "Ganancia del día", "Productos vendidos", "Total vendido", "Facturas"]);
      const days = groupBy(weeks[weekNumber], (sale) => sale.date);
      const weekTotals = emptyReportTotals();
      Object.keys(days).sort().forEach((date) => {
        const daySales = days[date];
        const totals = reportTotals(daySales);
        addReportTotals(weekTotals, totals);
        rows.push([
          dayName(date),
          date,
          totals.salesCount,
          totals.profit,
          totals.productsSold,
          totals.totalSales,
          totals.invoices,
        ]);
      });
      rows.push(["Resumen de la semana", "", weekTotals.salesCount, weekTotals.profit, weekTotals.productsSold, weekTotals.totalSales, weekTotals.invoices]);
      rows.push([""]);
    });
    const monthTotals = reportTotals(sales);
    rows.push(["Resumen de todo el mes", "", monthTotals.salesCount, monthTotals.profit, monthTotals.productsSold, monthTotals.totalSales, monthTotals.invoices]);
    rows.push([""]);
  });

  return rows;
}

function downloadInvoice(id) {
  const invoice = state.invoices.find((i) => i.id === id);
  const lines = [
    "Agropecuaria Jireh",
    "Más que alimento, es cuidado para tus mascotas.",
    `Factura: ${invoice.number}`,
    `Fecha: ${invoice.date}`,
    `Cliente: ${invoice.customer}`,
    "",
    ...invoice.items.map((i) => `${i.name} | ${i.quantity} ${unitLabel(i.unit)} | ${money(i.price)} | ${money(i.subtotal)}`),
    "",
    `Total: ${money(invoice.total)}`,
  ];
  downloadBlob(`${invoice.number}.pdf`, createPdf(lines));
  toast("Factura PDF descargada correctamente.");
}

function showNotifications() {
  const low = getMetrics().lowStock;
  modalBody.innerHTML = `
    <h2>Notificaciones</h2>
    ${low.length ? `<p class="notice">${low.length} producto(s) con bajo inventario.</p>${miniList(low.map((p) => ({ label: p.name, value: totalStock(p) })), "producto", "existencia")}` : "<p>No hay notificaciones pendientes.</p>"}
  `;
  modal.showModal();
}

function updateNotifications() {
  document.querySelector("#notificationCount").textContent = getMetrics().lowStock.length;
}

function getMetrics() {
  const today = todayISO();
  const todaySales = getDailySales();
  return {
    dailySales: sum(todaySales, "total"),
    dailyProfit: sum(todaySales, "profit"),
    dailyQty: todaySales.flatMap((s) => s.items).reduce((acc, item) => acc + item.quantity, 0),
    dailyPurchases: state.purchases.filter((p) => p.date === today).reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0),
    lowStock: state.products.filter((p) => totalStock(p) <= LOW_STOCK),
    totalStock: state.products.reduce((acc, p) => acc + totalStock(p), 0),
  };
}

function getDailySales() {
  const today = todayISO();
  return state.sales.filter((sale) => sale.date === today);
}

function groupSalesByDate(key, sales = state.sales) {
  const map = {};
  sales.forEach((sale) => map[sale.date] = (map[sale.date] || 0) + sale[key]);
  return Object.entries(map).slice(0, 7).reverse().map(([label, value]) => ({ label: label.slice(5), value }));
}

function bestSellers(sales = state.sales) {
  const map = {};
  sales.flatMap((s) => s.items).forEach((item) => map[item.name] = (map[item.name] || 0) + item.quantity);
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
}

function barChart(data, currency = false) {
  if (!data.length) return `<p>No hay datos suficientes todavía.</p>`;
  const max = Math.max(...data.map((d) => d.value), 1);
  return `<div class="metric-chart">${data.map((d) => {
    const width = Math.max(4, (d.value / max) * 100);
    return `
      <div class="metric-row">
        <span class="metric-label">${escapeHtml(String(d.label))}</span>
        <span class="metric-track"><span class="metric-fill" style="width:${width}%"></span></span>
        <span class="metric-value">${formatMetricValue(d.value, currency)}</span>
      </div>
    `;
  }).join("")}</div>`;
}

function miniList(items, left, right) {
  if (!items.length) return `<p>No hay registros.</p>`;
  return `<div class="table-wrap"><table><thead><tr><th>${left}</th><th>${right}</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(String(item.label))}</td><td>${escapeHtml(String(item.value))}</td></tr>`).join("")}</tbody></table></div>`;
}

function stat(label, value, note) {
  return `<article class="stat-card"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</article>`;
}

function pageHead(title, subtitle, actions) {
  return `<div class="page-head"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="actions">${actions}</div></div>`;
}

function addMovement(productId, type, quantity, detail) {
  const now = new Date();
  state.movements.unshift({ id: uid(), productId, type, quantity, detail, date: todayISO(now), time: time(now), user: currentUser()?.username || "Sistema" });
}

function logAction(action, detail) {
  const now = new Date();
  state.history.unshift({ action, detail, user: currentUser()?.username || "Sistema", date: todayISO(now), time: time(now) });
}

function canAccess(page) {
  const module = modules.find((item) => item.id === page);
  return module?.roles.includes(currentUser()?.role);
}

function currentUser() {
  return state.users.find((u) => u.id === state.activeUser);
}

function totalStock(product) {
  return product.type === "quintal" ? round(product.warehouse + product.display) : round(product.unitStock);
}

function unitToStock(unit, qty) {
  const factors = { quintal: 1, medio: 0.5, arroba: 0.25, libra: 0.01, onza: 0.000625, unidad: 1 };
  return round((factors[unit] || 1) * qty);
}

function purchaseCostForUnit(product, unit) {
  const factors = { quintal: 1, medio: 0.5, arroba: 0.25, libra: 0.01, onza: 0.000625, unidad: 1 };
  return product.purchasePrice * (factors[unit] || 1);
}

function matchPeriod(date, period) {
  const d = new Date(`${date}T00:00:00`);
  const now = new Date();
  if (period === "today") return date === todayISO(now);
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    return date === todayISO(y);
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return d >= start;
  }
  if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
}

function resetDailyCountersIfNeeded() {
  const today = todayISO();
  if (state.dailyReset !== today) {
    state.dailyReset = today;
    logAction("Reinicio diario automático", "Dashboard, estadísticas y reportes muestran el nuevo día sin borrar historial ni Excel");
    saveState();
  }
}

function downloadFile(filename, href) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBlob(filename, blob) {
  const href = URL.createObjectURL(blob);
  downloadFile(filename, href);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function createPdf(lines) {
  const safeLines = lines.flatMap((line) => splitPdfLine(toPdfText(line), 88));
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    "16 TL",
    ...safeLines.map((line) => `(${pdfEscape(line)}) Tj T*`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function createXlsxWorkbook(sheets) {
  const entries = [];
  const sheetEntries = Object.entries(sheets).map(([name, rows], index) => ({
    id: index + 1,
    name: sanitizeSheetName(name),
    rows,
  }));

  entries.push({
    name: "[Content_Types].xml",
    data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetEntries.map((sheet) => `<Override PartName="/xl/worksheets/sheet${sheet.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`),
  });
  entries.push({
    name: "_rels/.rels",
    data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
  });
  entries.push({
    name: "xl/workbook.xml",
    data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetEntries.map((sheet) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`).join("")}</sheets>
</workbook>`),
  });
  entries.push({
    name: "xl/_rels/workbook.xml.rels",
    data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetEntries.map((sheet) => `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`).join("")}
  <Relationship Id="rId${sheetEntries.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
  });
  entries.push({
    name: "xl/styles.xml",
    data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`),
  });
  sheetEntries.forEach((sheet) => {
    entries.push({ name: `xl/worksheets/sheet${sheet.id}.xml`, data: xml(sheetXml(sheet.rows)) });
  });

  return new Blob([zipStore(entries)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function sheetXml(rows) {
  if (rows.length && Array.isArray(rows[0])) {
    return matrixSheetXml(rows);
  }
  const records = rows.length ? rows : [{ Registro: "Sin registros" }];
  const headers = [...new Set(records.flatMap((row) => Object.keys(row)))];
  const allRows = [headers, ...records.map((row) => headers.map((header) => row[header] ?? ""))];
  return matrixSheetXml(allRows);
}

function matrixSheetXml(allRows) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${allRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(columnIndex, rowIndex, value)).join("")}</row>`).join("")}
  </sheetData>
</worksheet>`;
}

function clearLoginFields() {
  const user = document.querySelector("#loginUser");
  const pass = document.querySelector("#loginPass");
  if (user) user.value = "";
  if (pass) pass.value = "";
}

function groupBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function emptyReportTotals() {
  return { salesCount: 0, profit: 0, productsSold: 0, totalSales: 0, invoices: "" };
}

function reportTotals(sales) {
  return {
    salesCount: sales.length,
    profit: round(sales.reduce((acc, sale) => acc + sale.profit, 0)),
    productsSold: round(sales.flatMap((sale) => sale.items).reduce((acc, item) => acc + item.quantity, 0)),
    totalSales: round(sales.reduce((acc, sale) => acc + sale.total, 0)),
    invoices: sales.map((sale) => sale.number).join(", "),
  };
}

function addReportTotals(target, source) {
  target.salesCount += source.salesCount;
  target.profit = round(target.profit + source.profit);
  target.productsSold = round(target.productsSold + source.productsSold);
  target.totalSales = round(target.totalSales + source.totalSales);
  target.invoices = [target.invoices, source.invoices].filter(Boolean).join(", ");
}

function weekOfMonth(dateText) {
  const date = localDate(dateText);
  return Math.ceil(date.getDate() / 7);
}

function dayName(dateText) {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[localDate(dateText).getDay()];
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[month - 1]} ${year}`;
}

function localDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function cellXml(columnIndex, rowIndex, value) {
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(String(value))}</t></is></c>`;
}

function zipStore(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
    const crc = crc32(data);
    const local = concatBytes(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), name, data,
    );
    localParts.push(local);
    const central = concatBytes(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    );
    centralParts.push(central);
    offset += local.length;
  });
  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const end = concatBytes(u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(centralSize), u32(offset), u16(0));
  return concatBytes(...localParts, ...centralParts, end);
}

function formatMetricValue(value, currency = false) {
  if (currency) return money(value);
  return Number(value) % 1 === 0 ? String(value) : String(round(value));
}

function toPdfText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function splitPdfLine(line, length) {
  const parts = [];
  for (let index = 0; index < line.length; index += length) parts.push(line.slice(index, index + length));
  return parts.length ? parts : [""];
}

function pdfEscape(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizeSheetName(name) {
  return String(name).replace(/[\\/*?:[\]]/g, "_").slice(0, 31) || "Hoja";
}

function xml(value) {
  return new TextEncoder().encode(value.trim());
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index) {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const mod = (current - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    current = Math.floor((current - mod) / 26);
  }
  return name;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}

function concatBytes(...parts) {
  const total = parts.reduce((acc, part) => acc + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function loadState() {
  const saved = localStorage.getItem("agropecuaria-jireh-state");
  if (!saved) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem("agropecuaria-jireh-state", JSON.stringify(state));
}

function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  document.querySelector("#toastHost").appendChild(item);
  setTimeout(() => item.remove(), 4200);
}

function productName(id) {
  return state.products.find((p) => p.id === id)?.name || "Producto eliminado";
}

function unitLabel(unit) {
  return ({ quintal: "Quintal", medio: "Medio quintal", arroba: "Arroba", libra: "Libra", onza: "Onza", unidad: "Unidad" })[unit] || unit;
}

function sum(items, key) {
  return items.reduce((acc, item) => acc + (item[key] || 0), 0);
}

function money(value) {
  return MONEY.format(Number(value || 0)).replace("GTQ", "Q");
}

function number(value) {
  return Number.parseFloat(value || 0) || 0;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function time(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

function nowStamp() {
  const now = new Date();
  return `${todayISO(now)} ${time(now)}`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
