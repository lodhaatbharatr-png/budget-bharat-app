import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db;

export const initDB = async () => {
  try {
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("budget_bharat_db", false)).result;
    
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("budget_bharat_db", false);
    } else {
      db = await sqlite.createConnection("budget_bharat_db", false, "no-encryption", 1, false);
    }
    
    await db.open();

    // Replicating Code.gs Sheet schemas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY, type TEXT, date TEXT, amount REAL, person TEXT, 
        category TEXT, note TEXT, ref TEXT, promiseDate TEXT, timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT, email TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, name TEXT
      );
      CREATE TABLE IF NOT EXISTS admin_config (
        id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT, contact TEXT, 
        email TEXT, headerNote TEXT, footerNote TEXT
      );
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY, person TEXT, loanName TEXT, principalAmount REAL, 
        loanAmount REAL, monthlyEmi REAL, tenureMonths INTEGER, firstEmiDate TEXT, status TEXT
      );
      CREATE TABLE IF NOT EXISTS loan_emis (
        id INTEGER PRIMARY KEY AUTOINCREMENT, loanId TEXT, emiNo INTEGER, date TEXT, 
        emiAmount REAL, outstandingBal REAL, paid INTEGER, whoPaid TEXT, paymentId TEXT, paidDate TEXT
      );
    `);
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};

// Translating Code.gs Public RPC API to SQLite
export const BackendBridge = {
  getDashboardPayload: async () => {
    const txRes = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    const personsRes = await db.query('SELECT * FROM persons');
    const catRes = await db.query('SELECT * FROM categories');
    const adminRes = await db.query('SELECT * FROM admin_config WHERE id = 1');
    const loansRes = await db.query('SELECT * FROM loans');
    const emisRes = await db.query('SELECT * FROM loan_emis');

    const expenseCats = catRes.values.filter(c => c.type === 'expense').map(c => c.name);
    const incomeCats = catRes.values.filter(c => c.type === 'income').map(c => c.name);

    const formattedLoans = loansRes.values.map(loan => ({
      ...loan,
      schedule: emisRes.values.filter(e => e.loanId === loan.id).map(e => ({
        ...e, paid: e.paid === 1
      })).sort((a, b) => a.emiNo - b.emiNo)
    }));

    return {
      transactions: txRes.values || [],
      persons: personsRes.values || [],
      categories: { expense: expenseCats, income: incomeCats },
      admin: adminRes.values.length > 0 ? adminRes.values[0] : { name: '', contact: '', email: '', headerNote: '', footerNote: '' },
      loans: formattedLoans
    };
  },

  addTransaction: async (tx) => {
    const id = `row_${Date.now()}`;
    const timestamp = new Date().toISOString();
    await db.run(
      `INSERT INTO transactions (id, type, date, amount, person, category, note, ref, promiseDate, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, tx.type, tx.date, tx.amount, tx.person || '', tx.category || '', tx.note || '', tx.ref || '', tx.promiseDate || '', timestamp]
    );
    return await BackendBridge.getDashboardPayload();
  },

  deleteTransaction: async (id) => {
    await db.run('DELETE FROM transactions WHERE id = ?', [id]);
    return await BackendBridge.getDashboardPayload();
  },

  addPerson: async (p) => {
    const id = `PID_${p.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    await db.run(`INSERT INTO persons (id, name, phone, address, email) VALUES (?,?,?,?,?)`, 
      [id, p.name, p.phone || '', p.address || '', p.email || '']);
    return await BackendBridge.getDashboardPayload();
  },

  deletePerson: async (name) => {
    await db.run('DELETE FROM persons WHERE name = ?', [name]);
    await db.run('DELETE FROM transactions WHERE person = ?', [name]);
    return await BackendBridge.getDashboardPayload();
  },

  updateAdminConfig: async (data) => {
    await db.run(`INSERT OR REPLACE INTO admin_config (id, name, contact, email, headerNote, footerNote) VALUES (1, ?, ?, ?, ?, ?)`,
      [data.name, data.contact, data.email, data.headerNote, data.footerNote]);
    return await BackendBridge.getDashboardPayload();
  },

  saveLoan: async (loan) => {
    const id = loan.id || `LN_${Date.now()}`;
    
    // Check if status is CLOSED and recalculate loanAmount like Code.gs
    let finalLoanAmount = loan.loanAmount;
    if (loan.status === 'CLOSED' && loan.schedule) {
      let activeSum = 0;
      loan.schedule.forEach(s => { if (s.paid) activeSum += Number(s.emiAmount) || 0; });
      if (activeSum > 0) finalLoanAmount = Math.round(activeSum * 100) / 100;
    }

    await db.run(`INSERT OR REPLACE INTO loans (id, person, loanName, principalAmount, loanAmount, monthlyEmi, tenureMonths, firstEmiDate, status) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, loan.person, loan.loanName, loan.principalAmount, finalLoanAmount, loan.monthlyEmi, loan.tenureMonths, loan.firstEmiDate, loan.status]);
    
    if (loan.schedule && loan.schedule.length > 0) {
      await db.run('DELETE FROM loan_emis WHERE loanId = ?', [id]);
      for (const s of loan.schedule) {
        await db.run(`INSERT INTO loan_emis (loanId, emiNo, date, emiAmount, outstandingBal, paid, whoPaid, paymentId, paidDate) VALUES (?,?,?,?,?,?,?,?,?)`,
          [id, s.emiNo, s.date, s.emiAmount, s.outstandingBal, s.paid ? 1 : 0, s.whoPaid || '', s.paymentId || '', s.paidDate || '']);
      }
    }
    return await BackendBridge.getDashboardPayload();
  },

  deleteLoan: async (id) => {
    await db.run('DELETE FROM loans WHERE id = ?', [id]);
    await db.run('DELETE FROM loan_emis WHERE loanId = ?', [id]);
    return await BackendBridge.getDashboardPayload();
  }
};
