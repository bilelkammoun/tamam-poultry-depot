document.addEventListener('DOMContentLoaded', () => {
    const inventoryBody = document.getElementById('inventory-body');
    const partModal = document.getElementById('part-modal');
    const partForm = document.getElementById('part-form');
    const addPartBtn = document.getElementById('add-part-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const excelUpload = document.getElementById('excel-upload');
    const modalTitle = document.getElementById('modal-title');

    let inventory = JSON.parse(localStorage.getItem('tamam_inventory')) || [];
    let editIndex = -1;

    // --- Core Functions ---

    const renderInventory = () => {
        inventoryBody.innerHTML = '';
        inventory.forEach((part, index) => {
            const tr = document.createElement('tr');
            if (part.quantite <= part.quantiteMin) {
                tr.classList.add('stock-low');
            }

            tr.innerHTML = `
                <td>${part.designation}</td>
                <td>${part.code || '-'}</td>
                <td>${part.reference || '-'}</td>
                <td>${part.fournisseur || '-'}</td>
                <td><span class="badge ${part.quantite <= part.quantiteMin ? 'badge-low' : 'badge-stock'}">${part.quantite}</span></td>
                <td>${part.quantiteMin || '0'}</td>
                <td>${part.emplacement || '-'}</td>
                <td>
                    <button class="btn-danger" onclick="deletePart(${index})">🗑️</button>
                </td>
            `;
            inventoryBody.appendChild(tr);
        });
    };

    const saveInventory = () => {
        localStorage.setItem('tamam_inventory', JSON.stringify(inventory));
        renderInventory();
    };

    window.deletePart = (index) => {
        if (confirm('Voulez-vous vraiment supprimer cette pièce ?')) {
            inventory.splice(index, 1);
            saveInventory();
        }
    };

    // --- Modal Logic ---

    addPartBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Ajouter une pièce';
        partForm.reset();
        editIndex = -1;
        partModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        partModal.classList.add('hidden');
    });

    partForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPart = {
            designation: document.getElementById('part-designation').value,
            code: document.getElementById('part-code').value,
            reference: document.getElementById('part-reference').value,
            fournisseur: document.getElementById('part-fournisseur').value,
            quantite: parseInt(document.getElementById('part-quantite').value),
            quantiteMin: parseInt(document.getElementById('part-quantite-min').value || 0),
            emplacement: document.getElementById('part-emplacement').value
        };

        if (editIndex > -1) {
            inventory[editIndex] = newPart;
        } else {
            inventory.push(newPart);
        }

        saveInventory();
        partModal.classList.add('hidden');
    });

    // --- Excel Import Logic ---

    excelUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);

            // Mapping: We assume headers match or try to guess
            // For better UX, we could add a mapping step, but here we assume common names
            const importedParts = rows.map(row => ({
                designation: row.Designation || row.designation || row.Nom || 'Sans titre',
                code: row.Code || row.code || '',
                reference: row.Reference || row.reference || row.Ref || '',
                fournisseur: row.Fournisseur || row.fournisseur || row.Supplier || '',
                quantite: parseInt(row.Quantite || row.quantite || row.Stock || 0),
                quantiteMin: parseInt(row.Min || row.min || 0),
                emplacement: row.Emplacement || row.emplacement || row.Location || ''
            }));

            if (confirm(`Importer ${importedParts.length} pièces ? Cela s'ajoutera à votre liste actuelle.`)) {
                inventory = [...inventory, ...importedParts];
                saveInventory();
            }
            excelUpload.value = ''; // Reset input
        };
        reader.readAsBinaryString(file);
    });

    // --- Init ---
    renderInventory();
});
