import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'budget_bharat';
const STORAGE_KEY = 'budget_bharat_state_v1';
const DEFAULT_STATE = Object.freeze({
  transactions: [],
  persons: [],
  categories: {
    expense: [],
    income: []
  },
  admin: {},
  loans: []
});

let sqlite = null;
let db = null;
let initPromise = null;

const cloneDefaultState = () => ({
  transactions: [],
  persons: [],
  categories: { expense: [], income: [] },
  admin: {},
  loans: []
});

const normalizeState = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    transactions: Array.isArray(source.transactions) ? source.transactions : [],
    persons: Array.isArray(source.persons) ? source.persons : [],
    categories: {
      expense: Array.isArray(source.categories?.expense) ? source.categories.expense : [],
      income: Array.isArray(source.categories?.income) ? source.categories.income : []
    },
    admin: source.admin && typeof source.admin === 'object' ? source.admin : {},
    loans: Array.isArray(source.loans) ? source.loans : []
  };
};

const readFallback = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : cloneDefaultState();
  } catch (error) {
    console.warn('Unable to read local fallback state.', error);
    return cloneDefaultState();
  }
};

const writeFallback = (state) => {
  const normalized = normalizeState(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('Unable to persist local fallback state.', error);
  }
  return normalized;
};

const nativeAvailable = () => {
  try {
    return Boolean(Capacitor?.isNativePlatform?.());
  } catch (_) {
    return false;
  }
};

const readNative = async () => {
  if (!db) return null;
  const result = await db.query(
    'SELECT value FROM app_state WHERE id = 1 LIMIT 1'
  );
  const raw = result?.values?.[0]?.value;
  if (!raw) return null;
  try {
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn('Stored SQLite state is invalid; using empty state.', error);
    return null;
  }
};

const writeNative = async (state) => {
  if (!db) return normalizeState(state);
  const normalized = normalizeState(state);
  await db.run(
    'INSERT OR REPLACE INTO app_state (id, value) VALUES (1, ?)',
    [JSON.stringify(normalized)]
  );
  return normalized;
};

export const initDB = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!nativeAvailable()) return null;

    try {
      sqlite = new SQLiteConnection(CapacitorSQLite);
      const consistency = await sqlite.checkConnectionsConsistency();
      const connected = Boolean(consistency?.result) &&
        Boolean((await sqlite.isConnection(DB_NAME, false))?.result);

      db = connected
        ? await sqlite.retrieveConnection(DB_NAME, false)
        : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      // Migrate an existing web/fallback state into native SQLite once,
      // but never invent starter/sample records.
      const nativeState = await readNative();
      if (!nativeState) {
        const fallbackState = readFallback();
        if (JSON.stringify(fallbackState) !== JSON.stringify(DEFAULT_STATE)) {
          await writeNative(fallbackState);
        }
      }

      return db;
    } catch (error) {
      console.warn('Native SQLite unavailable; using localStorage fallback.', error);
      db = null;
      return null;
    }
  })();

  return initPromise;
};

export const readState = async () => {
  try {
    await initDB();
    const nativeState = await readNative();
    if (nativeState) return nativeState;
  } catch (error) {
    console.warn('SQLite read failed; falling back to localStorage.', error);
  }
  return readFallback();
};

export const writeState = async (state) => {
  const normalized = normalizeState(state);
  try {
    await initDB();
    if (db) return await writeNative(normalized);
  } catch (error) {
    console.warn('SQLite write failed; using localStorage fallback.', error);
  }
  return writeFallback(normalized);
};

export const resetState = async () => {
  const empty = cloneDefaultState();
  return writeState(empty);
};

export const BackendBridge = {
  getDashboardPayload: readState,

  addTransaction: async (tx) => {
    const state = await readState();
    const next = {
      ...state,
      transactions: [
        { ...tx, id: tx?.id || `tx_${Date.now()}` },
        ...state.transactions
      ]
    };
    return writeState(next);
  },

  updateTransaction: async (tx) => {
    const state = await readState();
    const id = String(tx?.id || tx?.entryId || '');
    const next = {
      ...state,
      transactions: state.transactions.map(item =>
        String(item.id || item.entryId || '') === id ? { ...item, ...tx } : item
      )
    };
    return writeState(next);
  },

  deleteTransaction: async (id) => {
    const state = await readState();
    return writeState({
      ...state,
      transactions: state.transactions.filter(item =>
        String(item.id || item.entryId || '') !== String(id)
      )
    });
  },

  addPerson: async (person) => {
    const state = await readState();
    const name = String(person?.name || '').trim();
    if (!name) return state;
    if (state.persons.some(item => String(item.name || '').toLowerCase() === name.toLowerCase())) {
      return state;
    }
    return writeState({
      ...state,
      persons: [...state.persons, { id: person.id || `p_${Date.now()}`, ...person, name }]
    });
  },

  updatePerson: async (person) => {
    const state = await readState();
    const oldName = person?.oldName;
    return writeState({
      ...state,
      persons: state.persons.map(item => item.name === oldName ? { ...item, ...person } : item)
    });
  },

  deletePerson: async (name) => {
    const state = await readState();
    return writeState({
      ...state,
      persons: state.persons.filter(person => person.name !== name),
      transactions: state.transactions.filter(tx => tx.person !== name)
    });
  },

  addCategory: async (type, name) => {
    const state = await readState();
    const key = type === 'income' ? 'income' : 'expense';
    if (!name || state.categories[key].includes(name)) return state;
    return writeState({
      ...state,
      categories: { ...state.categories, [key]: [...state.categories[key], name] }
    });
  },

  updateCategory: async (oldData, newData) => {
    const state = await readState();
    const key = oldData?.type === 'income' ? 'income' : 'expense';
    return writeState({
      ...state,
      categories: {
        ...state.categories,
        [key]: state.categories[key].map(item => item === oldData?.oldName ? newData?.newName : item)
      }
    });
  },

  deleteCategory: async (catData) => {
    const state = await readState();
    const key = catData?.type === 'income' ? 'income' : 'expense';
    return writeState({
      ...state,
      categories: {
        ...state.categories,
        [key]: state.categories[key].filter(item => item !== catData?.name)
      }
    });
  },

  updateAdminConfig: async (admin) => {
    const state = await readState();
    return writeState({ ...state, admin: { ...state.admin, ...admin } });
  },

  saveLoan: async (loan) => {
    const state = await readState();
    const index = state.loans.findIndex(item => item.id === loan?.id);
    const loans = [...state.loans];
    if (index >= 0) loans[index] = loan;
    else loans.unshift(loan);
    return writeState({ ...state, loans });
  },

  deleteLoan: async (loanId) => {
    const state = await readState();
    return writeState({
      ...state,
      loans: state.loans.filter(loan => loan.id !== loanId)
    });
  },

  restoreFullBackup: async (parsed) => {
    // The caller is responsible for validating the complete backup format.
    // This method only writes the already-parsed replacement state atomically.
    return writeState(normalizeState(parsed));
  }
};
