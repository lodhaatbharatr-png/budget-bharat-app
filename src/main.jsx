import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

// Import extracted constants
import { 
  INCOME_TYPES, 
  SELECT_STYLE, 
  MONTHS_SHORT, 
  APP_ICON_WHITE, 
  APP_LOGO_COLORED, 
  APP_LOGO_WHITE 
} from './constants';

// Import SQLite backend bridge
import { initDB, BackendBridge } from './db.js';

// Import Tailwind CSS
import './index.css';

// Helper to safely join array-based Base64 assets
const resolveImg = (src) => (Array.isArray(src) ? src.join('') : (src || ''));

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
        src={resolveImg(APP_LOGO_COLORED)}
        alt="Budget Bharat"
        className="h-[31px] object-contain mb-1.5 drop-shadow-sm"
      />
      <p className="text-[10px] font-bold text-[#625E70] tracking-wide mb-2.5">
        Developed by - Bharat Rasve © 2026
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            window.location.href = `tel:0${String(7218838122 || '').replace(/\D/g, '').slice(-10)}`;
          }}
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

        <a
          href="https://www.linkedin.com/in/bharatrasve"
          target="_blank"
          rel="noopener noreferrer"
          title="LinkedIn"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
          <i className="fa-brands fa-linkedin-in text-sm"></i>
        </a>

        <a
          href="https://github.com/bharombhar"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
          <i className="fa-brands fa-github text-sm"></i>
        </a>

        <a
          href="https://www.instagram.com/bharat_rasve_?r=nametag"
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
          <i className="fa-brands fa-instagram text-sm"></i>
        </a>

        <a
          href="https://bharatrasve.blogspot.com/"
          target="_blank"
          rel="noopener noreferrer"
          title="Website"
          className="w-9 h-9 flex items-center justify-center text-[#1E104B] hover:opacity-70 active:scale-90 transition-all"
        >
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
    if (BackendBridge && BackendBridge[fnName]) {
      return await BackendBridge[fnName](...args);
    } else {
      console.warn(`Function ${fnName} not implemented in SQLite bridge yet.`);
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
    try { await document.fonts.ready; } catch (e) { /* non-fatal */ }
  }

  const targetWidth = parseInt(target && target.style ? target.style.width : 0, 10) || Math.ceil((target && target.getBoundingClientRect ? target.getBoundingClientRect().width : 0) || target.offsetWidth) || 640;
  const targetHeight = Math.ceil((target && target.getBoundingClientRect ? target.getBoundingClientRect().height : 0) || target.offsetHeight || target.scrollHeight);
  const dynamicScale = targetHeight > 2500 ? 1.2 : targetHeight > 1500 ? 1.5 : 2;

  let canvas;
  try {
    canvas = await html2canvas(target, { 
      backgroundColor: '#ffffff', 
      scale: dynamicScale, 
      logging: false, 
      useCORS: true, 
      allowTaint: true,
      foreignObjectRendering: false,
      letterRendering: false,
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      scrollY: 0,
      scrollX: 0
    });
  } catch (canvasErr) {
    throw new Error("Statement is too long to export as a single image on this device.");
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas blob generation failed"));
    }, 'image/jpeg', 0.85);
  });

  if (!blob) throw new Error("Empty image blob created");
  const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: captionText
      });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return true;
      if (err.name === 'NotAllowedError') {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.jpg`;
        link.click();
        URL.revokeObjectURL(link.href);
        return true;
      }
      throw err;
    }
  } else {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.jpg`;
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  }
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
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback(`${typeLabel} entry saved`); 
      })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const deleteTransaction = (id) => {
    const targetId = typeof id === 'object' ? String(id.id || id.entryId || '').trim() : String(id || '').trim();
    return gasRun('deleteTransaction', targetId)
      .then((payload) => {
        if (payload && payload.transactions) {
          applyPayload(payload);
        } else {
          setTransactions(prev => prev.filter(t => String(t.id || t.entryId).trim() !== targetId));
        }
        showFeedback('Transaction deleted');
      })
      .catch((err) => {
        refresh(false, true);
        showFeedback('Delete failed: ' + (err && err.message ? err.message : String(err)));
        throw err;
      });
  };

  const addPerson = (p) => {
    return gasRun('addPerson', p)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Person Added to Directory'); 
      })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const updatePerson = (p) => {
    return gasRun('updatePerson', p)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Person & transactions updated'); 
      })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  const deletePerson = (personName) => {
    return gasRun('deletePerson', personName)
      .then((payload) => { 
        if (payload && payload.persons) {
          applyPayload(payload);
        } else {
          setPersons(prev => prev.filter(p => p.name !== personName));
          setTransactions(prev => prev.filter(t => t.person !== personName));
        }
        showFeedback('Person & related entries deleted'); 
      })
      .catch((err) => { 
        refresh(false, true);
        showFeedback('Delete failed: ' + (err && err.message ? err.message : String(err))); 
        throw err; 
      });
  };

  const addCategory = (type, name) => {
    return gasRun('addCategory', type, name)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Category Added'); 
      })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const updateCategory = (oldData, newData) => {
    return gasRun('updateCategory', oldData, newData)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Category Updated'); 
      })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  const deleteCategory = (catData) => {
    return gasRun('deleteCategory', catData)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Category Deleted'); 
      })
      .catch((err) => { showFeedback('Delete failed: ' + err.message); throw err; });
  };

  const updateAdminConfig = (adminData) => {
    return gasRun('updateAdminConfig', adminData)
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Admin settings saved'); 
      })
      .catch((err) => { showFeedback('Save failed: ' + err.message); throw err; });
  };

  const syncData = () => { refresh(true, true); };

  const exportCsv = (rpcFn, filename) => {
    showFeedback('Preparing export...');
    gasRun(rpcFn)
      .then((csv) => { downloadCsv(csv, filename); showFeedback('Exported ' + filename); })
      .catch((err) => showFeedback('Export failed: ' + err.message));
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
      .then((payload) => { 
        if (payload) applyPayload(payload); 
        showFeedback('Transaction updated'); 
      })
      .catch((err) => { showFeedback('Update failed: ' + err.message); throw err; });
  };

  return (
    <AppContext.Provider value={{
      transactions, filteredTransactions, persons, loans, categories, admin, loading, loadError, syncStatus,
      searchQuery, setSearchQuery,
      isMenuOpen, setIsMenuOpen, menuView, setMenuView,
      filterPeriod, setFilterPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
      directoryFilter, setDirectoryFilter,
      addTransaction, updateTransaction, deleteTransaction, addPerson, updatePerson, deletePerson, addCategory, updateCategory, deleteCategory, updateAdminConfig,
      saveLoanAction, deleteLoanAction,
      syncData, exportCsv, refresh, showFeedback
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
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
          className="w-full font-bold text-xs border border-[#1E104B]/20 rounded-xl pl-3.5 pr-8 py-3 outline-none focus:border-[#7B2B8C] focus:ring-2 focus:ring-[#7B2B8C]/20 transition-all bg-[#F4F3F8] focus:bg-white text-[#1E104B] placeholder-[#625E70]/50"
        />
        <button
          type="button"
          tabIndex="-1"
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-dark/40 hover:text-theme-dark p-1"
        >
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#241457] border border-[#7B2B8C]/40 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto hide-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div
                key={i}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className="px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#7B2B8C] cursor-pointer transition-colors border-b border-white/5 last:border-b-0 flex justify-between items-center"
              >
                <span className="text-white font-bold">{opt}</span>
                {value === opt && <i className="fa-solid fa-check text-[10px] text-emerald-400"></i>}
              </div>
            ))
          ) : (
            <div className="px-3.5 py-2 text-[11px] text-white/50 italic">
              Press enter or keep typing to add new
            </div>
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
            style={{
              width: `calc((100% - 8px) / ${options.length})`,
              left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${options.length}))`
            }}
          ></div>

          {options.map((opt) => {
            const isSelected = filterPeriod === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilterPeriod(opt)}
                className={`flex-1 relative z-10 py-1.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-tight whitespace-nowrap transition-all duration-200 select-none ${
                  isSelected
                    ? 'text-slate-900 font-black scale-105'
                    : 'text-slate-500 font-semibold hover:text-slate-800'
                }`}
              >
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
                <tr
                  key={t.id || t.entryId}
                  onClick={() => onSelectTransaction && onSelectTransaction(t)}
                  className="hover:bg-[#EDE9F6]/70 transition-colors cursor-pointer active:bg-[#E2DEEA]/50"
                >
                  <td className="px-3 py-3.5 font-semibold text-[#625E70]">{formatDisplayDate(t.date)}</td>
                  <td className="px-3 py-3.5 font-bold max-w-[130px] truncate text-[#1E104B]">
                    {t.note || t.category}
                    {(t.person || t.ref) && (
                      <span className="block text-[8px] font-semibold text-[#8A8596] mt-0.5">
                        {t.person} {t.person && t.ref ? '•' : ''} {t.ref}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 font-extrabold text-[#8A8596] uppercase text-[9px] tracking-wider">
                    {t.type === 'LENT' ? 'GIVEN' : t.type === 'BORROW' ? 'RECEIVED' : t.type}
                  </td>
                  <td className="px-3 py-3.5 text-right font-black text-xs" style={{ color: txColor }}>
                    {isPos ? '+' : '-'}{formatTableNum(t.amount)}
                  </td>
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
      <button
        onClick={() => { setMenuView('menu'); setIsMenuOpen(true); }}
        className="w-10 h-10 rounded-xl bg-white/10 border-0 flex items-center justify-center text-white active:scale-95 transition-all flex-none hover:bg-white/20 shadow-xs relative overflow-hidden"
        title="Menu"
      >
        <span className="header-menu-cycle absolute inset-0 flex items-center justify-center">
          <i className="fa-solid fa-bars text-base header-menu-bars"></i>
          <img
            src={resolveImg(APP_ICON_WHITE)}
            alt="Logo Icon"
            className="absolute h-7 w-7 object-contain header-menu-logo drop-shadow-sm"
          />
        </span>
      </button>

      <div className="flex-1 relative">
        <i
          className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 z-20 text-white text-sm pointer-events-none"
          style={{ display: 'block', lineHeight: 1 }}
        ></i>
        <input
          type="text"
          placeholder="Search people, note, category..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full backdrop-blur-md rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder-white/60 outline-none transition-colors font-medium ${
            isFocused || searchQuery
              ? 'bg-white/25 border-2 border-white ring-2 ring-white/30'
              : 'bg-white/10 border border-white/20'
          }`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white">
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>
      <button
        onClick={syncData}
        disabled={isSyncing}
        className={`sync-header-btn ${isSyncing ? 'is-syncing' : ''} ${isError ? 'is-error' : ''}`}
        title={isSyncing ? 'Syncing...' : isError ? 'Error. Tap to retry.' : 'Sync Data'}
      >
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
    return persons.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.phone && String(p.phone).toLowerCase().includes(query))
    );
  }, [persons, query]);

  const matchedTransactions = useMemo(() => {
    if (!query) return [];
    return transactions.filter(t =>
      (t.note && t.note.toLowerCase().includes(query)) ||
      (t.category && t.category.toLowerCase().includes(query)) ||
      (t.person && t.person.toLowerCase().includes(query)) ||
      (t.ref && t.ref.toLowerCase().includes(query))
    );
  }, [transactions, query]);

  const matchedCategories = useMemo(() => {
    if (!query) return [];
    const allCats = [...categories.expense, ...categories.income];
    return allCats.filter(c => c.toLowerCase().includes(query));
  }, [categories, query]);

  const hasResults = matchedPersons.length > 0 || matchedTransactions.length > 0 || matchedCategories.length > 0;

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
                {matchedPersons.map(p => {
                  let dr = 0, cr = 0;
                  transactions.filter(t => t.person === p.name).forEach(t => {
                    if (t.type === 'LENT') dr += t.amount;
                    if (t.type === 'BORROW') cr += t.amount;
                  });
                  const bal = dr - cr;
                  const balColor = bal > 0 ? '#078A87' : bal < 0 ? '#D6455D' : '#625E70';

                  return (
                    <div key={p.id} onClick={() => onSelectPerson(p)} className="p-3 bg-white border border-[#E4E1EA] rounded-2xl shadow-xs cursor-pointer flex justify-between items-center hover:bg-[#F4F3F8] transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#7B2B8C]/15 text-[#7B2B8C] flex items-center justify-center font-black text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E104B]">{p.name}</p>
                          <p className="text-[10px] text-[#8A8596] font-semibold">{p.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black" style={{ color: balColor }}>
                          {bal > 0 ? '+' : bal < 0 ? '-' : ''}{formatMoney(Math.abs(bal))}
                        </span>
                        <span className="block text-[8px] font-bold text-[#8A8596] uppercase">
                          {bal > 0 ? 'Receivable' : bal < 0 ? 'Payable' : 'Settled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedCategories.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-[#625E70] uppercase tracking-wider mb-2 px-1">Categories</h3>
              <div className="flex flex-wrap gap-1.5">
                {matchedCategories.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-[#E4E1EA] rounded-full text-xs font-bold text-[#1E104B] shadow-xs flex items-center">
                    <i className="fa-solid fa-tag mr-1.5 text-[#7B2B8C] text-[10px]"></i>{c}
                  </span>
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
    <img
      src={resolveImg(APP_LOGO_COLORED)}
      alt="Budget Bharat"
      className="h-6 object-contain mb-1.5"
    />
    <p className="text-[9px] font-bold text-[#8A8596]">Developed by - Bharat Rasve © 2026</p>
  </div>
);

const SideMenu = () => {
  const {
    isMenuOpen, setIsMenuOpen, menuView, setMenuView,
    persons, categories, admin,
    addPerson, updatePerson, deletePerson,
    addCategory, updateCategory, deleteCategory,
    updateAdminConfig, exportCsv
  } = useContext(AppContext);

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
    if (item && view === 'editCategory') {
      setFormData({ name: item });
    } else if (item) {
      setFormData(item);
    } else if (view === 'manageAdmin') {
      setFormData(admin || {});
    } else {
      setFormData({});
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (menuView === 'addPerson') {
        await addPerson({ name: formData.name, phone: formData.phone, email: formData.email, address: formData.address || 'Maharashtra' });
      } else if (menuView === 'editPerson') {
        await updatePerson({ oldName: editItem.name, name: formData.name, phone: formData.phone, email: formData.email, address: formData.address });
        setMenuView('managePersons');
        setIsSubmitting(false);
        return;
      } else if (menuView === 'addCategory') {
        await addCategory(catType, formData.name);
      } else if (menuView === 'editCategory') {
        await updateCategory({ type: catType, oldName: editItem }, { type: catType, newName: formData.name });
        setMenuView('manageCategories');
        setIsSubmitting(false);
        return;
      } else if (menuView === 'manageAdmin') {
        await updateAdminConfig({
          name: formData.name || '',
          contact: formData.contact || '',
          email: formData.email || '',
          headerNote: formData.headerNote || formData.note || '',
          footerNote: formData.footerNote || ''
        });
      }

      setFormData({});
      setEditItem(null);
      setMenuView('menu');
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Admin config save error:", err);
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

  const handleAction = (fn) => {
    setIsMenuOpen(false);
    fn();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1E104B]/70 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
      <div className="relative w-5/6 max-w-sm bg-[#F4F3F8] h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="grad-dark p-5 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={resolveImg(APP_ICON_WHITE)}
              alt="App Icon"
              className="h-9 w-9 object-contain opacity-95 flex-none"
            />
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Budget Bharat</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Console Setup & Master Config</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-none">
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

            <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-[#8A8596] uppercase tracking-widest">Quick Create</div>
            <button onClick={() => openSubView('addPerson')} className="w-full text-left px-6 py-3 hover:bg-white transition-colors text-sm font-bold text-[#1E104B]"><i className="fa-solid fa-user-plus w-7 text-[#078A87]"></i> Add Person</button>
            <button onClick={() => openSubView('addCategory')} className="w-full text-left px-6 py-3 hover:bg-white transition-colors text-sm font-bold text-[#1E104B]"><i className="fa-solid fa-tag w-7 text-[#078A87]"></i> Add Category</button>

            <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-[#8A8596] uppercase tracking-widest">Export CSV</div>
            <button onClick={() => handleAction(() => exportCsv('exportActiveLoansSummaryCsv', 'active_loans_summary.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-hand-holding-dollar w-7 text-[#078A87]"></i> Active Loans Summary</button>
            <button onClick={() => handleAction(() => exportCsv('exportAllLoanEmiRecordsCsv', 'all_loan_emi_records.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-table-list w-7 text-[#7B2B8C]"></i> All Loan EMI Records</button>
            <button onClick={() => handleAction(() => exportCsv('exportTransactionsCsv', 'transactions_export.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-file-export w-7 text-[#625E70]"></i> All Transactions</button>
            <button onClick={() => handleAction(() => exportCsv('exportIncomeSummaryCsv', 'income_summary.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-arrow-trend-up w-7 text-[#078A87]"></i> Income Summary</button>
            <button onClick={() => handleAction(() => exportCsv('exportExpenseSummaryCsv', 'expense_summary.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-arrow-trend-down w-7 text-[#D6455D]"></i> Expense Summary</button>
            <button onClick={() => handleAction(() => exportCsv('exportPersonsSummaryCsv', 'persons_summary.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-users-viewfinder w-7 text-[#625E70]"></i> Persons Summary</button>
            <button onClick={() => handleAction(() => exportCsv('exportAllExpensesCsv', 'all_expenses.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-receipt w-7 text-[#D6455D]"></i> All Expenses</button>
            <button onClick={() => handleAction(() => exportCsv('exportAllIncomesCsv', 'all_incomes.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-money-bill-trend-up w-7 text-[#078A87]"></i> All Incomes</button>
            <button onClick={() => handleAction(() => exportCsv('exportReceivablesCsv', 'receivables_report.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-hand-holding-dollar w-7 text-[#078A87]"></i> All Receivables</button>
            <button onClick={() => handleAction(() => exportCsv('exportPayablesCsv', 'payables_report.csv'))} className="w-full text-left px-6 py-2.5 hover:bg-white transition-colors text-xs font-bold text-[#1E104B]"><i className="fa-solid fa-file-invoice-dollar w-7 text-[#D6455D]"></i> All Payables</button>
            <SideMenuBranding />
          </div>
        )}

        {menuView === 'managePersons' && (
          <div className="flex-1 p-5 flex flex-col h-full overflow-y-auto hide-scrollbar bg-white">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setMenuView('menu')} className="text-xs font-bold text-[#625E70] hover:text-[#1E104B]"><i className="fa-solid fa-arrow-left mr-1.5"></i> Back</button>
              <button onClick={() => openSubView('addPerson')} className="px-3 py-1.5 rounded-full bg-[#078A87] text-white text-[10px] font-black uppercase"><i className="fa-solid fa-plus mr-1"></i> Add</button>
            </div>
            <h3 className="text-base font-black text-[#1E104B] mb-3">Directory Persons ({persons.length})</h3>
            <div className="space-y-2 flex-1 overflow-y-auto hide-scrollbar">
              {persons.map(p => (
                <div key={p.id || p.name} className="p-3 bg-[#F4F3F8] rounded-xl border border-[#E4E1EA] flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-[#1E104B]">{p.name}</p>
                    <p className="text-[9px] text-[#8A8596] font-medium">{p.phone || 'No phone'} • {p.address || 'Maharashtra'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openSubView('editPerson', p)} title="Edit Person" className="w-7 h-7 rounded-lg bg-white text-[#7B2B8C] border border-[#E4E1EA] flex items-center justify-center text-xs hover:bg-[#7B2B8C] hover:text-white transition-all"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => setPersonToDelete(p.name)} title="Delete Person" className="w-7 h-7 rounded-lg bg-white text-[#D6455D] border border-[#E4E1EA] flex items-center justify-center text-xs hover:bg-[#D6455D] hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>
            <SideMenuBranding />
          </div>
        )}

        {menuView === 'manageCategories' && (
          <div className="flex-1 p-5 flex flex-col h-full overflow-y-auto hide-scrollbar bg-white">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setMenuView('menu')} className="text-xs font-bold text-[#625E70] hover:text-[#1E104B]"><i className="fa-solid fa-arrow-left mr-1.5"></i> Back</button>
              <button onClick={() => openSubView('addCategory')} className="px-3 py-1.5 rounded-full bg-[#078A87] text-white text-[10px] font-black uppercase"><i className="fa-solid fa-plus mr-1"></i> Add</button>
            </div>
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setCatType('expense')} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${catType === 'expense' ? 'bg-[#1E104B] text-white' : 'bg-[#F4F3F8] text-[#625E70]'}`}>Expense</button>
              <button type="button" onClick={() => setCatType('income')} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${catType === 'income' ? 'bg-[#1E104B] text-white' : 'bg-[#F4F3F8] text-[#625E70]'}`}>Income</button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto hide-scrollbar">
              {(catType === 'expense' ? categories.expense : categories.income).map((c, idx) => (
                <div key={idx} className="p-2.5 bg-[#F4F3F8] rounded-xl border border-[#E4E1EA] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#1E104B]">{c}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openSubView('editCategory', c)} className="w-7 h-7 rounded-lg bg-white text-[#7B2B8C] border border-[#E4E1EA] flex items-center justify-center text-xs hover:bg-[#7B2B8C] hover:text-white transition-all"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => setCatToDelete({ type: catType, name: c })} className="w-7 h-7 rounded-lg bg-white text-[#D6455D] border border-[#E4E1EA] flex items-center justify-center text-xs hover:bg-[#D6455D] hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>
            <SideMenuBranding />
          </div>
        )}

        {(menuView === 'addPerson' || menuView === 'editPerson' || menuView === 'addCategory' || menuView === 'editCategory' || menuView === 'manageAdmin') && (
          <div className="flex-1 p-6 flex flex-col h-full overflow-y-auto hide-scrollbar bg-white">
            <button onClick={() => setMenuView('menu')} className="text-xs font-bold text-[#625E70] mb-3 active:scale-95 self-start hover:text-[#1E104B]"><i className="fa-solid fa-arrow-left mr-1.5"></i> Back</button>
            <h3 className="text-base font-black text-[#1E104B] mb-1">
              {menuView === 'addPerson' ? 'Add New Person' : menuView === 'editPerson' ? 'Edit Person' : menuView === 'addCategory' ? `Add New ${catType === 'expense' ? 'Expense' : 'Income'} Category` : menuView === 'editCategory' ? 'Edit Category' : 'Admin Setup'}
            </h3>
            <p className="text-[10px] font-bold text-[#078A87] uppercase tracking-wider mb-4">
              {menuView === 'addCategory' ? `Target Ledger: ${catType.toUpperCase()}` : menuView === 'addPerson' ? 'Directory Party Entry' : 'Configuration Setup'}
            </p>
            <form onSubmit={handleFormSubmit} className="space-y-4 pb-12">
              <div className="space-y-4">
                {(menuView === 'addCategory' || menuView === 'editCategory') && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Category Name *</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" />
                  </div>
                )}

                {(menuView === 'addPerson' || menuView === 'editPerson') && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Name *</label>
                      <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Phone</label>
                      <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Email Id</label>
                      <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="Optional" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase tracking-wider mb-1">Address / Location</label>
                      <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="City or Village" />
                    </div>
                  </>
                )}

                {menuView === 'manageAdmin' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Name *</label>
                      <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="e.g. Bharat Rasve" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Contact</label>
                      <input type="tel" value={formData.contact || ''} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="e.g. 9876543210" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Email id</label>
                      <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="e.g. user@example.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Statement Header note</label>
                      <input type="text" value={formData.headerNote || formData.note || ''} onChange={e => setFormData({ ...formData, headerNote: e.target.value, note: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="e.g. Official Accounting Summary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#625E70] uppercase mb-1">Statement Footer note</label>
                      <input type="text" value={formData.footerNote || ''} onChange={e => setFormData({ ...formData, footerNote: e.target.value })} className="w-full border border-[#E4E1EA] rounded-xl px-3.5 py-2.5 font-bold text-sm bg-[#F4F3F8] focus:bg-white text-[#1E104B] outline-none" placeholder="e.g. Thank you for your business" />
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 flex justify-center">
                <button type="submit" disabled={isSubmitting} className="w-2/3 min-w-[160px] bg-[#1E104B] hover:bg-[#2A186B] text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all uppercase text-xs flex items-center justify-center gap-2">
                  {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                  <span>{isSubmitting ? 'Saving...' : (menuView === 'addPerson' || menuView === 'addCategory') ? 'Save' : 'Save Changes'}</span>
                </button>
              </div>
              <SideMenuBranding />
            </form>
          </div>
        )}
      </div>

      {personToDelete && (
        <div className="fixed inset-0 z-[60] bg-theme-dark/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { if (!isSubmitting) setPersonToDelete(null); }}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-3 ${isSubmitting ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'}`}>
              <i className={isSubmitting ? "fa-solid fa-spinner animate-spin" : "fa-solid fa-triangle-exclamation"}></i>
            </div>
            <h3 className="text-sm font-black text-theme-dark uppercase tracking-wide">
              {isSubmitting ? 'Deleting Person...' : 'Delete Person?'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              {isSubmitting ? `Removing ${personToDelete} and associated records.` : <>Delete <strong>{personToDelete}</strong> and all linked transactions? This action cannot be undone.</>}
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setPersonToDelete(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs uppercase transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmDeletePerson}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-wait"
              >
                {isSubmitting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                <span>{isSubmitting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {catToDelete && (
        <div className="fixed inset-0 z-[60] bg-theme-dark/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCatToDelete(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xl mx-auto mb-3">
              <i className="fa-solid fa-tag"></i>
            </div>
            <h3 className="text-sm font-black text-theme-dark uppercase tracking-wide">Delete Category?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              Delete category <strong>"{catToDelete.name}"</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCatToDelete(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs uppercase transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmDeleteCategory}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
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

  const catData = useMemo(() => {
    const map = {};
    let totalExp = 0;
    filteredTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const key = t.category || '(Uncategorized)';
      map[key] = (map[key] || 0) + t.amount;
      totalExp += t.amount;
    });
    return Object.keys(map).map(k => ({ name: k, val: map[k], pct: totalExp ? (map[k] / totalExp) * 100 : 0 })).sort((a, b) => b.val - a.val);
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

  const topPeople = useMemo(() => (
    allPersonBalances.filter(p => p.bal !== 0).sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal)).slice(0, 6)
  ), [allPersonBalances]);

  return (
    <div className="px-4 mt-2 pb-32 space-y-3.5">
      <div className="flex justify-end items-start px-1">
        <PeriodSelector />
      </div>

      <div className="grad-kpi rounded-2xl p-3.5 shadow-md flex justify-between divide-x divide-white/10 mt-0.5">
        <div className="flex-1 text-center px-1">
          <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Expense</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(kpi.e)}</p>
        </div>
        <div className="flex-1 text-center px-1">
          <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Income</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(kpi.i)}</p>
        </div>
        <div className="flex-1 text-center px-1">
          <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Given (Dr)</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(kpi.dr)}</p>
        </div>
        <div className="flex-1 text-center px-1">
          <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Received</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(kpi.cr)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-theme-dark/10 shadow-sm space-y-4">
        <h2 className="text-[10px] font-bold text-theme-dark uppercase tracking-widest">Expense & Income Overview</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#078A87]/10 p-2.5 rounded-xl flex flex-col justify-between border border-[#078A87]/25">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#078A87] uppercase tracking-wider">Total Inflow</span>
              <span className="text-[8px] font-semibold text-[#078A87]/70">(Inc + Recv)</span>
            </div>
            <span className="text-base font-extrabold text-[#078A87] mt-0.5">{formatMoney(kpi.i + kpi.cr)}</span>
          </div>
          <div className="bg-[#D6455D]/10 p-2.5 rounded-xl flex flex-col justify-between border border-[#D6455D]/25">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D6455D] uppercase tracking-wider">Total Outflow</span>
              <span className="text-[8px] font-semibold text-[#D6455D]/70">(Exp + Given)</span>
            </div>
            <span className="text-base font-extrabold text-[#D6455D] mt-0.5">{formatMoney(kpi.e + kpi.dr)}</span>
          </div>
        </div>

        <div className="pt-2 space-y-2.5">
          <p className="text-[10px] font-bold text-theme-dark/50 uppercase tracking-wider">Top Spending Categories</p>
          {catData.slice(0, 3).map((c, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-theme-dark">{c.name}</span>
                <span className="text-theme-dark">{formatMoney(c.val)}</span>
              </div>
              <div className="w-full bg-theme-gray rounded-full h-1.5 overflow-hidden">
                <div className="bg-theme-dark h-1.5 rounded-full" style={{ width: `${Math.min(c.pct, 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-theme-dark/10 overflow-hidden shadow-sm">
        <div className="px-3.5 py-3 border-b border-theme-dark/5">
          <h2 className="text-[11px] font-black text-theme-dark uppercase tracking-wider">Recent Transactions</h2>
        </div>
        <TransactionTable transactions={filteredTransactions} maxRows={6} showViewAll={false} onSelectTransaction={onSelectTransaction} embedded={true} />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#E4E1EA] shadow-xs space-y-3.5">
        <h2 className="text-[10px] font-bold text-[#625E70] uppercase tracking-widest">People Overview</h2>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => { setDirectoryFilter('RECEIVABLE'); onNavigateTab && onNavigateTab('people'); }}
            className="bg-[#078A87]/10 p-3 rounded-xl flex flex-col border border-[#078A87]/20 cursor-pointer hover:bg-[#078A87]/15 active:scale-95 transition-all"
            title="Click to view all Credit (Receivable) parties"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#078A87] uppercase tracking-wider">Total Receivable</span>
              <i className="fa-solid fa-arrow-right text-[10px] text-[#078A87]"></i>
            </div>
            <span className="text-base font-black text-[#078A87] mt-0.5">+{formatMoney(totalReceivable)}</span>
          </div>
          <div
            onClick={() => { setDirectoryFilter('PAYABLE'); onNavigateTab && onNavigateTab('people'); }}
            className="bg-[#D6455D]/10 p-3 rounded-xl flex flex-col border border-[#D6455D]/20 cursor-pointer hover:bg-[#D6455D]/15 active:scale-95 transition-all"
            title="Click to view all Debit (Payable) parties"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D6455D] uppercase tracking-wider">Total Payable</span>
              <i className="fa-solid fa-arrow-right text-[10px] text-[#D6455D]"></i>
            </div>
            <span className="text-base font-black text-[#D6455D] mt-0.5">-{formatMoney(totalPayable)}</span>
          </div>
        </div>

        {topPeople.length > 0 && (
          <div className="space-y-1.5">
            {topPeople.map(p => (
              <div key={p.id} onClick={() => onSelectPerson(p)} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-[#F4F3F8] cursor-pointer transition-colors border border-transparent">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#7B2B8C]/15 flex items-center justify-center text-xs font-black text-[#7B2B8C]">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1E104B]">{p.name}</p>
                    <p className="text-[9px] font-bold text-[#8A8596] uppercase tracking-wide mt-0.5">
                      {p.bal > 0 ? 'You will receive' : 'You need to pay'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-black ${p.bal > 0 ? 'text-[#078A87]' : 'text-[#D6455D]'}`}>
                  {p.bal > 0 ? '+' : '-'}{formatMoney(Math.abs(p.bal))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(() => {
        const activeLoansList = (loans || []).filter(l => {
          const paidCount = (l.schedule || []).filter(s => s.paid).length;
          return l.status !== 'CLOSED' && paidCount < (l.schedule || []).length;
        });

        let homeLoanToPay = 0;
        let homeLoanPaid = 0;
        (loans || []).forEach(l => {
          homeLoanToPay += Number(l.loanAmount) || 0;
          (l.schedule || []).forEach(s => {
            if (s.paid) homeLoanPaid += Number(s.emiAmount) || 0;
          });
        });
        const homeLoanRem = Math.max(0, homeLoanToPay - homeLoanPaid);

        return (
          <div className="bg-white rounded-2xl p-4 border border-[#E4E1EA] shadow-xs space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-bold text-[#625E70] uppercase tracking-widest">Active Loans Overview</h2>
              <button
                onClick={() => onNavigateTab && onNavigateTab('loans')}
                className="text-[10px] font-black text-[#078A87] uppercase hover:underline"
              >
                View All ({activeLoansList.length})
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#1E104B]/5 p-2.5 rounded-xl flex flex-col justify-between border border-[#1E104B]/15">
                <span className="text-[9px] font-bold text-[#625E70] uppercase tracking-wider truncate">Total to Pay</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#1E104B] mt-1 truncate">{formatMoney(homeLoanToPay)}</span>
              </div>
              <div className="bg-[#078A87]/10 p-2.5 rounded-xl flex flex-col justify-between border border-[#078A87]/25">
                <span className="text-[9px] font-bold text-[#078A87] uppercase tracking-wider truncate">Paid So Far</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#078A87] mt-1 truncate">{formatMoney(homeLoanPaid)}</span>
              </div>
              <div className="bg-[#D6455D]/10 p-2.5 rounded-xl flex flex-col justify-between border border-[#D6455D]/25">
                <span className="text-[9px] font-bold text-[#D6455D] uppercase tracking-wider truncate">Remaining</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#D6455D] mt-1 truncate">{formatMoney(homeLoanRem)}</span>
              </div>
            </div>

            {activeLoansList.length === 0 ? (
              <p className="text-xs text-[#625E70] font-semibold text-center py-2">No active loans.</p>
            ) : (
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full table-fixed text-[10px]">
                  <thead className="bg-[#E8E6F0] text-[#1E104B] uppercase font-black border-b border-[#D6D2E0]">
                    <tr>
                      <th className="w-[34%] px-2.5 py-1.5 text-left tracking-tight">Loan / Person</th>
                      <th className="w-[22%] px-2 py-1.5 text-right tracking-tight">Loan Rs.</th>
                      <th className="w-[22%] px-2 py-1.5 text-right tracking-tight">EMI Rs.</th>
                      <th className="w-[22%] px-2 py-1.5 text-right tracking-tight">EMI Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1EA]/60 font-semibold text-[#1E104B]">
                    {activeLoansList.slice(0, 4).map(l => {
                      const pCount = (l.schedule || []).filter(s => s.paid).length;
                      const tCount = (l.schedule || []).length;
                      const lIsClosed = l.status === 'CLOSED' || (tCount > 0 && pCount === tCount);
                      return (
                        <tr
                          key={l.id}
                          onClick={() => {
                            if (window.__TRIGGER_LOAN__) {
                              window.__TRIGGER_LOAN__(l.person, l.id);
                            } else {
                              onNavigateTab && onNavigateTab('loans');
                            }
                          }}
                          className="hover:bg-[#F4F3F8] cursor-pointer transition-colors active:bg-gray-100"
                        >
                          <td className="px-2.5 py-3 truncate">
                            <span className="font-extrabold block truncate text-[#1E104B]">{l.loanName}</span>
                            <span className="block truncate text-[9px] font-bold text-[#625E70]">{l.person}</span>
                          </td>
                          <td className="px-2 py-3 text-right font-black text-[#1E104B]">{formatMoney(l.loanAmount)}</td>
                          <td className="px-2 py-3 text-right font-black text-[#1E104B]">{formatMoney(l.monthlyEmi)}</td>
                          <td className="px-2 py-3 text-right font-black">
                            <span className={lIsClosed ? 'text-gray-400' : 'text-emerald-600'}>{pCount}/{tCount}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
      <AppBottomBranding />
    </div>
  );
};

const PersonsView = ({ onSelectPerson }) => {
  const { persons, transactions, showFeedback, admin, directoryFilter, setDirectoryFilter } = useContext(AppContext);
  const [isSharingPersons, setIsSharingPersons] = useState(false);
  const summarySlipRef = useRef(null);

  const pData = useMemo(() => {
    const raw = persons.map(p => {
      let dr = 0, cr = 0;
      transactions.filter(t => t.person === p.name).forEach(t => {
        if (t.type === 'LENT') dr += t.amount;
        if (t.type === 'BORROW') cr += t.amount;
      });
      return { ...p, totalDr: dr, totalCr: cr, remaining: dr - cr };
    }).sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining));

    if (directoryFilter === 'RECEIVABLE') return raw.filter(p => p.remaining > 0);
    if (directoryFilter === 'PAYABLE') return raw.filter(p => p.remaining < 0);
    return raw;
  }, [persons, transactions, directoryFilter]);

  const totalReceivable = pData.filter(p => p.remaining > 0).reduce((sum, p) => sum + p.remaining, 0);
  const totalPayable = pData.filter(p => p.remaining < 0).reduce((sum, p) => sum + Math.abs(p.remaining), 0);
  const netBalance = totalReceivable - totalPayable;

  const handleSharePersonsSummary = async () => {
    showFeedback('Generating All Persons Ledger Image...');
    setIsSharingPersons(true);
    try {
      await waitForPaint();
      await shareReceiptToWhatsApp(
        summarySlipRef, 
        `All_Persons_Ledger_${Date.now()}`, 
        `Budget Bharat — All Persons Ledger (${pData.length} parties)`
      );
      showFeedback('Ledger Ready');
    } catch(err) {
      console.error('Directory slip export error:', err);
      showFeedback('Error: ' + (err && err.message ? err.message : 'generating image failed'));
    } finally {
      setIsSharingPersons(false);
    }
  };

  return (
    <div className="px-4 mt-2 space-y-3 pb-32">
      <div className="flex justify-between items-center">
        <button
          onClick={handleSharePersonsSummary}
          disabled={isSharingPersons}
          title="Share Directory Summary Image"
          className={`w-9 h-9 rounded-full bg-[#078A87]/15 text-[#078A87] hover:bg-[#078A87] hover:text-white active:bg-[#078A87] active:text-white flex items-center justify-center transition-all border border-[#078A87]/25 shadow-xs ${isSharingPersons ? 'opacity-50 cursor-wait' : ''}`}
        >
          <i className={`fa-solid ${isSharingPersons ? 'fa-spinner animate-spin' : 'fa-share-nodes'} text-xs`}></i>
        </button>

        <div className="flex bg-slate-200/90 p-1 rounded-xl shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setDirectoryFilter('ALL')}
            className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
              directoryFilter === 'ALL' ? 'bg-white text-[#1E104B] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('RECEIVABLE')}
            className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
              directoryFilter === 'RECEIVABLE' ? 'bg-[#078A87] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Credit
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('PAYABLE')}
            className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
              directoryFilter === 'PAYABLE' ? 'bg-[#D6455D] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Debit
          </button>
        </div>
      </div>

      <div className="grad-kpi rounded-2xl p-3.5 shadow-md grid grid-cols-3 divide-x divide-white/10 text-center">
        <div className="px-1">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">RECEIVABLE</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(totalReceivable)}</p>
        </div>
        <div className="px-1">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">PAYABLE</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(totalPayable)}</p>
        </div>
        <div className="px-1">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">BALANCE</p>
          <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(Math.abs(netBalance))}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E1EA] shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full table-fixed text-[10px]">
            <thead className="bg-[#E8E6F0] text-[#1E104B] uppercase font-black border-b border-[#D6D2E0]">
              <tr>
                <th className="w-[34%] px-2.5 py-2 text-left tracking-tight">Person Name</th>
                <th className="w-[22%] px-1.5 py-2 text-right tracking-tight">Given</th>
                <th className="w-[22%] px-1.5 py-1.5 text-right tracking-tight">Recv</th>
                <th className="w-[22%] px-2 py-2 text-right tracking-tight">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1EA]/60 font-semibold text-[#1E104B]">
              {pData.map((p) => {
                const isRec = p.remaining > 0;
                const isPay = p.remaining < 0;
                const balColor = isRec ? '#078A87' : isPay ? '#D6455D' : '#625E70';
                return (
                  <tr key={p.id} onClick={() => onSelectPerson(p)} className="hover:bg-[#F4F3F8] cursor-pointer transition-colors active:bg-gray-100">
                    <td className="px-2.5 py-3.5 truncate">
                      <span className="font-extrabold block truncate text-xs text-[#1E104B]">{p.name}</span>
                      {p.phone && <span className="block text-[8px] font-bold text-[#8A8596] truncate mt-0.5">{p.phone}</span>}
                    </td>
                    <td className="px-1.5 py-3.5 text-right font-bold text-[#7B2B8C] text-[11px] truncate">{formatMoney(p.totalDr)}</td>
                    <td className="px-1.5 py-3.5 text-right font-bold text-[#078A87] text-[11px] truncate">{formatMoney(p.totalCr)}</td>
                    <td className="px-2 py-3.5 text-right font-black text-[11px] truncate" style={{ color: balColor }}>
                      {isRec ? '+' : isPay ? '-' : ''}{formatMoney(Math.abs(p.remaining))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {ReactDOM.createPortal(
        <div className="canvas-hide">
          <div ref={summarySlipRef} id="persons-summary-slip" className="bg-white px-5 py-4 font-sans box-border inline-block text-slate-900 relative overflow-hidden" style={{ width: '640px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <div className="border-b-2 border-[#1E104B] pb-2 mb-2.5 flex justify-between items-end relative z-10">
              <div className="text-left">
                <h1 className="text-[10px] font-black text-[#7B2B8C] uppercase tracking-widest mb-0.5">
                  {admin && admin.headerNote ? admin.headerNote : 'Budget Bharat'}
                </h1>
                <h2 className="text-xl font-black text-[#1E104B] tracking-tight leading-tight">
                  All Persons Ledger
                </h2>
              </div>
              <div className="text-right text-[10px] font-bold text-gray-500 leading-tight">
                <p>Total Accounts: {pData.length}</p>
                <p className="mt-0.5">Date: {formatDisplayDate(new Date())}</p>
              </div>
            </div>

            <div className="flex justify-between bg-[#F4F3F8] rounded-xl py-2 px-2 text-center mb-2">
              <div className="flex-1 px-1">
                <p className="text-[8px] font-bold text-[#625E70] uppercase tracking-widest mb-0.5">RECEIVABLE</p>
                <p className="text-base font-black text-[#078A87]">+{formatMoney(totalReceivable)}</p>
              </div>
              <div className="flex-1 px-1">
                <p className="text-[8px] font-bold text-[#625E70] uppercase tracking-widest mb-0.5">PAYABLE</p>
                <p className="text-base font-black text-[#D6455D]">-{formatMoney(totalPayable)}</p>
              </div>
              <div className="flex-1 px-1">
                <p className="text-[8px] font-bold text-[#625E70] uppercase tracking-widest mb-0.5">BALANCE</p>
                <p className="text-base font-black text-[#1E104B]">{netBalance >= 0 ? '+' : '-'}{formatMoney(Math.abs(netBalance))}</p>
              </div>
            </div>

            <table className="w-full text-left text-[12px] mb-2 border-collapse table-fixed leading-tight">
              <colgroup>
                <col style={{ width: '31%' }} />
                <col style={{ width: '23%' }} />
                <col style={{ width: '23%' }} />
                <col style={{ width: '23%' }} />
              </colgroup>
              <thead className="bg-[#1E104B] text-white text-[11px]">
                <tr>
                  <th className="py-2 px-2 font-bold uppercase border border-[#E4E1EA]">Person Name</th>
                  <th className="py-2 px-2 font-bold uppercase text-right border border-[#E4E1EA]">Given</th>
                  <th className="py-2 px-2 font-bold uppercase text-right border border-[#E4E1EA]">Recv</th>
                  <th className="py-2 px-2 font-bold uppercase text-right border border-[#E4E1EA]">Balance</th>
                </tr>
              </thead>
              <tbody className="text-[#1E104B] bg-transparent font-medium">
                {pData.map(p => {
                  const isRec = p.remaining > 0;
                  const isPay = p.remaining < 0;
                  const balColor = isRec ? '#078A87' : isPay ? '#D6455D' : '#625E70';
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-2 font-bold border border-[#E4E1EA] truncate align-middle text-xs">{p.name}</td>
                      <td className="py-3 px-2 text-right font-bold border border-[#E4E1EA] text-[#7B2B8C] align-middle text-xs">{formatMoney(p.totalDr)}</td>
                      <td className="py-3 px-2 text-right font-bold border border-[#E4E1EA] text-[#078A87] align-middle text-xs">{formatMoney(p.totalCr)}</td>
                      <td className="py-3 px-2 text-right font-black border border-[#E4E1EA] align-middle text-xs" style={{ color: balColor }}>
                        {isRec ? '+' : isPay ? '-' : ''}{formatMoney(Math.abs(p.remaining))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pt-2 border-t border-gray-300 flex justify-between items-center relative z-10">
              <div className="flex flex-col justify-center text-left leading-tight">
                <span className="text-[9px] font-black text-[#1E104B] uppercase tracking-wider mb-0.5">STATEMENT BY -</span>
                <span className="font-extrabold text-[11px] text-[#1E104B]">Budget Bharat-Personal finance App</span>
                <span className="text-[10px] font-medium text-[#625E70] mt-0.5">Developed by - Bharat Rasve</span>
                <span className="text-[10px] font-medium text-[#625E70]">Mo.No: 7218838122</span>
              </div>

              <div className="flex items-center justify-center">
                <img
                  src={resolveImg(APP_LOGO_COLORED)}
                  alt="Logo"
                  className="w-[104px] h-[104px] object-contain select-none"
                />
              </div>

              <div className="text-right leading-tight">
                {admin && admin.footerNote && (
                  <p className="text-[10px] font-semibold text-gray-700 italic mb-1">
                    "{admin.footerNote}"
                  </p>
                )}
                <span className="text-[11px] font-extrabold text-[#1E104B] block">
                  {admin && admin.name ? admin.name : 'Bharat Rasve'}
                </span>
                {admin && admin.contact && (
                  <span className="text-[10px] font-bold text-gray-600 block mt-1">
                    Mo.No: {admin.contact}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <AppBottomBranding />
    </div>
  );
};

const LedgerView = ({ person, onBack, onSelectPerson, allPersons, onSelectTransaction }) => {
  const { transactions, loans, showFeedback, admin, deletePerson, syncData, syncStatus, loadError } = useContext(AppContext);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [isSharingStatement, setIsSharingStatement] = useState(false);
  const [showDeletePersonConfirm, setShowDeletePersonConfirm] = useState(false);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const [isLoanDropdownOpen, setIsLoanDropdownOpen] = useState(false);
  const loanDropdownRef = useRef(null);
  const statementSlipRef = useRef(null);

  // Dynamic balance calculation to ensure zero-delay accuracy
  const { personDr, personCr, personRemaining } = useMemo(() => {
    let dr = 0, cr = 0;
    transactions.filter(t => String(t.person || '').trim().toLowerCase() === String(person.name || '').trim().toLowerCase()).forEach(t => {
      if (t.type === 'LENT') dr += Number(t.amount) || 0;
      if (t.type === 'BORROW') cr += Number(t.amount) || 0;
    });
    return { personDr: dr, personCr: cr, personRemaining: dr - cr };
  }, [transactions, person.name]);

  const personActiveLoans = useMemo(() => {
    if (!person || !person.name) return [];
    const normTarget = String(person.name).trim().toLowerCase();

    return (loans || []).filter(l => {
      if (!l.person) return false;
      if (String(l.person).trim().toLowerCase() !== normTarget) return false;
      if (String(l.status || '').toUpperCase() === 'CLOSED') return false;
      const sched = l.schedule || [];
      if (sched.length === 0) return true;
      const paidCount = sched.filter(s => s.paid === true || String(s.paid).toLowerCase() === 'true').length;
      return paidCount < sched.length;
    });
  }, [loans, person]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loanDropdownRef.current && !loanDropdownRef.current.contains(e.target)) {
        setIsLoanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawTxs = useMemo(() => transactions.filter(t => String(t.person || '').trim().toLowerCase() === String(person.name || '').trim().toLowerCase()), [transactions, person.name]);
  
  const txs = useMemo(() => {
    if (!ledgerSearch.trim()) return rawTxs;
    const q = ledgerSearch.toLowerCase().trim();
    return rawTxs.filter(t => 
      (t.note && t.note.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.ref && t.ref.toLowerCase().includes(q)) ||
      (t.date && String(t.date).toLowerCase().includes(q)) ||
      (t.amount && String(t.amount).includes(q))
    );
  }, [rawTxs, ledgerSearch]);

  const currentIndex = allPersons.findIndex(p => String(p.name || '').trim().toLowerCase() === String(person.name || '').trim().toLowerCase());

  const goToPrev = () => {
    if (allPersons.length === 0) return;
    if (currentIndex > 0) onSelectPerson(allPersons[currentIndex - 1]);
    else onSelectPerson(allPersons[allPersons.length - 1]);
  };

  const goToNext = () => {
    if (allPersons.length === 0) return;
    if (currentIndex < allPersons.length - 1) onSelectPerson(allPersons[currentIndex + 1]);
    else onSelectPerson(allPersons[0]);
  };

  const targetDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const day = d.getDate();
    const mIdx = d.getMonth();
    const yy = String(d.getFullYear()).slice(-2);
    return `${day}-${MONTHS_SHORT[mIdx]}-${yy}`;
  }, []);

  const handleShareImage = async () => {
    const actionWord = personRemaining > 0 ? 'you will pay' : personRemaining < 0 ? 'you will receive' : 'is settled at';
    const captionText = `Dear ${person.name}, ${actionWord} ${formatMoney(Math.abs(personRemaining))} on or before date ${targetDateStr}.`;

    if (txs.length > 10) {
      showFeedback('Loading fonts & generating PDF...');
      setIsSharingStatement(true);
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await waitForPaint();

        const element = statementSlipRef.current || document.getElementById('whatsapp-share-slip');
        if (!element) throw new Error('Statement DOM node not found');

        const fileName = `${person.name.replace(/\s+/g, '_')}_Overall Statement.pdf`;
        const opt = {
          margin: [8, 8, 10, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false, foreignObjectRendering: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({ files: [pdfFile], title: fileName, text: captionText });
          showFeedback('PDF shared successfully');
        } else {
          html2pdf().set(opt).from(element).save();
          showFeedback('PDF downloaded successfully');
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        showFeedback('Error: ' + (err && err.message ? err.message : 'Generating PDF failed'));
      } finally {
        setIsSharingStatement(false);
      }
      return;
    }

    showFeedback('Opening share dialog...');
    setIsSharingStatement(true);
    try {
      await shareReceiptToWhatsApp(
        statementSlipRef,
        `${person.name.replace(/\s+/g, '_')}_Overall_Statement`,
        captionText
      );
      showFeedback('Statement shared');
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      showFeedback('Error: ' + (err && err.message ? err.message : 'rendering image failed'));
    } finally {
      setIsSharingStatement(false);
    }
  };

  const handleWhatsAppShare = () => {
    const actionWord = personRemaining > 0 ? 'you will pay' : personRemaining < 0 ? 'you will receive' : 'is settled at';
    const textMsg = `Dear ${person.name}, ${actionWord} ${formatMoney(Math.abs(personRemaining))} on or before date ${targetDateStr}.`;
    let phone = String(person.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.replace(/^0+/, '');
    if (phone.length === 10) phone = '91' + phone;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(textMsg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <React.Fragment>
      <div className="flex-none grad-dark px-3.5 py-3 text-white flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
          <button onClick={onBack} title="Exit to Directory" className="w-8 h-8 flex-none flex items-center justify-center hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <i className="fa-solid fa-arrow-left text-base"></i>
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold truncate leading-tight">{person.name}</h1>
            <div ref={loanDropdownRef} className="relative self-start mt-1.5 z-40">
              <div
                onClick={() => {
                  if (personActiveLoans.length > 0) setIsLoanDropdownOpen(prev => !prev);
                }}
                className={`flex items-center rounded-lg border text-[10px] font-black transition-all ${
                  personActiveLoans.length > 0
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30 cursor-pointer active:scale-95 shadow-xs'
                    : 'bg-white/5 border-white/10 text-white/50 cursor-default'
                }`}
                style={{ height: '22px' }}
              >
                <span className="px-2.5 py-0.5 leading-none tracking-wide whitespace-nowrap">
                  {personActiveLoans.length > 0 ? `${personActiveLoans.length} Loans` : 'No Loans'}
                </span>
                {personActiveLoans.length > 0 && (
                  <span className="flex items-center justify-center border-l border-white/25 px-2 h-full bg-white/10 rounded-r-lg">
                    <i className={`fa-solid ${isLoanDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[8px]`}></i>
                  </span>
                )}
              </div>

              {isLoanDropdownOpen && personActiveLoans.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#241457] border border-[#7B2B8C]/40 rounded-xl shadow-2xl py-1 z-50 animate-slide-up">
                  <div className="px-3 py-1.5 text-[9px] font-bold text-white/60 uppercase tracking-wider border-b border-white/10">
                    Active Loans ({personActiveLoans.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto hide-scrollbar divide-y divide-white/5">
                    {personActiveLoans.map((l) => {
                      const pCount = (l.schedule || []).filter(s => s.paid).length;
                      const tCount = (l.schedule || []).length;
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            setIsLoanDropdownOpen(false);
                            onBack();
                            if (window.__TRIGGER_LOAN__) {
                              window.__TRIGGER_LOAN__(person.name, l.id);
                            }
                          }}
                          className="px-3 py-2 hover:bg-[#7B2B8C] cursor-pointer transition-colors text-left"
                        >
                          <p className="text-xs font-bold text-white truncate">{l.loanName}</p>
                          <div className="flex justify-between items-center text-[10px] text-white/70 mt-0.5 font-semibold">
                            <span>{formatMoney(l.loanAmount)}</span>
                            <span className="text-emerald-400 font-bold">{pCount}/{tCount} Paid</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-none">
          {allPersons.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full border border-white/10 text-[11px] font-black">
              <button onClick={goToPrev} title="Previous Person" className="w-5 h-5 flex items-center justify-center bg-white/15 hover:bg-white/25 active:bg-[#1E104B]/60 rounded-full active:scale-90 transition-all shadow-xs">
                <i className="fa-solid fa-chevron-left text-[9px]"></i>
              </button>
              <span className="opacity-75 select-none">({currentIndex >= 0 ? currentIndex + 1 : 1}/{allPersons.length})</span>
              <button onClick={goToNext} title="Next Person" className="w-5 h-5 flex items-center justify-center bg-white/15 hover:bg-white/25 active:bg-[#1E104B]/60 rounded-full active:scale-90 transition-all shadow-xs">
                <i className="fa-solid fa-chevron-right text-[9px]"></i>
              </button>
            </div>
          )}

          <button
            onClick={syncData}
            disabled={syncStatus === 'syncing'}
            className={`sync-header-btn flex-none ${syncStatus === 'syncing' ? 'is-syncing' : ''} ${loadError !== '' ? 'is-error' : ''}`}
            title={syncStatus === 'syncing' ? 'Syncing...' : loadError !== '' ? 'Error. Tap to retry.' : 'Sync Data'}
          >
            <i className={`fa-solid fa-rotate text-sm ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      <div className="app-content bg-theme-gray pb-32 select-none">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2.5 py-1 px-1">
            <div className="flex items-center gap-2 flex-none">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `tel:0${String(person.phone || '').replace(/\D/g, '').slice(-10)}`;
                }}
                title="Call"
                className="w-9 h-9 rounded-full bg-[#078A87]/15 text-[#078A87] hover:bg-[#078A87] hover:text-white active:bg-[#078A87] active:text-white flex items-center justify-center transition-all border border-[#078A87]/25 shadow-xs"
              >
                <i className="fa-solid fa-phone text-xs"></i>
              </button>
              <button
                onClick={handleShareImage}
                title="Share Statement Image"
                className="w-9 h-9 rounded-full bg-[#078A87]/15 text-[#078A87] hover:bg-[#078A87] hover:text-white active:bg-[#078A87] active:text-white flex items-center justify-center transition-all border border-[#078A87]/25 shadow-xs"
              >
                <i className="fa-solid fa-share-nodes text-xs"></i>
              </button>
              <button
                onClick={handleWhatsAppShare}
                title="Open WhatsApp chat"
                className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                <i className="fa-brands fa-whatsapp text-base"></i>
              </button>
              <button
                onClick={() => setShowDeletePersonConfirm(true)}
                title="Delete Person & All Records"
                className="w-9 h-9 rounded-full bg-[#D6455D]/15 text-[#D6455D] hover:bg-[#D6455D] hover:text-white active:bg-[#D6455D] active:text-white flex items-center justify-center transition-all border border-[#D6455D]/25 shadow-xs"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>

            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              <input
                type="text"
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                placeholder="Search entry..."
                className="w-full bg-white border border-[#E4E1EA] rounded-full py-1.5 pl-8 pr-7 text-xs text-[#1E104B] placeholder-slate-400 focus:outline-none focus:border-[#078A87] transition-all font-semibold shadow-xs"
              />
              {ledgerSearch && (
                <button
                  type="button"
                  onClick={() => setLedgerSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              )}
            </div>
          </div>

          <div className="grad-kpi py-3.5 px-3 rounded-2xl shadow-md grid grid-cols-3 divide-x divide-white/10 text-center">
            <div className="px-1">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide">GIVEN (DR)</p>
              <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(personDr)}</p>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide">RECEIVED (CR)</p>
              <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(personCr)}</p>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide">BALANCE</p>
              <p className="text-sm font-black text-white mt-1 truncate">
                {personRemaining > 0 ? '+' : personRemaining < 0 ? '-' : ''}{formatMoney(Math.abs(personRemaining))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-[#E4E1EA] overflow-hidden">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead className="bg-[#E2DEEA] text-[#1E104B] font-black uppercase border-b border-[#CDC8DA] tracking-wider">
                  <tr>
                    <th className="px-3.5 py-1.5">Date</th>
                    <th className="px-3.5 py-1.5">Description</th>
                    <th className="px-3.5 py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1EA]/60 font-medium text-[#1E104B]">
                  {txs.map(t => (
                    <tr
                      key={t.id || t.entryId}
                      onClick={() => onSelectTransaction && onSelectTransaction(t)}
                      className="hover:bg-[#F4F3F8] transition-colors cursor-pointer active:bg-gray-100"
                    >
                      <td className="px-3.5 py-3 font-semibold text-[#625E70]">{formatDisplayDate(t.date)}</td>
                      <td className="px-3.5 py-3 font-bold max-w-[140px] truncate text-[#1E104B]">
                        {t.note || t.category}
                        {(t.ref || t.promiseDate) && (
                          <span className="block text-[8px] font-semibold text-[#8A8596] mt-0.5">
                            {t.ref} {t.ref && t.promiseDate ? '•' : ''} {t.promiseDate && `Promise: ${formatDisplayDate(t.promiseDate)}`}
                          </span>
                        )}
                      </td>
                      <td className={`px-3.5 py-3 text-right font-black text-xs ${t.type === 'LENT' ? 'text-[#7B2B8C]' : 'text-[#078A87]'}`}>
                        {t.type === 'LENT' ? '-' : '+'}{formatTableNum(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showDeletePersonConfirm && (
            <div className="fixed inset-0 z-50 bg-theme-dark/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { if (!isDeletingPerson) setShowDeletePersonConfirm(false); }}>
              <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-3 ${isDeletingPerson ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'}`}>
                  <i className={isDeletingPerson ? "fa-solid fa-spinner animate-spin" : "fa-solid fa-triangle-exclamation"}></i>
                </div>
                <h3 className="text-sm font-black text-theme-dark uppercase tracking-wide">
                  {isDeletingPerson ? 'Deleting Person...' : 'Delete Person?'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 mb-5">
                  {isDeletingPerson ? `Removing ${person.name} and all associated entries from sheet.` : <>Delete <strong>{person.name}</strong> and all associated transactions? This cannot be undone.</>}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    disabled={isDeletingPerson}
                    onClick={() => setShowDeletePersonConfirm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs uppercase transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingPerson}
                    onClick={async () => {
                      setIsDeletingPerson(true);
                      try {
                        await deletePerson(person.name);
                        setShowDeletePersonConfirm(false);
                        onBack();
                      } catch (err) {
                        console.error("Person deletion failed:", err);
                      } finally {
                        setIsDeletingPerson(false);
                      }
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-wait"
                  >
                    {isDeletingPerson && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                    <span>{isDeletingPerson ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {ReactDOM.createPortal(
            <div className="canvas-hide">
              <div 
                ref={statementSlipRef} 
                id="whatsapp-share-slip" 
                className="bg-white px-4 pt-2 pb-3 box-border inline-block text-slate-900 relative overflow-hidden" 
                style={{ width: '720px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                <div className="border-b-2 border-[#1E104B] pb-2 mb-2 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="text-left text-theme-dark leading-tight pr-2">
                      <h1 className="text-[10px] font-black text-[#7B2B8C] uppercase tracking-widest mb-0.5">
                        {admin && admin.headerNote ? admin.headerNote : 'Budget Bharat'}
                      </h1>
                      <h2 className="text-xl font-black text-[#1E104B] tracking-tight leading-tight">
                        A/C STATEMENT
                      </h2>
                      <p className="text-[9px] text-gray-500 font-bold mt-1">
                        Date: {formatDisplayDate(new Date())}
                      </p>
                    </div>
                    <div className="text-right flex flex-col justify-start leading-tight">
                      <h2 className="text-2xl font-black text-[#1E104B] tracking-tight leading-none whitespace-nowrap mb-1">{person.name}</h2>
                      <p className="text-xs font-bold text-gray-700">Mo.No: {person.phone ? person.phone : 'N/A'}</p>
                      <p className="text-[10px] font-semibold text-gray-500 capitalize mt-0.5">{person.address ? person.address : 'Maharashtra'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 px-2 text-center mb-2 divide-x divide-slate-200">
                  <div className="flex-1 px-1">
                    <p className="text-[9px] font-bold text-[#625E70] uppercase tracking-wider mb-0.5">GIVEN (DR)</p>
                    <p className="text-xl font-black text-[#7B2B8C] leading-none">{formatMoney(personDr)}</p>
                  </div>
                  <div className="flex-1 px-1">
                    <p className="text-[9px] font-bold text-[#625E70] uppercase tracking-wider mb-0.5">RECEIVED (CR)</p>
                    <p className="text-xl font-black text-[#078A87] leading-none">{formatMoney(personCr)}</p>
                  </div>
                  <div className="flex-1 px-1">
                    <p className="text-[9px] font-bold text-[#625E70] uppercase tracking-wider mb-0.5">BALANCE</p>
                    <p className={`text-xl font-black leading-none ${personRemaining > 0 ? 'text-[#078A87]' : personRemaining < 0 ? 'text-[#D6455D]' : 'text-[#1E104B]'}`}>
                      {personRemaining >= 0 ? '+' : '-'}{formatMoney(Math.abs(personRemaining))}
                    </p>
                  </div>
                </div>

                <table className="w-full text-left text-[11px] mb-3 border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '29%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '13%' }} />
                  </colgroup>
                  <thead className="bg-[#1E104B] text-white">
                    <tr>
                      <th className="py-1.5 px-2 font-bold uppercase border border-[#E4E1EA]">Date</th>
                      <th className="py-1.5 px-2 font-bold uppercase border border-[#E4E1EA]">Description</th>
                      <th className="py-1.5 px-2 font-bold uppercase border border-[#E4E1EA]">Ref A/C</th>
                      <th className="py-1.5 px-1.5 font-bold uppercase text-right border border-[#E4E1EA]">Amount</th>
                      <th className="py-1.5 px-1 font-bold uppercase text-center border border-[#E4E1EA]">Promise</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#1E104B] bg-transparent">
                    {txs.map(t => (
                      <tr key={t.id || t.entryId}>
                        <td className="py-1.5 px-2 font-semibold text-[#625E70] whitespace-nowrap border border-[#E4E1EA] align-middle text-[11px]">{formatDisplayDate(t.date)}</td>
                        <td className="py-1.5 px-2 font-normal whitespace-normal break-words border border-[#E4E1EA] align-middle leading-snug text-[13px] text-[#1E104B]">{t.note || t.category}</td>
                        <td className="py-1.5 px-2 font-semibold text-[#625E70] whitespace-normal break-words border border-[#E4E1EA] align-middle text-[11px]">{t.ref || '-'}</td>
                        <td className={`py-1.5 px-1.5 text-right font-black whitespace-nowrap border border-[#E4E1EA] align-middle text-[15px] ${t.type === 'LENT' ? 'text-[#7B2B8C]' : 'text-[#078A87]'}`}>
                          {t.type === 'LENT' ? '-' : '+'}{formatMoney(t.amount)}
                        </td>
                        <td className="py-1.5 px-1 text-[#B7791F] font-bold whitespace-nowrap text-center border border-[#E4E1EA] align-middle text-[10px]">{t.promiseDate ? formatDisplayDate(t.promiseDate) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>,
            document.body
          )}
          <AppBottomBranding />
        </div>
      </div>
    </React.Fragment>
  );
};

const LoanManagerView = ({ onSelectPerson, initialPersonFilter = null, initialLoanId = null, onClearLoanFocus }) => {
  const { loans, persons, admin, saveLoanAction, deleteLoanAction, showFeedback } = useContext(AppContext);

  const [viewMode, setViewMode] = useState(initialLoanId ? 'detail' : 'master');
  const [selectedLoanId, setSelectedLoanId] = useState(initialLoanId || (loans && loans.length > 0 ? loans[0].id : null));
  const [isCreatingLoan, setIsCreatingLoan] = useState(!initialLoanId && initialPersonFilter ? true : false);

  useEffect(() => {
    if (loans && loans.length > 0 && !loans.some(l => l.id === selectedLoanId)) {
      setSelectedLoanId(loans[0].id);
    }
  }, [loans, selectedLoanId]);

  const [newPerson, setNewPerson] = useState(initialPersonFilter || '');
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanTaken, setNewLoanTaken] = useState('');
  const [newLoanToPay, setNewLoanToPay] = useState('');
  const [newMonthlyEmi, setNewMonthlyEmi] = useState('');
  const [newTenure, setNewTenure] = useState('12');
  const [newFirstDate, setNewFirstDate] = useState(toInputDate_(new Date()));

  const [createStatus, setCreateStatus] = useState('idle');

  const currentLoan = useMemo(() => {
    return (loans || []).find(l => l.id === selectedLoanId) || ((loans && loans.length > 0) ? loans[0] : null);
  }, [loans, selectedLoanId]);

  const masterSummary = useMemo(() => {
    let totalLoanToPay = 0;
    let totalPaidSoFar = 0;

    (loans || []).forEach(loan => {
      totalLoanToPay += Number(loan.loanAmount) || 0;
      (loan.schedule || []).forEach(s => {
        if (s.paid) totalPaidSoFar += Number(s.emiAmount) || 0;
      });
    });

    const totalRemaining = Math.max(0, totalLoanToPay - totalPaidSoFar);
    return { totalLoanToPay, totalPaidSoFar, totalRemaining };
  }, [loans]);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const loanTaken = parseFloat(newLoanTaken) || 0;
    const loanToPay = parseFloat(newLoanToPay) || 0;
    const emi = parseFloat(newMonthlyEmi) || 0;
    const tenure = parseInt(newTenure, 10) || 1;

    if (!loanToPay || !emi || !newPerson) {
      alert('Please enter Loan to Pay, Monthly EMI, and Borrower.');
      return;
    }

    setCreateStatus('loading');
    try {
      let runningBal = loanToPay;
      const schedule = [];
      const baseDate = newFirstDate.split('-').reverse().join('/');

      for (let i = 1; i <= tenure; i++) {
        runningBal = Math.max(0, runningBal - emi);
        const d = parseDate(baseDate);
        const targetDate = new Date(d.getFullYear(), d.getMonth() + (i - 1), d.getDate());
        schedule.push({
          emiNo: i,
          date: formatDisplayDate(targetDate),
          emiAmount: emi,
          outstandingBal: Math.round(runningBal * 100) / 100,
          paid: false,
          whoPaid: '',
          paymentId: ''
        });
      }

      const payload = {
        id: 'LN_' + Date.now(),
        person: newPerson,
        loanName: newLoanName || 'Loan',
        principalAmount: loanTaken || loanToPay,
        loanAmount: loanToPay,
        monthlyEmi: emi,
        tenureMonths: tenure,
        firstEmiDate: baseDate,
        status: 'ACTIVE',
        schedule
      };

      await saveLoanAction(payload);
      setCreateStatus('success');
      setIsCreatingLoan(false);
      setSelectedLoanId(payload.id);
      setViewMode('detail');
    } catch (err) {
      setCreateStatus('error');
      alert('Failed to create loan: ' + (err && err.message ? err.message : 'Error'));
    }
  };

  if (viewMode === 'master' && !isCreatingLoan) {
    return (
      <div className="px-4 mt-2 pb-32 space-y-3.5 animate-slide-up">
        <div className="flex justify-end items-center px-1">
          <button
            onClick={() => setIsCreatingLoan(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#078A87] text-white text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>New Loan</span>
          </button>
        </div>

        <div className="grad-kpi rounded-2xl p-4 shadow-md grid grid-cols-3 divide-x divide-white/10 text-center text-white">
          <div className="px-1">
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Total to Pay</p>
            <p className="text-sm font-black text-white mt-1 truncate">{formatMoney(masterSummary.totalLoanToPay)}</p>
          </div>
          <div className="px-1">
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Paid So Far</p>
            <p className="text-sm font-black text-emerald-400 mt-1 truncate">{formatMoney(masterSummary.totalPaidSoFar)}</p>
          </div>
          <div className="px-1">
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Remaining</p>
            <p className="text-sm font-black text-[#07C0BE] mt-1 truncate">{formatMoney(masterSummary.totalRemaining)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E1EA] shadow-xs overflow-hidden">
          {(!loans || loans.length === 0) ? (
            <div className="text-center py-12 px-4">
              <i className="fa-solid fa-hand-holding-dollar text-3xl text-gray-300 mb-2"></i>
              <p className="text-xs font-bold text-gray-500">No active loans found. Create your first loan above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full table-fixed text-[10px]">
                <thead className="bg-[#E8E6F0] text-[#1E104B] uppercase font-black border-b border-[#D6D2E0]">
                  <tr>
                    <th className="w-[34%] px-3 py-2 text-left tracking-tight">Loan / Person</th>
                    <th className="w-[22%] px-2 py-2 text-right tracking-tight">Loan Rs.</th>
                    <th className="w-[22%] px-2 py-2 text-right tracking-tight">EMI Rs.</th>
                    <th className="w-[22%] px-2 py-2 text-right tracking-tight">EMI Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1EA]/60 font-semibold text-[#1E104B]">
                  {loans.map(loan => {
                    const paidCount = (loan.schedule || []).filter(s => s.paid).length;
                    const totalCount = (loan.schedule || []).length;
                    const isClosed = loan.status === 'CLOSED' || (totalCount > 0 && paidCount === totalCount);

                    return (
                      <tr
                        key={loan.id}
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setViewMode('detail');
                          setIsCreatingLoan(false);
                        }}
                        className="hover:bg-[#F4F3F8] cursor-pointer transition-colors active:bg-gray-100"
                      >
                        <td className="px-3 py-3.5 truncate">
                          <span className="font-extrabold block truncate text-xs text-[#1E104B]">{loan.loanName}</span>
                          <span className="block truncate text-[10px] font-bold text-[#625E70]">{loan.person}</span>
                        </td>
                        <td className="px-2 py-3.5 text-right font-black text-[#1E104B] text-xs">
                          {formatMoney(loan.loanAmount)}
                        </td>
                        <td className="px-2 py-3.5 text-right font-black text-[#1E104B] text-xs">
                          {formatMoney(loan.monthlyEmi)}
                        </td>
                        <td className="px-2 py-3.5 text-right font-black text-[11px]">
                          <span className={isClosed ? 'text-gray-400' : 'text-emerald-600'}>
                            {paidCount}/{totalCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AppBottomBranding />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full select-none">
      <div className="flex-none grad-dark px-3.5 py-3 text-white flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
          <button
            onClick={() => {
              if (onClearLoanFocus) onClearLoanFocus();
              setViewMode('master');
              setIsCreatingLoan(false);
            }}
            title="Exit to Loans Directory"
            className="w-8 h-8 flex-none flex items-center justify-center hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base"></i>
          </button>
          <h1 className="text-sm sm:text-base font-extrabold truncate leading-tight">
            {currentLoan ? currentLoan.loanName : 'Loan Overview'}
          </h1>
        </div>
      </div>

      <div className="app-content px-4 mt-2 pb-32 space-y-3">
        {currentLoan && !isCreatingLoan && (
          <div className="bg-white rounded-2xl border border-[#E4E1EA] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm font-black text-[#1E104B]">{currentLoan.loanName}</p>
                <p className="text-xs text-gray-500 font-bold">{currentLoan.person}</p>
              </div>
              <button
                onClick={() => deleteLoanAction(currentLoan.id).then(() => setViewMode('master'))}
                className="text-red-500 text-xs font-bold"
              >
                Delete Loan
              </button>
            </div>
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                <thead className="bg-[#1DA1D2] text-white uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">DATE</th>
                    <th className="px-3 py-2.5 text-right">AMOUNT</th>
                    <th className="px-3 py-2.5 text-right">BALANCE</th>
                    <th className="px-2.5 py-2.5 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1EA] font-semibold text-[#1E104B]">
                  {(currentLoan.schedule || []).map((row) => (
                    <tr key={row.emiNo} className={row.paid ? 'bg-amber-50/70' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-2.5">{formatDisplayDate(row.date)}</td>
                      <td className="px-3 py-2.5 text-right font-black">{formatMoney(row.emiAmount)}</td>
                      <td className="px-3 py-2.5 text-right">{formatMoney(row.outstandingBal)}</td>
                      <td className="px-2.5 py-2.5 text-center font-bold">
                        {row.paid ? <span className="text-emerald-600">PAID</span> : <span className="text-gray-400">DUE</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isCreatingLoan && (
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3.5 border border-[#E4E1EA]">
            <h3 className="text-sm font-black text-[#1E104B] uppercase tracking-wide">Create New Loan</h3>
            <form onSubmit={handleCreateLoan} className="space-y-3">
              <SearchableDropdown
                value={newPerson}
                onChange={setNewPerson}
                options={persons.map(p => p.name)}
                placeholder="Select borrower..."
              />
              <input
                type="text"
                required
                placeholder="Loan Name"
                value={newLoanName}
                onChange={e => setNewLoanName(e.target.value)}
                className="w-full border border-[#E4E1EA] rounded-xl px-3 py-2.5 font-bold text-xs bg-[#F4F3F8]"
              />
              <input
                type="number"
                required
                placeholder="Total Repayable Amount"
                value={newLoanToPay}
                onChange={e => setNewLoanToPay(e.target.value)}
                className="w-full border border-[#E4E1EA] rounded-xl px-3 py-2.5 font-bold text-xs bg-[#F4F3F8]"
              />
              <input
                type="number"
                required
                placeholder="Monthly EMI"
                value={newMonthlyEmi}
                onChange={e => setNewMonthlyEmi(e.target.value)}
                className="w-full border border-[#E4E1EA] rounded-xl px-3 py-2.5 font-bold text-xs bg-[#F4F3F8]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingLoan(false)}
                  className="flex-1 bg-gray-100 font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStatus === 'loading'}
                  className="flex-1 bg-[#1E104B] text-white font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  {createStatus === 'loading' ? 'Saving...' : 'Save Loan'}
                </button>
              </div>
            </form>
          </div>
        )}
        <AppBottomBranding />
      </div>
    </div>
  );
};

const RecordsView = ({ onSelectTransaction }) => {
  const { filteredTransactions } = useContext(AppContext);

  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === 'EXPENSE'), [filteredTransactions]);
  const incomes = useMemo(() => filteredTransactions.filter(t => t.type === 'INCOME'), [filteredTransactions]);
  const lents = useMemo(() => filteredTransactions.filter(t => t.type === 'LENT'), [filteredTransactions]);
  const borrows = useMemo(() => filteredTransactions.filter(t => t.type === 'BORROW'), [filteredTransactions]);

  const Section = ({ title, txs }) => {
    const totalAmount = useMemo(() => txs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [txs]);

    return (
      <div className="mb-3.5 bg-white rounded-2xl border border-[#E4E1EA] overflow-hidden shadow-xs">
        <div className="bg-[#1E104B] px-3.5 py-2.5 flex justify-between items-center text-white">
          <span className="text-[10px] font-black uppercase tracking-wider">{title} ({txs.length})</span>
          <span className="text-[10px] font-semibold tracking-wide text-white/80">
            Total: <span className="font-black text-white">{formatMoney(totalAmount)}</span>
          </span>
        </div>
        <TransactionTable transactions={txs} maxRows={10} showViewAll={false} onSelectTransaction={onSelectTransaction} embedded={true} />
      </div>
    );
  };

  return (
    <div className="px-4 mt-2 pb-32">
      <div className="flex justify-end mb-2.5">
        <PeriodSelector />
      </div>
      <Section title="Expense" txs={expenses} />
      <Section title="Income" txs={incomes} />
      <Section title="Given (Dr)" txs={lents} />
      <Section title="Received (Cr)" txs={borrows} />
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
          <button onClick={onClose} className="w-8 h-8 bg-[#F4F3F8] rounded-full flex items-center justify-center">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="space-y-2 text-xs font-semibold text-gray-700">
          <p>Amount: <span className="font-black text-sm text-[#1E104B]">{formatMoney(tx.amount)}</span></p>
          <p>Date: {formatDisplayDate(tx.date)}</p>
          <p>Type: {tx.type}</p>
          <p>Category / Note: {tx.note || tx.category || '-'}</p>
          {tx.person && <p>Person: {tx.person}</p>}
        </div>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              deleteTransaction(tx.id || tx.entryId);
              onClose();
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase shadow-md transition-all"
          >
            Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

const InputModal = ({ onClose, defaultPerson = '' }) => {
  const { addTransaction, persons, categories } = useContext(AppContext);
  const [type, setType] = useState('EXPENSE');
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personName, setPersonName] = useState(defaultPerson || '');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amt || isNaN(amt)) return;
    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amt),
        category: (type === 'EXPENSE' || type === 'INCOME') ? category : '',
        person: personName || '',
        date: date.split('-').reverse().join('/'),
        note
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-theme-dark/60 backdrop-blur-sm flex items-end justify-center p-0" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 max-h-[85%] overflow-y-auto relative shadow-2xl animate-slide-up hide-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-extrabold text-theme-dark uppercase tracking-wider">New Record</h2>
          <button onClick={onClose} className="w-8 h-8 bg-theme-gray rounded-full flex items-center justify-center">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F4F3F8] rounded-xl mb-4 text-[10px] font-bold uppercase border border-[#E4E1EA]">
          {['EXPENSE', 'INCOME', 'LENT', 'BORROW'].map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`py-2 rounded-lg transition-all ${type === item ? 'bg-[#1E104B] text-white shadow-xs' : 'text-[#625E70]'}`}
            >
              {item === 'LENT' ? 'GIVEN' : item === 'BORROW' ? 'RECEIVED' : item}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <input
            type="number"
            required
            step="any"
            placeholder="Amount (₹)"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            className="w-full text-xl font-black rounded-xl p-3 border border-[#E4E1EA] bg-[#F4F3F8] outline-none"
          />
          <AppDatePicker
            required={true}
            value={date}
            onChange={setDate}
            className="w-full font-bold text-xs rounded-xl p-3 border border-[#E4E1EA] bg-[#F4F3F8]"
          />
          {(type === 'LENT' || type === 'BORROW') && (
            <SearchableDropdown
              value={personName}
              onChange={setPersonName}
              options={persons.map(p => p.name)}
              placeholder="Select person..."
            />
          )}
          {(type === 'EXPENSE' || type === 'INCOME') && (
            <SearchableDropdown
              value={category}
              onChange={setCategory}
              options={type === 'INCOME' ? categories.income : categories.expense}
              placeholder="Category..."
            />
          )}
          <input
            type="text"
            placeholder="Description..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full font-bold text-xs rounded-xl p-3 border border-[#E4E1EA] bg-[#F4F3F8]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#078A87] text-white font-black py-3 rounded-xl uppercase text-xs shadow-md"
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
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
    return persons.map(p => {
      let dr = 0, cr = 0;
      transactions.filter(t => t.person === p.name).forEach(t => {
        if (t.type === 'LENT') dr += t.amount;
        if (t.type === 'BORROW') cr += t.amount;
      });
      return { ...p, totalDr: dr, totalCr: cr, remaining: dr - cr };
    }).sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining));
  }, [persons, transactions]);

  if (loading && transactions.length === 0 && persons.length === 0) {
    return (
      <div className="app-shell flex items-center justify-center font-bold text-xs text-gray-500">
        Loading Records...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell flex flex-col items-center justify-center p-6 text-center">
        <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2"></i>
        <p className="text-sm font-bold text-theme-dark">Couldn't load your data</p>
        <button onClick={() => refresh(true, true)} className="mt-3 px-4 py-2 bg-theme-dark text-white rounded-xl text-xs font-bold">Retry</button>
      </div>
    );
  }

  // Resilient person ledger selection without null blank-screen unmounts
  if (selectedPerson) {
    const refreshedPerson = fullPersonList.find(p => String(p.name || '').trim().toLowerCase() === String(selectedPerson.name || '').trim().toLowerCase()) || selectedPerson;

    return (
      <div className="app-shell">
        <LedgerView
          person={refreshedPerson}
          onBack={() => setSelectedPerson(null)}
          onSelectPerson={setSelectedPerson}
          allPersons={fullPersonList}
          onSelectTransaction={setSelectedTransaction}
        />
        {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
        {showInput && <InputModal onClose={() => setShowInput(false)} defaultPerson={refreshedPerson.name} />}
        
        {/* Navigation Bar inside active Ledger view */}
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
              <img
                src={resolveImg(APP_ICON_WHITE)}
                alt="Icon"
                className={`absolute w-8 h-8 object-contain transition-all duration-700 ${fabShowingAppIcon ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'}`}
              />
              <span
                aria-hidden="true"
                className={`fab-heavy-plus absolute transition-all duration-700 ${fabShowingAppIcon ? 'opacity-0 scale-75 -rotate-90' : 'opacity-100 scale-100 rotate-0'}`}
              ></span>
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
          <SearchView onSelectPerson={setSelectedPerson} onSelectTransaction={setSelectedTransaction} />
        ) : (
          <>
            {tab === 'home' && <HomeView onSelectPerson={setSelectedPerson} onSelectTransaction={setSelectedTransaction} onNavigateTab={setTab} />}
            {tab === 'people' && <PersonsView onSelectPerson={setSelectedPerson} />}
            {tab === 'loans' && <LoanManagerView onSelectPerson={setSelectedPerson} />}
            {tab === 'records' && <RecordsView onSelectTransaction={setSelectedTransaction} />}
          </>
        )}
      </div>

      {showInput && <InputModal onClose={() => setShowInput(false)} />}
      {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}

      {/* Global Navigation Bar */}
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
            <img
              src={resolveImg(APP_ICON_WHITE)}
              alt="Icon"
              className={`absolute w-8 h-8 object-contain transition-all duration-700 ${fabShowingAppIcon ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'}`}
            />
            <span
              aria-hidden="true"
              className={`fab-heavy-plus absolute transition-all duration-700 ${fabShowingAppIcon ? 'opacity-0 scale-75 -rotate-90' : 'opacity-100 scale-100 rotate-0'}`}
            ></span>
          </span>
        </button>
      </div>
    </div>
  );
};

// Mount after complete script evaluation
initDB().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
});
