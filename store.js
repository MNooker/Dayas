(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const icon = name => `<img src="assets/icons/${name}.svg" width="20" height="20" alt="" aria-hidden="true">`;
  const fmt = amount => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(amount || 0));
  const names = ['blusa-lino', 'cardigan-arena', 'vestido-terracota', 'jeans-azul', 'bolso-borgona', 'sandalias-nude', 'aretes-dorados', 'blusa-rosa', 'bolso-trenzado'];
  const make = (i, name, category, price, stock, sizes, colors) => ({ id: `PR-${1001 + i}`, name, category, price, stock, sizes, colors, status: 'Activo', image: `assets/${names[i]}.webp` });
  const demo = [make(0, 'Blusa de lino Alma', 'Blusas', 799, 16, 'XS,S,M,L', 'Marfil,Blanco'), make(1, 'Cárdigan tejido Siena', 'Tejidos', 1090, 9, 'S,M,L', 'Arena,Café'), make(2, 'Vestido midi Terra', 'Vestidos', 1490, 4, 'S,M,L', 'Terracota,Negro'), make(3, 'Jeans rectos Nora', 'Denim', 1190, 23, '24,26,28,30', 'Azul índigo'), make(4, 'Bolso estructurado Roma', 'Bolsos', 1390, 7, 'Única', 'Borgoña,Negro'), make(5, 'Sandalias Alina', 'Calzado', 990, 12, '23,24,25,26', 'Nude,Camel'), make(6, 'Arracadas Aura doradas', 'Accesorios', 390, 27, 'Única', 'Dorado'), make(8, 'Bolso tejido Elisa', 'Bolsos', 1250, 5, 'Única', 'Café,Coñac')];
  const rawArray = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const state = { products: demo, filter: 'Todos', sort: 'featured', cart: rawArray('daya-cart-v2').filter(item => item && typeof item.id === 'string' && typeof item.key === 'string' && Number.isInteger(item.qty) && item.qty > 0), drawer: '', previousFocus: null, quick: null, size: '', color: '' };
  const pById = id => state.products.find(product => product.id === id);
  const split = value => String(value || 'Única').split(',').map(part => part.trim()).filter(Boolean);
  const active = () => state.products.filter(product => product.status === 'Activo' && Number(product.stock) > 0);
  const normal = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');
  const imgFor = product => { const path = String(product.image || ''); if (window.DAYA_ASSETS?.[path]) return window.DAYA_ASSETS[path]; return /^assets\/[a-z0-9_-]+\.webp$/.test(path) || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(path) ? path : 'assets/blusa-lino.webp'; };
  const saved = () => { try { localStorage.setItem('daya-cart-v2', JSON.stringify(state.cart)); } catch { toast('No se pudo guardar la bolsa en este navegador.'); } };
  const productQuantity = id => state.cart.filter(item => item.id === id).reduce((sum, item) => sum + item.qty, 0);
  function toast(message) { const element = $('#toast'); element.textContent = message; element.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { element.hidden = true; }, 5000); }
  function count() { const quantity = state.cart.reduce((sum, item) => sum + item.qty, 0); const badge = $('#global-cart-count'); badge.textContent = quantity; badge.hidden = !quantity; $('.bag-jump').setAttribute('aria-label', `Ver bolsa, ${quantity} ${quantity === 1 ? 'pieza' : 'piezas'}`); }
  function renderFilters(focusCategory) {
    const products = active(); const categories = ['Todos', ...new Set(products.map(product => product.category))];
    if (!categories.includes(state.filter)) state.filter = 'Todos';
    $('#filter-row').innerHTML = categories.map(category => `<button class="filter-btn ${category === state.filter ? 'active' : ''}" type="button" data-filter="${escape(category)}" aria-pressed="${category === state.filter}">${escape(category)}<span aria-hidden="true">${category === 'Todos' ? products.length : products.filter(product => product.category === category).length}</span></button>`).join('');
    if (focusCategory) $$('#filter-row button').find(button => button.dataset.filter === focusCategory)?.focus({ preventScroll: true });
  }
  function visible() { const products = active().filter(product => state.filter === 'Todos' || product.category === state.filter); if (state.sort === 'low') products.sort((a, b) => a.price - b.price); if (state.sort === 'high') products.sort((a, b) => b.price - a.price); if (state.sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name, 'es')); return products; }
  function renderCatalog() {
    const products = visible();
    $('#product-count').textContent = `${String(products.length).padStart(2, '0')} ${products.length === 1 ? 'PIEZA DISPONIBLE' : 'PIEZAS DISPONIBLES'}${state.filter === 'Todos' ? '' : ' / ' + state.filter.toUpperCase()}`;
    $('#catalog-grid').innerHTML = products.length ? products.map((product, index) => `<article class="product-card"><div class="product-image-wrap"><img src="${escape(imgFor(product))}" alt="${escape(product.name)}" loading="lazy" width="440" height="560"><button class="product-view" type="button" data-quick="${escape(product.id)}" aria-label="Ver detalles de ${escape(product.name)}"></button><span class="product-tag">${index === 0 ? 'SELECCIÓN DAYA' : 'DISPONIBLE'}</span><button class="product-add" type="button" data-pick="${escape(product.id)}" aria-label="Elegir ${escape(product.name)} para la bolsa">${icon('plus')}</button></div><div class="product-info"><div><h3><button type="button" data-quick="${escape(product.id)}" class="product-title-button">${escape(product.name)}</button></h3><p>${escape(String(product.category).toUpperCase())}</p></div><strong class="product-price">${fmt(product.price)}</strong></div></article>`).join('') : '<div class="empty-catalog"><h3>Una nueva selección está en camino.</h3><p>Explora las otras categorías de la colección.</p><button type="button" class="all-products" data-all>VER TODAS LAS PIEZAS ↗</button></div>';
    $('#catalog-grid').setAttribute('aria-busy', 'false');
    $('#show-all').hidden = state.filter === 'Todos';
  }
  function variantStock(product, size, color) { if (!Array.isArray(product.variants) || !product.variants.length) return Number(product.stock); return Number(product.variants.find(variant => variant.size === size && variant.color === color)?.stock || 0); }
  function chosen(product) { return { size: split(product.sizes).length === 1 ? split(product.sizes)[0] : state.size, color: split(product.colors).length === 1 ? split(product.colors)[0] : state.color }; }
  function selectProduct(id) { const product = pById(id); if (!product) return; const sizes = split(product.sizes), colors = split(product.colors); if (sizes.length === 1 && colors.length === 1) addCart(id, sizes[0], colors[0]); else openQuick(id); }
  function updateQuick() {
    const product = pById(state.quick); if (!product) return;
    const { size, color } = chosen(product);
    $$('[data-size]').forEach(button => { const selected = button.dataset.size === size; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); button.disabled = split(product.colors).every(candidate => variantStock(product, button.dataset.size, candidate) < 1); });
    $$('[data-color]').forEach(button => { const selected = button.dataset.color === color; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); button.disabled = split(product.sizes).every(candidate => variantStock(product, candidate, button.dataset.color) < 1); });
    const ready = size && color && variantStock(product, size, color) > 0;
    $('[data-confirm-pick]').disabled = !ready;
    $('#variant-hint').textContent = ready ? `${size} / ${color} · Lista para agregar` : 'Elige talla y color para continuar.';
  }
  function openQuick(id) {
    const product = pById(id); if (!product) return;
    state.quick = id; state.size = ''; state.color = '';
    if (state.drawer) closeDrawer();
    $('#quick-content').innerHTML = `<div class="quick-layout"><div class="quick-picture"><img src="${escape(imgFor(product))}" alt="${escape(product.name)}" width="560" height="690"></div><div class="quick-info"><p class="eyebrow">DAYA / ${escape(String(product.category).toUpperCase())}</p><h2 id="quick-title">${escape(product.name)}</h2><div class="price">${fmt(product.price)} <small>MXN</small></div><p>Elige los detalles de tu próxima pieza favorita.</p><fieldset class="variant-block"><legend>TALLA</legend><div class="variant-options">${split(product.sizes).map(size => `<button type="button" data-size="${escape(size)}" aria-pressed="false">${escape(size)}</button>`).join('')}</div></fieldset><fieldset class="variant-block"><legend>COLOR</legend><div class="variant-options">${split(product.colors).map(color => `<button type="button" data-color="${escape(color)}" aria-pressed="false">${escape(color)}</button>`).join('')}</div></fieldset><div class="quick-bottom"><p class="variant-hint" id="variant-hint" role="status"></p><button type="button" data-confirm-pick="${escape(product.id)}" class="primary-button" disabled>AGREGAR A LA BOLSA <span aria-hidden="true">↗</span></button></div><p class="quick-disclaimer">${Number(product.stock)} unidades disponibles.<br>Sin pago en línea. La disponibilidad se confirma con la tienda.</p></div></div>`;
    updateQuick(); $('#quick-dialog').showModal(); syncScroll();
  }
  function addCart(id, size, color) {
    const product = pById(id); if (!product || !active().includes(product)) return toast('Esta pieza ya no está disponible.');
    const key = [id, size, color].join('|'); const existing = state.cart.find(item => item.key === key);
    if (productQuantity(id) + 1 > Number(product.stock)) return toast('No quedan más unidades disponibles de esta pieza.');
    if ((existing?.qty || 0) + 1 > variantStock(product, size, color)) return toast('Esta talla y color no tienen más unidades.');
    if (existing) existing.qty += 1; else state.cart.push({ id, key, size, color, qty: 1 });
    saved(); count(); if ($('#quick-dialog').open) $('#quick-dialog').close(); openDrawer('cart'); toast('Pieza añadida a tu bolsa.');
  }
  function total() { return state.cart.reduce((sum, item) => sum + (pById(item.id)?.price || 0) * item.qty, 0); }
  function syncScroll() { document.body.style.overflow = state.drawer || $('#quick-dialog').open || $('#checkout-dialog').open ? 'hidden' : ''; }
  function inertBackground(value) { for (const element of [$('#main'), $('.site-header'), $('.site-footer'), $('#mobile-nav')]) if (element) element.inert = value; }
  function closeDrawer() { const wasOpen = !$('#drawer').hidden; $('#drawer').hidden = true; $('#overlay').hidden = true; state.drawer = ''; inertBackground(false); syncScroll(); if (wasOpen && state.previousFocus?.isConnected) state.previousFocus.focus({ preventScroll: true }); }
  function openDrawer(which) {
    if ($('#quick-dialog').open) $('#quick-dialog').close();
    if (!state.drawer) state.previousFocus = document.activeElement;
    state.drawer = which; $('#drawer').hidden = false; $('#overlay').hidden = false;
    $('#mobile-nav').hidden = true; $('#nav-toggle').setAttribute('aria-expanded', 'false'); $('#nav-toggle').setAttribute('aria-label', 'Abrir menú');
    inertBackground(true); syncScroll(); renderDrawer(); (which === 'search' ? $('#search-input') : $('#drawer-close')).focus();
  }
  function renderDrawer() {
    if (state.drawer === 'cart') {
      $('#drawer-eyebrow').textContent = 'TU SELECCIÓN'; $('#drawer-title').textContent = 'La bolsa';
      $('#drawer-body').innerHTML = state.cart.length ? state.cart.map(item => { const product = pById(item.id); if (!product) return ''; return `<article class="drawer-item"><img src="${escape(imgFor(product))}" alt="${escape(product.name)}" width="91" height="120"><div><h3>${escape(product.name)}</h3><p>${escape([item.size, item.color].filter(Boolean).join(' · '))}</p><strong>${fmt(product.price)}</strong><div class="mini-actions"><div class="quantity"><button type="button" data-adjust="${escape(item.key)}" data-delta="-1" aria-label="Disminuir cantidad de ${escape(product.name)}">${icon('minus')}</button><output aria-label="Cantidad de ${escape(product.name)}">${item.qty}</output><button type="button" data-adjust="${escape(item.key)}" data-delta="1" aria-label="Aumentar cantidad de ${escape(product.name)}">${icon('plus')}</button></div><button type="button" class="line-button" data-remove="${escape(item.key)}" aria-label="Eliminar ${escape(product.name)} de la bolsa">Eliminar</button></div></div></article>`; }).join('') : '<div class="drawer-empty"><h3>Todo empieza con una pieza.</h3><p>Encuentra algo que hable de ti en nuestra colección.</p></div>';
      $('#drawer-foot').innerHTML = state.cart.length ? `<div class="price-line"><span>Subtotal estimado</span><strong>${fmt(total())} MXN</strong></div><button class="primary-button" type="button" id="checkout-open">GUARDAR SOLICITUD <span aria-hidden="true">↗</span></button><p class="muted">Demostración local. No se envía a la tienda ni se realiza un cobro.</p>` : '<button class="primary-button" type="button" id="continue-shopping">EXPLORAR COLECCIÓN <span aria-hidden="true">↗</span></button>';
    } else {
      $('#drawer-eyebrow').textContent = 'DAYA / ENCUENTRA'; $('#drawer-title').textContent = 'Buscar';
      $('#drawer-body').innerHTML = '<div class="search-field"><label for="search-input">NOMBRE O CATEGORÍA</label><input id="search-input" type="search" placeholder="Prueba con lino, bolso, vestido…" autocomplete="off"></div><p class="search-summary" id="search-summary" role="status"></p><div id="search-results"></div>';
      $('#drawer-foot').innerHTML = '<p class="muted">Encuentra esa pieza que tienes en mente.</p>'; searchResults('');
    }
  }
  function searchResults(query) {
    const value = normal(query.trim()); const products = active().filter(product => normal(product.name + ' ' + product.category).includes(value));
    $('#search-summary').textContent = `${products.length} ${products.length === 1 ? 'pieza encontrada' : 'piezas encontradas'}`;
    $('#search-results').innerHTML = products.length ? products.map(product => `<button type="button" class="drawer-item search-result" data-quick="${escape(product.id)}"><img src="${escape(imgFor(product))}" alt="" width="91" height="120"><span><span class="result-name">${escape(product.name)}</span><span class="result-category">${escape(product.category)}</span><strong>${fmt(product.price)}</strong></span></button>`).join('') : '<div class="drawer-empty"><h3>Aún no encontramos esa pieza.</h3><p>Prueba otro nombre o una categoría como bolsos o blusas.</p></div>';
  }
  function refreshCartFocus(dataset) { renderDrawer(); const control = $$('#drawer-body button').find(button => Object.keys(dataset).every(key => button.dataset[key] === dataset[key])); (control || $('#drawer-body button') || $('#continue-shopping') || $('#drawer-close')).focus({ preventScroll: true }); }
  function changeQuantity(key, delta) {
    const item = state.cart.find(line => line.key === key); if (!item) return; const product = pById(item.id); if (!product) return;
    if (delta > 0 && productQuantity(item.id) >= Number(product.stock)) return toast('No hay más unidades disponibles de esta pieza.');
    if (delta > 0 && item.qty + 1 > variantStock(product, item.size, item.color)) return toast('Esta talla y color no tienen más unidades.');
    item.qty += delta; if (item.qty < 1) state.cart = state.cart.filter(line => line.key !== key);
    saved(); count(); refreshCartFocus({ adjust: key, delta: String(delta) });
  }
  function checkout() {
    if (!state.cart.length) return;
    const invalid = state.cart.some(item => !pById(item.id) || productQuantity(item.id) > Number(pById(item.id).stock) || item.qty > variantStock(pById(item.id), item.size, item.color));
    if (invalid) return toast('La disponibilidad cambió. Revisa las cantidades de tu bolsa.');
    closeDrawer(); $('#checkout-success')?.remove(); $('#checkout-form').hidden = false; $('#checkout-error').hidden = true;
    $('#checkout-title').textContent = 'Tu selección, a un paso.'; $('#checkout-dialog').showModal(); syncScroll(); $('#checkout-form [name="name"]').focus();
  }
  function requestOrder(event) {
    event.preventDefault(); if (!state.cart.length) return toast('Tu bolsa está vacía.');
    const form = event.currentTarget; const values = new FormData(form);
    const name = String(values.get('name') || '').trim(), email = String(values.get('email') || '').trim(), phone = String(values.get('phone') || '').trim(), note = String(values.get('note') || '').trim();
    const invalid = name.length < 3 ? form.elements.name : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? form.elements.email : phone.replace(/\D/g, '').length < 10 ? form.elements.phone : null;
    if (invalid) { invalid.setCustomValidity('Revisa este campo antes de continuar.'); invalid.reportValidity(); invalid.setAttribute('aria-invalid', 'true'); return; }
    const order = { id: 'WEB-' + String(Date.now()).slice(-9), name, email, phone, note, items: state.cart.map(item => ({ productId: item.id, name: pById(item.id)?.name || 'Producto', size: item.size, color: item.color, qty: item.qty, price: pById(item.id)?.price || 0 })), total: total(), created: new Date().toISOString(), status: 'Por confirmar', channel: 'Web / demostración' };
    try { localStorage.setItem('daya-web-inquiries-v1', JSON.stringify([order, ...rawArray('daya-web-inquiries-v1')].slice(0, 200))); }
    catch { $('#checkout-error').textContent = 'No pudimos guardar la solicitud. Revisa el espacio o los permisos del navegador e inténtalo de nuevo. Tus datos siguen aquí.'; $('#checkout-error').hidden = false; return; }
    state.cart = []; saved(); count(); form.reset(); form.hidden = true; $('#checkout-title').textContent = 'Tu selección está guardada.';
    const success = document.createElement('div'); success.id = 'checkout-success'; success.className = 'request-success'; success.setAttribute('role', 'status'); success.innerHTML = `${icon('check')}<strong>${escape(order.id)}</strong><p>La solicitud está disponible en Gestión → Solicitudes web de este navegador.</p><p class="muted">No se envió a la tienda. No se hizo ningún cobro ni se reservó inventario. Para consultar tus piezas, escríbenos.</p><a class="editorial-link" href="mailto:dayaclothing.mx@gmail.com?subject=${encodeURIComponent('Consulta sobre selección ' + order.id)}">Escribir a Daya ↗</a><button class="primary-button" type="button" data-close-checkout>SEGUIR EXPLORANDO <span aria-hidden="true">↗</span></button>`;
    $('#checkout-content').append(success); success.tabIndex = -1; success.focus();
  }
  function applyProducts(products) {
    state.products = products;
    state.cart = state.cart.filter(item => { const product = pById(item.id); return product && product.status === 'Activo' && Number(product.stock) > 0; });
    saved(); renderFilters(); renderCatalog(); count();
    if (state.drawer === 'cart') renderDrawer(); if (state.drawer === 'search') searchResults($('#search-input').value);
  }
  async function loadCloudProducts() { try { const response = await fetch('/api/catalog', { cache: 'no-store' }); if (!response.ok) return; const data = await response.json(); if (Array.isArray(data.products) && data.products.length) applyProducts(data.products); } catch { /* Local collection remains usable offline. */ } }
  function loadProducts() {
    if (!('indexedDB' in window)) { loadCloudProducts(); return; }
    let remoteStarted = false; const loadRemote = () => { if (!remoteStarted) { remoteStarted = true; loadCloudProducts(); } };
    try {
      const request = indexedDB.open('daya-clothing-studio', 1);
      request.onupgradeneeded = () => { for (const name of ['products', 'customers', 'orders', 'users', 'tasks', 'checklist', 'outbox', 'events', 'settings', 'meta']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' }); };
      request.onsuccess = () => { const db = request.result; try { const transaction = db.transaction('products', 'readonly'); const records = transaction.objectStore('products').getAll(); records.onsuccess = () => { if (records.result.length) applyProducts(records.result); }; transaction.oncomplete = () => { db.close(); loadRemote(); }; transaction.onerror = () => { db.close(); loadRemote(); }; } catch { db.close(); loadRemote(); } };
      request.onerror = loadRemote; request.onblocked = loadRemote;
    } catch { loadRemote(); }
  }
  function trapDrawer(event) {
    if ($('#drawer').hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return; }
    if (event.key !== 'Tab') return;
    const controls = $$('#drawer button:not([disabled]),#drawer input:not([disabled]),#drawer a[href]'); if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
  }
  function init() {
    renderFilters(); renderCatalog(); count(); loadProducts();
    $('#sort-select').addEventListener('change', event => { state.sort = event.target.value; renderCatalog(); });
    $('#drawer-close').addEventListener('click', closeDrawer); $('#overlay').addEventListener('click', closeDrawer);
    for (const dialog of [$('#quick-dialog'), $('#checkout-dialog')]) { dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); dialog.addEventListener('close', syncScroll); }
    $('#checkout-form').addEventListener('submit', requestOrder); document.addEventListener('keydown', trapDrawer);
    document.addEventListener('click', event => {
      const target = event.target.closest('[data-pick],[data-quick],[data-size],[data-color],[data-confirm-pick],[data-adjust],[data-remove],[data-filter],[data-close-dialog],[data-close-checkout],[data-all]');
      if (target) {
        const data = target.dataset;
        if (data.pick) selectProduct(data.pick); if (data.quick) openQuick(data.quick);
        if (data.size) { state.size = data.size; const product = pById(state.quick); if (state.color && variantStock(product, state.size, state.color) < 1) state.color = ''; updateQuick(); }
        if (data.color) { state.color = data.color; const product = pById(state.quick); if (state.size && variantStock(product, state.size, state.color) < 1) state.size = ''; updateQuick(); }
        if (data.confirmPick) { const product = pById(data.confirmPick); if (product) { const { size, color } = chosen(product); if (size && color) addCart(product.id, size, color); } }
        if (data.adjust) changeQuantity(data.adjust, Number(data.delta));
        if (data.remove) { state.cart = state.cart.filter(item => item.key !== data.remove); saved(); count(); refreshCartFocus({ remove: data.remove }); }
        if (data.filter) { state.filter = data.filter; renderFilters(data.filter); renderCatalog(); }
        if (data.all !== undefined) { state.filter = 'Todos'; renderFilters('Todos'); renderCatalog(); }
        if (data.closeDialog !== undefined) $('#quick-dialog').close(); if (data.closeCheckout !== undefined) $('#checkout-dialog').close(); return;
      }
      if (event.target.closest('.bag-jump')) { event.preventDefault(); openDrawer('cart'); }
      if (event.target.closest('.search-jump')) { event.preventDefault(); openDrawer('search'); }
      if (event.target.closest('#checkout-open')) checkout(); if (event.target.closest('#continue-shopping')) closeDrawer();
      if (event.target.closest('#show-all')) { state.filter = 'Todos'; renderFilters(); renderCatalog(); $('#filter-row button')?.focus(); }
    });
    document.addEventListener('input', event => { if (event.target.id === 'search-input') searchResults(event.target.value); if (event.target.closest('#checkout-form') && event.target.setCustomValidity) { event.target.setCustomValidity(''); event.target.removeAttribute('aria-invalid'); } });
    const params = new URLSearchParams(location.search); if (params.has('buscar')) openDrawer('search'); else if (params.has('bolsa')) openDrawer('cart');
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
