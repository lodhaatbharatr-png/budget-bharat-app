
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

let db = null;
const STORAGE_KEY = 'budget_bharat_sqlite_fallback_v1';

const getFallbackData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    transactions: [
      { id: '1', type: 'EXPENSE', amount: 450, category: 'Food', person: 'Self', date: '14/09/2026', note: 'Lunch', ref: 'Cash' },
      { id: '2', type: 'INCOME', amount: 25000, category: 'Salary', person: 'Employer', date: '01/09/2026', note: 'Monthly Salary', ref: 'Bank' }
    ],
    persons: [
      { id: 'p1', name: 'Self', phone: '', email: '', address: 'Maharashtra' },
      { id: 'p2', name: 'Employer', phone: '', email: '', address: 'Maharashtra' }
    ],
    loans: [],
    categories: {
      expense: ['Food', 'Rent', 'Utilities', 'Shopping', 'Transport'],
      income: ['Salary', 'Freelance', 'Investments', 'Gift']
    },
    admin: { name: 'Bharat Rasve', contact: '7218838122', email: '', headerNote: 'Official Accounting Summary', footerNote: 'Thank you for your business' }
  };
};

const saveFallbackData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
};

export const initDB = async () => {
  if (db) return db;
  try {
    if (Capacitor.isNativePlatform()) {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      const ret = await sqlite.checkConnectionsConsistency();
      const isConn = (await sqlite.isConnection('budget_bharat_db', false)).result;
      if (isConn) {
        db = await sqlite.createConnection('budget_bharat_db', false, 'no-encryption', 1, false);
      } else {
        db = await sqlite.createConnection('budget_bharat_db', false, 'no-encryption', 1, false);
      }
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS app_data (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
    }
  } catch (e) {
    console.warn('Native SQLite unavailable, using web fallback store.', e);
  }
  return db;
};

export const BackendBridge = {
  getDashboardPayload: async () => {
    return getFallbackData();
  },
  addTransaction: async (tx) => {
    const data = getFallbackData();
    const newTx = { ...tx, id: 'tx_' + Date.now() };
    data.transactions.unshift(newTx);
    saveFallbackData(data);
    return data;
  },
  updateTransaction: async (tx) => {
    const data = getFallbackData();
    data.transactions = data.transactions.map(t => (String(t.id || t.entryId) === String(tx.id || tx.entryId) ? { ...t, ...tx } : t));
    saveFallbackData(data);
    return data;
  },
  deleteTransaction: async (id) => {
    const data = getFallbackData();
    data.transactions = data.transactions.filter(t => String(t.id || t.entryId) !== String(id));
    saveFallbackData(data);
    return data;
  },
  addPerson: async (p) => {
    const data = getFallbackData();
    if (!data.persons.some(item => item.name.toLowerCase() === p.name.toLowerCase())) {
      data.persons.push({ id: 'p_' + Date.now(), ...p });
      saveFallbackData(data);
    }
    return data;
  },
  updatePerson: async (p) => {
    const data = getFallbackData();
    data.persons = data.persons.map(item => (item.name === p.oldName ? { ...item, ...p } : item));
    saveFallbackData(data);
    return data;
  },
  deletePerson: async (name) => {
    const data = getFallbackData();
    data.persons = data.persons.filter(p => p.name !== name);
    data.transactions = data.transactions.filter(t => t.person !== name);
    saveFallbackData(data);
    return data;
  },
  addCategory: async (type, name) => {
    const data = getFallbackData();
    const target = type === 'income' ? data.categories.income : data.categories.expense;
    if (!target.includes(name)) {
      target.push(name);
      saveFallbackData(data);
    }
    return data;
  },
  updateCategory: async (oldData, newData) => {
    const data = getFallbackData();
    const target = oldData.type === 'income' ? data.categories.income : data.categories.expense;
    const idx = target.indexOf(oldData.oldName);
    if (idx !== -1) target[idx] = newData.newName;
    saveFallbackData(data);
    return data;
  },
  deleteCategory: async (catData) => {
    const data = getFallbackData();
    const target = catData.type === 'income' ? data.categories.income : data.categories.expense;
    const idx = target.indexOf(catData.name);
    if (idx !== -1) target.splice(idx, 1);
    saveFallbackData(data);
    return data;
  },
  updateAdminConfig: async (admin) => {
    const data = getFallbackData();
    data.admin = { ...data.admin, ...admin };
    saveFallbackData(data);
    return data;
  },
  saveLoan: async (loan) => {
    const data = getFallbackData();
    const idx = data.loans.findIndex(l => l.id === loan.id);
    if (idx >= 0) {
      data.loans[idx] = loan;
    } else {
      data.loans.unshift(loan);
    }
    saveFallbackData(data);
    return data;
  },
  deleteLoan: async (loanId) => {
    const data = getFallbackData();
    data.loans = data.loans.filter(l => l.id !== loanId);
    saveFallbackData(data);
    return data;
  }
};
