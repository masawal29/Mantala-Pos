بimport React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { 
  Home, ShoppingCart, Package, BookOpen, Receipt, 
  LineChart, Plus, Trash2, AlertCircle, ChevronRight, 
  Menu as MenuIcon, X, CheckCircle, Coffee, DollarSign,
  TrendingUp, TrendingDown, Users, Hand, Printer, Download,
  LogOut, Lock, User, Award, ArrowDownRight, Smartphone, Edit,
  Clock, Settings, Image as ImageIcon, QrCode, Banknote, Calendar, UserPlus
} from 'lucide-react';

// --- CONFIGURATION PERMANEN (MILIK KEDAI MANTALA) ---
const firebaseConfig = {
  apiKey: "AIzaSyAASEwSAK9AcgCbvodqpl4ehn7wt-gN0OU",
  authDomain: "kedai-mantala-pos.firebaseapp.com",
  projectId: "kedai-mantala-pos",
  storageBucket: "kedai-mantala-pos.firebasestorage.app",
  messagingSenderId: "260680944002",
  appId: "1:260680944002:web:d4d063b3ca552a6d06a79b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kedai-mantala-main';

// --- INITIAL DATA UNTUK SETUP PERTAMA KALI ---
const initialIngredients = [
  { id: 'B1', name: 'Cup', unit: 'pcs', stock: 650, minStock: 100, price: 600 },
  { id: 'B2', name: 'Teh 999', unit: 'gr', stock: 1512, minStock: 200, price: 78 },
  { id: 'B8', name: 'Chatramue', unit: 'gr', stock: 800, minStock: 200, price: 150 },
  { id: 'B9', name: 'Black Tea', unit: 'gr', stock: 500, minStock: 200, price: 100 },
  { id: 'B10', name: 'Teh Naga', unit: 'gr', stock: 848, minStock: 200, price: 75 },
  { id: 'B7', name: 'Kopi Blend', unit: 'gr', stock: 800, minStock: 250, price: 224 },
  { id: 'B5', name: 'Gula', unit: 'gr', stock: 3000, minStock: 1000, price: 20 },
  { id: 'B4', name: 'SKM', unit: 'gr', stock: 5000, minStock: 500, price: 23 },
  { id: 'B11', name: 'UHT Coconut', unit: 'ml', stock: 0, minStock: 200, price: 24 },
  { id: 'B12', name: 'UHT Full Cream', unit: 'ml', stock: 0, minStock: 200, price: 24 },
  { id: 'B13', name: 'Gula Jawa', unit: 'ml', stock: 0, minStock: 200, price: 20 },
  { id: 'B14', name: 'Creamer', unit: 'gr', stock: 1000, minStock: 200, price: 44 },
  { id: 'B3', name: 'Susu Evaporasi', unit: 'ml', stock: 4180, minStock: 500, price: 46 },
  { id: 'B15', name: 'Lemon Tea Powder', unit: 'gr', stock: 0, minStock: 100, price: 70 },
  { id: 'B16', name: 'Peach Tea Powder', unit: 'gr', stock: 0, minStock: 100, price: 70 },
  { id: 'B17', name: 'Coklat Powder', unit: 'gr', stock: 0, minStock: 100, price: 470 },
  { id: 'B6', name: 'Ice Tube', unit: 'gr', stock: 5000, minStock: 2000, price: 1.16 },
  { id: 'B98', name: 'Air Panas', unit: 'ml', stock: 99999, minStock: 0, price: 0 },
  { id: 'B99', name: 'Air', unit: 'ml', stock: 99999, minStock: 0, price: 0 }
];

const initialMenus = [
  { id: 'T1', code: 'T1', name: 'Es Teh', category: 'Teh', pricePublic: 5000, priceOnline: 6250, priceMember: 4000, status: 'Aktif', hpp: 3000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop' },
  { id: 'T2', code: 'T2', name: 'Teh Susu', category: 'Teh', pricePublic: 8000, priceOnline: 10000, priceMember: 6000, status: 'Aktif', hpp: 4000, image: 'https://images.unsplash.com/photo-1588934500078-2321c17fbbac?w=300&h=300&fit=crop' },
  { id: 'K4', code: 'K4', name: 'Kopi Moka', category: 'Kopi', pricePublic: 16000, priceOnline: 20000, priceMember: 12000, status: 'Aktif', hpp: 10000, image: 'https://images.unsplash.com/photo-1574626002936-21804d9a6fc4?w=300&h=300&fit=crop' },
  { id: 'W1', code: 'W1', name: 'Warung', category: 'Teh', pricePublic: 6000, priceOnline: 6000, priceMember: 6000, status: 'Aktif', hpp: 3000 }
];

const MOCK_USERS_DEFAULT = [
  { id: 'admin-root', username: 'admin', password: 'admin123', name: 'Pinggiran Group', role: 'admin', photoUrl: '' },
  { id: 'u1', username: 'awalluddin', password: '123', name: 'Awalluddin', role: 'kasir', photoUrl: '' },
  { id: 'u2', username: 'salma', password: '123', name: 'Salma', role: 'kasir', photoUrl: '' },
  { id: 'u3', username: 'musa', password: '123', name: 'Musa', role: 'kasir', photoUrl: '' },
  { id: 'u4', username: 'yasmine', password: '123', name: 'Yasmine', role: 'kasir', photoUrl: '' },
  { id: 'u5', username: 'yusri', password: '123', name: 'Yusri', role: 'kasir', photoUrl: '' },
  { id: 'u7', username: 'zulfikar', password: '123', name: 'Zulfikar', role: 'kasir', photoUrl: '' },
  { id: 'u8', username: 'ajijo', password: '123', name: 'Aji Jo', role: 'kasir', photoUrl: '' }
];

const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('kasir');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [ingredients, setIngredients] = useState([]);
  const [menus, setMenus] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [appSettings, setAppSettings] = useState({ logoUrl: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            // Jika token mismatch (biasa terjadi karena beda project), masuk secara anonim
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth Error", e); }
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, u => setFirebaseUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const syncData = async () => {
      try {
        const userPath = `artifacts/${appId}/users/${uid}`;
        const batch = writeBatch(db);

        const ingRef = collection(db, userPath, 'ingredients');
        const ingSnap = await getDocs(ingRef);
        if (ingSnap.empty) {
          initialIngredients.forEach(i => batch.set(doc(db, userPath, 'ingredients', i.id), i));
          initialMenus.forEach(m => batch.set(doc(db, userPath, 'menus', m.id), m));
          MOCK_USERS_DEFAULT.forEach(u => batch.set(doc(db, userPath, 'appUsers', u.id), u));
          batch.set(doc(db, userPath, 'settings', 'general'), { logoUrl: '' });
          await batch.commit();
        }

        onSnapshot(collection(db, userPath, 'ingredients'), s => setIngredients(s.docs.map(d => d.data())), e => console.error("Ing Sync Error", e));
        onSnapshot(collection(db, userPath, 'menus'), s => setMenus(s.docs.map(d => d.data())), e => console.error("Menu Sync Error", e));
        onSnapshot(collection(db, userPath, 'sales'), s => setSales(s.docs.map(d => d.data())), e => console.error("Sales Sync Error", e));
        onSnapshot(collection(db, userPath, 'expenses'), s => setExpenses(s.docs.map(d => d.data())), e => console.error("Exp Sync Error", e));
        onSnapshot(collection(db, userPath, 'attendance'), s => setAttendance(s.docs.map(d => d.data())), e => console.error("Att Sync Error", e));
        onSnapshot(collection(db, userPath, 'appUsers'), s => {
           const list = s.docs.map(d => d.data());
           setAppUsers(list);
           if (currentUser) {
              const updated = list.find(u => u.username === currentUser.username);
              if (updated) setCurrentUser(updated);
           }
        }, e => console.error("Users Sync Error", e));
        onSnapshot(doc(db, userPath, 'settings', 'general'), d => d.exists() && setAppSettings(d.data()), e => console.error("Settings Sync Error", e));

        setIsCloudReady(true);
      } catch (err) { console.error("General Sync Error", err); setIsCloudReady(true); }
    };
    syncData();
  }, [firebaseUser, currentUser?.username]);

  const handleAttendance = async (type) => {
    if (!firebaseUser) return;
    const ref = doc(db, `artifacts/${appId}/users/${firebaseUser.uid}/attendance`, `ATT-${Date.now()}`);
    await setDoc(ref, { id: ref.id, date: new Date().toISOString(), name: currentUser.name, role: currentUser.role, type });
    showToast(`Absensi ${type} Berhasil!`);
  };

  if (!isCloudReady) return <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white"><Coffee className="animate-pulse text-amber-500 mb-4" size={48} /><p className="font-bold tracking-widest uppercase text-xs opacity-50">Menghubungkan ke Cloud...</p></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} appUsers={appUsers} appSettings={appSettings} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 z-10 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-amber-500 shrink-0">
             {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-full h-full object-contain p-1" /> : <Hand className="text-amber-500" size={24} />}
          </div>
          <div className="min-w-0"><h1 className="text-lg font-black text-white leading-tight truncate uppercase tracking-tighter">Mantala</h1><p className="text-[10px] text-slate-400 italic">Jadi #TemanSetia</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem icon={<ShoppingCart />} label="Kasir (POS)" active={activeTab === 'kasir'} onClick={() => setActiveTab('kasir')} />
          {currentUser.role === 'admin' && (
            <>
              <NavItem icon={<LineChart />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavItem icon={<Package />} label="Stok Gudang" active={activeTab === 'stok'} onClick={() => setActiveTab('stok')} />
              <NavItem icon={<BookOpen />} label="Menu & HPP" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
              <NavItem icon={<Receipt />} label="Pengeluaran" active={activeTab === 'pengeluaran'} onClick={() => setActiveTab('pengeluaran')} />
              <NavItem icon={<Clock />} label="Data Absensi" active={activeTab === 'absensi'} onClick={() => setActiveTab('absensi')} />
              <NavItem icon={<Settings />} label="Pengaturan" active={activeTab === 'pengaturan'} onClick={() => setActiveTab('pengaturan')} />
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 mb-4 flex gap-2">
            <button onClick={() => handleAttendance('Masuk')} className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-500 hover:text-white transition-all">Masuk</button>
            <button onClick={() => handleAttendance('Pulang')} className="flex-1 py-2 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">Pulang</button>
          </div>
          <div className="flex items-center justify-between gap-2 p-1">
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10">
                  {currentUser.photoUrl ? <img src={currentUser.photoUrl} className="w-full h-full object-cover"/> : <User size={16}/>}
               </div>
               <div className="text-xs truncate"><p className="text-white font-bold truncate">{currentUser.name}</p><p className="text-[10px] opacity-40 uppercase font-black">{currentUser.role}</p></div>
            </div>
            <button onClick={() => setCurrentUser(null)} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={18}/></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-lg border-b border-white/5">
           <div className="flex items-center gap-2">
             {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-7 h-7 bg-white p-0.5 rounded-full object-contain"/> : <Hand className="text-amber-500" size={20}/>}
             <h1 className="font-black uppercase tracking-tighter">Mantala</h1>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg">{isMobileMenuOpen ? <X/> : <MenuIcon/>}</button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-slate-900 text-slate-300 z-50 flex flex-col p-4 animate-fade-in">
             <NavItem icon={<ShoppingCart />} label="Kasir (POS)" active={activeTab === 'kasir'} onClick={() => {setActiveTab('kasir'); setIsMobileMenuOpen(false);}} />
             {currentUser.role === 'admin' && (
               <>
                 <NavItem icon={<LineChart />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} />
                 <NavItem icon={<Package />} label="Stok Gudang" active={activeTab === 'stok'} onClick={() => {setActiveTab('stok'); setIsMobileMenuOpen(false);}} />
                 <NavItem icon={<BookOpen />} label="Menu & HPP" active={activeTab === 'menu'} onClick={() => {setActiveTab('menu'); setIsMobileMenuOpen(false);}} />
                 <NavItem icon={<Receipt />} label="Pengeluaran" active={activeTab === 'pengeluaran'} onClick={() => {setActiveTab('pengeluaran'); setIsMobileMenuOpen(false);}} />
                 <NavItem icon={<Clock />} label="Data Absensi" active={activeTab === 'absensi'} onClick={() => {setActiveTab('absensi'); setIsMobileMenuOpen(false);}} />
                 <NavItem icon={<Settings />} label="Pengaturan" active={activeTab === 'pengaturan'} onClick={() => {setActiveTab('pengaturan'); setIsMobileMenuOpen(false);}} />
               </>
             )}
             <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
               <button onClick={() => {setCurrentUser(null); setIsMobileMenuOpen(false);}} className="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest">Logout</button>
             </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'dashboard' && <Dashboard sales={sales} expenses={expenses} menus={menus} ingredients={ingredients} setActiveTab={setActiveTab} />}
          {activeTab === 'kasir' && <POS menus={menus} ingredients={ingredients} sales={sales} showToast={showToast} currentUser={currentUser} appSettings={appSettings} firebaseUser={firebaseUser} />}
          {activeTab === 'stok' && <Inventory ingredients={ingredients} showToast={showToast} firebaseUser={firebaseUser} />}
          {activeTab === 'menu' && <MenuHPP menus={menus} showToast={showToast} firebaseUser={firebaseUser} />}
          {activeTab === 'pengeluaran' && <Expenses expenses={expenses} showToast={showToast} firebaseUser={firebaseUser} />}
          {activeTab === 'absensi' && <AttendanceTab attendance={attendance} />}
          {activeTab === 'pengaturan' && <SettingsTab appSettings={appSettings} appUsers={appUsers} showToast={showToast} firebaseUser={firebaseUser} />}
        </div>

        {toast && (
          <div className="absolute bottom-6 right-6 z-[100] animate-fade-in-up">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold border-b-4 ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-800' : 'bg-rose-600 border-rose-800'}`}><CheckCircle size={20}/><p>{toast.message}</p></div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
      <div className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-amber-500'} transition-colors`}>{React.cloneElement(icon, { size: 18 })}</div>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color, bg, subtitle }) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${bg} ${color} shrink-0`}>{React.cloneElement(icon, { size: 20 })}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
        <p className="text-xl font-black text-slate-900 truncate tracking-tighter">{value}</p>
        {subtitle && <p className="text-[10px] font-bold text-amber-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Dashboard({ sales, expenses, menus, ingredients, setActiveTab }) {
  const [filter, setFilter] = useState('hari_ini');
  
  const isDateMatch = (dateStr) => {
    const d = new Date(dateStr); const now = new Date();
    if (filter === 'hari_ini') return d.toDateString() === now.toDateString();
    if (filter === 'bulan_ini') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  };

  const filteredSales = sales.filter(s => isDateMatch(s.date));
  const filteredExpenses = expenses.filter(e => isDateMatch(e.date));

  const omzet = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const hpp = filteredSales.reduce((sum, s) => sum + (s.totalHpp || 0), 0);
  const pengeluaran = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const labaBersih = (omzet - hpp) - pengeluaran;

  const productStats = menus.map(m => {
    const qty = filteredSales.reduce((acc, s) => acc + s.items.filter(i => i.menu.id === m.id).reduce((a, b) => a + b.qty, 0), 0);
    return { name: m.name, qty };
  }).sort((a,b) => b.qty - a.qty);

  const bestProduct = productStats[0]?.qty > 0 ? productStats[0] : {name: '-', qty: 0};

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Ringkasan</h2>
        <div className="flex bg-slate-200 p-1 rounded-lg text-[10px] font-black uppercase">
           {['hari_ini', 'bulan_ini', 'semua'].map(f => (
             <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded ${filter === f ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>{f.replace('_',' ')}</button>
           ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendapatan" value={formatRupiah(omzet)} icon={<DollarSign/>} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Laba Kotor" value={formatRupiah(omzet-hpp)} icon={<TrendingUp/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Laba Bersih" value={formatRupiah(labaBersih)} icon={<BookOpen/>} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Produk Top" value={bestProduct.name} subtitle={`${bestProduct.qty} terjual`} icon={<Award/>} color="text-amber-600" bg="bg-amber-50" />
      </div>
    </div>
  );
}

function POS({ menus, ingredients, sales, showToast, currentUser, appSettings, firebaseUser }) {
  const [cart, setCart] = useState([]);
  const [platform, setPlatform] = useState('Publik');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('Tunai');
  const [receipt, setReceipt] = useState(null);
  const [printType, setPrintType] = useState('pelanggan');

  const categories = ['Semua', ...new Set(menus.map(m => m.category))];
  const filtered = activeCategory === 'Semua' ? menus : menus.filter(m => m.category === activeCategory);
  const total = cart.reduce((s, i) => s + (i.qty * i.price), 0);

  const addToCart = (m) => {
    setCart(prev => {
      const ex = prev.find(i => i.menu.id === m.id);
      const price = platform === 'Online' ? m.priceOnline : platform === 'Member' ? m.priceMember : m.pricePublic;
      if (ex) return prev.map(i => i.menu.id === m.id ? {...i, qty: i.qty+1} : i);
      return [...prev, { menu: m, qty: 1, price, hpp: m.hpp }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.menu.id === id ? {...i, qty: i.qty + delta} : i).filter(i => i.qty > 0));
  };

  const handlePay = async () => {
    if (!firebaseUser) return;
    const saleId = `TRX-${Date.now()}`;
    const newSale = { id: saleId, date: new Date().toISOString(), items: cart, total, totalHpp: cart.reduce((s, i) => s + ((i.hpp || 0)*i.qty), 0), cashierName: currentUser.name, platform, paymentMethod: payMethod };
    await setDoc(doc(db, `artifacts/${appId}/users/${firebaseUser.uid}/sales`, saleId), newSale);
    setReceipt(newSale);
    setCart([]);
    setPayModal(false);
    showToast("Transaksi disimpan!");
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col h-[60%] lg:h-full overflow-hidden">
         <div className="bg-white border-b p-3 flex justify-between items-center shrink-0">
            <h2 className="font-black text-lg tracking-tighter">MENU KASIR</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner shrink-0">
               {['Publik', 'Online', 'Member'].map(p => <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${platform === p ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>{p}</button>)}
            </div>
         </div>
         <div className="bg-white/50 backdrop-blur-sm border-b p-2 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
            {categories.map(c => <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${activeCategory === c ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}>{c}</button>)}
         </div>
         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 custom-scrollbar pb-24 lg:pb-4">
            {filtered.map(m => (
              <button key={m.id} onClick={() => addToCart(m)} className="bg-white rounded-3xl border border-slate-200 p-2.5 text-left hover:border-amber-500 transition-all flex flex-col h-full group transform active:scale-95">
                <div className="h-20 sm:h-28 bg-slate-50 rounded-2xl mb-2 overflow-hidden flex items-center justify-center text-slate-300 relative group-hover:bg-amber-50 transition-colors">
                  {m.image ? <img src={m.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Coffee size={24}/>}
                </div>
                <div className="flex-1 flex flex-col px-1">
                  <p className="text-[9px] font-black text-amber-600 uppercase mb-0.5 tracking-wider">{m.category}</p>
                  <p className="text-xs font-black text-slate-800 line-clamp-2 leading-tight mb-2 min-h-[2.4em]">{m.name}</p>
                  <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-100">
                     <span className="text-[11px] font-black text-slate-900">{formatRupiah(platform === 'Online' ? m.priceOnline : platform === 'Member' ? m.priceMember : m.pricePublic)}</span>
                     <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors border border-slate-200"><Plus size={14}/></div>
                  </div>
                </div>
              </button>
            ))}
         </div>
      </div>

      <div className="w-full lg:w-[320px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[40%] lg:h-full shrink-0 z-20 shadow-2xl">
         <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 uppercase"><h3 className="font-black text-xs tracking-widest flex items-center gap-2"><Receipt size={16} className="text-amber-500"/> Pesanan</h3><span className="text-[10px] font-black text-amber-600">{platform}</span></div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scrollbar">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40 italic"><ShoppingCart size={32} className="mb-2"/><p className="text-xs font-bold">Pilih menu...</p></div> : 
              cart.map(i => (
                <div key={i.menu.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 animate-fade-in">
                  <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-800 truncate uppercase">{i.menu.name}</p><p className="text-[10px] text-amber-600 font-black">{formatRupiah(i.price)}</p></div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button onClick={() => updateQty(i.menu.id, -1)} className="w-7 h-7 flex items-center justify-center bg-slate-50 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-black">-</button>
                    <span className="w-6 text-center text-xs font-black">{i.qty}</span>
                    <button onClick={() => addToCart(i.menu)} className="w-7 h-7 flex items-center justify-center bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-black">+</button>
                  </div>
                </div>
              ))
            }
         </div>
         <div className="p-4 bg-white border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span><span className="text-2xl font-black text-slate-900 tracking-tighter">{formatRupiah(total)}</span></div>
            <button onClick={() => setPayModal(true)} disabled={cart.length === 0} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-500 transition-all disabled:bg-slate-100 uppercase tracking-widest text-sm">Bayar</button>
            <p className="text-center text-[9px] italic text-slate-400 font-medium">Duhai #KawanSetia, Terima kasih.</p>
         </div>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden animate-fade-in-up">
              <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                 <div><h3 className="font-black text-lg uppercase tracking-tighter">Konfirmasi</h3><p className="text-amber-600 font-black text-2xl tracking-tighter leading-none mt-1">{formatRupiah(total)}</p></div>
                 <button onClick={() => setPayModal(false)} className="p-2 text-slate-400 bg-white rounded-full shadow-sm"><X/></button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setPayMethod('Tunai')} className={`p-5 border-2 rounded-3xl flex flex-col items-center gap-3 transition-all ${payMethod === 'Tunai' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'}`}><Banknote size={36}/><span className="font-black text-[10px] uppercase">Tunai</span></button>
                    <button onClick={() => setPayMethod('QRIS')} className={`p-5 border-2 rounded-3xl flex flex-col items-center gap-3 transition-all ${payMethod === 'QRIS' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'}`}><QrCode size={36}/><span className="font-black text-[10px] uppercase">QRIS</span></button>
                 </div>
                 {payMethod === 'QRIS' && <div className="bg-slate-50 p-5 rounded-[24px] flex flex-col items-center gap-3 border border-dashed border-slate-200"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" className="w-24 opacity-60"/><p className="text-[10px] text-slate-400 text-center font-bold">Silakan scan QRIS Kedai Mantala</p></div>}
                 <button onClick={handlePay} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 uppercase tracking-widest">Selesaikan Pembayaran</button>
              </div>
           </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex flex-col items-center justify-center p-4">
           <style type="text/css" media="print">{`
             @page { size: 58mm auto; margin: 0; }
             body { background: white; margin: 0; padding: 0; }
             body * { visibility: hidden; }
             #print-area, #print-area * { visibility: visible; }
             #print-area { position: absolute; left: 0; top: 0; width: 58mm; color: black; background: white; padding: 2mm; font-family: monospace; font-size: 9px; line-height: 1.1; }
             .is-barista { display: ${printType === 'barista' ? 'block' : 'none'} !important; }
             .is-customer { display: ${printType === 'pelanggan' ? 'block' : 'none'} !important; }
           `}</style>
           <div className="bg-white rounded-[40px] w-full max-w-[340px] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
              <div id="print-area" className="bg-white p-6 overflow-y-auto font-mono text-black">
                 <div className={`${printType === 'barista' ? 'hidden print:hidden' : 'block'} text-center space-y-1`}>
                    {appSettings.logoUrl && <img src={appSettings.logoUrl} className="w-10 h-10 mx-auto grayscale mb-2" />}
                    <h3 className="font-black text-xs uppercase">KEDAI MANTALA</h3>
                    <p className="text-[9px]">Jadi #TemanSetia</p>
                    <div className="border-b border-black border-dashed my-3"></div>
                    <div className="text-left text-[8px] flex justify-between font-bold">
                       <div><p>Kasir: {receipt.cashierName}</p><p>{new Date(receipt.date).toLocaleDateString()}</p></div>
                       <div className="text-right"><p>{receipt.paymentMethod}</p><p>{receipt.platform}</p></div>
                    </div>
                    <div className="border-b border-black border-dashed my-3"></div>
                    <div className="space-y-1.5 text-left text-[8px]">
                       {receipt.items.map((i,idx) => <div key={idx} className="flex justify-between font-bold"><span>{i.qty}x {i.menu.name}</span><span>{formatRupiah(i.qty*i.price)}</span></div>)}
                    </div>
                    <div className="border-b border-black border-dashed my-3"></div>
                    <div className="flex justify-between font-black text-[10px]"><span>TOTAL</span><span>{formatRupiah(receipt.total)}</span></div>
                    <div className="mt-6 italic text-[8px] font-bold">Duhai #KawanSetia, Terima kasih.</div>
                 </div>
                 <div className={`${printType === 'pelanggan' ? 'hidden' : 'block'} pt-4`}>
                    <h3 className="bg-black text-white text-center font-black py-1 mb-3 text-[10px] uppercase">TIKET DAPUR</h3>
                    <div className="space-y-3">
                       {receipt.items.map((i,idx) => <p key={idx} className="text-lg font-black uppercase">[{i.qty}X] {i.menu.name}</p>)}
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-slate-50 border-t grid grid-cols-2 gap-3 shrink-0">
                 <button onClick={() => {setPrintType('pelanggan'); setTimeout(() => window.print(), 100)}} className="py-3 bg-amber-500 text-white font-black rounded-2xl text-[10px] uppercase flex items-center justify-center gap-2"><Printer size={16}/> Pelanggan</button>
                 <button onClick={() => {setPrintType('barista'); setTimeout(() => window.print(), 100)}} className="py-3 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase flex items-center justify-center gap-2"><Coffee size={16}/> Barista</button>
                 <button onClick={handleDownloadJPG} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl flex items-center justify-center"><Download size={20}/></button>
                 <button onClick={() => setReceipt(null)} className="py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest">Selesai</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function PriceRow({ label, price, profit }) {
  const margin = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;
  return (
    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <div className="text-right">
        <p className="text-sm font-black text-slate-800 leading-none">{formatRupiah(price)}</p>
        <p className="text-[10px] text-emerald-600 font-bold mt-1 leading-none">+{formatRupiah(profit)} ({margin}%)</p>
      </div>
    </div>
  );
}

function Inventory({ ingredients, showToast, firebaseUser }) {
  return (
    <div className="p-4 md:p-8 overflow-auto flex-1 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div><h2 className="text-2xl font-black uppercase tracking-tighter">Stok Gudang</h2><p className="text-sm text-slate-500 italic font-medium">Bahan baku terdaftar.</p></div>
         <div className="bg-emerald-600 text-white p-5 rounded-[24px] shadow-lg shadow-emerald-600/20"><p className="text-[10px] font-black uppercase opacity-80 mb-1">Nilai Aset</p><p className="text-2xl font-black tracking-tighter">{formatRupiah(ingredients.reduce((s,i) => s + (i.stock*i.price), 0))}</p></div>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
               <tr><th className="p-5">Bahan</th><th className="p-5 text-center">Stok</th><th className="p-5">Harga Beli</th><th className="p-5 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y border-slate-50">
               {ingredients.filter(i => i.id !== 'B98' && i.id !== 'B99').map(i => (
                 <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-black text-slate-800 uppercase tracking-tighter text-sm">{i.name} {i.stock <= i.minStock && <span className="ml-2 text-[9px] bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">Menipis</span>}</td>
                    <td className="p-5 text-center"><span className={`text-lg font-black ${i.stock <= i.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{i.stock}</span> <span className="text-[10px] text-slate-400 uppercase font-black ml-1">{i.unit}</span></td>
                    <td className="p-5 font-bold text-slate-500 text-sm">{formatRupiah(i.price)}</td>
                    <td className="p-5 text-right"><button className="text-amber-600 font-black text-xs hover:bg-amber-100 bg-amber-50 px-4 py-2 rounded-xl transition-all border border-amber-200 uppercase">Kelola</button></td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}

function MenuHPP({ menus, ingredients, showToast, firebaseUser }) {
  return (
    <div className="p-4 md:p-8 overflow-auto flex-1 space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Katalog Menu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {menus.map(m => (
           <div key={m.id} className="bg-white rounded-[32px] border border-slate-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-slate-200 border-2 border-white shadow-sm">
                  {m.image ? <img src={m.image} className="w-full h-full object-cover"/> : <Coffee size={24}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-amber-500 uppercase">{m.category}</p>
                  <h3 className="font-black text-slate-800 truncate uppercase tracking-tighter">{m.name}</h3>
                  <p className="text-[10px] font-black text-rose-500 mt-0.5">HPP: {formatRupiah(m.hpp)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 <PriceRow label="Public" price={m.pricePublic} profit={m.pricePublic - m.hpp} />
                 <PriceRow label="Online" price={m.priceOnline} profit={m.priceOnline - m.hpp} />
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

function Expenses({ expenses, showToast, firebaseUser }) {
  const total = expenses.reduce((s,e) => s + e.amount, 0);
  return (
    <div className="p-4 md:p-8 overflow-auto flex-1 space-y-6">
       <div className="flex justify-between items-center gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Pengeluaran</h2>
          <div className="bg-rose-600 text-white p-5 rounded-[24px] shadow-lg shadow-rose-600/20"><p className="text-[10px] font-black uppercase opacity-80 mb-1">Total Biaya</p><p className="text-2xl font-black tracking-tighter">{formatRupiah(total)}</p></div>
       </div>
       <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse min-w-[500px]">
             <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="p-5">Tanggal</th><th className="p-5">Keterangan</th><th className="p-5 text-right">Jumlah</th></tr>
             </thead>
             <tbody className="divide-y border-slate-50">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-[10px] font-black text-slate-400 uppercase">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                    <td className="p-5 font-black text-slate-800 uppercase tracking-tighter text-sm">{e.name}</td>
                    <td className="p-5 text-right font-black text-rose-600 text-base">{formatRupiah(e.amount)}</td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function AttendanceTab({ attendance }) {
  return (
    <div className="p-4 md:p-8 overflow-auto flex-1 space-y-6">
       <h2 className="text-2xl font-black uppercase tracking-tighter">Kehadiran</h2>
       <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
               <tr><th className="p-5">Waktu</th><th className="p-5">Karyawan</th><th className="p-5 text-right">Aktivitas</th></tr>
             </thead>
             <tbody className="divide-y border-slate-50">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-[10px] font-black text-slate-400 uppercase">{new Date(a.date).toLocaleString('id-ID')}</td>
                    <td className="p-5 font-black text-slate-800 uppercase tracking-tighter text-sm">{a.name}</td>
                    <td className="p-5 text-right">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${a.type==='Masuk' ? 'bg-emerald-50 text-emerald-600 border-emerald-100':'bg-rose-50 text-rose-600 border-rose-100'}`}>{a.type}</span>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function SettingsTab({ appSettings, appUsers, showToast, firebaseUser }) {
  const userPath = `artifacts/${appId}/users/${firebaseUser?.uid}`;

  const handleUpdateLogo = () => {
    const url = prompt("Masukkan Link Logo (URL Gambar):", appSettings.logoUrl);
    if (url !== null) updateDoc(doc(db, userPath, 'settings', 'general'), {logoUrl: url});
  };

  return (
    <div className="p-4 md:p-8 overflow-auto flex-1 space-y-6">
       <h2 className="text-2xl font-black uppercase tracking-tighter">Pengaturan</h2>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-fit">
             <h3 className="font-black border-b border-slate-50 pb-4 mb-6 flex items-center gap-3 uppercase text-xs tracking-widest text-slate-400">Branding</h3>
             <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[24px] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shrink-0">
                   {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-full h-full object-contain p-2"/> : <Hand size={32} className="text-slate-300"/>}
                </div>
                <div className="flex-1">
                   <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Logo Mantala</p>
                   <p className="text-[10px] text-slate-400 font-medium mb-4 italic">Gunakan link gambar statis.</p>
                   <button onClick={handleUpdateLogo} className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-slate-900/10">Ubah Logo</button>
                </div>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <h3 className="font-black border-b border-slate-50 pb-4 mb-6 flex items-center gap-3 uppercase text-xs tracking-widest text-slate-400">Akun Kasir</h3>
             <div className="space-y-3">
                {appUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-[20px] border border-white hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                       <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center font-black text-slate-400 text-xs border-2 border-white shadow-sm shrink-0">
                          {u.photoUrl ? <img src={u.photoUrl} className="w-full h-full object-cover"/> : u.name[0]}
                       </div>
                       <div className="min-w-0"><p className="font-black text-slate-800 text-xs uppercase truncate leading-none">{u.name}</p><p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter leading-none">{u.role} | {u.username}</p></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function LoginScreen({ onLogin, appUsers, appSettings }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const ex = appUsers.find(u => u.username === user.toLowerCase() && u.password === pass);
    if (ex) onLogin(ex); else setErr("Data Login Salah!");
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
       <div className="w-full max-w-sm bg-white rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden animate-fade-in relative z-10">
          <div className="bg-slate-900 p-10 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 overflow-hidden border-4 border-amber-500 shadow-xl transform -rotate-6">
                {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-full h-full object-contain p-2"/> : <Hand className="text-amber-500" size={32}/>}
             </div>
             <h1 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Kedai Mantala</h1>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">Sistem Kasir 2.0</p>
          </div>
          <form onSubmit={submit} className="p-10 space-y-6">
             {err && <div className="text-center text-rose-600 text-xs font-black bg-rose-50 p-3 rounded-2xl border border-rose-100">{err}</div>}
             <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label><input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-amber-500 font-bold text-slate-800" placeholder="Username..." required /></div>
             <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-amber-500 font-bold text-slate-800" placeholder="••••••••" required /></div>
             <button className="w-full py-5 bg-slate-900 text-white font-black rounded-[20px] hover:bg-amber-500 transition-all uppercase tracking-widest shadow-xl shadow-slate-900/10">Masuk</button>
          </form>
          <div className="pb-8 text-center opacity-20 text-[9px] uppercase tracking-[0.3em] font-black text-slate-900">Pinggiran Group Systems</div>
       </div>
    </div>
  );
}.