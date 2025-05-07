import { cryptoUtils } from "../background-scripts/cryptoUtils.js";

const recordList = document.getElementById('recordList');
const infoBtn = document.getElementById('infoBtn');
const newRecordBtn = document.getElementById('newRecordBtn');
newRecordBtn.className = "btn btn-add"
const deleteAllBtn = document.getElementById('deleteAllBtn');
deleteAllBtn.className = "btn btn-del"
const importBtn = document.getElementById('importBtn');
importBtn.className = "btn btn-import"
const exportBtn = document.getElementById('exportBtn');
exportBtn.className = "btn btn-export"
const csvFileInput = document.getElementById('csvFileInput');

// Record Modal
const recordModal = document.getElementById('recordModal');
const modalName = document.getElementById('modalName');
const modalScheme = document.getElementById('modalScheme');
const modalBasisUrl = document.getElementById('modalBasisUrl');
const modalPort = document.getElementById('modalPort');
const modalIdentifier = document.getElementById('modalIdentifier');
const modalAccessToken = document.getElementById('modalAccessToken');
const modalActive = document.getElementById('modalActiveToggle');
const modalProxyToggle = document.getElementById('modalProxyToggle');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveModalBtn = document.getElementById('saveModalBtn');

// Info Modal
const infoModal = document.getElementById('infoModal');
const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');

let records = [];

// Hilfsfunktionen
function loadRecords(callback) {
    chrome.storage.local.get(['records'], (res) => {
        records = res.records || [];
        callback(records);
    });
}

function saveRecords(updatedRecords, callback) {
    chrome.storage.local.set({ records: updatedRecords }, () => {
        if (callback) callback();
    });
}

function renderRecords(list) {
    recordList.innerHTML = '';
    list.forEach((record, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'item-wrapper';

        const img = document.createElement('img');
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='white'/><text x='50' y='55' font-size='28' fill='black' text-anchor='middle' font-family='Arial' dy='.3em'>TASK</text></svg>";
        img.alt = "TASK Logo";
        img.className = 'item-image';
        wrapper.appendChild(img);

        const item = document.createElement('div');
        item.className = 'record-item';
        wrapper.appendChild(item);

        // Name Element
        const name = document.createElement('h3');
        name.textContent = record.name;
        name.style.textTransform = 'uppercase';
        item.appendChild(name);

        // Host-Tag
        const hostTag = document.createElement('div');
        hostTag.className = 'tag';
        hostTag.textContent = record.basis_url;
        item.appendChild(hostTag);

        // Active
        const activeGroup = document.createElement('div');
        activeGroup.className = 'switch-group switch-group-record';
        const activeLabel = document.createElement('label');
        activeLabel.textContent = 'Aktiv: ';
        activeLabel.htmlFor = 'recordActiveToggle'
        activeGroup.appendChild(activeLabel);
        const activeLabelInner = document.createElement('label');
        activeLabelInner.className = 'switch switch-record';
        activeGroup.appendChild(activeLabelInner);
        const activeInput = document.createElement('input');
        activeInput.id = 'recordActiveToggle'
        activeInput.type = 'checkbox';
        activeInput.checked = record.active;
        activeInput.addEventListener('change', (e) => {
            const checkbox = e.target;
            if (checkbox && checkbox.checked !== undefined) {
                records[index].active = checkbox.checked;
                saveRecords(records);
            }
        })
        const activeSpan = document.createElement('span');
        activeSpan.className = 'slider round';
        activeLabelInner.appendChild(activeInput);
        activeLabelInner.appendChild(activeSpan);
        item.appendChild(activeGroup);

        // Scheme
        const scheme = document.createElement('span');
        scheme.textContent = `Protokoll: ${ record.scheme }`;
        item.appendChild(scheme);

        // Identifier
        const identifier = document.createElement('span');
        identifier.textContent = `Identifier: ${ record.identifier }`;
        item.appendChild(identifier);

        // AccessToken
        const accessToken = document.createElement('span');
        const decryptedToken = cryptoUtils.decryptToken(record.accessToken);
        const visiblePart = decryptedToken.substring(0, 10);
        const maskedPart = '*'.repeat(decryptedToken.length - 10);
        accessToken.textContent = `AccessToken: ${ visiblePart }${ maskedPart }`;

        item.appendChild(accessToken);

        // Proxy
        const proxyGroup = document.createElement('div');
        proxyGroup.className = 'switch-group switch-group-record';
        const proxyLabel = document.createElement('label');
        proxyLabel.textContent = 'Proxy verwenden: ';
        proxyLabel.htmlFor = 'recordProxyToggle'
        proxyGroup.appendChild(proxyLabel);
        const proxyLabelInner = document.createElement('label');
        proxyLabelInner.className = 'switch switch-record';
        proxyGroup.appendChild(proxyLabelInner);
        const proxyInput = document.createElement('input');
        proxyInput.id = 'recordProxyToggle'
        proxyInput.type = 'checkbox';
        proxyInput.checked = record.proxy;
        proxyInput.addEventListener('change', (e) => {
            const checkbox = e.target;
            if (checkbox && checkbox.checked !== undefined) {
                records[index].proxy = checkbox.checked;
                saveRecords(records);
            }
        })
        const proxySpan = document.createElement('span');
        proxySpan.className = 'slider round';
        proxyLabelInner.appendChild(proxyInput);
        proxyLabelInner.appendChild(proxySpan);
        item.appendChild(proxyGroup);

        // Delete-Button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-secondary';
        deleteButton.title = "Löschen";
        deleteButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 108.29 122.88" style="width:16px; height:16px;">
            <g>
              <path d="M77.4,49.1h-5.94v56.09h5.94V49.1L77.4,49.1L77.4,49.1z M6.06,9.06h32.16V6.2c0-0.1,0-0.19,0.01-0.29
                c0.13-2.85,2.22-5.25,5.01-5.79C43.97-0.02,44.64,0,45.38,0H63.9c0.25,0,0.49-0.01,0.73,0.02c1.58,0.08,3.02,0.76,4.06,1.81
                c1.03,1.03,1.69,2.43,1.79,3.98c0.01,0.18,0.02,0.37,0.02,0.55v2.7H103c0.44,0,0.75,0.01,1.19,0.08c2.21,0.36,3.88,2.13,4.07,4.37
                c0.02,0.24,0.03,0.47,0.03,0.71v10.54c0,1.47-1.19,2.66-2.67,2.66H2.67C1.19,27.43,0,26.23,0,24.76V24.7v-9.91
                C0,10.64,2.04,9.06,6.06,9.06L6.06,9.06z M58.07,49.1h-5.95v56.09h5.95V49.1L58.07,49.1L58.07,49.1z M38.74,49.1H32.8v56.09h5.95
                V49.1L38.74,49.1L38.74,49.1z M10.74,31.57h87.09c0.36,0.02,0.66,0.04,1.03,0.1c1.25,0.21,2.4,0.81,3.27,1.66
                c1.01,1,1.67,2.34,1.7,3.83c0,0.31-0.03,0.63-0.06,0.95l-7.33,78.66c-0.1,1.03-0.27,1.95-0.79,2.92c-1.01,1.88-2.88,3.19-5.2,3.19
                H18.4c-0.55,0-1.05,0-1.59-0.08c-0.22-0.03-0.43-0.08-0.64-0.14c-0.31-0.09-0.62-0.21-0.91-0.35c-0.27-0.13-0.52-0.27-0.78-0.45
                c-1.51-1.04-2.51-2.78-2.69-4.72L4.5,37.88c-0.02-0.25-0.04-0.52-0.04-0.77c0.05-1.48,0.7-2.8,1.7-3.79
                c0.88-0.86,2.06-1.47,3.33-1.67C9.9,31.59,10.34,31.57,10.74,31.57L10.74,31.57z M97.75,36.9H10.6c-0.57,0-0.84,0.1-0.79,0.7
                l7.27,79.05h0l0,0.01c0.03,0.38,0.2,0.69,0.45,0.83l0,0l0.08,0.03l0.06,0.01l0.08,0h72.69c0.6,0,0.67-0.84,0.71-1.28l7.34-78.71
                C98.53,37.04,98.23,36.9,97.75,36.9L97.75,36.9z"/>
            </g>
          </svg>
        `;
        deleteButton.addEventListener('click', () => {
            if (confirm('Wirklich alle Einträge löschen?')) {
                records.splice(index, 1);
                saveRecords(records, () => {
                    renderRecords(records);
                });
            }
        });
        wrapper.appendChild(deleteButton);

        // Duplicate-Button
        const duplicateButton = document.createElement('button');
        duplicateButton.className = 'btn btn-secondary';
        duplicateButton.title = "Duplizieren";
        duplicateButton.innerHTML = `
            <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 100.56 122.88" style="width:16px; height:16px;">
                <g>
                    <path d="M72.15,112.2L90.4,93H72.15V112.2L72.15,112.2z M81.75,9.2c0,1.69-1.37,3.05-3.05,3.05c-1.69,0-3.05-1.37-3.05-3.05V6.11 H6.11v92.24h3.01c1.69,0,3.05,1.37,3.05,3.05c0,1.69-1.37,3.05-3.05,3.05H5.48c-1.51,0-2.88-0.61-3.87-1.61l0.01-0.01 c-1-1-1.61-2.37-1.61-3.87V5.48C0,3.97,0.61,2.6,1.61,1.61C2.6,0.61,3.97,0,5.48,0h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01 c0.99,0.99,1.61,2.36,1.61,3.86V9.2L81.75,9.2z M100.56,90.55c0,1.4-0.94,2.58-2.22,2.94l-26.88,28.27 c-0.56,0.68-1.41,1.11-2.36,1.11c-0.06,0-0.12,0-0.19-0.01c-0.06,0-0.12,0.01-0.18,0.01H24.29c-1.51,0-2.88-0.61-3.87-1.61 l0.01-0.01l-0.01-0.01c-0.99-0.99-1.61-2.36-1.61-3.86v-93.5c0-1.51,0.62-2.88,1.61-3.87l0.01,0.01c1-0.99,2.37-1.61,3.86-1.61 h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01c0.99,0.99,1.61,2.36,1.61,3.86V90.55L100.56,90.55z M94.45,86.9V24.54H24.92v92.24 h41.13V89.95c0-1.69,1.37-3.05,3.05-3.05H94.45L94.45,86.9z"/>
                </g>
            </svg>
        `;
        duplicateButton.addEventListener('click', () => {
            modalName.value = record.name + ' (Kopie)';
            modalScheme.value = record.scheme;
            modalBasisUrl.value = record.basis_url;
            modalPort.value = record.port;
            modalProxyToggle.checked = record.proxy;
            modalIdentifier.value = record.identifier;
            modalAccessToken.value = cryptoUtils.decryptToken(record.accessToken);
            modalActive.checked = record.active;
            recordModal.style.display = 'block';
        });
        wrapper.appendChild(duplicateButton);

        recordList.appendChild(wrapper);
    });
}

// Modal-Steuerung
newRecordBtn.addEventListener('click', () => {
    modalName.value = '';
    modalScheme.value = 'https';
    modalBasisUrl.value = '';
    modalPort.value = '';
    modalProxyToggle.checked = false;
    modalIdentifier.value = '';
    modalAccessToken.value = '';
    modalActive.checked = true;
    recordModal.style.display = 'block';
});

cancelModalBtn.addEventListener('click', () => {
    recordModal.style.display = 'none';
});

infoBtn.addEventListener('click', () => {
    infoModal.style.display = 'block';
})

closeInfoModalBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
});

saveModalBtn.addEventListener('click', () => {
    const newName = modalName.value.trim();
    const scheme = modalScheme.value;
    const basisUrl = modalBasisUrl.value.trim();
    const port = modalPort.value.trim();
    const newId = modalIdentifier.value.trim();
    const accessToken = modalAccessToken.value.trim();
    const active = modalActive.checked;
    const proxy = modalProxyToggle.checked;
    const fullUrl = `${ scheme }://${ basisUrl }:${ port }`;

    if (!newName || !basisUrl || !newId || !accessToken || !port) {
        alert('Bitte alle Felder ausfüllen');
        return;
    }
    records.push({
        name: newName,
        scheme: scheme,
        basis_url: basisUrl,
        port: port,
        identifier: newId,
        fullUrl: fullUrl,
        accessToken: cryptoUtils.encryptToken(accessToken),
        active: active,
        proxy: proxy,
    });
    saveRecords(records, () => {
        renderRecords(records);
    });
    recordModal.style.display = 'none';
});

// Alle Einträge löschen
deleteAllBtn.addEventListener('click', () => {
    if (confirm('Wirklich alle Einträge löschen?')) {
        records = [];
        saveRecords(records, () => {
            renderRecords(records);
        });
    }
});

// Import CSV
importBtn.addEventListener('click', () => {
    csvFileInput.click();
});

csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const importedRecords = [];
        for (let i = 1; i < lines.length; i++) {
            // Spalten: name;scheme;basis_url;port;identifier;accessToken;active;proxy
            const parts = lines[i].split(';');
            if (parts.length >= 8) {
                importedRecords.push({
                    name: parts[0],
                    scheme: parts[1],
                    basis_url: parts[2],
                    port: parts[3],
                    identifier: parts[4],
                    accessToken: parts[5],
                    active: parts[6],
                    proxy: parts[7],
                    fullUrl: `${ parts[1] }://${ parts[2] }:${ parts[3] }`,
                });
            }
        }
        records = [...records, ...importedRecords];
        saveRecords(records, () => renderRecords(records));
    };
    reader.readAsText(file);
});

// Export CSV
exportBtn.addEventListener('click', () => {
    let csvContent = 'name;scheme;basis_url;port;identifier;accessToken;active;proxy\n';
    records.forEach(r => {
        csvContent += `${ r.name };${ r.scheme };${ r.basis_url };${ r.port };${ r.identifier };${ r.accessToken };${ r.active };${ r.proxy }\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Beim Laden
window.addEventListener('load', () => {
    loadRecords((recs) => {
        renderRecords(recs);
    });
});

// Modal schließen, wenn man auf den Hintergrund klickt
window.addEventListener('click', (ev) => {
    if (ev.target === recordModal) {
        recordModal.style.display = 'none';
    }
});
