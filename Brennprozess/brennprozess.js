// === Konfiguration ===
const ADMIN_PASSWORD = 'admin1605'; // Sollte in einer echten App verschlüsselt sein
const STORAGE_KEY = 'brennprozess_entries';
const UNTERHALT_STORAGE_KEY = 'unterhalt_entries';
const ACCESS_PASSWORDS = ['adw_kiln', 'admin1605'];

// === DOM Elements ===
const form = document.getElementById('brennForm');
const datumInput = document.getElementById('datumInput');
const bemerkungenInput = document.getElementById('bemerkungenInput');
const bemerkungenCount = document.getElementById('bemerkungenCount');
const wPersonenInput = document.getElementById('wPersonenInput');
const wPersonenCount = document.getElementById('wPersonenCount');
const vornameInput = document.getElementById('vornameInput');
const nachnameInput = document.getElementById('nachnameInput');
const anzahlExterneSelect = document.getElementById('anzahlExterneSelect');
const brennzyklusSelect = document.getElementById('brennzyklusSelect');
const brennmodusSelect = document.getElementById('brennmodusSelect');
const entriesList = document.getElementById('entriesList');
const unterhaltBeitraegeTotal = document.getElementById('unterhaltBeitraegeTotal');
const unterhaltAusgabenTotal = document.getElementById('unterhaltAusgabenTotal');
const unterhaltKontostand = document.getElementById('unterhaltKontostand');
const accessOverlay = document.getElementById('accessOverlay');
const accessPasswordInput = document.getElementById('accessPassword');
const accessButton = document.getElementById('accessButton');
const accessError = document.getElementById('accessError');

// Unterhalt Form
const unterhaltForm = document.getElementById('unterhaltForm');
const unterhaltVornameInput = document.getElementById('unterhaltVornameInput');
const unterhaltNachnameInput = document.getElementById('unterhaltNachnameInput');
const unterhaltDatumInput = document.getElementById('unterhaltDatumInput');
const unterhaltBetragInput = document.getElementById('unterhaltBetragInput');
const unterhaltBemerkungenInput = document.getElementById('unterhaltBemerkungenInput');
const unterhaltBemerkungenCount = document.getElementById('unterhaltBemerkungenCount');

// Admin
const adminButton = document.getElementById('adminButton');
const adminModal = document.getElementById('adminModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const adminPassword = document.getElementById('adminPassword');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminPanel = document.getElementById('adminPanel');
const adminForm = document.getElementById('adminForm');
const adminLogoutButton = document.getElementById('adminLogoutButton');
const adminEntriesList = document.getElementById('adminEntriesList');

// Delete
const deleteModal = document.getElementById('deleteModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const deletePassword = document.getElementById('deletePassword');
const deleteConfirmButton = document.getElementById('deleteConfirmButton');
const deleteCancelButton = document.getElementById('deleteCancelButton');
const deletePasswordError = document.getElementById('deletePasswordError');

// Export
const exportButton = document.getElementById('exportButton');
const exportModal = document.getElementById('exportModal');
const exportModalClose = document.getElementById('exportModalClose');
const exportPassword = document.getElementById('exportPassword');
const exportConfirmButton = document.getElementById('exportConfirmButton');
const exportCancelButton = document.getElementById('exportCancelButton');
const exportPasswordError = document.getElementById('exportPasswordError');

// === State ===
let isAdminLoggedIn = false;
let entryIdToDelete = null;
let entryTypeToDelete = 'brennprozess'; // 'brennprozess' oder 'unterhalt'

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  setupEventListeners();
  checkAccess();
});

function setupEventListeners() {
  // Form
  form.addEventListener('submit', handleFormSubmit);
  form.addEventListener('reset', resetForm);

  // Datum-Eingabe beim Verlassen normalisieren
  datumInput.addEventListener('blur', normalizeDatumInput);

  // Character counters
  bemerkungenInput.addEventListener('input', updateCharCount);
  wPersonenInput.addEventListener('input', updateCharCount);

  // Unterhalt Form
  unterhaltForm.addEventListener('submit', handleUnterhaltFormSubmit);
  unterhaltForm.addEventListener('reset', resetUnterhaltForm);
  unterhaltDatumInput.addEventListener('blur', normalizeUnterhaltDatumInput);
  unterhaltBemerkungenInput.addEventListener('input', updateCharCount);

  // Admin
  adminButton.addEventListener('click', openAdminModal);
  modalClose.addEventListener('click', closeAdminModal);
  modalOverlay.addEventListener('click', closeAdminModal);
  adminLoginButton.addEventListener('click', handleAdminLogin);
  adminLogoutButton.addEventListener('click', handleAdminLogout);

  // Delete
  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteCancelButton.addEventListener('click', closeDeleteModal);
  deleteConfirmButton.addEventListener('click', handleDeleteConfirm);

  // Access Control
  accessButton.addEventListener('click', handleAccessSubmit);
  accessPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAccessSubmit();
    }
  });

  // Export
  exportButton.addEventListener('click', openExportModal);
  exportModalClose.addEventListener('click', closeExportModal);
  exportCancelButton.addEventListener('click', closeExportModal);
  exportConfirmButton.addEventListener('click', handleExportConfirm);
}

function parseDate(dateString) {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

function checkAccess() {
  showAccessOverlay();
}

function showAccessOverlay() {
  if (accessOverlay) {
    accessOverlay.classList.remove('hidden');
  }
  document.body.classList.add('no-scroll');
  if (accessPasswordInput) {
    accessPasswordInput.focus();
  }
}

function hideAccessOverlay() {
  if (accessOverlay) {
    accessOverlay.classList.add('hidden');
  }
  document.body.classList.remove('no-scroll');
}

function handleAccessSubmit() {
  if (!accessPasswordInput) {
    return;
  }

  const password = accessPasswordInput.value.trim();
  if (ACCESS_PASSWORDS.includes(password)) {
    hideAccessOverlay();
    accessPasswordInput.value = '';
    if (accessError) {
      accessError.textContent = '';
      accessError.classList.remove('show');
    }
  } else {
    if (accessError) {
      accessError.textContent = 'Kennwort falsch. Bitte erneut versuchen.';
      accessError.classList.add('show');
    }
    accessPasswordInput.value = '';
    accessPasswordInput.focus();
  }
}

function normalizeDatumInput() {
  let value = datumInput.value.trim();
  if (!value) {
    return;
  }

  // Punkte, Bindestriche oder Leerzeichen in Slashes umwandeln
  value = value.replace(/[.\-\s]+/g, '/');

  // Nur Ziffern und Slashes zulassen
  value = value.replace(/[^0-9/]/g, '');

  // Mehr als zwei Slashes verhindern und führende/trailing Slashes entfernen
  const rawParts = value.split('/').filter(part => part !== '').slice(0, 3);

  let day = '';
  let month = '';
  let year = '';

  if (rawParts.length === 1) {
    const digits = rawParts[0].replace(/\D/g, '');
    if (digits.length >= 8) {
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4, 8);
    } else if (digits.length >= 4) {
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4);
    } else if (digits.length > 2) {
      day = digits.slice(0, 2);
      month = digits.slice(2);
    } else {
      day = digits;
    }
  } else {
    day = rawParts[0] || '';
    month = rawParts[1] || '';
    year = rawParts[2] || '';
  }

  if (day) {
    day = day.padStart(2, '0');
  }
  if (month) {
    month = month.padStart(2, '0');
  }
  if (year && year.length > 4) {
    year = year.slice(0, 4);
  }

  value = [day, month, year].filter((segment, index) => segment !== '' || index < 2).join('/');
  datumInput.value = value;
}

// === Character Counter ===
function updateCharCount(e) {
  const input = e.target;
  let countElement;
  
  if (input === bemerkungenInput) {
    countElement = bemerkungenCount;
  } else if (input === wPersonenInput) {
    countElement = wPersonenCount;
  } else if (input === unterhaltBemerkungenInput) {
    countElement = unterhaltBemerkungenCount;
  }
  
  if (countElement) {
    countElement.textContent = input.value.length;
  }
}

// === Form Validation ===
function validateForm() {
  clearAllErrors();
  let isValid = true;

  // Datum
  if (!datumInput.value) {
    showFieldError('datumInput', 'Datum ist erforderlich');
    isValid = false;
  } else {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    const parsedDate = parseDate(datumInput.value);
    if (!dateRegex.test(datumInput.value) || !parsedDate) {
      showFieldError('datumInput', 'Datum muss im Format DD/MM/YYYY sein');
      isValid = false;
    }
  }

  // Vorname
  if (!vornameInput.value.trim()) {
    showFieldError('vornameInput', 'Vorname ist erforderlich');
    isValid = false;
  }

  // Nachname
  if (!nachnameInput.value.trim()) {
    showFieldError('nachnameInput', 'Nachname ist erforderlich');
    isValid = false;
  }

  // Anzahl Externe
  if (!anzahlExterneSelect.value) {
    showFieldError('anzahlExterneSelect', 'Anzahl Externe ist erforderlich');
    isValid = false;
  }

  // Brennzyklus
  if (!brennzyklusSelect.value) {
    showFieldError('brennzyklusSelect', 'Brenn-Zyklus ist erforderlich');
    isValid = false;
  }

  // Brennmodus
  if (!brennmodusSelect.value) {
    showFieldError('brennmodusSelect', 'Brennmodus ist erforderlich');
    isValid = false;
  }

  if (datumInput.value) {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    const parsedDate = parseDate(datumInput.value);
    if (!dateRegex.test(datumInput.value) || !parsedDate) {
      showFieldError('datumInput', 'Datum muss im Format DD/MM/YYYY sein');
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);

  if (field) {
    field.parentElement.classList.add('error');
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);

  if (field && field.parentElement) {
    field.parentElement.classList.remove('error');
  }

  if (errorElement) {
    errorElement.classList.remove('show');
  }
}

function clearAllErrors() {
  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('error');
  });
  document.querySelectorAll('.error-message').forEach(msg => {
    msg.classList.remove('show');
  });
}

// === Form Submission ===
function handleFormSubmit(e) {
  e.preventDefault();

  normalizeDatumInput();

  if (!validateForm()) {
    return;
  }

  const entry = {
    id: Date.now().toString(),
    datum: datumInput.value,
    bemerkungen: bemerkungenInput.value,
    vorname: vornameInput.value,
    nachname: nachnameInput.value,
    wPersonen: wPersonenInput.value,
    anzahlExterne: anzahlExterneSelect.value,
    brennzyklus: brennzyklusSelect.value,
    brennmodus: brennmodusSelect.value,
    timestamp: new Date().toISOString()
  };

  addEntry(entry);
  form.reset();
  bemerkungenCount.textContent = '0';
  wPersonenCount.textContent = '0';
  datumInput.value = '';

  // Show success message
  showSuccessMessage('Eintrag erfolgreich erstellt!');
}

function resetForm() {
  clearAllErrors();
  bemerkungenCount.textContent = '0';
  wPersonenCount.textContent = '0';
  datumInput.value = '';
}

// === Unterhalt Form ===
function normalizeUnterhaltDatumInput() {
  let value = unterhaltDatumInput.value.trim();
  if (!value) {
    return;
  }

  // Punkte, Bindestriche oder Leerzeichen in Slashes umwandeln
  value = value.replace(/[.\-\s]+/g, '/');

  // Nur Ziffern und Slashes zulassen
  value = value.replace(/[^0-9/]/g, '');

  // Mehr als zwei Slashes verhindern
  const rawParts = value.split('/').filter(part => part !== '').slice(0, 3);

  let day = '';
  let month = '';
  let year = '';

  if (rawParts.length === 1) {
    const digits = rawParts[0].replace(/\D/g, '');
    if (digits.length >= 8) {
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4, 8);
    } else if (digits.length >= 4) {
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4);
    } else if (digits.length > 2) {
      day = digits.slice(0, 2);
      month = digits.slice(2);
    } else {
      day = digits;
    }
  } else {
    day = rawParts[0] || '';
    month = rawParts[1] || '';
    year = rawParts[2] || '';
  }

  if (day) {
    day = day.padStart(2, '0');
  }
  if (month) {
    month = month.padStart(2, '0');
  }
  if (year && year.length > 4) {
    year = year.slice(0, 4);
  }

  value = [day, month, year].filter((segment, index) => segment !== '' || index < 2).join('/');
  unterhaltDatumInput.value = value;
}

function handleUnterhaltFormSubmit(e) {
  e.preventDefault();

  normalizeUnterhaltDatumInput();

  if (!validateUnterhaltForm()) {
    return;
  }

  const entry = {
    id: Date.now().toString(),
    vorname: unterhaltVornameInput.value,
    nachname: unterhaltNachnameInput.value,
    datum: unterhaltDatumInput.value,
    betrag: parseFloat(unterhaltBetragInput.value),
    bemerkungen: unterhaltBemerkungenInput.value,
    type: 'unterhalt',
    timestamp: new Date().toISOString()
  };

  addUnterhaltEntry(entry);
  unterhaltForm.reset();
  unterhaltVornameInput.value = '';
  unterhaltNachnameInput.value = '';
  unterhaltDatumInput.value = '';
  unterhaltBetragInput.value = '';
  unterhaltBemerkungenInput.value = '';
  unterhaltBemerkungenCount.textContent = '0';

  // Show success message
  showSuccessMessage('Ausgabe erfolgreich erfasst!');
}

function resetUnterhaltForm() {
  clearAllErrors();
  unterhaltVornameInput.value = '';
  unterhaltNachnameInput.value = '';
  unterhaltDatumInput.value = '';
  unterhaltBetragInput.value = '';
  unterhaltBemerkungenInput.value = '';
  unterhaltBemerkungenCount.textContent = '0';
}

function validateUnterhaltForm() {
  clearAllErrors();
  let isValid = true;

  // Vorname
  if (!unterhaltVornameInput.value.trim()) {
    showFieldError('unterhaltVornameInput', 'Vorname ist erforderlich');
    isValid = false;
  }

  // Nachname
  if (!unterhaltNachnameInput.value.trim()) {
    showFieldError('unterhaltNachnameInput', 'Nachname ist erforderlich');
    isValid = false;
  }

  // Datum
  if (!unterhaltDatumInput.value) {
    showFieldError('unterhaltDatumInput', 'Datum ist erforderlich');
    isValid = false;
  } else {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    const parsedDate = parseDate(unterhaltDatumInput.value);
    if (!dateRegex.test(unterhaltDatumInput.value) || !parsedDate) {
      showFieldError('unterhaltDatumInput', 'Datum muss im Format DD/MM/YYYY sein');
      isValid = false;
    }
  }

  // Betrag
  if (!unterhaltBetragInput.value) {
    showFieldError('unterhaltBetragInput', 'Betrag ist erforderlich');
    isValid = false;
  } else {
    const betrag = parseFloat(unterhaltBetragInput.value);
    if (isNaN(betrag) || betrag < 0) {
      showFieldError('unterhaltBetragInput', 'Betrag muss eine positive Zahl sein');
      isValid = false;
    }
  }

  return isValid;
}

function getUnterhaltEntries() {
  const stored = localStorage.getItem(UNTERHALT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function updateUnterhaltSummary() {
  const brennEntries = getEntries();
  const unterhaltEntries = getUnterhaltEntries();
  const totalBeitraege = brennEntries.reduce((sum, entry) => {
    const unterhalt = Number(calculateInvoiceAmount(entry, true).unterhaltsbeitrag || 0);
    return sum + unterhalt;
  }, 0);
  const totalAusgaben = unterhaltEntries.reduce((sum, entry) => {
    const betrag = Number(entry.betrag || 0);
    return sum + betrag;
  }, 0);
  const kontostand = totalBeitraege - totalAusgaben;

  if (unterhaltBeitraegeTotal) {
    unterhaltBeitraegeTotal.textContent = formatInvoiceAmount(totalBeitraege);
  }
  if (unterhaltAusgabenTotal) {
    unterhaltAusgabenTotal.textContent = formatInvoiceAmount(totalAusgaben);
  }
  if (unterhaltKontostand) {
    unterhaltKontostand.textContent = formatInvoiceAmount(kontostand);
    unterhaltKontostand.style.color = kontostand < 0 ? 'var(--danger-color)' : 'var(--success-color)';
  }
}

function saveUnterhaltEntries(entries) {
  localStorage.setItem(UNTERHALT_STORAGE_KEY, JSON.stringify(entries));
}

function addUnterhaltEntry(entry) {
  const entries = getUnterhaltEntries();
  entries.push(entry);
  saveUnterhaltEntries(entries);
  loadEntries();
}

function deleteUnterhaltEntry(id) {
  const entries = getUnterhaltEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveUnterhaltEntries(filtered);
  loadEntries();
  if (isAdminLoggedIn) {
    loadAdminEntries();
  }
}

// === Entry Management ===
function addEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
  loadEntries();
}

function getEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function deleteEntry(id) {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveEntries(filtered);
  loadEntries();
  if (isAdminLoggedIn) {
    loadAdminEntries();
  }
}

function loadEntries() {
  const brennEntries = getEntries();
  const unterhaltEntries = getUnterhaltEntries();
  
  // Kombiniere beide Arrays und sortiere nach Datum (absteigend)
  const allEntries = [
    ...brennEntries.map(e => ({ ...e, entryType: 'brennprozess' })),
    ...unterhaltEntries.map(e => ({ ...e, entryType: 'unterhalt' }))
  ];
  
  // Sortiere nach Datum und Erfassungszeit (neueste zuerst)
  allEntries.sort((a, b) => {
    const dateA = parseDate(a.datum);
    const dateB = parseDate(b.datum);

    if (dateA && dateB && dateB.getTime() !== dateA.getTime()) {
      return dateB - dateA;
    }

    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  entriesList.innerHTML = '';
  updateUnterhaltSummary();

  if (allEntries.length === 0) {
    entriesList.innerHTML = '<p class="empty-message">Keine Einträge vorhanden.</p>';
    return;
  }

  allEntries.forEach(entry => {
    const entryElement = createEntryElement(entry);
    entriesList.appendChild(entryElement);
  });
}

function createEntryElement(entry) {
  const div = document.createElement('div');
  div.className = 'entry-item';

  // Wenn es ein Unterhalt-Eintrag ist
  if (entry.entryType === 'unterhalt') {
    div.innerHTML = `
      <div class="entry-header">
        <div class="entry-date">${entry.datum}</div>
          <div class="entry-badge" style="background-color: #ff9800;">Unterhalt</div>
        <button type="button" class="delete-entry-btn" data-id="${entry.id}" data-type="unterhalt">🗑 Löschen</button>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Name</div>
          <div class="entry-value">${entry.vorname} ${entry.nachname}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Ausgaben CHF</div>
          <div class="entry-value">${formatInvoiceAmount(entry.betrag)}</div>
        </div>
      </div>
      ${entry.bemerkungen ? `
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Bemerkungen</div>
          <div class="entry-value">${escapeHtml(entry.bemerkungen)}</div>
        </div>
      </div>
      ` : ''}
    `;
  } else {
    // Brennprozess-Eintrag
    const breakdown = calculateInvoiceAmount(entry, true);
    const totalAmount = calculateInvoiceAmount(entry);
    const grundkosten = totalAmount - breakdown.solibeitrag;

    div.innerHTML = `
      <div class="entry-header">
        <div class="entry-date">${entry.datum}</div>
        <div class="entry-badge">Ofen-Nutzung</div>
        <button type="button" class="delete-entry-btn" data-id="${entry.id}">🗑 Löschen</button>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Verantwortliche Person</div>
          <div class="entry-value">${escapeHtml(entry.vorname)} ${escapeHtml(entry.nachname)}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Weitere Personen</div>
          <div class="entry-value">${entry.wPersonen ? escapeHtml(entry.wPersonen) : '-'}</div>
        </div>
      </div>
      <div class="entry-row total-row">
        <div class="entry-field">
          <div class="entry-label">Gesamtbetrag</div>
          <div class="entry-value">${formatInvoiceAmount(totalAmount)}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">&#11153; Davon Grundkosten (Alle)</div>
          <div class="entry-value">${formatInvoiceAmount(grundkosten)}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">&#11153; Davon Solibeitrag (Externe)</div>
          <div class="entry-value">${formatInvoiceAmount(breakdown.solibeitrag)}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Anzahl externe Personen</div>
          <div class="entry-value">${entry.anzahlExterne}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Brennmodus</div>
          <div class="entry-value">${escapeHtml(entry.brennmodus)}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Brenn-Zyklus (Betriebsstunden)</div>
          <div class="entry-value">${entry.brennzyklus}</div>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field">
          <div class="entry-label">Bemerkungen</div>
          <div class="entry-value">${entry.bemerkungen ? escapeHtml(entry.bemerkungen) : '-'}</div>
        </div>
      </div>
    `;
  }

  // Event-Listener für Delete-Button
  const deleteBtn = div.querySelector('.delete-entry-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      entryIdToDelete = entry.id;
      entryTypeToDelete = entry.entryType || 'brennprozess';
      openDeleteModal();
    });
  }

  return div;
}

function calculateInvoiceAmount(entry, breakdown = false) {
  const brennzyklus = Number(entry.brennzyklus) || 0;
  const anzahlExterne = Number(entry.anzahlExterne) || 0;
  const factor = entry.brennmodus === 'Hochbrand' ? 0.5 : 0.4;
  const solibeitrag = anzahlExterne * 10;
  const admingebuehr = 3;
  const unterhaltsbeitrag = 10;
  const stromkosten = (brennzyklus * 10) * factor;
  const total = solibeitrag + admingebuehr + unterhaltsbeitrag + stromkosten;

  if (breakdown) {
    return {
      solibeitrag,
      admingebuehr,
      unterhaltsbeitrag,
      stromkosten,
      total
    };
  }

  return total;
}

function formatInvoiceAmount(amount) {
  return `${amount.toFixed(2).replace('.', ',')} CHF`;
}

// === Delete Modal Functions ===
function openDeleteModal() {
  deleteModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  deletePassword.value = '';
  deletePasswordError.classList.remove('show');
  deletePassword.focus();
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  deletePassword.value = '';
  deletePasswordError.classList.remove('show');
  entryIdToDelete = null;
}

function handleDeleteConfirm() {
  const password = deletePassword.value;

  if (!password) {
    showDeleteError('Kennwort erforderlich');
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    showDeleteError('Kennwort falsch');
    deletePassword.value = '';
    return;
  }

  // Lösche den richtigen Eintrag-Typ
  if (entryTypeToDelete === 'unterhalt') {
    deleteUnterhaltEntry(entryIdToDelete);
  } else {
    deleteEntry(entryIdToDelete);
  }
  
  closeDeleteModal();
  showSuccessMessage('Eintrag wurde gelöscht!');
}

function showDeleteError(message) {
  deletePasswordError.textContent = message;
  deletePasswordError.classList.add('show');
}

// === Export Modal Functions ===
function openExportModal(e) {
  e.preventDefault();
  exportModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  exportPassword.value = '';
  exportPasswordError.classList.remove('show');
  exportPassword.focus();
}

function closeExportModal() {
  exportModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  exportPassword.value = '';
  exportPasswordError.classList.remove('show');
}

function handleExportConfirm() {
  const password = exportPassword.value;

  if (!password) {
    showExportError('Kennwort erforderlich');
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    showExportError('Kennwort falsch');
    exportPassword.value = '';
    return;
  }

  exportToExcel();
  closeExportModal();
  showSuccessMessage('Archiv exportiert!');
}

function showExportError(message) {
  exportPasswordError.textContent = message;
  exportPasswordError.classList.add('show');
}

function exportToExcel() {
  const entries = getEntries();

  if (entries.length === 0) {
    alert('Es gibt keine Einträge zum Exportieren.');
    return;
  }

  // Daten für Excel vorbereiten
  const excelData = entries.map(entry => ({
    'Datum': entry.datum,
    'Verantwortliche Person': `${entry.vorname} ${entry.nachname}`,
    'Weitere Personen': entry.wPersonen || '-',
    'Bemerkungen': entry.bemerkungen || '-',
    'Anzahl Externe': entry.anzahlExterne,
    'Brenn-Zyklus (Stunden)': entry.brennzyklus,
    'Brennmodus': entry.brennmodus,
    'Solibeitrag (CHF)': calculateInvoiceAmount(entry, true).solibeitrag.toFixed(2),
    'Stromkosten (CHF)': calculateInvoiceAmount(entry, true).stromkosten.toFixed(2),
    'Admingebühr (CHF)': calculateInvoiceAmount(entry, true).admingebuehr.toFixed(2),
    'Unterhalts-Beitrag (CHF)': calculateInvoiceAmount(entry, true).unterhaltsbeitrag.toFixed(2),
    'Gesamtbetrag (CHF)': calculateInvoiceAmount(entry).toFixed(2)
  }));

  if (typeof XLSX !== 'undefined' && XLSX && XLSX.utils && typeof XLSX.writeFile === 'function') {
    // Arbeitsblatt erstellen
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Spaltenbreiten anpassen
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 }
    ];

    // Arbeitsmappe erstellen
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Brennprozesse');

    // Datei speichern
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Brennprozess_Archiv_${timestamp}.xlsx`);
  } else {
    downloadCsv(excelData, 'Brennprozess_Archiv', 'csv');
  }
}

function downloadCsv(data, baseName, extension) {
  const rows = [Object.keys(data[0])];
  data.forEach(item => {
    rows.push(Object.values(item).map(value => {
      const cell = String(value).replace(/"/g, '""');
      return `"${cell}"`;
    }));
  });

  const csvContent = rows.map(row => row.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${baseName}_${new Date().toISOString().split('T')[0]}.${extension}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// === Admin Functions ===
function openAdminModal(e) {
  e.preventDefault();
  adminModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  adminPassword.focus();
}

function closeAdminModal() {
  adminModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  adminPassword.value = '';
  document.getElementById('passwordError').classList.remove('show');
}

function handleAdminLogin() {
  const password = adminPassword.value;

  if (!password) {
    showAdminError('Kennwort erforderlich');
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    showAdminError('Kennwort falsch');
    adminPassword.value = '';
    return;
  }

  isAdminLoggedIn = true;
  adminForm.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  loadAdminEntries();
}

function handleAdminLogout() {
  isAdminLoggedIn = false;
  adminPanel.classList.add('hidden');
  adminForm.classList.remove('hidden');
  adminPassword.value = '';
}

function showAdminError(message) {
  const errorElement = document.getElementById('passwordError');
  errorElement.textContent = message;
  errorElement.classList.add('show');
}

function loadAdminEntries() {
  const entries = getEntries();
  adminEntriesList.innerHTML = '';

  if (entries.length === 0) {
    adminEntriesList.innerHTML = '<p style="padding: 12px; text-align: center; color: #999;">Keine Einträge vorhanden.</p>';
    return;
  }

  entries.forEach(entry => {
    const adminEntry = document.createElement('div');
    adminEntry.className = 'admin-entry';

    adminEntry.innerHTML = `
      <div class="admin-entry-info">
        <div class="admin-entry-date">${entry.datum}</div>
        <div class="admin-entry-person">${entry.vorname} ${entry.nachname} | ${entry.brennmodus}</div>
      </div>
      <div class="admin-entry-actions">
        <button type="button" class="delete-button" data-id="${entry.id}">Löschen</button>
      </div>
    `;

    const deleteBtn = adminEntry.querySelector('.delete-button');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Eintrag wirklich löschen?')) {
        deleteEntry(entry.id);
      }
    });

    adminEntriesList.appendChild(adminEntry);
  });
}

// === Utility Functions ===
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showSuccessMessage(message) {
  const msgElement = document.createElement('div');
  msgElement.className = 'success-message';
  msgElement.textContent = message;

  form.insertBefore(msgElement, form.firstChild);

  setTimeout(() => {
    msgElement.remove();
  }, 3000);
}
