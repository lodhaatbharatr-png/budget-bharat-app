// --- START OF src/main.jsx ---

import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

import { 
  INCOME_TYPES, 
  SELECT_STYLE, 
  MONTHS_SHORT, 
  APP_ICON_WHITE, 
  APP_LOGO_COLORED, 
  APP_LOGO_WHITE 
} from './constants';

import { initDB, BackendBridge } from './db.js';
import './index.css';

// Safe portal renderer wrapper to prevent "createPortal is not a function" crashes
const SafePortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !typeof document !== 'undefined' && !document.body) return null;
  return ReactDOM.createPortal(children, document.body);
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error in "' + (this.props.label || 'section') + '":', error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 min-h-[240px]">
          <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400"></i>
          <p className="text-sm font-bold text-theme-dark">{this.props.label || 'This section'} hit a snag</p>
          <p className="text-xs text-theme-dark/60 max-w-xs break-words">
            {String((this.state.error && this.state.error.message) || this.state.error || 'Unknown error')}
          </p>
          <button onClick={this.handleReset} className="px-4 py-2 bg-theme-dark text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppBottomBranding = () => {
  const handleWhatsAppDeveloper = (e) => {
    e.preventDefault();
    const phone = '917218838122';
    const textMsg = 'Hi Bharat, i need help regarding..';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pt-6 pb-2 text-center flex flex-col items-center justify-center select-none">
      <img
        src={APP_LOGO_COLORED}
        alt="Budget Bharat"
        className="h-[31px] object-contain mb-1.5 drop-shadow-sm"
      />
      <p className="text-[10px] font-bold text-[#625E70] tracking-wide mb-2.5">
        Developed by - Bharat Rasve © 2026
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => { window.location.href = `tel:0${String(7218838122 || '').replace(/\D/g, '').slice(-10)}`; }}
          title="Call Developer"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
          <i className="fa-solid fa-phone text-[13px]"></i>
        </button>
        <button
          type="button"
          onClick={handleWhatsAppDeveloper}
          title="WhatsApp Developer"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
          <i className="fa-brands fa-whatsapp text-base"></i>
        </button>
        <a href="https://www.linkedin.com/in/bharatrasve" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all">
          <i className="fa-brands fa-linkedin-in text-sm"></i>
        </a>
        <a href="https://github.com/bharombhar" target="_blank" rel="noopener noreferrer" title="GitHub" className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all">
          <i className="fa-brands fa-github text-sm"></i>
        </a>
        <a href="https://www.instagram.com/bharat_rasve_?r=nametag" target="_blank" rel="noopener noreferrer" title="Instagram" className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all">
          <i className="fa-brands fa-instagram text-sm"></i>
        </a>
        <a href="https://bharatrasve.blogspot.com/" target="_blank" rel="noopener noreferrer" title="Website" className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all">
          <i className="fa-solid fa-globe text-sm"></i>
        </a>
      </div>
    </div>
  );
};

const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val || 0);
const formatTableNum = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val || 0));
const toProperCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const parseDate = (dStr) => {
  if (!dStr) return new Date(0);
  if (dStr instanceof Date) return dStr;
  const s = String(dStr).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = m[3].length === 2 ? parseInt('20' + m[3], 10) : parseInt(m[3], 10);
    return new Date(year, month, day);
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const toInputDate_ = (dStr) => {
  if (!dStr) return '';
  if (dStr instanceof Date) {
    const y = dStr.getFullYear();
    const m = ('0' + (dStr.getMonth() + 1)).slice(-2);
    const d = ('0' + dStr.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }
  const s = String(dStr).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const day = ('0' + m[1]).slice(-2);
    const month = ('0' + m[2]).slice(-2);
    const year = m[3].length === 2 ? ('20' + m[3]) : m[3];
    return `${year}-${month}-${day}`;
  }
  return '';
};

const formatDisplayDate = (dStr) => {
  if (!dStr) return '-';
  let day, monthIdx, yy;
  if (dStr instanceof Date) {
    day = dStr.getDate();
    monthIdx = dStr.getMonth();
    yy = String(dStr.getFullYear()).slice(-2);
  } else {
    const s = String(dStr).trim();
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      day = parseInt(m[1], 10);
      monthIdx = parseInt(m[2], 10) - 1;
      yy = m[3].length === 4 ? m[3].slice(-2) : m[3];
    } else {
      const d = new Date(s);
      if (isNaN(d.getTime())) return dStr;
      day = d.getDate();
      monthIdx = d.getMonth();
      yy = String(d.getFullYear()).slice(-2);
    }
  }
  if (isNaN(day) || monthIdx < 0 || monthIdx > 11) return dStr;
  return `${day}-${MONTHS_SHORT[monthIdx]}-${yy}`;
};

const gasRun = async (fnName, ...args) => {
  try {
    if (BackendBridge[fnName]) {
       return await BackendBridge[fnName](...args);
    } else {
       console.warn(`Function ${fnName} not implemented in bridge yet.`);
       return null;
    }
  } catch (err) {
    throw err;
  }
};

const downloadCsv = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const shareReceiptToWhatsApp = async (ref, filename, captionText) => {
  let target = ref && ref.current ? ref.current : (typeof ref === 'string' ? document.getElementById(ref) : ref);
  if (!target) throw new Error("Target render reference not found");
  if (target instanceof HTMLElement === false && target.nodeType !== 1) {
    target = target.current || target;
  }
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }
  const targetWidth = parseInt(target && target.style ? target.style.width : 0, 10) || Math.ceil((target && target.getBoundingClientRect ? target.getBoundingClientRect().width : 0) || target.offsetWidth) || 640;
  const targetHeight = Math.ceil((target && target.getBoundingClientRect ? target.getBoundingClientRect().height : 0) || target.offsetHeight || target.scrollHeight);
  const dynamicScale = targetHeight > 2500 ? 1.2 : targetHeight > 1500 ? 1.5 : 2;

  let canvas = await html2canvas(target, { 
    backgroundColor: '#ffffff', 
    scale: dynamicScale, 
    logging: false, 
    useCORS: true, 
    allowTaint: true,
    foreignObjectRendering: false,
    width: targetWidth,
    height: targetHeight,
    windowWidth: targetWidth,
    windowHeight: targetHeight,
    scrollY: 0,
    scrollX: 0
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas blob generation failed"));
    }, 'image/jpeg', 0.85);
  });

  const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename, text: captionText });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return true;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.jpg`;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
};

const waitForPaint = () => new Promise(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
});

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loans, setLoans] = useState([]);
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [admin, setAdmin] = useState({ name: '', contact: '', email: '', headerNote: '', footerNote: '' });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState('menu');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('ALL');

  const showFeedback = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const applyPayload = (payload) => {
    if (!payload) return;
    setTransactions(payload.transactions || []);
    setPersons(payload.persons || []);
    setLoans(payload.loans || []);
    setCategories(payload.categories || { expense: [], income: [] });
    setAdmin(payload.admin || { name: '', contact: '', email: '', headerNote: '', footerNote: '' });
  };

  const saveLoanAction = (loanData) => {
    return gasRun('saveLoan', loanData)
      .then((payload) => { applyPayload(payload); showFeedback('Loan updated'); })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const deleteLoanAction = (loanId) => {
    return gasRun('deleteLoan', loanId)
      .then((payload) => { applyPayload(payload); showFeedback('Loan deleted'); })
      .catch((err) => { showFeedback('Delete failed: ' + err.message); throw err; });
  };

  const refresh = (verbose = false, force = false) => {
    setLoading(true);
    setSyncStatus('syncing');
    gasRun('getDashboardPayload', force)
      .then((payload) => {
        applyPayload(payload);
        setLoadError('');
        if (verbose) showFeedback('Data synced');
      })
      .catch((err) => setLoadError(String(err && err.message ? err.message : err)))
      .finally(() => { setLoading(false); setSyncStatus('idle'); });
  };

  useEffect(() => { refresh(false, false); }, []);

  const addTransaction = (tx) => {
    const typeLabel = tx.type === 'BORROW' ? 'Received' : tx.type === 'LENT' ? 'Given' : tx.type === 'EXPENSE' ? 'Expense' : 'Income';
    return gasRun('addTransaction', tx)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback(`${typeLabel} entry saved`); })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const deleteTransaction = (id) => {
    const targetId = typeof id === 'object' ? String(id.id || id.entryId || '').trim() : String(id || '').trim();
    return gasRun('deleteTransaction', targetId)
      .then((payload) => {
        if (payload && payload.transactions) applyPayload(payload);
        else setTransactions(prev => prev.filter(t => String(t.id || t.entryId).trim() !== targetId));
        showFeedback('Transaction deleted');
      })
      .catch((err) => { refresh(false, true); showFeedback('Delete failed'); throw err; });
  };

  const addPerson = (p) => {
    return gasRun('addPerson', p)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Person Added to Directory'); })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const updatePerson = (p) => {
    return gasRun('updatePerson', p)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Person & transactions updated'); })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  const deletePerson = (personName) => {
    return gasRun('deletePerson', personName)
      .then((payload) => {
        if (payload && payload.persons) applyPayload(payload);
        else {
          setPersons(prev => prev.filter(p => p.name !== personName));
          setTransactions(prev => prev.filter(t => t.person !== personName));
        }
        showFeedback('Person & related entries deleted');
      })
      .catch((err) => { refresh(false, true); showFeedback('Delete failed'); throw err; });
  };

  const addCategory = (type, name) => {
    return gasRun('addCategory', type, name)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Category Added'); })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const updateCategory = (oldData, newData) => {
    return gasRun('updateCategory', oldData, newData)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Category Updated'); })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  const deleteCategory = (catData) => {
    return gasRun('deleteCategory', catData)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Category Deleted'); })
      .catch((err) => { showFeedback('Delete failed: ' + err.message); throw err; });
  };

  const updateAdminConfig = (adminData) => {
    return gasRun('updateAdminConfig', adminData)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Admin settings saved'); })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const syncData = () => { refresh(true, true); };

  const exportCsv = (rpcFn, filename) => {
    showFeedback('Preparing export...');
    gasRun(rpcFn)
      .then((csv) => { downloadCsv(csv, filename); showFeedback('Exported ' + filename); })
      .catch((err) => showFeedback('Export failed: ' + err.message));
  };

  const csvEscape = (v) => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const csvSection = (headers, rows) => [headers.join(',')]
    .concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(',')))
    .join('\n');

  const exportFullBackupCsv = () => {
    showFeedback('Preparing full backup...');
    try {
      const lines = [];
      lines.push('##SECTION:transactions');
      lines.push(csvSection(['id', 'type', 'amount', 'category', 'person', 'date', 'note', 'ref', 'promiseDate'], transactions));
      lines.push('##SECTION:persons');
      lines.push(csvSection(['id', 'name', 'phone', 'email', 'address'], persons));
      lines.push('##SECTION:categories');
      const catRows = [
        ...(categories.expense || []).map(name => ({ type: 'expense', name })),
        ...(categories.income || []).map(name => ({ type: 'income', name })),
      ];
      lines.push(csvSection(['type', 'name'], catRows));
      lines.push('##SECTION:loans');
      lines.push(csvSection(
        ['id', 'person', 'loanName', 'principalAmount', 'loanAmount', 'monthlyEmi', 'tenureMonths', 'firstEmiDate', 'status', 'scheduleJson'],
        (loans || []).map(l => ({ ...l, scheduleJson: JSON.stringify(l.schedule || []) }))
      ));
      lines.push('##SECTION:admin');
      lines.push(csvSection(['name', 'contact', 'email', 'headerNote', 'footerNote'], [admin || {}]));

      downloadCsv(lines.join('\n'), `budget_bharat_full_backup_${Date.now()}.csv`);
      showFeedback('Full backup exported');
    } catch (err) {
      showFeedback('Backup export failed: ' + err.message);
    }
  };

  const parseCsvRows = (text) => {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') {}
      else field += c;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows.filter(r => !(r.length === 1 && r[0] === ''));
  };

  const importFullBackupCsv = (file) => {
    if (!file) return;
    showFeedback('Restoring backup...');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target.result);
        const parts = text.split(/(?=##SECTION:)/).map(p => p.trim()).filter(Boolean);
        const data = { transactions: [], persons: [], categories: { expense: [], income: [] }, loans: [], admin: {} };

        parts.forEach(part => {
          const firstNL = part.indexOf('\n');
          const sectionName = part.slice(0, firstNL).replace('##SECTION:', '').trim();
          const body = part.slice(firstNL + 1);
          const rows = parseCsvRows(body);
          if (rows.length === 0) return;
          const cols = rows[0];
          const records = rows.slice(1).map(r => {
            const obj = {};
            cols.forEach((c, i) => { obj[c] = r[i] !== undefined ? r[i] : ''; });
            return obj;
          });

          if (sectionName === 'transactions') {
            data.transactions = records.map(r => ({ ...r, amount: Number(r.amount) || 0 }));
          } else if (sectionName === 'persons') {
            data.persons = records;
          } else if (sectionName === 'categories') {
            records.forEach(r => {
              if (r.type === 'income') data.categories.income.push(r.name);
              else data.categories.expense.push(r.name);
            });
          } else if (sectionName === 'loans') {
            data.loans = records.map(r => {
              let schedule = [];
              try { schedule = JSON.parse(r.scheduleJson || '[]'); } catch (e) { schedule = []; }
              return {
                ...r,
                principalAmount: Number(r.principalAmount) || 0,
                loanAmount: Number(r.loanAmount) || 0,
                monthlyEmi: Number(r.monthlyEmi) || 0,
                tenureMonths: Number(r.tenureMonths) || 0,
                schedule
              };
            });
          } else if (sectionName === 'admin') {
            data.admin = records[0] || {};
          }
        });

        gasRun('restoreFullBackup', data)
          .then((payload) => { applyPayload(payload); showFeedback('Backup restored successfully'); })
          .catch((err) => showFeedback('Restore failed: ' + err.message));
      } catch (err) {
        showFeedback('Invalid backup file: ' + err.message);
      }
    };
    reader.onerror = () => showFeedback('Could not read that file');
    reader.readAsText(file);
  };

  const filteredTransactions = useMemo(() => {
    if (filterPeriod === 'All' || filterPeriod === 'All Time') return transactions;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return transactions.filter(t => {
      const d = parseDate(t.date);
      if (filterPeriod === 'Today') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      if (filterPeriod === 'Week') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        return d >= start && d <= today;
      }
      if (filterPeriod === 'Month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      if (filterPeriod === 'Qtr') {
        const q = Math.floor(today.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === today.getFullYear();
      }
      if (filterPeriod === 'Year') return d.getFullYear() === today.getFullYear();
      if (filterPeriod === 'Custom' && customFrom && customTo) {
        const f = parseDate(customFrom);
        const tDate = parseDate(customTo);
        tDate.setHours(23, 59, 59, 999);
        return d >= f && d <= tDate;
      }
      return true;
    });
  }, [transactions, filterPeriod, customFrom, customTo]);

  const updateTransaction = (tx) => {
    return gasRun('updateTransaction', tx)
      .then((payload) => { if (payload) applyPayload(payload); showFeedback('Transaction updated'); })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  return (
    <AppContext.Provider value={{
      transactions, filteredTransactions, persons, loans, categories, admin, loading, loadError, syncStatus,
      searchQuery, setSearchQuery, isMenuOpen, setIsMenuOpen, menuView, setMenuView,
      filterPeriod, setFilterPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
      directoryFilter, setDirectoryFilter, addTransaction, updateTransaction, deleteTransaction, 
      addPerson, updatePerson, deletePerson, addCategory, updateCategory, deleteCategory, updateAdminConfig,
      saveLoanAction, deleteLoanAction, syncData, exportCsv, exportFullBackupCsv, importFullBackupCsv, refresh, showFeedback
    }}>
      {children}
      {toast.show && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 toast-enter pointer-events-none">
          <div className="bg-theme-dark text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold tracking-wide">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            {toast.msg}
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

const AppDatePicker = ({ value, onChange, required = false, className = '', style = {} }) => {
  const inputRef = useRef(null);
  const lockRef = useRef(false);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (inputRef.current) {
      lockRef.current = true;
      inputRef.current.blur();
      setTimeout(() => { lockRef.current = false; }, 450);
    }
  };

  const handleBlock = (e) => {
    if (lockRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div onClick={e => e.stopPropagation()} onTouchStart={handleBlock} onPointerDown={handleBlock} className="relative w-full">
      <input
        ref={inputRef}
        type="date"
        required={required}
        value={value || ''}
        style={{ colorScheme: 'light', touchAction: 'manipulation', ...style }}
        onClick={handleBlock}
        onFocus={handleBlock}
        onChange={handleChange}
        className={className}
      />
    </div>
  );
};

const SearchableDropdown = ({ value, onChange, options = [], placeholder = 'Select or type...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!value) return options.slice(0, 15);
    const query = String(value).toLowerCase();
    return options.filter(opt => String(opt).toLowerCase().includes(query)).slice(0, 15);
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full font-bold text-xs border border-[#1E104B]/20 rounded-xl pl-3.5 pr-8 py-3 outline-none focus:border-[#7B2B8C] focus:ring-2 focus:ring-[#7B2B8C]/20 transition-all bg-[#F4F3F8] focus:bg-white text-[#1E104B]"
        />
        <button type="button" tabIndex="-1" onClick={() => setIsOpen(prev => !prev)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-dark/40 hover:text-theme-dark p-1">
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
        </button>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#241457] border border-[#7B2B8C]/40 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto hide-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div key={i} onClick={() => { onChange(opt); setIsOpen(false); }} className="px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#7B2B8C] cursor-pointer transition-colors border-b border-white/5 flex justify-between items-center">
                <span className="text-white font-bold">{opt}</span>
                {value === opt && <i className="fa-solid fa-check text-[10px] text-emerald-400"></i>}
              </div>
            ))
          ) : (
            <div className="px-3.5 py-2 text-[11px] text-white/50 italic">Press enter or keep typing to add new</div>
          )}
        </div>
      )}
    </div>
  );
};

const PeriodSelector = () => {
  const { filterPeriod, setFilterPeriod, customFrom, setCustomFrom, customTo, setCustomTo } = useContext(AppContext);
  const options = ['All', 'Today', 'Week', 'Month', 'Qtr', 'Year', 'Custom'];
  const activeIndex = Math.max(0, options.indexOf(filterPeriod));

  return (
    <div className="flex flex-col items-end w-full z-20">
      <div className="w-full max-w-full overflow-x-auto hide-scrollbar flex justify-end">
        <div className="relative flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner w-full min-w-[360px] sm:min-w-[480px]">
          <div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
            style={{ width: `calc((100% - 8px) / ${options.length})`, left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${options.length}))` }}
          ></div>
          {options.map((opt) => {
            const isSelected = filterPeriod === opt;
            return (
              <button key={opt} type="button" onClick={() => setFilterPeriod(opt)} className={`flex-1 relative z-10 py-1.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-tight whitespace-nowrap transition-all duration-200 select-none ${isSelected ? 'text-slate-900 font-black scale-105' : 'text-slate-500 font-semibold hover:text-slate-800'}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {filterPeriod === 'Custom' && (
        <div className="flex space-x-2 mt-1.5 bg-white p-2 rounded-xl border border-theme-dark/15 shadow-sm animate-slide-up origin-top text-[10px] font-bold items-center">
          <div className="flex flex-col w-28">
            <span className="text-theme-dark/60 uppercase text-[8px]">From</span>
            <AppDatePicker value={customFrom} onChange={setCustomFrom} className="outline-none text-theme-dark bg-transparent text-[10px] w-full cursor-pointer" />
          </div>
          <div className="flex flex-col border-l border-theme-dark/20 pl-2 w-28">
            <span className="text-theme-dark/60 uppercase text-[8px]">To</span>
            <AppDatePicker value={customTo} onChange={setCustomTo} className="outline-none text-theme-dark bg-transparent text-[10px] w-full cursor-pointer" />
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionTable = ({ transactions, maxRows = 6, showViewAll = true, onSelectTransaction, embedded = false }) => {
  const [expanded, setExpanded] = useState(false);
  const displayTxs = expanded ? transactions : transactions.slice(0, maxRows);

  if (transactions.length === 0) return <p className="text-xs text-theme-dark/60 font-semibold px-3 py-3">No records found.</p>;

  return (
    <div className={embedded ? 'w-full' : 'bg-white rounded-lg border border-theme-dark/10 overflow-hidden shadow-sm'}>
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-left text-[10px] whitespace-nowrap">
          <thead className="bg-[#E2DEEA] text-[#1E104B] uppercase font-black border-b border-[#CDC8DA] tracking-wider">
            <tr>
              <th className="px-3 py-1.5">Date</th>
              <th className="px-3 py-1.5">Description</th>
              <th className="px-3 py-1.5">Type</th>
              <th className="px-3 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-dark/5 font-medium text-theme-dark">
            {displayTxs.map(t => {
              const isPos = ['INCOME', 'BORROW'].includes(t.type);
              const txColor = isPos ? '#078A87' : '#D6455D';
              return (
                <tr key={t.id || t.entryId} onClick={() => onSelectTransaction && onSelectTransaction(t)} className="hover:bg-[#EDE9F6]/70 transition-colors cursor-pointer">
                  <td className="px-3 py-3.5 font-semibold text-[#625E70]">{formatDisplayDate(t.date)}</td>
                  <td className="px-3 py-3.5 font-bold max-w-[130px] truncate text-[#1E104B]">
                    {t.note || t.category}
                    {(t.person || t.ref) && <span className="block text-[8px] font-semibold text-[#8A8596] mt-0.5">{t.person} {t.person && t.ref ? '•' : ''} {t.ref}</span>}
                  </td>
                  <td className="px-3 py-3.5 font-extrabold text-[#8A8596] uppercase text-[9px] tracking-wider">{t.type === 'LENT' ? 'GIVEN' : t.type === 'BORROW' ? 'RECEIVED' : t.type}</td>
                  <td className="px-3 py-3.5 text-right font-black text-xs" style={{ color: txColor }}>{isPos ? '+' : '-'}{formatTableNum(t.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showViewAll && transactions.length > maxRows && (
        <div className="border-t border-theme-dark/5 bg-theme-gray/60 p-2 text-center">
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] font-bold text-theme-dark hover:opacity-70 uppercase tracking-widest transition-opacity w-full">
            {expanded ? 'Show Less' : `View All (${transactions.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { searchQuery, setSearchQuery, setIsMenuOpen, setMenuView, syncData, syncStatus, loadError } = useContext(AppContext);
  const isSyncing = syncStatus === 'syncing';
  const isError = loadError !== '';
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="grad-dark pt-3.5 pb-3 px-4 rounded-b-[1.5rem] shadow-md flex items-center space-x-2.5 flex-none z-30">
      <button onClick={() => { setMenuView('menu'); setIsMenuOpen(true); }} className="w-10 h-10 rounded-xl bg-white/10 border-0 flex items-center justify-center text-white active:scale-95 transition-all flex-none hover:bg-white/20 shadow-xs relative overflow-hidden" title="Menu">
        <span className="header-menu-cycle absolute inset-0 flex items-center justify-center">
          <i className="fa-solid fa-bars text-base header-menu-bars"></i>
          <img src={APP_ICON_WHITE} alt="Logo Icon" className="absolute h-7 w-7 object-contain header-menu-logo drop-shadow-sm" />
        </span>
      </button>
      <div className="flex-1 relative">
        <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 z-20 text-white text-sm pointer-events-none"></i>
        <input
          type="text"
          placeholder="Search people, note, category..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full backdrop-blur-md rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder-white/60 outline-none transition-colors font-medium ${isFocused || searchQuery ? 'bg-white/25 border-2 border-white ring-2 ring-white/30' : 'bg-white/10 border border-white/20'}`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white">
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>
      <button onClick={syncData} disabled={isSyncing} className={`sync-header-btn ${isSyncing ? 'is-syncing' : ''} ${isError ? 'is-error' : ''}`} title="Sync Data">
        <i className={`fa-solid fa-rotate text-sm ${isSyncing ? 'animate-spin' : ''}`}></i>
      </button>
    </div>
  );
};

const SearchView = ({ onSelectPerson, onSelectTransaction }) => {
  const { searchQuery, transactions, persons, categories } = useContext(AppContext);
  const query = searchQuery.trim().toLowerCase();

  const matchedPersons = useMemo(() => {
    if (!query) return [];
    return persons.filter(p => p.name.toLowerCase().includes(query) || (p.phone && String(p.phone).toLowerCase().includes(query)));
  }, [persons, query]);

  const matchedTransactions = useMemo(() => {
    if (!query) return [];
    return transactions.filter(t => (t.note && t.note.toLowerCase().includes(query)) || (t.category && t.category.toLowerCase().includes(query)) || (t.person && t.person.toLowerCase().includes(query)));
  }, [transactions, query]);

  const hasResults = matchedPersons.length > 0 || matchedTransactions.length > 0;

  return (
    <div className="px-4 mt-4 pb-8 space-y-5">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-theme-dark/60 font-bold">Results for "<span className="text-theme-dark">{searchQuery}</span>"</span>
        <span className="text-[10px] font-bold text-theme-dark/50">{matchedPersons.length + matchedTransactions.length} matches</span>
      </div>
      {!hasResults ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-magnifying-glass text-3xl text-theme-dark/20 mb-2"></i>
          <p className="text-sm font-bold text-theme-dark/60">No matches found</p>
        </div>
      ) : (
        <>
          {matchedPersons.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-[#625E70] uppercase tracking-wider mb-2 px-1">People ({matchedPersons.length})</h3>
              <div className="space-y-2">
                {matchedPersons.map(p => (
                  <div key={p.id} onClick={() => onSelectPerson(p)} className="p-3 bg-white border border-[#E4E1EA] rounded-2xl shadow-xs cursor-pointer flex justify-between items-center hover:bg-[#F4F3F8] transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#7B2B8C]/15 text-[#7B2B8C] flex items-center justify-center font-black text-xs">{p.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold text-[#1E104B]">{p.name}</p>
                        <p className="text-[10px] text-[#8A8596] font-semibold">{p.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {matchedTransactions.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-theme-dark uppercase tracking-wider mb-2 px-1">Transactions ({matchedTransactions.length})</h3>
              <TransactionTable transactions={matchedTransactions} maxRows={100} showViewAll={false} onSelectTransaction={onSelectTransaction} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SideMenuBranding = () => (
  <div className="pt-6 pb-3 flex flex-col items-center justify-center text-center opacity-80 flex-none">
    <img src={APP_LOGO_COLORED} alt="Budget Bharat" className="h-6 object-contain mb-1.5" />
    <p className="text-[9px] font-bold text-[#8A8596]">Developed by - Bharat Rasve © 2026</p>
  </div>
);

const SideMenu = () => {
  const { isMenuOpen, setIsMenuOpen, menuView, setMenuView, persons, categories, admin, addPerson, updatePerson, deletePerson, addCategory, updateCategory, deleteCategory, updateAdminConfig, exportCsv, exportFullBackupCsv, importFullBackupCsv } = useContext(AppContext);
  const [formData, setFormData] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [catType, setCatType] = useState('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [catToDelete, setCatToDelete] = useState(null);

  if (!isMenuOpen) return null;

  const openSubView = (view, item = null) => {
    setMenuView(view);
    setEditItem(item);
    if (item && view === 'editCategory') setFormData({ name: item });
    else if (item) setFormData(item);
    else if (view === 'manageAdmin') setFormData(admin || {});
    else setFormData({});
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (menuView === 'addPerson') await addPerson({ name: formData.name, phone: formData.phone, email: formData.email, address: formData.address || 'Maharashtra' });
      else if (menuView === 'editPerson') await updatePerson({ oldName: editItem.name, name: formData.name, phone: formData.phone, email: formData.email, address: formData.address });
      else if (menuView === 'addCategory') await addCategory(catType, formData.name);
      else if (menuView === 'editCategory') await updateCategory({ type: catType, oldName: editItem }, { type: catType, newName: formData.name });
      else if (menuView === 'manageAdmin') await updateAdminConfig(formData);
      setMenuView('menu');
      setIsMenuOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeletePerson = async () => {
    if (!personToDelete) return;
    setIsSubmitting(true);
    try {
      await deletePerson(personToDelete);
      setPersonToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(catToDelete);
      setCatToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1E104B]/70 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
      <div className="relative w-5/6 max-w-sm bg-[#F4F3F8] h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="grad-dark p-5 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_ICON_WHITE} alt="App Icon" className="h-9 w-9 object-contain opacity-95 flex-none" />
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Budget Bharat</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Console Setup & Master Config</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {menuView === 'menu' && (
          <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
            <div className="px-6 mb-2 text-[10px] font-bold text-[#8A8596] uppercase tracking-widest">Backend Management</div>
            <button onClick={() => openSubView('managePersons')} className="w-full text-left px-6 py-3.5 hover:bg-white transition-colors text-sm font-bold text-[#1E104B] flex items-center justify-between">
              <span><i className="fa-solid fa-users w-7 text-[#7B2B8C]"></i> Manage Persons ({persons.length})</span>
              <i className="fa-solid fa-chevron-right text-xs text-[#8A8596]"></i>
            </button>
            <button onClick={() => openSubView('manageCategories')} className="w-full text-left px-6 py-3.5 hover:bg-white transition-colors text-sm font-bold text-[#1E104B] flex items-center justify-between">
              <span><i className="fa-solid fa-tags w-7 text-[#7B2B8C]"></i> Manage Categories</span>
              <i className="fa-solid fa-chevron-right text-xs text-[#8A8596]"></i>
            </button>
            <button onClick={() => openSubView('manageAdmin')} className="w-full text-left px-6 py-3.5 hover:bg-white transition-colors text-sm font-bold text-[#1E104B] flex items-center justify-between">
              <span><i className="fa-solid fa-user-gear w-7 text-[#7B2B8C]"></i> Admin Setup</span>
              <i className="fa-solid fa-chevron-right text-xs text-[#8A8596]"></i>
            </button>

            <div className="px-6 mt-4 mb-2 text-[10px] font-bold text-[#8A8596] uppercase tracking-widest">Backup & Restore</div>
            <button onClick={() => exportFullBackupCsv()} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-database w-7 text-[#7B2B8C]"></i> Full Data Backup (CSV)</button>
            <label className="w-full flex items-center px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B] cursor-pointer">
              <i className="fa-solid fa-file-import w-7 text-[#078A87]"></i> Restore from Backup
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  e.target.value = '';
                  if (!file) return;
                  if (!window.confirm('Restoring a backup replaces all current data on this device. Continue?')) return;
                  setIsMenuOpen(false);
                  importFullBackupCsv(file);
                }}
              />
            </label>
            <SideMenuBranding />
          </div>
        )}

        {(menuView === 'addPerson' || menuView === 'editPerson' || menuView === 'addCategory' || menuView === 'editCategory' || menuView === 'manageAdmin') && (
          <div className="flex-1 p-6 flex flex-col h-full overflow-y-auto hide-scrollbar bg-white">
            <button onClick={() => setMenuView('menu')} className="text-xs font-bold text-[#625E70] mb-3 self-start"><i className="fa-solid fa-arrow-left mr-1.5"></i> Back</button>
            <form onSubmit={handleFormSubmit} className="space-y-4 pb-12">
              <input type="text" required placeholder="Name / Title" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8]" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#1E104B] text-white font-bold py-3.5 rounded-xl uppercase text-xs">Save</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const HomeView = ({ onSelectPerson, onSelectTransaction, onNavigateTab }) => {
  const { filteredTransactions, transactions, persons, loans, setDirectoryFilter } = useContext(AppContext);

  const kpi = useMemo(() => {
    let e = 0, i = 0, dr = 0, cr = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'EXPENSE') e += t.amount;
      else if (t.type === 'INCOME') i += t.amount;
      else if (t.type === 'LENT') dr += t.amount;
      else if (t.type === 'BORROW') cr += t.amount;
    });
    return { e, i, dr, cr };
  }, [filteredTransactions]);

  const allPersonBalances = useMemo(() => {
    return persons.map(p => {
      let dr = 0, cr = 0;
      transactions.filter(t => t.person === p.name).forEach(t => {
        if (t.type === 'LENT') dr += Number(t.amount) || 0;
        if (t.type === 'BORROW') cr += Number(t.amount) || 0;
      });
      return { ...p, totalDr: dr, totalCr: cr, bal: dr - cr };
    });
  }, [persons, transactions]);

  const totalReceivable = allPersonBalances.filter(p => p.bal > 0).reduce((s, p) => s + p.bal, 0);
  const totalPayable = allPersonBalances.filter(p => p.bal < 0).reduce((s, p) => s + Math.abs(p.bal), 0);
  const topPeople = useMemo(() => allPersonBalances.filter(p => p.bal !== 0).sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal)).slice(0, 6), [allPersonBalances]);

  return (
    <div className="px-4 mt-2 pb-32 space-y-3.5">
      <div className="flex justify-end items-start px-1"><PeriodSelector /></div>
      <div className="grad-kpi rounded-2xl p-3.5 shadow-md flex justify-between divide-x divide-white/10 mt-0.5">
        <div className="flex-1 text-center px-1"><p className="text-[9px] font-bold text-white/70 uppercase">Expense</p><p className="text-sm font-black text-white mt-1">{formatMoney(kpi.e)}</p></div>
        <div className="flex-1 text-center px-1"><p className="text-[9px] font-bold text-white/70 uppercase">Income</p><p className="text-sm font-black text-white mt-1">{formatMoney(kpi.i)}</p></div>
        <div className="flex-1 text-center px-1"><p className="text-[9px] font-bold text-white/70 uppercase">Given</p><p className="text-sm font-black text-white mt-1">{formatMoney(kpi.dr)}</p></div>
        <div className="flex-1 text-center px-1"><p className="text-[9px] font-bold text-white/70 uppercase">Received</p><p className="text-sm font-black text-white mt-1">{formatMoney(kpi.cr)}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-theme-dark/10 overflow-hidden shadow-sm">
        <div className="px-3.5 py-3 border-b border-theme-dark/5"><h2 className="text-[11px] font-black text-theme-dark uppercase">Recent Transactions</h2></div>
        <TransactionTable transactions={filteredTransactions} maxRows={6} showViewAll={false} onSelectTransaction={onSelectTransaction} embedded={true} />
      </div>
      <AppBottomBranding />
    </div>
  );
};

const PersonsView = ({ onSelectPerson }) => {
  const { persons, transactions, showFeedback, directoryFilter, setDirectoryFilter } = useContext(AppContext);
  const pData = useMemo(() => {
    const raw = (persons || []).map(p => {
      let dr = 0, cr = 0;
      (transactions || []).filter(t => String(t.person || '').trim().toLowerCase() === String(p.name || '').trim().toLowerCase()).forEach(t => {
        if (t.type === 'LENT') dr += Number(t.amount) || 0;
        if (t.type === 'BORROW') cr += Number(t.amount) || 0;
      });
      return { ...p, totalDr: dr, totalCr: cr, remaining: dr - cr };
    }).sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining));
    if (directoryFilter === 'RECEIVABLE') return raw.filter(p => p.remaining > 0);
    if (directoryFilter === 'PAYABLE') return raw.filter(p => p.remaining < 0);
    return raw;
  }, [persons, transactions, directoryFilter]);

  return (
    <div className="px-4 mt-2 space-y-3 pb-32">
      <div className="flex justify-end items-center">
        <div className="flex bg-slate-200/90 p-1 rounded-xl shadow-inner gap-1">
          <button onClick={() => setDirectoryFilter('ALL')} className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase ${directoryFilter === 'ALL' ? 'bg-white text-[#1E104B]' : 'text-slate-500'}`}>All</button>
          <button onClick={() => setDirectoryFilter('RECEIVABLE')} className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase ${directoryFilter === 'RECEIVABLE' ? 'bg-[#078A87] text-white' : 'text-slate-500'}`}>Credit</button>
          <button onClick={() => setDirectoryFilter('PAYABLE')} className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase ${directoryFilter === 'PAYABLE' ? 'bg-[#D6455D] text-white' : 'text-slate-500'}`}>Debit</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E1EA] shadow-xs overflow-hidden">
        <table className="w-full table-fixed text-[10px]">
          <thead className="bg-[#E8E6F0] text-[#1E104B] uppercase font-black">
            <tr>
              <th className="w-[34%] px-2.5 py-2 text-left">Person Name</th>
              <th className="w-[22%] px-1.5 py-2 text-right">Given</th>
              <th className="w-[22%] px-1.5 py-2 text-right">Recv</th>
              <th className="w-[22%] px-2 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E1EA]/60 font-semibold text-[#1E104B]">
            {pData.map((p) => {
              const isRec = p.remaining > 0;
              const isPay = p.remaining < 0;
              return (
                <tr key={p.id || p.name} onClick={() => onSelectPerson(p)} className="hover:bg-[#F4F3F8] cursor-pointer">
                  <td className="px-2.5 py-3.5 truncate font-extrabold text-xs">{p.name}</td>
                  <td className="px-1.5 py-3.5 text-right font-bold text-[#7B2B8C]">{formatMoney(p.totalDr)}</td>
                  <td className="px-1.5 py-3.5 text-right font-bold text-[#078A87]">{formatMoney(p.totalCr)}</td>
                  <td className="px-2 py-3.5 text-right font-black" style={{ color: isRec ? '#078A87' : isPay ? '#D6455D' : '#625E70' }}>{isRec ? '+' : isPay ? '-' : ''}{formatMoney(Math.abs(p.remaining))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AppBottomBranding />
    </div>
  );
};

const LedgerView = ({ person, onBack, onSelectPerson, allPersons, onSelectTransaction }) => {
  const { transactions, deletePerson, syncStatus, loadError } = useContext(AppContext);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const statementSlipRef = useRef(null);

  const rawTxs = useMemo(() => (transactions || []).filter(t => String(t.person || '').trim().toLowerCase() === String(person.name || '').trim().toLowerCase()), [transactions, person.name]);
  const txs = useMemo(() => {
    if (!ledgerSearch.trim()) return rawTxs;
    const q = ledgerSearch.toLowerCase().trim();
    return rawTxs.filter(t => (t.note && t.note.toLowerCase().includes(q)) || (t.category && t.category.toLowerCase().includes(q)));
  }, [rawTxs, ledgerSearch]);

  const currentIndex = (allPersons || []).findIndex(p => String(p.name || '').trim().toLowerCase() === String(person.name || '').trim().toLowerCase());

  return (
    <React.Fragment>
      <div className="flex-none grad-dark px-3.5 py-3 text-white flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
          <button onClick={onBack} className="w-8 h-8 flex-none flex items-center justify-center hover:bg-white/10 rounded-full"><i className="fa-solid fa-arrow-left text-base"></i></button>
          <div className="flex flex-col min-w-0"><h1 className="text-sm sm:text-base font-extrabold truncate">{person.name}</h1></div>
        </div>
        {allPersons && allPersons.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full text-[11px] font-black">
            <button onClick={() => currentIndex > 0 ? onSelectPerson(allPersons[currentIndex - 1]) : onSelectPerson(allPersons[allPersons.length - 1])}><i className="fa-solid fa-chevron-left text-[9px]"></i></button>
            <span>({currentIndex >= 0 ? currentIndex + 1 : 1}/{allPersons.length})</span>
            <button onClick={() => currentIndex < allPersons.length - 1 ? onSelectPerson(allPersons[currentIndex + 1]) : onSelectPerson(allPersons[0])}><i className="fa-solid fa-chevron-right text-[9px]"></i></button>
          </div>
        )}
      </div>
      <div className="app-content bg-theme-gray pb-32">
        <div className="p-4 space-y-3">
          <div className="grad-kpi py-3.5 px-3 rounded-2xl shadow-md grid grid-cols-3 text-center text-white">
            <div><p className="text-[10px] font-bold text-white/70">GIVEN</p><p className="text-sm font-black">{formatMoney(person.totalDr)}</p></div>
            <div><p className="text-[10px] font-bold text-white/70">RECEIVED</p><p className="text-sm font-black">{formatMoney(person.totalCr)}</p></div>
            <div><p className="text-[10px] font-bold text-white/70">BALANCE</p><p className="text-sm font-black">{formatMoney(Math.abs(person.remaining))}</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-xs border border-[#E4E1EA] overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#E2DEEA] text-[#1E104B] font-black uppercase">
                <tr><th className="px-3.5 py-1.5">Date</th><th className="px-3.5 py-1.5">Description</th><th className="px-3.5 py-1.5 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1EA]/60 font-medium text-[#1E104B]">
                {txs.map(t => (
                  <tr key={t.id || t.entryId} onClick={() => onSelectTransaction && onSelectTransaction(t)} className="hover:bg-[#F4F3F8] cursor-pointer">
                    <td className="px-3.5 py-3">{formatDisplayDate(t.date)}</td>
                    <td className="px-3.5 py-3 font-bold">{t.note || t.category}</td>
                    <td className={`px-3.5 py-3 text-right font-black ${t.type === 'LENT' ? 'text-[#7B2B8C]' : 'text-[#078A87]'}`}>{t.type === 'LENT' ? '-' : '+'}{formatTableNum(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AppBottomBranding />
        </div>
      </div>
    </React.Fragment>
  );
};

const LoanManagerView = () => {
  const { loans } = useContext(AppContext);
  return (
    <div className="px-4 mt-2 pb-32 space-y-3.5">
      <div className="bg-white rounded-2xl border border-[#E4E1EA] shadow-xs overflow-hidden">
        {(!loans || loans.length === 0) ? (
          <div className="text-center py-12 px-4"><p className="text-xs font-bold text-gray-500">No active loans found.</p></div>
        ) : (
          <table className="w-full table-fixed text-[10px]">
            <thead className="bg-[#E8E6F0] text-[#1E104B] uppercase font-black">
              <tr><th className="w-[34%] px-3 py-2 text-left">Loan Name</th><th className="w-[22%] px-2 py-2 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1EA]/60 font-semibold text-[#1E104B]">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-[#F4F3F8]">
                  <td className="px-3 py-3.5 font-extrabold text-xs">{loan.loanName}</td>
                  <td className="px-2 py-3.5 text-right font-black text-xs">{formatMoney(loan.loanAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AppBottomBranding />
    </div>
  );
};

const RecordsView = ({ onSelectTransaction }) => {
  const { filteredTransactions } = useContext(AppContext);
  return (
    <div className="px-4 mt-2 pb-32 space-y-3.5">
      <div className="flex justify-end mb-2.5"><PeriodSelector /></div>
      <TransactionTable transactions={filteredTransactions} maxRows={50} showViewAll={false} onSelectTransaction={onSelectTransaction} />
      <AppBottomBranding />
    </div>
  );
};

const TransactionDetailModal = ({ tx, onClose }) => {
  const { deleteTransaction } = useContext(AppContext);
  if (!tx) return null;

  return (
    <div className="fixed inset-0 z-50 bg-theme-dark/60 backdrop-blur-sm flex items-end justify-center p-0" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 relative shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-extrabold text-[#1E104B] uppercase">Transaction Details</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#F4F3F8] rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-700">Amount: {formatMoney(tx.amount)}</p>
          <p className="text-xs font-bold text-gray-700">Type: {tx.type}</p>
          <p className="text-xs font-bold text-gray-700">Note: {tx.note || '-'}</p>
          <button onClick={() => { deleteTransaction(tx.entryId || tx.id); onClose(); }} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl uppercase text-xs">Delete Transaction</button>
        </div>
      </div>
    </div>
  );
};

const InputModal = ({ onClose, defaultPerson = '' }) => {
  const { addTransaction, persons } = useContext(AppContext);
  const [type, setType] = useState('EXPENSE');
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personName, setPersonName] = useState(defaultPerson || '');
  const [note, setNote] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!amt || isNaN(amt)) return;
    await addTransaction({ type, amount: parseFloat(amt), person: personName, date: date.split('-').reverse().join('/'), note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-theme-dark/60 backdrop-blur-sm flex items-end justify-center p-0" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 relative shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-sm font-extrabold text-theme-dark uppercase">New Record</h2><button onClick={onClose} className="w-8 h-8 bg-theme-gray rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button></div>
        <form onSubmit={submit} className="space-y-4">
          <input type="number" required placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)} className="w-full border rounded-xl p-3 bg-[#F4F3F8]" />
          <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-xl p-3 bg-[#F4F3F8]" />
          <input type="text" placeholder="Description" value={note} onChange={e => setNote(e.target.value)} className="w-full border rounded-xl p-3 bg-[#F4F3F8]" />
          <button type="submit" className="w-full bg-[#078A87] text-white font-black py-3 rounded-full uppercase text-xs">Save Entry</button>
        </form>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { searchQuery, setSearchQuery, persons, transactions, loading, loadError, refresh } = useContext(AppContext);
  const [tab, setTab] = useState('home');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [fabShowingAppIcon, setFabShowingAppIcon] = useState(true);

  useEffect(() => {
    const fabCycle = setInterval(() => setFabShowingAppIcon(prev => !prev), 6000);
    return () => clearInterval(fabCycle);
  }, []);

  const fullPersonList = useMemo(() => {
    return (persons || []).map(p => {
      let dr = 0, cr = 0;
      (transactions || []).filter(t => String(t.person || '').trim().toLowerCase() === String(p.name || '').trim().toLowerCase()).forEach(t => {
        if (t.type === 'LENT') dr += Number(t.amount) || 0;
        if (t.type === 'BORROW') cr += Number(t.amount) || 0;
      });
      return { ...p, totalDr: dr, totalCr: cr, remaining: dr - cr };
    }).sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining));
  }, [persons, transactions]);

  if (loading && (!transactions || transactions.length === 0)) return <div className="app-shell flex items-center justify-center font-bold">Loading...</div>;

  if (selectedPerson) {
    const refreshedPerson = fullPersonList.find(p => String(p.name || '').trim().toLowerCase() === String(selectedPerson.name || '').trim().toLowerCase()) || selectedPerson;
    return (
      <div className="app-shell">
        <ErrorBoundary key={refreshedPerson.name} label={refreshedPerson.name + "'s ledger"} onReset={() => setSelectedPerson(null)}>
          <LedgerView person={refreshedPerson} onBack={() => setSelectedPerson(null)} onSelectPerson={setSelectedPerson} allPersons={fullPersonList} onSelectTransaction={setSelectedTransaction} />
        </ErrorBoundary>
        {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
        {showInput && <InputModal onClose={() => setShowInput(false)} defaultPerson={refreshedPerson.name} />}
        
        <div className="notched-nav-container select-none">
          <div className="notched-pill">
            <div className="flex items-center gap-7 sm:gap-9 pr-4">
              <button onClick={() => { setSelectedPerson(null); setTab('home'); }} className="p-2 text-white/50 hover:text-white flex flex-col items-center"><i className="fa-solid fa-house text-lg"></i></button>
              <button onClick={() => { setSelectedPerson(null); setTab('people'); }} className="p-2 text-[#07C0BE] flex flex-col items-center"><i className="fa-solid fa-users text-lg"></i></button>
              <button onClick={() => { setSelectedPerson(null); setTab('loans'); }} className="p-2 text-white/50 hover:text-white flex flex-col items-center"><i className="fa-solid fa-hand-holding-dollar text-lg"></i></button>
              <button onClick={() => { setSelectedPerson(null); setTab('records'); }} className="p-2 text-white/50 hover:text-white flex flex-col items-center"><i className="fa-solid fa-receipt text-lg"></i></button>
            </div>
          </div>
          <button onClick={() => setShowInput(true)} className="notched-fab">
            <span className="relative w-8 h-8 flex items-center justify-center">
              <img src={APP_ICON_WHITE} alt="Icon" className={`absolute w-8 h-8 object-contain transition-all duration-700 ${fabShowingAppIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
              <span className={`fab-heavy-plus absolute transition-all duration-700 ${fabShowingAppIcon ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}></span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <SideMenu />
      <div className="app-content">
        {searchQuery.trim().length > 0 ? (
          <ErrorBoundary key="search" label="Search"><SearchView onSelectPerson={setSelectedPerson} onSelectTransaction={setSelectedTransaction} /></ErrorBoundary>
        ) : (
          <>
            {tab === 'home' && <ErrorBoundary key="home" label="Home"><HomeView onSelectPerson={setSelectedPerson} onSelectTransaction={setSelectedTransaction} onNavigateTab={setTab} /></ErrorBoundary>}
            {tab === 'people' && <ErrorBoundary key="people" label="Persons"><PersonsView onSelectPerson={setSelectedPerson} /></ErrorBoundary>}
            {tab === 'loans' && <ErrorBoundary key="loans" label="Loans / EMIs"><LoanManagerView onSelectPerson={setSelectedPerson} /></ErrorBoundary>}
            {tab === 'records' && <ErrorBoundary key="records" label="Records"><RecordsView onSelectTransaction={setSelectedTransaction} /></ErrorBoundary>}
          </>
        )}
      </div>

      {showInput && <InputModal onClose={() => setShowInput(false)} />}
      {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}

      <div className="notched-nav-container select-none">
        <div className="notched-pill">
          <div className="flex items-center gap-7 sm:gap-9 pr-4">
            <button onClick={() => setTab('home')} className={`p-2 flex flex-col items-center ${tab === 'home' ? 'text-[#07C0BE]' : 'text-white/50 hover:text-white'}`}><i className="fa-solid fa-house text-lg"></i></button>
            <button onClick={() => setTab('people')} className={`p-2 flex flex-col items-center ${tab === 'people' ? 'text-[#07C0BE]' : 'text-white/50 hover:text-white'}`}><i className="fa-solid fa-users text-lg"></i></button>
            <button onClick={() => setTab('loans')} className={`p-2 flex flex-col items-center ${tab === 'loans' ? 'text-[#07C0BE]' : 'text-white/50 hover:text-white'}`}><i className="fa-solid fa-hand-holding-dollar text-lg"></i></button>
            <button onClick={() => setTab('records')} className={`p-2 flex flex-col items-center ${tab === 'records' ? 'text-[#07C0BE]' : 'text-white/50 hover:text-white'}`}><i className="fa-solid fa-receipt text-lg"></i></button>
          </div>
        </div>
        <button onClick={() => setShowInput(true)} className="notched-fab">
          <span className="relative w-8 h-8 flex items-center justify-center">
            <img src={APP_ICON_WHITE} alt="Icon" className={`absolute w-8 h-8 object-contain transition-all duration-700 ${fabShowingAppIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
            <span className={`fab-heavy-plus absolute transition-all duration-700 ${fabShowingAppIcon ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}></span>
          </span>
        </button>
      </div>
    </div>
  );
};

initDB().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary label="Budget Bharat">
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
});

// --- END OF src/main.jsx ---
