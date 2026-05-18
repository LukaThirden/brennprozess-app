// === Konfiguration ===
const ADMIN_PASSWORD = 'admin1605'; // Sollte in einer echten App verschlüsselt sein
const STORAGE_KEY = 'brennprozess_entries';
const UNTERHALT_STORAGE_KEY = 'unterhalt_entries';
const MONITOR_TRANSFER_STORAGE_KEY = 'monitor_transfer_entries';
const MONITOR_TRANSFER_KEY = 'monitor_saldo_transfer';
const ACCESS_PASSWORDS = ['adw_kiln', 'admin1605'];
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
const wPersonenInput = document.getElementById('wPersonenInput');
const vornameInput = document.getElementById('vornameInput');
const nachnameInput = document.getElementById('nachnameInput');
const anzahlExterneSelect = document.getElementById('anzahlExterneSelect');
const brennzyklusSelect = document.getElementById('brennzyklusSelect');
const brennmodusSelect = document.getElementById('brennmodusSelect');
const entriesList = document.getElementById('entriesList');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const selectAllEntriesCheckbox = document.getElementById('selectAllEntriesCheckbox');
const unterhaltBeitraegeTotal = document.getElementById('unterhaltBeitraegeTotal');
const unterhaltAusgabenTotal = document.getElementById('unterhaltAusgabenTotal');
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
const invoiceButton = document.getElementById('invoiceButton');
const invoiceAddressModal = document.getElementById('invoiceAddressModal');
const invoiceAddrVorname = document.getElementById('invoiceAddrVorname');
const invoiceAddrNachname = document.getElementById('invoiceAddrNachname');
const invoiceAddrStrasse = document.getElementById('invoiceAddrStrasse');
const invoiceAddrPlz = document.getElementById('invoiceAddrPlz');
const invoiceAddrOrt = document.getElementById('invoiceAddrOrt');
const invoiceAddressConfirm = document.getElementById('invoiceAddressConfirm');
const invoiceAddressCancel = document.getElementById('invoiceAddressCancel');
const invoiceAddressClose = document.getElementById('invoiceAddressClose');
const exportModal = document.getElementById('exportModal');
const exportModalClose = document.getElementById('exportModalClose');
const exportPassword = document.getElementById('exportPassword');
const exportConfirmButton = document.getElementById('exportConfirmButton');
const exportCancelButton = document.getElementById('exportCancelButton');
const exportPasswordError = document.getElementById('exportPasswordError');

// Monitor
const monitorEinnahmen = document.getElementById('monitorEinnahmen');
const monitorAdminFees = document.getElementById('monitorAdminFees');
const monitorStromkosten = document.getElementById('monitorStromkosten');
const monitorSolibeitrag = document.getElementById('monitorSolibeitrag');
const monitorUnterhaltsbeitrag = document.getElementById('monitorUnterhaltsbeitrag');
const monitorTransferValue = document.getElementById('monitorTransferValue');
const monitorUnterhaltAusgaben = document.getElementById('monitorUnterhaltAusgaben');
const monitorSaldoUnterhalt = document.getElementById('monitorSaldoUnterhalt');
const monitorDateStamp = document.getElementById('monitorDateStamp');
const monitorAdminButton = document.getElementById('monitorAdminButton');
const monitorTransferAuthModal = document.getElementById('monitorTransferAuthModal');
const monitorTransferModal = document.getElementById('monitorTransferModal');
const monitorTransferInput = document.getElementById('monitorTransferInput');
const monitorTransferSave = document.getElementById('monitorTransferSave');
const monitorTransferCancel = document.getElementById('monitorTransferCancel');
const monitorTransferAuthCancel = document.getElementById('monitorTransferAuthCancel');
const monitorTransferAuthClose = document.getElementById('monitorTransferAuthClose');
const monitorTransferClose = document.getElementById('monitorTransferClose');
const monitorTransferError = document.getElementById('monitorTransferError');
const monitorTransferPassword = document.getElementById('monitorTransferPassword');
const monitorTransferPasswordError = document.getElementById('monitorTransferPasswordError');
const monitorTransferLoginButton = document.getElementById('monitorTransferLoginButton');

// Entry Preview
const entryPreviewModal = document.getElementById('entryPreviewModal');
const entryPreviewTitle = document.getElementById('entryPreviewTitle');
const entryPreviewContainer = document.getElementById('entryPreviewContainer');
const entryPreviewClose = document.getElementById('entryPreviewClose');
const entryPreviewConfirmButton = document.getElementById('entryPreviewConfirmButton');
const entryPreviewCancelButton = document.getElementById('entryPreviewCancelButton');

// Status Change
const statusChangeModal = document.getElementById('statusChangeModal');
const statusChangePassword = document.getElementById('statusChangePassword');
const statusChangePasswordError = document.getElementById('statusChangePasswordError');
const statusChangeModalInfo = document.getElementById('statusChangeModalInfo');
const statusChangeConfirmButton = document.getElementById('statusChangeConfirmButton');
const statusChangeCancelButton = document.getElementById('statusChangeCancelButton');
const statusChangeModalClose = document.getElementById('statusChangeModalClose');

// === State ===
let isAdminLoggedIn = false;
let entryIdToDelete = null;
let entryTypeToDelete = 'brennprozess'; // 'brennprozess' oder 'unterhalt'
let pendingDeleteTargets = [];
const selectedEntryKeys = new Set();
let currentEntrySelectionKeys = [];
let brennEntriesCache = [];
let unterhaltEntriesCache = [];
let monitorTransferEntriesCache = [];
let cloudSyncEnabled = false;
let syncHealthCheckTimer = null;
let syncHealthCheckInFlight = false;
let accessReauthTimer = null;
let pendingPreviewEntry = null;
let pendingPreviewType = null;
let pendingStatusEntryId = null;
let pendingStatusEntryType = null;

const SYNC_CHECK_INTERVAL_MS = 10000;

// === Initialization ===
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await initializeDataStore();
  startSyncHealthChecks();
  checkAccess();
});

function setupEventListeners() {
  setupFormSectionToggles();

  // Form
  form.addEventListener('submit', handleFormSubmit);
  form.addEventListener('reset', resetForm);

  // Datum-Eingabe beim Verlassen normalisieren
  datumInput.addEventListener('blur', normalizeDatumInput);

  // Unterhalt Form
  unterhaltForm.addEventListener('submit', handleUnterhaltFormSubmit);
  unterhaltForm.addEventListener('reset', resetUnterhaltForm);
  unterhaltDatumInput.addEventListener('blur', normalizeUnterhaltDatumInput);

  // Admin
  if (adminButton) {
    adminButton.addEventListener('click', openAdminModal);
  }
  modalClose.addEventListener('click', closeAdminModal);
  modalOverlay.addEventListener('click', handleModalOverlayClick);
  adminLoginButton.addEventListener('click', handleAdminLogin);
  adminLogoutButton.addEventListener('click', handleAdminLogout);
  adminPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdminLogin();
    }
  });

  // Delete
  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteCancelButton.addEventListener('click', closeDeleteModal);
  deleteConfirmButton.addEventListener('click', handleDeleteConfirm);
  if (deleteSelectedButton) {
    deleteSelectedButton.addEventListener('click', handleDeleteSelected);
  }
  if (selectAllEntriesCheckbox) {
    selectAllEntriesCheckbox.addEventListener('change', handleSelectAllEntriesChange);
  }
  window.addEventListener('resize', handleResponsiveUiUpdate);
  deletePassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDeleteConfirm();
    }
  });

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
  if (invoiceButton) {
    invoiceButton.addEventListener('click', generateInvoicePDF);
  }
  if (invoiceAddressClose) invoiceAddressClose.addEventListener('click', closeInvoiceAddressModal);
  if (invoiceAddressCancel) invoiceAddressCancel.addEventListener('click', closeInvoiceAddressModal);
  if (invoiceAddressConfirm) invoiceAddressConfirm.addEventListener('click', confirmInvoicePDF);
  if (statusChangeModalClose) statusChangeModalClose.addEventListener('click', closeStatusChangeModal);
  if (statusChangeCancelButton) statusChangeCancelButton.addEventListener('click', closeStatusChangeModal);
  if (statusChangeConfirmButton) statusChangeConfirmButton.addEventListener('click', confirmEntryStatusChange);
  if (statusChangePassword) {
    statusChangePassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmEntryStatusChange(); }
    });
  }
  exportModalClose.addEventListener('click', closeExportModal);
  exportCancelButton.addEventListener('click', closeExportModal);
  exportConfirmButton.addEventListener('click', handleExportConfirm);
  exportPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExportConfirm();
    }
  });

  // Entry preview
  entryPreviewClose.addEventListener('click', closeEntryPreviewModal);
  entryPreviewCancelButton.addEventListener('click', closeEntryPreviewModal);
  if (monitorAdminButton) {
    monitorAdminButton.addEventListener('click', openMonitorTransferAuthModal);
  }
  if (monitorTransferAuthClose) {
    monitorTransferAuthClose.addEventListener('click', closeMonitorTransferAuthModal);
  }
  if (monitorTransferAuthCancel) {
    monitorTransferAuthCancel.addEventListener('click', closeMonitorTransferAuthModal);
  }
  if (monitorTransferClose) {
    monitorTransferClose.addEventListener('click', closeMonitorTransferModal);
  }
  if (monitorTransferCancel) {
    monitorTransferCancel.addEventListener('click', closeMonitorTransferModal);
  }
  if (monitorTransferLoginButton) {
    monitorTransferLoginButton.addEventListener('click', handleMonitorTransferLogin);
  }
  if (monitorTransferPassword) {
    monitorTransferPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleMonitorTransferLogin();
      }
    });
  }
  if (monitorTransferSave) {
    monitorTransferSave.addEventListener('click', saveMonitorTransfer);
  }
  if (monitorTransferInput) {
    monitorTransferInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveMonitorTransfer();
      }
    });
  }
  updateMonitorSummary();
  entryPreviewConfirmButton.addEventListener('click', handleEntryPreviewConfirm);
}

function handleResponsiveUiUpdate() {
  updateSelectionControls();
  updateMonitorSummary();
}

function isMobileBrowser() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

function handleModalOverlayClick() {
  if (!exportModal.classList.contains('hidden')) {
    closeExportModal();
    return;
  }

  if (!adminModal.classList.contains('hidden')) {
    closeAdminModal();
    return;
  }

  if (monitorTransferAuthModal && !monitorTransferAuthModal.classList.contains('hidden')) {
    closeMonitorTransferAuthModal();
    return;
  }

  if (monitorTransferModal && !monitorTransferModal.classList.contains('hidden')) {
    closeMonitorTransferModal();
    return;
  }

  if (invoiceAddressModal && !invoiceAddressModal.classList.contains('hidden')) {
    closeInvoiceAddressModal();
    return;
  }

  if (statusChangeModal && !statusChangeModal.classList.contains('hidden')) {
    closeStatusChangeModal();
  }
}

function getMonitorTransferAmount() {
  const entries = getMonitorTransferEntries();
  if (entries.length === 0) {
    return 0;
  }

  return Number(entries[0].betrag || 0);
}

function formatSignedInvoiceAmount(amount) {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  return `${sign}${abs.toFixed(2).replace('.', ',')} CHF`;
}

function getMonitorTransferEntries() {
  return [...monitorTransferEntriesCache].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
}

async function addMonitorTransferEntry(entry) {
  if (cloudSyncEnabled) {
    try {
      const created = await createSupabaseRecord(SB_UNTERHALT_TABLE, toSupabaseMonitorTransferPayload(entry));
      monitorTransferEntriesCache.push(normalizeMonitorTransferRecord(created));
      persistLocalCache();
      loadEntries();
      return;
    } catch (error) {
      console.warn('Monitor-Übertrag konnte nicht in Supabase gespeichert werden.', error);
      cloudSyncEnabled = false;
      updateSyncStatus(false);
    }
  }

  monitorTransferEntriesCache.push({ ...entry, type: 'monitor_transfer' });
  persistLocalCache();
  loadEntries();
}

function openMonitorTransferAuthModal(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!monitorTransferAuthModal || !modalOverlay || !monitorTransferPassword) {
    return;
  }

  if (monitorTransferPassword) {
    monitorTransferPassword.value = '';
  }
  if (monitorTransferPasswordError) {
    monitorTransferPasswordError.textContent = '';
    monitorTransferPasswordError.classList.remove('show');
  }
  if (monitorTransferError) {
    monitorTransferError.textContent = '';
    monitorTransferError.classList.remove('show');
  }
  monitorTransferAuthModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  if (monitorTransferPassword) {
    monitorTransferPassword.focus();
  }
}

function closeMonitorTransferAuthModal() {
  if (!monitorTransferAuthModal || !modalOverlay) {
    return;
  }

  monitorTransferAuthModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  if (monitorTransferPassword) {
    monitorTransferPassword.value = '';
  }
  if (monitorTransferPasswordError) {
    monitorTransferPasswordError.textContent = '';
    monitorTransferPasswordError.classList.remove('show');
  }
}

function openMonitorTransferModal() {
  if (!monitorTransferModal || !modalOverlay || !monitorTransferInput) {
    return;
  }

  monitorTransferInput.value = getMonitorTransferAmount().toFixed(2);
  if (monitorTransferError) {
    monitorTransferError.textContent = '';
    monitorTransferError.classList.remove('show');
  }
  monitorTransferModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  monitorTransferInput.focus();
}

function closeMonitorTransferModal() {
  if (!monitorTransferModal || !modalOverlay) {
    return;
  }

  monitorTransferModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  if (monitorTransferError) {
    monitorTransferError.textContent = '';
    monitorTransferError.classList.remove('show');
  }
}

function handleMonitorTransferLogin() {
  if (!monitorTransferPassword || !monitorTransferAuthModal) {
    return;
  }

  const password = monitorTransferPassword.value.trim();
  if (password !== ADMIN_PASSWORD) {
    if (monitorTransferPasswordError) {
      monitorTransferPasswordError.textContent = 'Kennwort falsch';
      monitorTransferPasswordError.classList.add('show');
    }
    monitorTransferPassword.value = '';
    monitorTransferPassword.focus();
    return;
  }

  if (monitorTransferPasswordError) {
    monitorTransferPasswordError.textContent = '';
    monitorTransferPasswordError.classList.remove('show');
  }

  monitorTransferAuthModal.classList.add('hidden');
  openMonitorTransferModal();
}

function saveMonitorTransfer() {
  if (!monitorTransferInput) {
    return;
  }

  const value = monitorTransferInput.value.trim();
  const amount = value === '' ? 0 : Number(value);

  if (!Number.isFinite(amount)) {
    if (monitorTransferError) {
      monitorTransferError.textContent = 'Bitte eine gültige Zahl eingeben.';
      monitorTransferError.classList.add('show');
    }
    return;
  }

  addMonitorTransferEntry({
    id: Date.now().toString(),
    datum: getCurrentDateLabel(),
    betrag: amount,
    bemerkungen: 'Monitor Übertrag',
    type: 'monitor_transfer',
    timestamp: new Date().toISOString()
  });
  closeMonitorTransferModal();
}

function setupFormSectionToggles() {
  const toggles = document.querySelectorAll('.form-section-toggle');
  const sections = [];

  toggles.forEach((toggle) => {
    const targetId = toggle.dataset.target;
    const body = targetId ? document.getElementById(targetId) : null;

    if (!body) {
      return;
    }

    sections.push({ toggle, body });

    const closeOthers = () => {
      sections.forEach((section) => {
        if (section.body === body) {
          return;
        }

        section.body.classList.remove('form-section-body--open');
        section.toggle.setAttribute('aria-expanded', 'false');
      });
    };

    const toggleSection = () => {
      const isOpen = body.classList.contains('form-section-body--open');

      closeOthers();

      if (isOpen) {
        body.classList.remove('form-section-body--open');
        toggle.setAttribute('aria-expanded', 'false');
        return;
      }

      body.classList.add('form-section-body--open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', toggleSection);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSection();
      }
    });
  });
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
      monitorTransferEntriesCache = remoteState.monitorTransferEntries;
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

    const hasRemoteData = remoteState.brennEntries.length > 0 || remoteState.unterhaltEntries.length > 0 || remoteState.monitorTransferEntries.length > 0;
    const hasLocalData = brennEntriesCache.length > 0 || unterhaltEntriesCache.length > 0 || monitorTransferEntriesCache.length > 0;

    if (hasRemoteData) {
      brennEntriesCache = remoteState.brennEntries;
      unterhaltEntriesCache = remoteState.unterhaltEntries;
      monitorTransferEntriesCache = remoteState.monitorTransferEntries;
      persistLocalCache();
      loadEntries();
      return;
    }

    if (hasLocalData) {
      await migrateLocalDataToSupabase();
      const migratedState = await fetchSupabaseState();
      brennEntriesCache = migratedState.brennEntries;
      unterhaltEntriesCache = migratedState.unterhaltEntries;
      monitorTransferEntriesCache = migratedState.monitorTransferEntries;
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
    const monitorTransferStored = localStorage.getItem(MONITOR_TRANSFER_STORAGE_KEY);
    brennEntriesCache = brennStored ? JSON.parse(brennStored) : [];
    unterhaltEntriesCache = unterhaltStored ? JSON.parse(unterhaltStored) : [];
    monitorTransferEntriesCache = monitorTransferStored ? JSON.parse(monitorTransferStored) : [];

    if (monitorTransferEntriesCache.length === 0) {
      const legacyTransfer = Number(localStorage.getItem(MONITOR_TRANSFER_KEY));
      if (Number.isFinite(legacyTransfer) && legacyTransfer !== 0) {
        monitorTransferEntriesCache = [{
          id: `legacy-transfer-${Date.now()}`,
          datum: getCurrentDateLabel(),
          betrag: legacyTransfer,
          bemerkungen: 'Migration aus lokalem Übertrag',
          type: 'monitor_transfer',
          timestamp: new Date().toISOString()
        }];
      }
    }
  } catch (error) {
    console.warn('Lokaler Speicher konnte nicht gelesen werden.', error);
    brennEntriesCache = [];
    unterhaltEntriesCache = [];
    monitorTransferEntriesCache = [];
  }
}

function persistLocalCache() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brennEntriesCache));
  localStorage.setItem(UNTERHALT_STORAGE_KEY, JSON.stringify(unterhaltEntriesCache));
  localStorage.setItem(MONITOR_TRANSFER_STORAGE_KEY, JSON.stringify(monitorTransferEntriesCache));
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
    status: record.status || 'offen',
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
    type: record.type || 'unterhalt',
    status: record.status || 'offen',
    timestamp: record.timestamp || record.created_at || new Date().toISOString()
  };
}

function normalizeMonitorTransferRecord(record) {
  return {
    id: record.id,
    datum: record.datum || getCurrentDateLabel(),
    betrag: Number(record.betrag || 0),
    bemerkungen: record.bemerkungen || '',
    type: 'monitor_transfer',
    timestamp: record.timestamp || record.created_at || new Date().toISOString()
  };
}

async function fetchSupabaseState() {
  const [brennRaw, unterhaltRaw] = await Promise.all([
    fetchAllSupabaseRecords(SB_BRENN_TABLE),
    fetchAllSupabaseRecords(SB_UNTERHALT_TABLE)
  ]);

  const unterhaltItems = unterhaltRaw.filter((record) => (record.type || 'unterhalt') !== 'monitor_transfer');
  const monitorTransferItems = unterhaltRaw.filter((record) => record.type === 'monitor_transfer');

  return {
    brennEntries: brennRaw.map(normalizeBrennRecord),
    unterhaltEntries: unterhaltItems.map(normalizeUnterhaltRecord),
    monitorTransferEntries: monitorTransferItems.map(normalizeMonitorTransferRecord)
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
    status: entry.status || 'offen',
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
    status: entry.status || 'offen',
    timestamp: entry.timestamp || new Date().toISOString()
  };
}

function toSupabaseMonitorTransferPayload(entry) {
  return {
    vorname: '',
    nachname: '',
    datum: entry.datum || getCurrentDateLabel(),
    betrag: Number(entry.betrag || 0),
    bemerkungen: entry.bemerkungen || 'Monitor Übertrag',
    type: 'monitor_transfer',
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

async function patchSupabaseRecord(table, id, payload) {
  return supabaseRequest(table, { method: 'PATCH', query: `id=eq.${encodeURIComponent(id)}`, body: payload });
}

async function migrateLocalDataToSupabase() {
  for (const entry of brennEntriesCache) {
    await createSupabaseRecord(SB_BRENN_TABLE, toSupabaseBrennPayload(entry));
  }
  for (const entry of unterhaltEntriesCache) {
    await createSupabaseRecord(SB_UNTERHALT_TABLE, toSupabaseUnterhaltPayload(entry));
  }
  for (const entry of monitorTransferEntriesCache) {
    await createSupabaseRecord(SB_UNTERHALT_TABLE, toSupabaseMonitorTransferPayload(entry));
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

function getCurrentDateLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  return `${day}/${month}/${year}`;
}

function getLatestEntryDateLabel(brennEntries, unterhaltEntries) {
  const allEntries = [
    ...brennEntries.map((entry) => ({ ...entry, entryType: 'brennprozess' })),
    ...unterhaltEntries.map((entry) => ({ ...entry, entryType: 'unterhalt' }))
  ];

  if (allEntries.length === 0) {
    return getCurrentDateLabel();
  }

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

  return allEntries[0].datum || getCurrentDateLabel();
}

function getExportDateRangeLabel(brennEntries, unterhaltEntries) {
  const allEntries = [
    ...brennEntries.map((entry) => ({ ...entry, entryType: 'brennprozess' })),
    ...unterhaltEntries.map((entry) => ({ ...entry, entryType: 'unterhalt' }))
  ];

  if (allEntries.length === 0) {
    const today = getCurrentDateLabel();
    return `${today} bis ${today}`;
  }

  allEntries.sort((a, b) => {
    const dateA = parseDate(a.datum);
    const dateB = parseDate(b.datum);

    if (dateA && dateB && dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  const oldestDate = allEntries[0].datum || getCurrentDateLabel();
  const newestDate = allEntries[allEntries.length - 1].datum || oldestDate;
  return `${oldestDate} bis ${newestDate}`;
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
  if (ACCESS_PASSWORDS.includes(password)) {
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

  openEntryPreviewModal(entry, 'brennprozess');
}

function resetForm() {
  clearAllErrors();
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

  openEntryPreviewModal(entry, 'unterhalt');
}

function openEntryPreviewModal(entry, entryType) {
  pendingPreviewEntry = { ...entry };
  pendingPreviewType = entryType;

  const previewSource = createEntryElement({ ...entry, entryType });
  const previewCard = previewSource.cloneNode(true);

  const previewCheckboxes = previewCard.querySelectorAll('.entry-select-checkbox');
  previewCheckboxes.forEach((checkbox) => {
    checkbox.disabled = true;
    checkbox.tabIndex = -1;
  });

  const chevron = previewCard.querySelector('.entry-chevron');
  if (chevron) {
    chevron.remove();
  }

  const body = previewCard.querySelector('.entry-body');
  if (body) {
    body.classList.add('entry-body--open');
  }

  entryPreviewContainer.innerHTML = '';
  entryPreviewContainer.appendChild(previewCard);
  entryPreviewTitle.textContent = entryType === 'unterhalt' ? 'Vorschau Unterhalts-Ausgabe' : 'Vorschau Ofen-Nutzung';

  entryPreviewModal.classList.remove('hidden');
}

function closeEntryPreviewModal() {
  entryPreviewModal.classList.add('hidden');
  entryPreviewContainer.innerHTML = '';
  pendingPreviewEntry = null;
  pendingPreviewType = null;
}

async function handleEntryPreviewConfirm() {
  if (!pendingPreviewEntry || !pendingPreviewType) {
    closeEntryPreviewModal();
    return;
  }

  if (pendingPreviewType === 'unterhalt') {
    await addUnterhaltEntry(pendingPreviewEntry);
    unterhaltForm.reset();
    unterhaltVornameInput.value = '';
    unterhaltNachnameInput.value = '';
    unterhaltDatumInput.value = '';
    unterhaltBetragInput.value = '';
    unterhaltBemerkungenInput.value = '';
    showSuccessMessage('Ausgabe erfolgreich erfasst!');
  } else {
    await addEntry(pendingPreviewEntry);
    form.reset();
    datumInput.value = '';
    showSuccessMessage('Eintrag erfolgreich erstellt!');
  }

  closeEntryPreviewModal();
}

function resetUnterhaltForm() {
  clearAllErrors();
  unterhaltVornameInput.value = '';
  unterhaltNachnameInput.value = '';
  unterhaltDatumInput.value = '';
  unterhaltBetragInput.value = '';
  unterhaltBemerkungenInput.value = '';
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
}

function updateMonitorSummary() {
  const brennEntries = getEntries();
  const unterhaltEntries = getUnterhaltEntries();

  const totalEinnahmen = brennEntries.reduce((sum, entry) => sum + Number(calculateInvoiceAmount(entry) || 0), 0);
  const totalAdminFees = brennEntries.length * 3;
  const totalStromkosten = brennEntries.reduce((sum, entry) => sum + Number(calculateInvoiceAmount(entry, true).stromkosten || 0), 0);
  const totalSolibeitrag = brennEntries.reduce((sum, entry) => sum + Number(calculateInvoiceAmount(entry, true).solibeitrag || 0), 0);
  const totalUnterhaltsbeitrag = brennEntries.reduce((sum, entry) => sum + Number(calculateInvoiceAmount(entry, true).unterhaltsbeitrag || 0), 0);
  const totalUnterhaltAusgaben = unterhaltEntries.reduce((sum, entry) => sum + (Number(entry.betrag) || 0), 0);
  const transferAmount = getMonitorTransferAmount();
  const saldoUnterhalt = totalUnterhaltsbeitrag - totalUnterhaltAusgaben + transferAmount;

  if (monitorEinnahmen) {
    monitorEinnahmen.textContent = formatInvoiceAmount(totalEinnahmen);
  }
  if (monitorAdminFees) {
    monitorAdminFees.textContent = formatInvoiceAmount(totalAdminFees);
  }
  if (monitorStromkosten) {
    monitorStromkosten.textContent = formatInvoiceAmount(totalStromkosten);
  }
  if (monitorSolibeitrag) {
    monitorSolibeitrag.textContent = formatInvoiceAmount(totalSolibeitrag);
  }
  if (monitorUnterhaltsbeitrag) {
    monitorUnterhaltsbeitrag.textContent = formatInvoiceAmount(totalUnterhaltsbeitrag);
  }
  if (monitorTransferValue) {
    monitorTransferValue.textContent = formatInvoiceAmount(transferAmount);
  }
  if (monitorUnterhaltAusgaben) {
    monitorUnterhaltAusgaben.textContent = formatInvoiceAmount(totalUnterhaltAusgaben);
  }
  if (monitorSaldoUnterhalt) {
    monitorSaldoUnterhalt.textContent = formatInvoiceAmount(saldoUnterhalt);
    monitorSaldoUnterhalt.style.color = saldoUnterhalt < 0 ? '#dc2626' : '';
  }
  if (monitorDateStamp) {
      const monitorDateRange = getExportDateRangeLabel(brennEntries, unterhaltEntries);
      monitorDateStamp.textContent = monitorDateRange;
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

  currentEntrySelectionKeys = allEntries.map((entry) => getEntrySelectionKey(entry.id, entry.entryType || 'brennprozess'));
  const validSelectionKeys = new Set(currentEntrySelectionKeys);
  selectedEntryKeys.forEach((key) => {
    if (!validSelectionKeys.has(key)) {
      selectedEntryKeys.delete(key);
    }
  });

  entriesList.innerHTML = '';
  updateUnterhaltSummary();
  updateMonitorSummary();
  updateSelectionControls();

  if (allEntries.length === 0) {
    entriesList.innerHTML = '<p class="empty-message">Keine Einträge vorhanden.</p>';
    return;
  }

  allEntries.forEach(entry => {
    const entryElement = createEntryElement(entry);
    entriesList.appendChild(entryElement);
  });
}

function getEntrySelectionKey(entryId, entryType = 'brennprozess') {
  return `${entryType}:${entryId}`;
}

function parseEntrySelectionKey(key) {
  const separatorIndex = key.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  return {
    entryType: key.slice(0, separatorIndex),
    id: key.slice(separatorIndex + 1)
  };
}

function updateDeleteSelectedButtonState() {
  if (!deleteSelectedButton) {
    return;
  }

  const isMobile = isMobileBrowser();
  const deleteLabel = isMobile ? 'Löschen' : '🗑 Einträge löschen';
  const selectedCount = selectedEntryKeys.size;
  deleteSelectedButton.disabled = selectedCount === 0;
  deleteSelectedButton.textContent = selectedCount > 0
    ? `${deleteLabel} (${selectedCount})`
    : deleteLabel;
}

function updateSelectAllEntriesCheckboxState() {
  if (!selectAllEntriesCheckbox) {
    return;
  }

  const totalCount = currentEntrySelectionKeys.length;
  const selectedCount = currentEntrySelectionKeys.reduce((sum, key) => sum + (selectedEntryKeys.has(key) ? 1 : 0), 0);

  selectAllEntriesCheckbox.disabled = totalCount === 0;
  selectAllEntriesCheckbox.checked = totalCount > 0 && selectedCount === totalCount;
  selectAllEntriesCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
}

function updateSelectionControls() {
  updateDeleteSelectedButtonState();
  updateExportButtonState();
  updateSelectAllEntriesCheckboxState();
  updateInvoiceButtonState();
}

function updateExportButtonState() {
  if (!exportButton) {
    return;
  }

  const isMobile = isMobileBrowser();
  const exportLabel = isMobile ? 'Exportieren' : '📊 Exportieren';
  const selectedCount = selectedEntryKeys.size;
  exportButton.disabled = selectedCount === 0;
  exportButton.textContent = selectedCount > 0
    ? `${exportLabel} (${selectedCount})`
    : exportLabel;
}

function handleSelectAllEntriesChange() {
  if (!selectAllEntriesCheckbox) {
    return;
  }

  const shouldSelectAll = selectAllEntriesCheckbox.checked;
  currentEntrySelectionKeys.forEach((key) => {
    if (shouldSelectAll) {
      selectedEntryKeys.add(key);
    } else {
      selectedEntryKeys.delete(key);
    }
  });

  entriesList.querySelectorAll('.entry-select-checkbox').forEach((checkbox) => {
    checkbox.checked = shouldSelectAll;
  });

  updateSelectionControls();
}

function handleDeleteSelected() {
  if (selectedEntryKeys.size === 0) {
    return;
  }

  const targets = [];
  selectedEntryKeys.forEach((key) => {
    const parsed = parseEntrySelectionKey(key);
    if (parsed && parsed.id) {
      targets.push(parsed);
    }
  });

  if (targets.length === 0) {
    return;
  }

  openDeleteModal(targets);
}

function createEntryElement(entry) {
  const div = document.createElement('div');
  div.className = `entry-item ${entry.entryType === 'unterhalt' ? 'unterhalt-entry' : 'ofen-entry'}`;
  const entryType = entry.entryType || 'brennprozess';
  const selectionKey = getEntrySelectionKey(entry.id, entryType);
  const isSelected = selectedEntryKeys.has(selectionKey);
  const status = entry.status || 'offen';

  // Wenn es ein Unterhalt-Eintrag ist
  if (entry.entryType === 'unterhalt') {
    div.innerHTML = `
      <div class="entry-header entry-toggle">
        <div class="entry-header-left">
          <label class="entry-select-control">
            <input type="checkbox" class="entry-select-checkbox" data-id="${entry.id}" data-type="unterhalt" ${isSelected ? 'checked' : ''} />
          </label>
          <div class="entry-meta">
            <div class="entry-date">${entry.datum}</div>
            <div class="entry-type-label"><span class="entry-type-indicator" style="background-color: #ff9800;"></span>Unterhalt</div>
          </div>
        </div>
        <button type="button" class="entry-status-badge entry-status-badge--${status}" data-id="${entry.id}" data-type="unterhalt">${status}</button>
        <div class="entry-header-amount unterhalt-amount">${formatInvoiceAmount(entry.betrag)} (Ausgabe)</div>
        <span class="entry-chevron">▼</span>
      </div>
      <div class="entry-body">
        <div class="entry-row">
          <div class="entry-field">
            <div class="entry-label">Name</div>
            <div class="entry-value">${entry.vorname} ${entry.nachname}</div>
          </div>
        </div>
        <div class="entry-row">
          <div class="entry-field">
            <div class="entry-label">Bemerkungen</div>
            <div class="entry-value">${entry.bemerkungen ? escapeHtml(entry.bemerkungen) : '-'}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Brennprozess-Eintrag
    const breakdown = calculateInvoiceAmount(entry, true);
    const totalAmount = calculateInvoiceAmount(entry);
    const grundkosten = totalAmount - breakdown.solibeitrag;

    div.innerHTML = `
      <div class="entry-header entry-toggle">
        <div class="entry-header-left">
          <label class="entry-select-control">
            <input type="checkbox" class="entry-select-checkbox" data-id="${entry.id}" data-type="brennprozess" ${isSelected ? 'checked' : ''} />
          </label>
          <div class="entry-meta">
            <div class="entry-date">${entry.datum}</div>
            <div class="entry-type-label"><span class="entry-type-indicator" style="background-color: #2196f3;"></span>Nutzung</div>
          </div>
        </div>
        <button type="button" class="entry-status-badge entry-status-badge--${status}" data-id="${entry.id}" data-type="brennprozess">${status}</button>
        <div class="entry-header-amount ofen-amount">${formatInvoiceAmount(totalAmount)} (Gesamt)</div>
        <span class="entry-chevron">▼</span>
      </div>
      <div class="entry-body">
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
        <div class="entry-row grundkosten-row">
          <div class="entry-field">
            <div class="entry-label">Grundkosten (Alle)</div>
            <div class="entry-value">${formatInvoiceAmount(grundkosten)}</div>
          </div>
        </div>
        <div class="entry-row solibeitrag-row">
          <div class="entry-field">
            <div class="entry-label">Solibeitrag (Externe)</div>
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
            <div class="entry-label">Brenn-Zyklus (Stunden)</div>
            <div class="entry-value">${entry.brennzyklus}</div>
          </div>
        </div>
        <div class="entry-row">
          <div class="entry-field">
            <div class="entry-label">Bemerkungen</div>
            <div class="entry-value">${entry.bemerkungen ? escapeHtml(entry.bemerkungen) : '-'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Toggle-Logik: Klick auf Header klappt Details aus/ein
  const toggle = div.querySelector('.entry-toggle');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      if (e.target.closest('.entry-select-control')) return;
      if (e.target.closest('.entry-status-badge')) return;
      const body = div.querySelector('.entry-body');
      const chevron = div.querySelector('.entry-chevron');
      const isOpen = body.classList.toggle('entry-body--open');
      chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
    });
  }

  const statusBadge = div.querySelector('.entry-status-badge');
  if (statusBadge) {
    statusBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      openStatusChangeModal(entry.id, entryType);
    });
  }

  const selectCheckbox = div.querySelector('.entry-select-checkbox');
  if (selectCheckbox) {
    selectCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedEntryKeys.add(selectionKey);
      } else {
        selectedEntryKeys.delete(selectionKey);
      }
      updateSelectionControls();
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
function openDeleteModal(targets = null) {
  if (Array.isArray(targets) && targets.length > 0) {
    pendingDeleteTargets = targets;
  } else if (entryIdToDelete !== null) {
    pendingDeleteTargets = [{ id: entryIdToDelete, entryType: entryTypeToDelete || 'brennprozess' }];
  } else {
    pendingDeleteTargets = [];
  }

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
  entryTypeToDelete = 'brennprozess';
  pendingDeleteTargets = [];
}

async function handleDeleteConfirm() {
  const password = deletePassword.value;
  const targets = pendingDeleteTargets.length > 0
    ? pendingDeleteTargets
    : (entryIdToDelete !== null ? [{ id: entryIdToDelete, entryType: entryTypeToDelete || 'brennprozess' }] : []);

  if (!password) {
    showDeleteError('Kennwort erforderlich');
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    showDeleteError('Kennwort falsch');
    deletePassword.value = '';
    return;
  }

  if (targets.length === 0) {
    closeDeleteModal();
    return;
  }

  for (const target of targets) {
    if (target.entryType === 'unterhalt') {
      await deleteUnterhaltEntry(target.id);
    } else {
      await deleteEntry(target.id);
    }
  }

  selectedEntryKeys.clear();
  updateSelectionControls();
  
  closeDeleteModal();
  showSuccessMessage(targets.length > 1 ? `${targets.length} Einträge wurden gelöscht!` : 'Eintrag wurde gelöscht!');
}

function showDeleteError(message) {
  deletePasswordError.textContent = message;
  deletePasswordError.classList.add('show');
}

// === Export Modal Functions ===
function openExportModal(e) {
  e.preventDefault();

  if (selectedEntryKeys.size === 0) {
    return;
  }

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
  const { brennEntries, unterhaltEntries } = getSelectedEntriesForExport();

  if (!password) {
    showExportError('Kennwort erforderlich');
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    showExportError('Kennwort falsch');
    exportPassword.value = '';
    return;
  }

  if (brennEntries.length === 0 && unterhaltEntries.length === 0) {
    showExportError('Keine Einträge ausgewählt');
    return;
  }

  exportToExcel({ brennEntries, unterhaltEntries });
  closeExportModal();
  showSuccessMessage('Archiv exportiert!');
}

function showExportError(message) {
  exportPasswordError.textContent = message;
  exportPasswordError.classList.add('show');
}

function getSelectedEntriesForExport() {
  const selectedBrennIds = new Set();
  const selectedUnterhaltIds = new Set();

  selectedEntryKeys.forEach((key) => {
    const parsed = parseEntrySelectionKey(key);
    if (!parsed) {
      return;
    }

    if (parsed.entryType === 'unterhalt') {
      selectedUnterhaltIds.add(parsed.id);
    } else {
      selectedBrennIds.add(parsed.id);
    }
  });

  const brennEntries = getEntries().filter((entry) => selectedBrennIds.has(String(entry.id)));
  const unterhaltEntries = getUnterhaltEntries().filter((entry) => selectedUnterhaltIds.has(String(entry.id)));

  return { brennEntries, unterhaltEntries };
}

function exportToExcel(selectedData = null) {
  const allBrennEntries = getEntries();
  const allUnterhaltEntries = getUnterhaltEntries();

  const brennEntries = selectedData && Array.isArray(selectedData.brennEntries)
    ? selectedData.brennEntries
    : allBrennEntries;
  const unterhaltEntries = selectedData && Array.isArray(selectedData.unterhaltEntries)
    ? selectedData.unterhaltEntries
    : allUnterhaltEntries;

  const sortEntriesNewestFirst = (entries) => {
    return [...entries].sort((a, b) => {
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);

      if (dateA && dateB && dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }

      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  };

  const sortedBrennEntries = sortEntriesNewestFirst(brennEntries);
  const sortedUnterhaltEntries = sortEntriesNewestFirst(unterhaltEntries);

  if (sortedBrennEntries.length === 0 && sortedUnterhaltEntries.length === 0) {
    alert('Es gibt keine Einträge zum Exportieren.');
    return;
  }

  const totalEinnahmen = sortedBrennEntries.reduce((sum, entry) => {
    return sum + Number(calculateInvoiceAmount(entry) || 0);
  }, 0);
  const totalAdminFees = sortedBrennEntries.length * 3;
  const totalStromkosten = sortedBrennEntries.reduce((sum, entry) => {
    return sum + Number(calculateInvoiceAmount(entry, true).stromkosten || 0);
  }, 0);
  const totalSolibeitrag = sortedBrennEntries.reduce((sum, entry) => {
    return sum + Number(calculateInvoiceAmount(entry, true).solibeitrag || 0);
  }, 0);
  const totalUnterhaltsbeitrag = sortedBrennEntries.reduce((sum, entry) => {
    return sum + Number(calculateInvoiceAmount(entry, true).unterhaltsbeitrag || 0);
  }, 0);
  const totalUnterhaltAusgaben = sortedUnterhaltEntries.reduce((sum, entry) => {
    return sum + (Number(entry.betrag) || 0);
  }, 0);
  const transferAmount = getMonitorTransferAmount();
  const saldoUnterhalt = totalUnterhaltsbeitrag - totalUnterhaltAusgaben + transferAmount;
  const allSelected =
    sortedBrennEntries.length === allBrennEntries.length &&
    sortedUnterhaltEntries.length === allUnterhaltEntries.length;
  const monitorDateRange = getExportDateRangeLabel(sortedBrennEntries, sortedUnterhaltEntries);
  const monitorHeaderLabel = allSelected
    ? `Gesamtauswahl von ${monitorDateRange}`
    : 'Partielle Auswahl';
  const timestamp = new Date().toISOString().split('T')[0];
  const FMT_NUM = '0.00';
  const FMT_CHF = '_ [$CHF-807]\\ * #,##0.00_ ;_ [$CHF-807]\\ * \\-#,##0.00_ ;_ [$CHF-807]\\ * "-"??_ ;_ @_ ';

  const workbook = new ExcelJS.Workbook();

  // Blatt 1: Brennprozesse
  if (sortedBrennEntries.length > 0) {
    const ws = workbook.addWorksheet('Ofen-Nutzung');
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
    sortedBrennEntries.forEach(entry => {
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

  // Blatt 2: Unterhalts-Ausgaben
  {
    const ws = workbook.addWorksheet('Unterhalts-Ausgaben');
    ws.columns = [{ width: 14 }, { width: 22 }, { width: 14 }, { width: 28 }];
    if (sortedUnterhaltEntries.length > 0) {
      const headerRow = ws.addRow(['Datum','Verantwortliche Person','Betrag (CHF)','Bemerkungen']);
      headerRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 12 };
        if (colNum === 3) cell.numFmt = FMT_NUM;
      });
      sortedUnterhaltEntries.forEach(entry => {
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
    } else {
      const hintRow = ws.addRow(['Kein Eintrag vorhanden']);
      hintRow.getCell(1).font = { italic: true, size: 12 };
    }
  }

  // Blatt 3: Monitor
  const monitorWs = workbook.addWorksheet('Monitor');
  monitorWs.columns = [{ width: 44 }, { width: 20 }];

  const addMonitorRow = (label, val, options = {}) => {
    const {
      bold = false,
      isCurrency = true,
      topBorder = false,
      dashedTopBorder = false,
      dashedBottomBorder = false,
      bottomBorder = false,
      valueColor = null
    } = options;

    const row = monitorWs.addRow([label, val]);
    const borderStyle = {};
    if (topBorder) {
      borderStyle.top = { style: 'thin', color: { argb: 'FF111111' } };
    }
    if (dashedTopBorder) {
      borderStyle.top = { style: 'dashed', color: { argb: 'FF111111' } };
    }
    if (dashedBottomBorder) {
      borderStyle.bottom = { style: 'dashed', color: { argb: 'FF111111' } };
    }
    if (bottomBorder) {
      borderStyle.bottom = { style: 'thin', color: { argb: 'FF111111' } };
    }

    row.getCell(1).font = { bold, size: 12 };
    row.getCell(2).font = valueColor
      ? { bold, size: 12, color: { argb: valueColor } }
      : { bold, size: 12 };
    if (isCurrency) {
      row.getCell(2).numFmt = FMT_CHF;
    }
    if (topBorder || dashedTopBorder || dashedBottomBorder || bottomBorder) {
      row.getCell(1).border = borderStyle;
      row.getCell(2).border = borderStyle;
    }

    return row;
  };

  addMonitorRow(monitorHeaderLabel, '', { bold: false, isCurrency: false });
  monitorWs.addRow([]);
  addMonitorRow('Einnahmen aus Ofen-Nutzung', totalEinnahmen, { bold: true });
  addMonitorRow('Admingebühren (3.- pro Nutzung)', totalAdminFees);
  addMonitorRow('Stromkosten (effektiv)', totalStromkosten);
  addMonitorRow('Solibeiträge (10.- pro externe Person)', totalSolibeitrag);
  addMonitorRow('Unterhaltsbeiträge (10.- pro Nutzung)', totalUnterhaltsbeitrag);
  if (transferAmount !== 0) {
    addMonitorRow('Übertrag', transferAmount, { topBorder: true });
  }
  addMonitorRow('Ausgaben für Unterhalt', totalUnterhaltAusgaben, { bold: true, topBorder: true, bottomBorder: true });
  addMonitorRow('Saldo Unterhalt', saldoUnterhalt, {
    bold: true,
    valueColor: saldoUnterhalt < 0 ? 'FFC62828' : null
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
  }, 2000);
}

// === Status Change Functions ===
function openStatusChangeModal(entryId, entryType) {
  if (!statusChangeModal) return;
  pendingStatusEntryId = entryId;
  pendingStatusEntryType = entryType;

  const cache = entryType === 'unterhalt' ? unterhaltEntriesCache : brennEntriesCache;
  const entry = cache.find(e => e.id === entryId);
  const currentStatus = (entry && entry.status) || 'offen';
  const newStatus = currentStatus === 'offen' ? 'abgeschlossen' : 'offen';

  if (statusChangeModalInfo) {
    statusChangeModalInfo.textContent = `Status ändern auf: "${newStatus}"`;
  }
  if (statusChangePassword) statusChangePassword.value = '';
  if (statusChangePasswordError) {
    statusChangePasswordError.textContent = '';
    statusChangePasswordError.classList.remove('show');
  }
  statusChangeModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  if (statusChangePassword) statusChangePassword.focus();
}

function closeStatusChangeModal() {
  if (statusChangeModal) statusChangeModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  if (statusChangePassword) statusChangePassword.value = '';
  if (statusChangePasswordError) {
    statusChangePasswordError.textContent = '';
    statusChangePasswordError.classList.remove('show');
  }
  pendingStatusEntryId = null;
  pendingStatusEntryType = null;
}

async function confirmEntryStatusChange() {
  if (!statusChangePassword || !pendingStatusEntryId) return;
  const pw = statusChangePassword.value;
  if (!pw) {
    if (statusChangePasswordError) {
      statusChangePasswordError.textContent = 'Kennwort erforderlich';
      statusChangePasswordError.classList.add('show');
    }
    return;
  }
  if (pw !== ADMIN_PASSWORD) {
    if (statusChangePasswordError) {
      statusChangePasswordError.textContent = 'Kennwort falsch';
      statusChangePasswordError.classList.add('show');
    }
    if (statusChangePassword) statusChangePassword.value = '';
    return;
  }

  const entryId = pendingStatusEntryId;
  const entryType = pendingStatusEntryType;
  const table = entryType === 'unterhalt' ? SB_UNTERHALT_TABLE : SB_BRENN_TABLE;
  const cache = entryType === 'unterhalt' ? unterhaltEntriesCache : brennEntriesCache;
  const entry = cache.find(e => e.id === entryId);
  if (!entry) { closeStatusChangeModal(); return; }

  const newStatus = (entry.status || 'offen') === 'offen' ? 'abgeschlossen' : 'offen';
  entry.status = newStatus;
  persistLocalCache();

  if (cloudSyncEnabled) {
    try {
      await patchSupabaseRecord(table, entryId, { status: newStatus });
    } catch (err) {
      console.warn('Status-Sync fehlgeschlagen:', err);
    }
  }

  applyStatusToEntryBadge(entryId, entryType, newStatus);
  closeStatusChangeModal();
}

function applyStatusToEntryBadge(entryId, entryType, newStatus) {
  const badge = entriesList.querySelector(`.entry-status-badge[data-id="${entryId}"][data-type="${entryType}"]`);
  if (!badge) return;
  badge.className = `entry-status-badge entry-status-badge--${newStatus}`;
  badge.textContent = newStatus;
}

function updateInvoiceButtonState() {
  if (!invoiceButton) return;
  const selectedCount = selectedEntryKeys.size;
  invoiceButton.disabled = selectedCount === 0;
}

function generateInvoicePDF() {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF-Bibliothek nicht geladen. Bitte Seite neu laden.');
    return;
  }
  const recipient = getInvoiceRecipientFromSelection();
  if (invoiceAddrVorname) invoiceAddrVorname.value = recipient.vorname;
  if (invoiceAddrNachname) invoiceAddrNachname.value = recipient.nachname;
  // Open address dialog
  if (invoiceAddressModal) {
    invoiceAddressModal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
    if (invoiceAddrVorname) invoiceAddrVorname.focus();
  }
}

function getInvoiceRecipientFromSelection() {
  const selectedBrennEntries = [];

  selectedEntryKeys.forEach((key) => {
    const parsed = parseEntrySelectionKey(key);
    if (!parsed || parsed.entryType !== 'brennprozess') return;
    const entry = brennEntriesCache.find((item) => item.id === parsed.id);
    if (entry) selectedBrennEntries.push(entry);
  });

  if (selectedBrennEntries.length === 0) {
    return { vorname: '', nachname: '' };
  }

  selectedBrennEntries.sort((a, b) => {
    const dateA = parseDate(a.datum);
    const dateB = parseDate(b.datum);
    if (dateA && dateB) return dateA - dateB;
    return 0;
  });

  const responsibleEntry = selectedBrennEntries[0] || {};
  return {
    vorname: String(responsibleEntry.vorname || '').trim(),
    nachname: String(responsibleEntry.nachname || '').trim()
  };
}

function closeInvoiceAddressModal() {
  if (invoiceAddressModal) invoiceAddressModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
}

function confirmInvoicePDF() {
  const vorname = invoiceAddrVorname ? invoiceAddrVorname.value.trim() : '';
  const nachname = invoiceAddrNachname ? invoiceAddrNachname.value.trim() : '';
  const strasse = invoiceAddrStrasse ? invoiceAddrStrasse.value.trim() : '';
  const plz = invoiceAddrPlz ? invoiceAddrPlz.value.trim() : '';
  const ort = invoiceAddrOrt ? invoiceAddrOrt.value.trim() : '';

  closeInvoiceAddressModal();
  buildInvoicePDF({ vorname, nachname, strasse, plz, ort });
}

function buildInvoicePDF(recipient) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const marginL = 20;
  const marginR = 190;
  let y = 20;

  // Collect selected entries
  const selectedEntries = [];
  selectedEntryKeys.forEach((key) => {
    const parsed = parseEntrySelectionKey(key);
    if (!parsed) return;
    if (parsed.entryType === 'brennprozess') {
      const entry = brennEntriesCache.find(e => e.id === parsed.id);
      if (entry) selectedEntries.push({ ...entry, entryType: 'brennprozess' });
    } else if (parsed.entryType === 'unterhalt') {
      const entry = unterhaltEntriesCache.find(e => e.id === parsed.id);
      if (entry) selectedEntries.push({ ...entry, entryType: 'unterhalt' });
    }
  });

  if (selectedEntries.length === 0) return;

  selectedEntries.sort((a, b) => {
    const dateA = parseDate(a.datum);
    const dateB = parseDate(b.datum);
    if (dateA && dateB) return dateA - dateB;
    return 0;
  });

  const addNewPageIfNeeded = (neededHeight) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // === Sender block (top left) ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Verein ADW11', marginL, y);
  y += 5.5;
  doc.text('Auf dem Wolf 11', marginL, y);
  y += 5.5;
  doc.text('4052 Basel', marginL, y);

  // === Recipient block (top right) ===
  const recipientLines = [
    `${recipient.vorname} ${recipient.nachname}`.trim(),
    recipient.strasse,
    `${recipient.plz} ${recipient.ort}`.trim()
  ].filter(l => l);
  doc.setFontSize(11);
  let ry = 20;
  recipientLines.forEach(line => {
    doc.text(line, marginR, ry, { align: 'right' });
    ry += 5.5;
  });

  // Date below recipient
  doc.setFontSize(10);
  doc.text(`Basel, ${getCurrentDateLabel()}`, marginR, ry + 2, { align: 'right' });

  y += 16;

  // === Title ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Rechnung', marginL, y);
  y += 8;

  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  doc.line(marginL, y, marginR, y);
  y += 8;

  // === Entries ===
  let totalAmount = 0;

  selectedEntries.forEach((entry, index) => {
    addNewPageIfNeeded(50);

    if (entry.entryType === 'brennprozess') {
      const breakdown = calculateInvoiceAmount(entry, true);
      const amount = calculateInvoiceAmount(entry);
      const grundkosten = amount - breakdown.solibeitrag;
      totalAmount += amount;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Ofen-Nutzung \u2013 ${entry.datum || '-'}`, marginL, y);
      doc.text(formatInvoiceAmount(amount), marginR, y, { align: 'right' });
      y += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const labelX = marginL + 4;
      const valueX = 115;

      const rows = [
        ['Verantwortliche Person', `${entry.vorname || ''} ${entry.nachname || ''}`.trim()],
        ['Weitere Personen', entry.wPersonen || '-'],
        ['Grundkosten (Alle)', formatInvoiceAmount(grundkosten)],
        ['Solibeitrag (Externe)', formatInvoiceAmount(breakdown.solibeitrag)],
        ['Anzahl externe Personen', String(entry.anzahlExterne || 0)],
        ['Brennmodus', entry.brennmodus || '-'],
        ['Brenn-Zyklus (Stunden)', String(entry.brennzyklus || 0)],
        ...(entry.bemerkungen ? [['Bemerkungen', entry.bemerkungen]] : []),
      ];

      rows.forEach(([label, value]) => {
        addNewPageIfNeeded(6);
        doc.setTextColor(100, 100, 100);
        doc.text(label, labelX, y);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), valueX, y);
        y += 5;
      });

    } else if (entry.entryType === 'unterhalt') {
      const amount = Number(entry.betrag) || 0;
      totalAmount += amount;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Unterhaltsausgabe \u2013 ${entry.datum || '-'}`, marginL, y);
      doc.text(formatInvoiceAmount(amount), marginR, y, { align: 'right' });
      y += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const labelX = marginL + 4;
      const valueX = 115;

      const rows = [
        ['Person', `${entry.vorname || ''} ${entry.nachname || ''}`.trim()],
        ...(entry.bemerkungen ? [['Bemerkungen', entry.bemerkungen]] : []),
      ];

      rows.forEach(([label, value]) => {
        addNewPageIfNeeded(6);
        doc.setTextColor(100, 100, 100);
        doc.text(label, labelX, y);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), valueX, y);
        y += 5;
      });
    }

    if (index < selectedEntries.length - 1) {
      addNewPageIfNeeded(10);
      y += 3;
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.line(marginL, y, marginR, y);
      doc.setDrawColor(0, 0, 0);
      y += 5;
    }
  });

  // === Total ===
  y += 5;
  addNewPageIfNeeded(30);
  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  doc.line(marginL, y, marginR, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', marginL, y);
  doc.text(formatInvoiceAmount(totalAmount), marginR, y, { align: 'right' });

  // === IBAN box ===
  y += 14;
  addNewPageIfNeeded(25);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(marginL, y, marginR - marginL, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Bitte \xfcberweisen an:', marginL + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('IBAN: CH06 2349 6860 0097 9', marginL + 4, y + 15);

  const dateStr = getCurrentDateLabel().replace(/\//g, '-');
  doc.save(`Rechnung_ADW11_${dateStr}.pdf`);
}
