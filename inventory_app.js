/**
 * TAMAM POULTRY - Inventory Management Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const session = DB.checkAuth();
    
    const inventoryBody = document.getElementById('inventory-body');
    const articleModal = document.getElementById('article-modal');
    const articleForm = document.getElementById('article-form');
    const movementModal = document.getElementById('movement-modal');
    const movementForm = document.getElementById('movement-form');
    const excelUpload = document.getElementById('excel-upload');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const clearAllBtn = document.getElementById('clear-all-btn');

    let articles = await DB.getArticles();
    let currentEditCode = null;

    // --- Role Based UI ---
    if (session.role === 'Admin') {
        clearAllBtn.classList.remove('hidden');
    }

    if (session.role === 'Technicien') {
        document.getElementById('admin-actions').style.display = 'none';
        document.getElementById('nav-movements').style.display = 'none';
        document.getElementById('nav-users').style.display = 'none';
    } else if (session.role === 'Magasinier') {
        document.getElementById('admin-actions').style.display = 'none';
        document.getElementById('nav-users').style.display = 'none';
    }

    // --- Core Functions ---
    const renderInventory = () => {
        const query = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        
        inventoryBody.innerHTML = '';
        const filtered = articles.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(query) || 
                                 a.code.toLowerCase().includes(query) || 
                                 (a.reference && a.reference.toLowerCase().includes(query));
            const matchesCategory = !category || a.category === category;
            return matchesSearch && matchesCategory;
        });

        filtered.forEach(article => {
            const tr = document.createElement('tr');
            if (article.stock <= 5) tr.classList.add('stock-low');

            tr.innerHTML = `
                <td><code style="color: var(--info-color)">${article.code}</code></td>
                <td><strong>${article.name}</strong></td>
                <td><span class="badge badge-role">${article.category || '-'}</span></td>
                <td>${article.location || '-'}</td>
                <td><span style="font-weight:600">${parseFloat(article.price || 0).toFixed(2)}</span></td>
                <td>
                    <span class="badge ${article.stock <= 5 ? 'badge-low' : 'badge-stock'}">${article.stock}</span>
                    <small style="color: var(--text-muted)">${article.unit || ''}</small>
                </td>
                <td>${article.supplier || '-'}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${session.role !== 'Technicien' ? `
                            <button class="btn-secondary" onclick="openMovementModal('${article.code}')" title="Mouvement Stock" style="padding: 5px 10px">🔄</button>
                            <button class="btn-secondary" onclick="openEditModal('${article.code}')" title="Modifier" style="padding: 5px 10px">✏️</button>
                        ` : ''}
                        ${session.role === 'Admin' ? `
                            <button class="btn-danger" onclick="deleteArticle('${article.code}')" title="Supprimer" style="padding: 5px 10px">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            `;
            inventoryBody.appendChild(tr);
        });

        updateFilters();
    };

    const updateFilters = () => {
        const categories = [...new Set(articles.map(a => a.category).filter(c => c))];
        const current = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Toutes catégories</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            if (cat === current) opt.selected = true;
            categoryFilter.appendChild(opt);
        });
    };

    // --- Modal Logic ---
    window.openEditModal = (code) => {
        const article = articles.find(a => a.code === code);
        if (!article) return;
        
        currentEditCode = code;
        document.getElementById('modal-title').textContent = 'Modifier l\'article';
        document.getElementById('art-code').value = article.code;
        document.getElementById('art-code').readOnly = true;
        document.getElementById('art-name').value = article.name;
        document.getElementById('art-category').value = article.category || '';
        document.getElementById('art-location').value = article.location || '';
        document.getElementById('art-supplier').value = article.supplier || '';
        document.getElementById('art-price').value = article.price || 0;
        document.getElementById('art-unit').value = article.unit || '';
        document.getElementById('art-stock').value = article.stock;
        
        articleModal.classList.remove('hidden');
    };

    document.getElementById('add-part-btn').addEventListener('click', () => {
        currentEditCode = null;
        articleForm.reset();
        document.getElementById('modal-title').textContent = 'Ajouter une pièce';
        document.getElementById('art-code').readOnly = false;
        articleModal.classList.remove('hidden');
    });

    document.getElementById('close-modal').addEventListener('click', () => articleModal.classList.add('hidden'));

    articleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const article = {
            code: document.getElementById('art-code').value,
            name: document.getElementById('art-name').value,
            category: document.getElementById('art-category').value,
            location: document.getElementById('art-location').value,
            supplier: document.getElementById('art-supplier').value,
            price: parseFloat(document.getElementById('art-price').value) || 0,
            unit: document.getElementById('art-unit').value,
            stock: parseInt(document.getElementById('art-stock').value) || 0
        };
        await DB.saveArticle(article);
        articles = await DB.getArticles();
        renderInventory();
        articleModal.classList.add('hidden');
    });

    window.deleteArticle = async (code) => {
        if (confirm('Supprimer cet article ?')) {
            await DB.deleteArticle(code);
            articles = await DB.getArticles();
            renderInventory();
        }
    };

    clearAllBtn.addEventListener('click', async () => {
        const confirm1 = confirm("⚠️ ATTENTION : Voulez-vous vraiment EFFACER TOUS les articles du magasin ? Cette action est irréversible.");
        if (confirm1) {
            const confirm2 = confirm("Sûr à 100% ? Tout le stock sera remis à zéro.");
            if (confirm2) {
                await DB.clearArticles();
                articles = await DB.getArticles();
                renderInventory();
                alert("Le magasin a été vidé.");
            }
        }
    });

    // --- Stock Movement Logic ---
    window.openMovementModal = (code) => {
        const article = articles.find(a => a.code === code);
        if (!article) return;
        document.getElementById('move-art-code').value = code;
        document.getElementById('move-title').textContent = `Mouvement : ${article.name}`;
        movementModal.classList.remove('hidden');
    };

    document.getElementById('close-move-modal').addEventListener('click', () => movementModal.classList.add('hidden'));

    movementForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('move-art-code').value;
        const type = document.getElementById('move-type').value;
        const quantity = parseInt(document.getElementById('move-quantity').value);
        const reason = document.getElementById('move-reason').value;

        const article = articles.find(a => a.code === code);
        if (type === 'OUT' && article.stock < quantity) {
            alert('Stock insuffisant !');
            return;
        }

        article.stock = type === 'IN' ? article.stock + quantity : article.stock - quantity;
        await DB.saveArticle(article);
        
        await DB.addMovement({
            partCode: code,
            partName: article.name,
            action: type === 'IN' ? 'Entrée' : 'Sortie',
            quantity: quantity,
            user: session.name,
            reason: reason
        });

        articles = await DB.getArticles();
        renderInventory();
        movementModal.classList.add('hidden');
        movementForm.reset();
    });

    // --- Excel Import ---
    excelUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);

            const findKey = (row, keys) => {
                const rowKeys = Object.keys(row);
                // Try exact match first
                for (const k of keys) {
                    const found = rowKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                    if (found) return row[found];
                }
                // Try fuzzy match
                for (const k of keys) {
                    const found = rowKeys.find(rk => rk.toLowerCase().includes(k.toLowerCase()));
                    if (found) return row[found];
                }
                return null;
            };

            const mapping = {
                code: ['Code', 'Reference', 'Réf', 'الرمز', 'كود', 'مرجع'],
                name: ['Designation', 'Désignation', 'Nom', 'Name', 'تسمية', 'إسم', 'المادة', 'بيان', 'البيان'],
                category: ['Categorie', 'Catégorie', 'Category', 'صنف', 'فئة'],
                stock: ['Stock', 'Quantite', 'Quantité', 'Qty', 'كمية', 'مخزون'],
                location: ['Emplacement', 'Location', 'موقع', 'مكان'],
                supplier: ['Fournisseur', 'Supplier', 'مورد'],
                price: ['Prix', 'Price', 'سعر', 'ثمن'],
                unit: ['Unite', 'Unité', 'Unit', 'وحدة']
            };

            json.forEach(row => {
                const article = {
                    code: String(findKey(row, mapping.code) || '').trim(),
                    name: findKey(row, mapping.name) || 'Sans nom',
                    category: findKey(row, mapping.category) || 'Non classé',
                    stock: parseInt(findKey(row, mapping.stock) || 0),
                    location: findKey(row, mapping.location) || '',
                    supplier: findKey(row, mapping.supplier) || '',
                    price: parseFloat(findKey(row, mapping.price) || 0),
                    unit: findKey(row, mapping.unit) || 'pce'
                };
                
                if (article.code) {
                    await DB.saveArticle(article);
                }
            });

            articles = await DB.getArticles();
            renderInventory();
            alert(`${json.length} articles synchronisés avec succès.`);
        };
        reader.readAsArrayBuffer(file);
    });

    // --- Initial Render ---
    searchInput.addEventListener('input', renderInventory);
    categoryFilter.addEventListener('change', renderInventory);
    renderInventory();
});
