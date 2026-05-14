// === Konfiguration ===
const ADMIN_PASSWORD = 'admin123'; // Sollte in einer echten App verschlüsselt sein
const STORAGE_KEY = 'brennprozess_entries';
const UNTERHALT_STORAGE_KEY = 'unterhalt_entries';
const ACCESS_PASSWORD = 'ADW11';
const ACCESS_VALID_UNTIL_KEY = 'brennprozess_access_valid_until';
const ACCESS_REAUTH_MS = 5 * 60 * 1000;
const SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};
const SB_URL = (SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
const SB_ANON_KEY = SUPABASE_CONFIG.anonKey || '';
const SB_BRENN_TABLE = SUPABASE_CONFIG.brennTable || 'brennprozess_entries';
const SB_UNTERHALT_TABLE = SUPABASE_CONFIG.unterhaltTable || 'unterhalt_entries';

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
let brennEntriesCache = [];
let unterhaltEntriesCache = [];
let cloudSyncEnabled = false;
let syncHealthCheckTimer = null;
let syncHealthCheckInFlight = false;
let accessReauthTimer = null;

const SYNC_CHECK_INTERVAL_MS = 10000;

// === Initialization ===
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await initializeDataStore();
  startSyncHealthChecks();
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
  if (adminButton) {
    adminButton.addEventListener('click', openAdminModal);
  }
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

function updateSyncStatus(enabled) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  if (enabled) {
    el.textContent = '\u25CF Cloud aktiv';
    el.className = 'sync-status sync-cloud';
    el.title = 'Daten werden mit Supabase synchronisiert';
  } else {
    el.textContent = '\u25CF Nur lokal';
    el.className = 'sync-status sync-local';
    el.title = 'Kein Cloud-Sync \u2013 Daten nur auf diesem Ger\u00e4t';
  }
}

async function checkSupabaseConnection() {
  await Promise.all([
    supabaseRequest(SB_BRENN_TABLE, { query: 'select=id&limit=1' }),
    supabaseRequest(SB_UNTERHALT_TABLE, { query: 'select=id&limit=1' })
  ]);
}

async function runSyncHealthCheck() {
  if (syncHealthCheckInFlight || !SB_URL || !SB_ANON_KEY) {
    return;
  }

  syncHealthCheckInFlight = true;
  try {
    await checkSupabaseConnection();

    if (!cloudSyncEnabled) {
      cloudSyncEnabled = true;
      updateSyncStatus(true);
      const remoteState = await fetchSupabaseState();
      brennEntriesCache = remoteState.brennEntries;
      unterhaltEntriesCache = remoteState.unterhaltEntries;
      persistLocalCache();
      loadEntries();
      console.info('Supabase-Sync wieder aktiv.');
    }
  } catch (error) {
    if (cloudSyncEnabled) {
      cloudSyncEnabled = false;
      updateSyncStatus(false);
      console.warn('Supabase-Sync unterbrochen, wechsle auf lokalen Speicher.', error);
    }
  } finally {
    syncHealthCheckInFlight = false;
  }
}

function startSyncHealthChecks() {
  if (syncHealthCheckTimer || !SB_URL || !SB_ANON_KEY) {
    return;
  }

  syncHealthCheckTimer = setInterval(() => {
    runSyncHealthCheck();
  }, SYNC_CHECK_INTERVAL_MS);
}

async function initializeDataStore() {
  loadLocalCache();
  loadEntries();

  if (!SB_URL || !SB_ANON_KEY) {
    updateSyncStatus(false);
    return;
  }

  try {
    const remoteState = await fetchSupabaseState();
    cloudSyncEnabled = true;
    updateSyncStatus(true);

    const hasRemoteData = remoteState.brennEntries.length > 0 || remoteState.unterhaltEntries.length > 0;
    const hasLocalData = brennEntriesCache.length > 0 || unterhaltEntriesCache.length > 0;

    if (hasRemoteData) {
      brennEntriesCache = remoteState.brennEntries;
      unterhaltEntriesCache = remoteState.unterhaltEntries;
      persistLocalCache();
      loadEntries();
      return;
    }

    if (hasLocalData) {
      await migrateLocalDataToSupabase();
      const migratedState = await fetchSupabaseState();
      brennEntriesCache = migratedState.brennEntries;
      unterhaltEntriesCache = migratedState.unterhaltEntries;
      persistLocalCache();
      loadEntries();
    }
  } catch (error) {
    cloudSyncEnabled = false;
    updateSyncStatus(false);
    console.warn('Supabase-Sync nicht verfügbar, nutze lokalen Speicher.', error);
  }
}

function loadLocalCache() {
  try {
    const brennStored = localStorage.getItem(STORAGE_KEY);
    const unterhaltStored = localStorage.getItem(UNTERHALT_STORAGE_KEY);
    brennEntriesCache = brennStored ? JSON.parse(brennStored) : [];
    unterhaltEntriesCache = unterhaltStored ? JSON.parse(unterhaltStored) : [];
  } catch (error) {
    console.warn('Lokaler Speicher konnte nicht gelesen werden.', error);
    brennEntriesCache = [];
    unterhaltEntriesCache = [];
  }
}

function persistLocalCache() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brennEntriesCache));
  localStorage.setItem(UNTERHALT_STORAGE_KEY, JSON.stringify(unterhaltEntriesCache));
}

async function supabaseRequest(table, options = {}) {
  const { method = 'GET', query = '', body } = options;
  const url = `${SB_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers = {
    'apikey': SB_ANON_KEY,
    'Authorization': `Bearer ${SB_ANON_KEY}`
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
}

async function fetchAllSupabaseRecords(table) {
  const allItems = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const items = await supabaseRequest(table, { query: `select=*&offset=${offset}&limit=${limit}` });
    const batch = Array.isArray(items) ? items : [];
    allItems.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return allItems;
}

function normalizeBrennRecord(record) {
  return {
    id: record.id,
    datum: record.datum || '',
    bemerkungen: record.bemerkungen || '',
    vorname: record.vorname || '',
    nachname: record.nachname || '',
    wPersonen: record.wpersonen || record.wPersonen || '',
    anzahlExterne: String(record.anzahlexterne ?? record.anzahlExterne ?? '0'),
    brennzyklus: String(record.brennzyklus ?? '0'),
    brennmodus: record.brennmodus || '',
    timestamp: record.timestamp || record.created_at || new Date().toISOString()
  };
}

function normalizeUnterhaltRecord(record) {
  return {
    id: record.id,
    vorname: record.vorname || '',
    nachname: record.nachname || '',
    datum: record.datum || '',
    betrag: Number(record.betrag || 0),
    bemerkungen: record.bemerkungen || '',
    type: 'unterhalt',
    timestamp: record.timestamp || record.created_at || new Date().toISOString()
  };
}

async function fetchSupabaseState() {
  const [brennRaw, unterhaltRaw] = await Promise.all([
    fetchAllSupabaseRecords(SB_BRENN_TABLE),
    fetchAllSupabaseRecords(SB_UNTERHALT_TABLE)
  ]);

  return {
    brennEntries: brennRaw.map(normalizeBrennRecord),
    unterhaltEntries: unterhaltRaw.map(normalizeUnterhaltRecord)
  };
}

function toSupabaseBrennPayload(entry) {
  return {
    datum: entry.datum,
    bemerkungen: entry.bemerkungen || '',
    vorname: entry.vorname,
    nachname: entry.nachname,
    wpersonen: entry.wPersonen || '',
    anzahlexterne: Number(entry.anzahlExterne || 0),
    brennzyklus: Number(entry.brennzyklus || 0),
    brennmodus: entry.brennmodus,
    timestamp: entry.timestamp || new Date().toISOString()
  };
}

function toSupabaseUnterhaltPayload(entry) {
  return {
    vorname: entry.vorname,
    nachname: entry.nachname,
    datum: entry.datum,
    betrag: Number(entry.betrag || 0),
    bemerkungen: entry.bemerkungen || '',
    type: 'unterhalt',
    timestamp: entry.timestamp || new Date().toISOString()
  };
}

async function createSupabaseRecord(table, payload) {
  const result = await supabaseRequest(table, { method: 'POST', body: payload });
  return Array.isArray(result) ? result[0] : result;
}

async function deleteSupabaseRecord(table, id) {
  return supabaseRequest(table, { method: 'DELETE', query: `id=eq.${encodeURIComponent(id)}` });
}

async function migrateLocalDataToSupabase() {
  for (const entry of brennEntriesCache) {
    await createSupabaseRecord(SB_BRENN_TABLE, toSupabaseBrennPayload(entry));
  }
  for (const entry of unterhaltEntriesCache) {
    await createSupabaseRecord(SB_UNTERHALT_TABLE, toSupabaseUnterhaltPayload(entry));
  }
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
  const validUntil = getAccessValidUntil();
  if (validUntil > Date.now()) {
    hideAccessOverlay();
    scheduleAccessReauth(validUntil);
    return;
  }

  clearAccessValidity();
  showAccessOverlay();
}

function getAccessValidUntil() {
  const raw = sessionStorage.getItem(ACCESS_VALID_UNTIL_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setAccessValidUntil(timestamp) {
  sessionStorage.setItem(ACCESS_VALID_UNTIL_KEY, String(timestamp));
}

function clearAccessValidity() {
  sessionStorage.removeItem(ACCESS_VALID_UNTIL_KEY);
}

function scheduleAccessReauth(validUntil) {
  if (accessReauthTimer) {
    clearTimeout(accessReauthTimer);
    accessReauthTimer = null;
  }

  const remainingMs = validUntil - Date.now();
  if (remainingMs <= 0) {
    clearAccessValidity();
    showAccessOverlay();
    return;
  }

  accessReauthTimer = setTimeout(() => {
    clearAccessValidity();
    showAccessOverlay();
  }, remainingMs);
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
  if (password === ACCESS_PASSWORD) {
    const validUntil = Date.now() + ACCESS_REAUTH_MS;
    setAccessValidUntil(validUntil);
    hideAccessOverlay();
    scheduleAccessReauth(validUntil);
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
async function handleFormSubmit(e) {
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

  await addEntry(entry);
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

async function handleUnterhaltFormSubmit(e) {
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

  await addUnterhaltEntry(entry);
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
  return [...unterhaltEntriesCache];
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
  unterhaltEntriesCache = [...entries];
  persistLocalCache();
}

async function addUnterhaltEntry(entry) {
  if (cloudSyncEnabled) {
    try {
      const created = await createSupabaseRecord(SB_UNTERHALT_TABLE, toSupabaseUnterhaltPayload(entry));
      unterhaltEntriesCache.push(normalizeUnterhaltRecord(created));
      persistLocalCache();
      loadEntries();
      return;
    } catch (error) {
      console.warn('Supabase-Speicherung fehlgeschlagen, verwende lokalen Fallback.', error);
      cloudSyncEnabled = false;
      updateSyncStatus(false);
    }
  }

  const entries = getUnterhaltEntries();
  entries.push(entry);
  saveUnterhaltEntries(entries);
  loadEntries();
}

async function deleteUnterhaltEntry(id) {
  if (cloudSyncEnabled) {
    try {
      await deleteSupabaseRecord(SB_UNTERHALT_TABLE, id);
    } catch (error) {
      console.warn('Unterhaltseintrag konnte in Supabase nicht gelöscht werden.', error);
      cloudSyncEnabled = false;
      updateSyncStatus(false);
    }
  }

  const entries = getUnterhaltEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveUnterhaltEntries(filtered);
  loadEntries();
  if (isAdminLoggedIn) {
    loadAdminEntries();
  }
}

// === Entry Management ===
async function addEntry(entry) {
  if (cloudSyncEnabled) {
    try {
      const created = await createSupabaseRecord(SB_BRENN_TABLE, toSupabaseBrennPayload(entry));
      brennEntriesCache.push(normalizeBrennRecord(created));
      persistLocalCache();
      loadEntries();
      return;
    } catch (error) {
      console.warn('Supabase-Speicherung fehlgeschlagen, verwende lokalen Fallback.', error);
      cloudSyncEnabled = false;
      updateSyncStatus(false);
    }
  }

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
  loadEntries();
}

function getEntries() {
  return [...brennEntriesCache];
}

function saveEntries(entries) {
  brennEntriesCache = [...entries];
  persistLocalCache();
}

async function deleteEntry(id) {
  if (cloudSyncEnabled) {
    try {
      await deleteSupabaseRecord(SB_BRENN_TABLE, id);
    } catch (error) {
      console.warn('Brennprozesseintrag konnte in Supabase nicht gelöscht werden.', error);
      cloudSyncEnabled = false;
      updateSyncStatus(false);
    }
  }

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
        <div class="entry-meta">
          <div class="entry-date">${entry.datum}</div>
          <div class="entry-badge" style="background-color: #ff9800;">Unterhalt</div>
        </div>
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
          <div class="entry-label">Ausgabenbetrag</div>
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
        <div class="entry-meta">
          <div class="entry-date">${entry.datum}</div>
          <div class="entry-badge">Ofen-Nutzung</div>
        </div>
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
      <div class="entry-row grundkosten-row">
        <div class="entry-field">
          <div class="entry-label">davon Grundkosten (Alle)</div>
          <div class="entry-value">${formatInvoiceAmount(grundkosten)}</div>
        </div>
      </div>
      <div class="entry-row solibeitrag-row">
        <div class="entry-field">
          <div class="entry-label">davon Solibeitrag (Externe)</div>
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

// === Unterhalt Calculation Functions ===
function calculateUnterhaltTotalBeitrag() {
  // Beiträge = sum of Unterhaltsbeitrag from Brennprozess entries
  const brennEntries = getEntries();
  return brennEntries.reduce((sum, entry) => {
    const unterhalt = Number(calculateInvoiceAmount(entry, true).unterhaltsbeitrag || 0);
    return sum + unterhalt;
  }, 0);
}

function calculateUnterhaltTotalAusgaben() {
  // Ausgaben = sum of Betrag from Unterhalt entries
  return (unterhaltEntriesCache || []).reduce((sum, entry) => {
    return sum + (Number(entry.betrag) || 0);
  }, 0);
}

function calculateUnterhaltKontostand() {
  // Kontostand = Beiträge - Ausgaben
  const beitrag = calculateUnterhaltTotalBeitrag();
  const ausgaben = calculateUnterhaltTotalAusgaben();
  return beitrag - ausgaben;
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

async function handleDeleteConfirm() {
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
    await deleteUnterhaltEntry(entryIdToDelete);
  } else {
    await deleteEntry(entryIdToDelete);
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
  const brennEntries = getEntries();
  const unterhaltEntries = unterhaltEntriesCache || [];

  if (brennEntries.length === 0 && unterhaltEntries.length === 0) {
    alert('Es gibt keine Einträge zum Exportieren.');
    return;
  }

  const totalBeitrag = calculateUnterhaltTotalBeitrag();
  const totalAusgaben = calculateUnterhaltTotalAusgaben();
  const kontostand = calculateUnterhaltKontostand();
  const timestamp = new Date().toISOString().split('T')[0];
  const FMT_NUM = '0.00';
  const FMT_CHF = '_ [$CHF-807]\\ * #,##0.00_ ;_ [$CHF-807]\\ * \\-#,##0.00_ ;_ [$CHF-807]\\ * "-"??_ ;_ @_ ';

  const workbook = new ExcelJS.Workbook();

  // Blatt 1: Brennprozesse
  if (brennEntries.length > 0) {
    const ws = workbook.addWorksheet('Brennprozesse');
    // CHF-Spaltenindizes (0-basiert): H=7, I=8, J=9, K=10, L=11
    const chfCols = new Set([7, 8, 9, 10, 11]);
    const headers = ['Datum','Verantwortliche Person','Weitere Personen','Bemerkungen',
      'Anzahl Externe','Brenn-Zyklus (Stunden)','Brennmodus','Solibeitrag (CHF)',
      'Stromkosten (CHF)','Admingebühr (CHF)','Unterhalts-Beitrag (CHF)','Gesamtbetrag (CHF)'];
    ws.columns = headers.map((h, i) => ({ width: chfCols.has(i) ? 18 : Math.max(h.length + 2, 12) }));
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 12 };
      if (chfCols.has(colNum - 1)) cell.numFmt = FMT_NUM;
    });
    brennEntries.forEach(entry => {
      const bd = calculateInvoiceAmount(entry, true);
      const vals = [
        entry.datum,
        `${entry.vorname} ${entry.nachname}`,
        entry.wPersonen || '-',
        entry.bemerkungen || '-',
        Number(entry.anzahlExterne),
        Number(entry.brennzyklus),
        entry.brennmodus,
        bd.solibeitrag,
        bd.stromkosten,
        bd.admingebuehr,
        bd.unterhaltsbeitrag,
        calculateInvoiceAmount(entry)
      ];
      const r = ws.addRow(vals);
      r.eachCell((cell, colNum) => {
        cell.font = { size: 12 };
        if (chfCols.has(colNum - 1)) cell.numFmt = FMT_NUM;
      });
    });
  }

  // Blatt 2: Unterhalt-Ausgaben
  if (unterhaltEntries.length > 0) {
    const ws = workbook.addWorksheet('Unterhalt-Ausgaben');
    ws.columns = [{ width: 14 }, { width: 22 }, { width: 14 }, { width: 28 }];
    const headerRow = ws.addRow(['Datum','Verantwortliche Person','Betrag (CHF)','Bemerkungen']);
    headerRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 12 };
      if (colNum === 3) cell.numFmt = FMT_NUM;
    });
    unterhaltEntries.forEach(entry => {
      const r = ws.addRow([
        entry.datum || '',
        `${entry.vorname || ''} ${entry.nachname || ''}`.trim(),
        Number(entry.betrag) || 0,
        entry.bemerkungen || '-'
      ]);
      r.eachCell((cell, colNum) => {
        cell.font = { size: 12 };
        if (colNum === 3) cell.numFmt = FMT_NUM;
      });
    });
  }

  // Blatt 3: Konto Unterhalt
  const kontoWs = workbook.addWorksheet('Konto Unterhalt');
  kontoWs.columns = [{ width: 22 }, { width: 18 }];
  [
    ['SALDO UNTERHALT', kontostand, true],
    ['EINNAHMEN', totalBeitrag, false],
    ['AUSGABEN', totalAusgaben, false]
  ].forEach(([label, val, bold]) => {
    const r = kontoWs.addRow([label, val]);
    r.getCell(1).font = { bold, size: 12 };
    r.getCell(2).font = { bold, size: 12 };
    r.getCell(2).numFmt = FMT_CHF;
  });

  // Datei herunterladen
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Brennprozess_Archiv_${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }).catch(err => {
    console.error('Excel-Export fehlgeschlagen:', err);
    alert('Export fehlgeschlagen: ' + err.message);
  });
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
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Eintrag wirklich löschen?')) {
        await deleteEntry(entry.id);
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
  document.querySelectorAll('.success-message').forEach(el => el.remove());

  const msgElement = document.createElement('div');
  msgElement.className = 'success-message';
  msgElement.textContent = message;

  document.body.appendChild(msgElement);

  setTimeout(() => {
    msgElement.remove();
  }, 4000);
}
