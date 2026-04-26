// ============================================================
// App.jsx — Kedai Mantala POS System
// Stack: React + Firebase (Auth + Firestore) + Tailwind CSS + Lucide React
// ============================================================

import React, {
  useState, useEffect, useContext, createContext,
  useRef, useCallback, useMemo,
} from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch, getDocs,
} from 'firebase/firestore';
import {
  Coffee, ShoppingCart, BarChart3, Package, Clock, Settings, LogOut,
  Plus, Minus, Trash2, X, Printer, UserCircle, Bell, TrendingUp,
  TrendingDown, DollarSign, AlertTriangle, Eye, EyeOff, Users, Star,
  Wallet, Receipt, Check, Edit, Save, Menu, QrCode, Shield,
  ChevronRight, RefreshCw, Home,
} from 'lucide-react';

// ============================================================
// FIREBASE INIT
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAASEwSAK9AcgCbvodqpl4ehn7wt-gN0OU",
  authDomain: "kedai-mantala-pos.firebaseapp.com",
  projectId: "kedai-mantala-pos",
  storageBucket: "kedai-mantala-pos.firebasestorage.app",
  messagingSenderId: "260680944002",
  appId: "1:260680944002:web:d4d063b3ca552a6d06a79b",
};

// Primary app
const firebaseApp = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(FIREBASE_CONFIG);
// Secondary app (for creating new users without signing out current admin)
const secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(FIREBASE_CONFIG, 'secondary');

const auth          = getAuth(firebaseApp);
const secondaryAuth = getAuth(secondaryApp);
const db            = getFirestore(firebaseApp);

const DOMAIN = '@kedaimantala.pos';

// ============================================================
// SEED DATA
// ============================================================
const SEED_INVENTORY = [
  { id: 'cup-hot-s',    name: 'Cup Hot S',          unit: 'pcs',  stock: 200,   minStock: 30,   cost: 500  },
  { id: 'cup-hot-m',    name: 'Cup Hot M',          unit: 'pcs',  stock: 200,   minStock: 30,   cost: 700  },
  { id: 'cup-cold-m',   name: 'Cup Cold M',         unit: 'pcs',  stock: 200,   minStock: 30,   cost: 800  },
  { id: 'cup-cold-l',   name: 'Cup Cold L',         unit: 'pcs',  stock: 200,   minStock: 30,   cost: 1000 },
  { id: 'milk',         name: 'Susu Segar',         unit: 'ml',   stock: 15000, minStock: 3000, cost: 15   },
  { id: 'espresso',     name: 'Biji Kopi Espresso', unit: 'gram', stock: 3000,  minStock: 500,  cost: 150  },
  { id: 'matcha',       name: 'Matcha Powder',      unit: 'gram', stock: 1000,  minStock: 200,  cost: 200  },
  { id: 'choco-powder', name: 'Chocolate Powder',   unit: 'gram', stock: 1000,  minStock: 200,  cost: 100  },
  { id: 'syrup-vanilla',name: 'Sirup Vanilla',      unit: 'ml',   stock: 2000,  minStock: 400,  cost: 50   },
  { id: 'whip-cream',   name: 'Whipped Cream',      unit: 'gram', stock: 500,   minStock: 100,  cost: 120  },
  { id: 'tea-bag',      name: 'Tea Bag',            unit: 'pcs',  stock: 120,   minStock: 30,   cost: 1000 },
  { id: 'croissant',    name: 'Croissant',          unit: 'pcs',  stock: 25,    minStock: 5,    cost: 8000 },
  { id: 'sandwich',     name: 'Sandwich',           unit: 'pcs',  stock: 15,    minStock: 3,    cost: 12000},
  { id: 'es-batu',      name: 'Es Batu',            unit: 'gram', stock: 8000,  minStock: 1500, cost: 2    },
  { id: 'gula',         name: 'Gula Pasir',         unit: 'gram', stock: 4000,  minStock: 500,  cost: 15   },
];

const SEED_MENU = [
  // Coffee
  { id: 'espresso',      name: 'Espresso',        category: 'Coffee',     prices: { public: 18000, online: 20000, member: 16000 }, recipe: [{ id: 'cup-hot-s',  qty: 1 }, { id: 'espresso', qty: 18 }] },
  { id: 'americano',     name: 'Americano',       category: 'Coffee',     prices: { public: 22000, online: 24000, member: 20000 }, recipe: [{ id: 'cup-hot-m',  qty: 1 }, { id: 'espresso', qty: 18 }] },
  { id: 'latte-hot',     name: 'Latte Hot',       category: 'Coffee',     prices: { public: 28000, online: 30000, member: 25000 }, recipe: [{ id: 'cup-hot-m',  qty: 1 }, { id: 'espresso', qty: 18 }, { id: 'milk', qty: 200 }] },
  { id: 'latte-ice',     name: 'Latte Ice',       category: 'Coffee',     prices: { public: 30000, online: 32000, member: 27000 }, recipe: [{ id: 'cup-cold-l', qty: 1 }, { id: 'espresso', qty: 18 }, { id: 'milk', qty: 200 }, { id: 'es-batu', qty: 150 }] },
  { id: 'cappuccino',    name: 'Cappuccino',      category: 'Coffee',     prices: { public: 28000, online: 30000, member: 25000 }, recipe: [{ id: 'cup-hot-m',  qty: 1 }, { id: 'espresso', qty: 18 }, { id: 'milk', qty: 150 }] },
  { id: 'caramel-latte', name: 'Caramel Latte',   category: 'Coffee',     prices: { public: 35000, online: 38000, member: 32000 }, recipe: [{ id: 'cup-cold-l', qty: 1 }, { id: 'espresso', qty: 18 }, { id: 'milk', qty: 200 }, { id: 'syrup-vanilla', qty: 30 }, { id: 'es-batu', qty: 150 }] },
  { id: 'cold-brew',     name: 'Cold Brew',       category: 'Coffee',     prices: { public: 32000, online: 35000, member: 29000 }, recipe: [{ id: 'cup-cold-l', qty: 1 }, { id: 'espresso', qty: 25 }, { id: 'es-batu', qty: 200 }] },
  { id: 'v60',           name: 'V60 Drip',        category: 'Coffee',     prices: { public: 30000, online: 33000, member: 27000 }, recipe: [{ id: 'cup-hot-m',  qty: 1 }, { id: 'espresso', qty: 20 }] },
  // Non-Coffee
  { id: 'matcha-latte',  name: 'Matcha Latte',    category: 'Non-Coffee', prices: { public: 32000, online: 35000, member: 29000 }, recipe: [{ id: 'cup-cold-l', qty: 1 }, { id: 'matcha', qty: 15 }, { id: 'milk', qty: 200 }, { id: 'es-batu', qty: 150 }, { id: 'gula', qty: 20 }] },
  { id: 'choco-latte',   name: 'Chocolate Latte', category: 'Non-Coffee', prices: { public: 30000, online: 33000, member: 27000 }, recipe: [{ id: 'cup-cold-l', qty: 1 }, { id: 'choco-powder', qty: 20 }, { id: 'milk', qty: 200 }, { id: 'es-batu', qty: 150 }, { id: 'gula', qty: 20 }] },
  { id: 'teh-tarik',     name: 'Teh Tarik',       category: 'Non-Coffee', prices: { public: 18000, online: 20000, member: 16000 }, recipe: [{ id: 'cup-hot-m',  qty: 1 }, { id: 'tea-bag', qty: 1 }, { id: 'milk', qty: 100 }, { id: 'gula', qty: 30 }] },
  { id: 'es-teh',        name: 'Es Teh Manis',    category: 'Non-Coffee', prices: { public: 12000, online: 14000, member: 10000 }, recipe: [{ id: 'cup-cold-m', qty: 1 }, { id: 'tea-bag', qty: 1 }, { id: 'gula', qty: 30 }, { id: 'es-batu', qty: 150 }] },
  // Food
  { id: 'croissant-item',name: 'Croissant',       category: 'Food',       prices: { public: 25000, online: 27000, member: 22000 }, recipe: [{ id: 'croissant', qty: 1 }] },
  { id: 'chicken-sand',  name: 'Chicken Sandwich',category: 'Food',       prices: { public: 38000, online: 40000, member: 35000 }, recipe: [{ id: 'sandwich', qty: 1 }] },
];

const SEED_USERS = [
  { username: 'admin',      name: 'Admin Pinggiran', role: 'admin',   password: 'admin123' },
  { username: 'awalluddin', name: 'Awalluddin',      role: 'cashier', password: 'kasir123' },
  { username: 'salma',      name: 'Salma',           role: 'cashier', password: 'kasir123' },
];

// ============================================================
// UTILITIES
// ============================================================
const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const calculateHPP = (cart, inventory) => {
  if (!cart?.length || !inventory?.length) return 0;
  return cart.reduce((total, item) => {
    const itemCost = (item.recipe || []).reduce((cost, ing) => {
      const inv = inventory.find(i => i.id === ing.id);
      return cost + (inv ? inv.cost * ing.qty : 0);
    }, 0);
    return total + itemCost * item.qty;
  }, 0);
};

const getDateRange = (filter) => {
  const now = new Date();
  if (filter === 'daily') {
    return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
  }
  if (filter === 'monthly') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  return { start: new Date(0), end: now };
};

const tsToDate = (ts) => ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
const fmtTime  = (ts) => { const d = tsToDate(ts); return d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'; };
const fmtDate  = (ts) => { const d = tsToDate(ts); return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; };

// ============================================================
// FIREBASE SEEDER
// ============================================================
let seedingDone = false;

const seedFirestore = async () => {
  if (seedingDone) return;
  seedingDone = true;
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'main'));
    if (settingsSnap.exists()) return;

    const batch = writeBatch(db);
    batch.set(doc(db, 'settings', 'main'), {
      shopName:     'Kedai Mantala',
      logoUrl:      '',
      qrisImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
      address:      'Jl. Kopi Mantap No. 1, Malang',
    });
    SEED_MENU.forEach(item => batch.set(doc(db, 'menu', item.id), item));
    SEED_INVENTORY.forEach(item => batch.set(doc(db, 'inventory', item.id), item));
    await batch.commit();
  } catch (e) {
    console.error('[Seed Firestore]', e);
  }
};

const createInitialUsers = async () => {
  for (const u of SEED_USERS) {
    const email = `${u.username}${DOMAIN}`;
    try {
      // Check Firestore first to avoid duplicate attempts
      const snap = await getDocs(query(collection(db, 'users')));
      const exists = snap.docs.some(d => d.data().username === u.username);
      if (exists) continue;

      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, u.password);
      await signOut(secondaryAuth);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, username: u.username, name: u.name, role: u.role, email,
      });
    } catch (e) {
      if (e.code !== 'auth/email-already-in-use') console.warn('[CreateUser]', u.username, e.message);
    }
  }
};

// ============================================================
// GLOBAL FONTS + STYLE
// ============================================================
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-display { font-family: 'Playfair Display', serif !important; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    .bg-slate-750 { background-color: #1a2537; }
    @media print {
      @page { size: 58mm auto; margin: 2mm; }
      body { background: white !important; }
    }
  `}</style>
);

// ============================================================
// LOADING SCREEN
// ============================================================
const LoadingScreen = ({ message = 'Memuat sistem...' }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-amber-400 font-semibold">{message}</p>
  </div>
);

// ============================================================
// LOGIN SCREEN
// ============================================================
const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, `${username.toLowerCase()}${DOMAIN}`, password);
    } catch {
      setError('Username atau password salah. Coba lagi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl shadow-2xl shadow-amber-500/40 mb-4">
            <Coffee size={38} className="text-slate-900" />
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Kedai Mantala</h1>
          <p className="text-slate-400 text-sm mt-1">Point of Sale System</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
          <h2 className="text-white font-semibold text-lg mb-1">Masuk ke Sistem</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1.5">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username" required autoComplete="username"
              className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password" required autoComplete="current-password"
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Memuat...</>
              : 'Masuk'}
          </button>
        </form>
        <p className="text-center text-slate-500 text-xs mt-5">Default: <span className="text-slate-400">admin</span> / <span className="text-slate-400">admin123</span></p>
      </div>
    </div>
  );
};

// ============================================================
// POS MODULE
// ============================================================
const PLATFORMS  = ['Public', 'Online', 'Member'];
const CATEGORIES = ['Semua', 'Coffee', 'Non-Coffee', 'Food'];

const POSModule = ({ currentUser, inventory, settings }) => {
  const [menuItems,    setMenuItems]    = useState([]);
  const [cart,         setCart]         = useState([]);
  const [category,     setCategory]     = useState('Semua');
  const [platform,     setPlatform]     = useState('Public');
  const [search,       setSearch]       = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt,  setShowReceipt]  = useState(false);
  const [lastOrder,    setLastOrder]    = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('category'));
    return onSnapshot(q, snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const filtered = useMemo(() => {
    let list = menuItems;
    if (category !== 'Semua') list = list.filter(i => i.category === category);
    if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [menuItems, category, search]);

  const priceKey = platform.toLowerCase();

  const addToCart = useCallback((item) => {
    const price = item.prices?.[priceKey] ?? item.prices?.public ?? 0;
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, price, qty: 1 }];
    });
  }, [priceKey]);

  const updateQty  = (id, d) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + d } : c).filter(c => c.qty > 0));
  const removeItem = (id)    => setCart(prev => prev.filter(c => c.id !== id));
  const clearCart  = ()      => setCart([]);

  const changePlatform = (p) => {
    const key = p.toLowerCase();
    setPlatform(p);
    setCart(prev => prev.map(c => {
      const m = menuItems.find(mi => mi.id === c.id);
      return { ...c, price: m?.prices?.[key] ?? c.price };
    }));
  };

  const subtotal   = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const hpp        = calculateHPP(cart, inventory);
  const cartCount  = cart.reduce((s, c) => s + c.qty, 0);

  const handleOrderComplete = (order) => {
    setLastOrder(order);
    setCart([]);
    setShowCheckout(false);
    setShowReceipt(true);
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* ── Left: Menu ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
          <input
            type="text" placeholder="🔍 Cari menu..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
          />
          <div className="flex gap-1.5">
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => changePlatform(p)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${platform === p ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${category === c ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto flex-1 content-start">
          {filtered.map(item => {
            const inCart   = cart.find(c => c.id === item.id);
            const price    = item.prices?.[priceKey] ?? item.prices?.public ?? 0;
            return (
              <button key={item.id} onClick={() => addToCart(item)}
                className={`relative bg-slate-800 border rounded-2xl p-3 text-left transition-all group hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 ${inCart ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700'}`}>
                {inCart && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-slate-900 text-xs font-bold">{inCart.qty}</span>
                  </div>
                )}
                <div className="bg-gradient-to-br from-amber-500/20 to-slate-700 rounded-xl h-14 flex items-center justify-center mb-2.5 group-hover:from-amber-500/30 transition-all">
                  <Coffee size={26} className="text-amber-400" />
                </div>
                <p className="text-white text-xs font-semibold leading-tight mb-1 line-clamp-2">{item.name}</p>
                <p className="text-amber-400 text-xs font-bold">{formatRp(price)}</p>
                <p className="text-slate-500 text-xs">{item.category}</p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500">
              <Coffee size={40} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada menu ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart (Desktop) ── */}
      <div className="hidden lg:flex flex-col w-80 bg-slate-800 rounded-2xl border border-slate-700 flex-shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ShoppingCart size={18} className="text-amber-400" /> Pesanan
              {cartCount > 0 && <span className="bg-amber-500 text-slate-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-slate-500 hover:text-red-400 text-xs transition-colors">Hapus Semua</button>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">Platform: <span className="text-amber-400 font-semibold">{platform}</span></p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0
            ? <div className="text-center py-12 text-slate-500"><ShoppingCart size={36} className="mx-auto mb-2 opacity-25" /><p className="text-sm">Keranjang kosong</p></div>
            : cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-slate-750 rounded-xl p-3 border border-slate-600">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold line-clamp-1">{item.name}</p>
                  <p className="text-amber-400 text-xs">{formatRp(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center justify-center text-white">
                    <Minus size={10} />
                  </button>
                  <span className="text-white text-xs font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center justify-center text-slate-900">
                    <Plus size={10} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 text-slate-500 hover:text-red-400 flex items-center justify-center ml-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div className="p-4 border-t border-slate-700 flex-shrink-0 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white font-bold">{formatRp(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Est. HPP</span>
            <span className="text-slate-500">{formatRp(hpp)}</span>
          </div>
          <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all mt-1 flex items-center justify-center gap-2">
            <Receipt size={16} /> Proses Pembayaran
          </button>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <button onClick={() => setShowCheckout(true)}
          className="lg:hidden fixed bottom-20 right-4 bg-emerald-600 text-white rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-900/50 flex items-center gap-2.5 z-40 font-bold">
          <ShoppingCart size={18} />
          <span>{cartCount} item</span>
          <span className="text-emerald-200">·</span>
          <span>{formatRp(subtotal)}</span>
        </button>
      )}

      {/* Modals */}
      {showCheckout && (
        <CheckoutModal
          cart={cart} subtotal={subtotal} hpp={hpp} platform={platform}
          currentUser={currentUser} settings={settings}
          onClose={() => setShowCheckout(false)} onComplete={handleOrderComplete}
        />
      )}
      {showReceipt && lastOrder && (
        <ReceiptModal order={lastOrder} settings={settings} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
};

// ============================================================
// CHECKOUT MODAL
// ============================================================
const CheckoutModal = ({ cart, subtotal, hpp, platform, currentUser, settings, onClose, onComplete }) => {
  const [payMethod,  setPayMethod]  = useState('Tunai');
  const [cashRaw,    setCashRaw]    = useState('');
  const [note,       setNote]       = useState('');
  const [processing, setProcessing] = useState(false);

  const cashNum  = parseInt(cashRaw.replace(/\D/g, '')) || 0;
  const change   = cashNum - subtotal;
  const canPay   = payMethod === 'QRIS' || cashNum >= subtotal;

  const QUICK_CASH = [50000, 100000, subtotal].filter((v, i, a) => a.indexOf(v) === i);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const orderData = {
        items:          cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price, recipe: c.recipe || [] })),
        subtotal,
        hpp,
        profit:         subtotal - hpp,
        paymentMethod:  payMethod,
        cashReceived:   payMethod === 'Tunai' ? cashNum : subtotal,
        change:         payMethod === 'Tunai' ? Math.max(0, change) : 0,
        platform,
        cashierName:    currentUser.name,
        cashierUid:     currentUser.uid,
        note,
        timestamp:      serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Deduct inventory stock
      const invSnap = await getDocs(collection(db, 'inventory'));
      const invMap  = {};
      invSnap.docs.forEach(d => { invMap[d.id] = { ref: d.ref, stock: d.data().stock }; });

      const batch = writeBatch(db);
      cart.forEach(item => {
        (item.recipe || []).forEach(ing => {
          if (invMap[ing.id] !== undefined) {
            const newStock = Math.max(0, invMap[ing.id].stock - ing.qty * item.qty);
            batch.update(invMap[ing.id].ref, { stock: newStock });
            invMap[ing.id].stock = newStock; // prevent double-deduct in same batch
          }
        });
      });
      await batch.commit();

      onComplete({ ...orderData, id: orderRef.id, timestamp: new Date() });
    } catch (e) {
      alert('Gagal memproses: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Pembayaran</h2>
          <button onClick={onClose} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Order Summary */}
          <div className="bg-slate-750 rounded-xl p-4 space-y-2 border border-slate-600">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-300">{item.name} <span className="text-slate-500 text-xs">×{item.qty}</span></span>
                <span className="text-white font-medium">{formatRp(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-slate-600">
              <span className="text-white font-bold">TOTAL</span>
              <span className="text-amber-400 font-bold text-xl">{formatRp(subtotal)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'Tunai', label: '💵 Tunai' }, { id: 'QRIS', label: '📱 QRIS' }].map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${payMethod === m.id ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25' : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* QRIS Display */}
          {payMethod === 'QRIS' && (
            <div className="bg-white rounded-2xl p-5 text-center shadow-inner">
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">Scan untuk membayar</p>
              <img
                src={settings?.qrisImageUrl || 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'}
                alt="QRIS Code" className="w-44 h-44 mx-auto object-contain"
              />
              <p className="text-amber-600 font-bold text-2xl mt-3">{formatRp(subtotal)}</p>
              <p className="text-slate-400 text-xs mt-1">{settings?.shopName || 'Kedai Mantala'}</p>
            </div>
          )}

          {/* Cash Input */}
          {payMethod === 'Tunai' && (
            <div className="space-y-3">
              <label className="text-slate-400 text-xs uppercase tracking-wider block">Uang Diterima</label>
              <input
                type="number" inputMode="numeric" value={cashRaw} onChange={e => setCashRaw(e.target.value)}
                placeholder="0" min="0"
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-lg font-bold text-right outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                {QUICK_CASH.map(v => (
                  <button key={v} onClick={() => setCashRaw(String(v))}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs py-2 rounded-lg transition-colors">
                    {v === subtotal ? '✓ Pas' : formatRp(v)}
                  </button>
                ))}
              </div>
              {cashNum > 0 && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${change >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                  {change >= 0 ? `Kembalian: ${formatRp(change)}` : `Kurang: ${formatRp(Math.abs(change))}`}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Contoh: no ice, less sugar..."
              className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-700 flex-shrink-0">
          <button onClick={handlePay} disabled={!canPay || processing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2">
            {processing
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memproses...</>
              : <><Check size={18} /> Konfirmasi Bayar {formatRp(subtotal)}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// RECEIPT MODAL
// ============================================================
const ReceiptModal = ({ order, settings, onClose }) => {
  const buildHTML = (type) => {
    const isCustomer = type === 'customer';
    const rows = order.items.map(item =>
      isCustomer
        ? `<tr><td style="padding:2px 0">${item.name}</td><td style="padding:2px 0;text-align:center">x${item.qty}</td><td style="padding:2px 0;text-align:right">${formatRp(item.price * item.qty)}</td></tr>`
        : `<tr><td colspan="3" style="padding:5px 0;font-size:20px;font-weight:700">${item.qty}× ${item.name}</td></tr>`
    ).join('');

    const ts  = order.timestamp instanceof Date ? order.timestamp : (order.timestamp?.toDate?.() || new Date());
    const dtStr = ts.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Struk</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:${isCustomer ? '11px' : '14px'};width:58mm;background:white;color:#000}
  .center{text-align:center}
  .dash{border-top:1px dashed #000;margin:6px 0}
  .bold{font-weight:700}
  table{width:100%;border-collapse:collapse}
  .total td{border-top:1px dashed #000;padding-top:4px;font-weight:700}
  .footer{text-align:center;font-size:10px;margin-top:8px}
  @media print{@page{size:58mm auto;margin:2mm} body{font-size:${isCustomer ? '11px' : '14px'}}}
</style></head><body>
<div class="center" style="padding:8px 0">
  ${settings?.logoUrl ? `<img src="${settings.logoUrl}" style="height:40px;margin-bottom:4px"><br>` : ''}
  <div class="bold" style="font-size:${isCustomer ? '14px' : '18px'}">${settings?.shopName || 'Kedai Mantala'}</div>
  ${isCustomer ? `<div style="font-size:10px">${settings?.address || ''}</div><div style="font-size:10px">${dtStr}</div>` : '<div style="font-size:13px;margin-top:4px">── TIKET BARISTA ──</div>'}
</div>
<div class="dash"></div>
${isCustomer ? `<div style="font-size:10px;margin-bottom:4px">Kasir: ${order.cashierName} | ${order.platform}</div>` : ''}
<table>${rows}</table>
${isCustomer ? `
<table>
  <tr class="total"><td>TOTAL</td><td></td><td style="text-align:right">${formatRp(order.subtotal)}</td></tr>
  <tr><td>Bayar (${order.paymentMethod})</td><td></td><td style="text-align:right">${formatRp(order.cashReceived)}</td></tr>
  ${order.change > 0 ? `<tr><td>Kembalian</td><td></td><td style="text-align:right">${formatRp(order.change)}</td></tr>` : ''}
</table>
<div class="footer"><div class="dash"></div><p>Terima kasih sudah berkunjung!</p><p>Silakan datang kembali :)</p></div>
` : `<div style="margin-top:8px;font-size:11px;border-top:1px dashed #000;padding-top:6px">Kasir: ${order.cashierName} | ${order.platform}${order.note ? `<br>Catatan: ${order.note}` : ''}</div>`}
</body></html>`;
  };

  const doPrint = (type) => {
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) return alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.');
    w.document.write(buildHTML(type));
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl overflow-hidden">
        {/* Success header */}
        <div className="bg-emerald-600 px-5 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={30} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-2xl">Pembayaran Berhasil!</h2>
          <p className="text-emerald-100 text-3xl font-bold mt-1">{formatRp(order.subtotal)}</p>
          {order.change > 0 && <p className="text-emerald-200 text-sm mt-1">Kembalian: {formatRp(order.change)}</p>}
          <p className="text-emerald-200 text-xs mt-1">{order.paymentMethod} · {order.platform}</p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-slate-400 text-xs text-center">Pilih jenis struk yang ingin dicetak:</p>
          <button onClick={() => doPrint('customer')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Receipt size={18} /> Struk Pelanggan (dengan harga)
          </button>
          <button onClick={() => doPrint('barista')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-slate-600 transition-colors">
            <Printer size={18} /> Tiket Barista (tanpa harga)
          </button>
          <button onClick={onClose}
            className="w-full bg-transparent hover:bg-slate-700 text-slate-400 py-3 rounded-xl border border-slate-700 transition-colors text-sm">
            Selesai — Lanjut Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const Dashboard = ({ currentUser }) => {
  const [orders,          setOrders]          = useState([]);
  const [expenses,        setExpenses]        = useState([]);
  const [filter,          setFilter]          = useState('daily');
  const [showExpForm,     setShowExpForm]     = useState(false);
  const [expForm,         setExpForm]         = useState({ description: '', amount: '', category: 'Operasional' });
  const [savingExp,       setSavingExp]       = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const { start, end } = getDateRange(filter);

  const filteredOrders = useMemo(() =>
    orders.filter(o => { const d = tsToDate(o.timestamp); return d && d >= start && d <= end; }),
    [orders, start, end]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => { const d = tsToDate(e.timestamp); return d && d >= start && d <= end; }),
    [expenses, start, end]);

  const revenue       = filteredOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const hpp           = filteredOrders.reduce((s, o) => s + (o.hpp || 0), 0);
  const totalExp      = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit   = revenue - hpp;
  const netProfit     = grossProfit - totalExp;

  // Product analysis
  const salesMap = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => (o.items || []).forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
      map[item.name].qty     += item.qty;
      map[item.name].revenue += item.price * item.qty;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const best  = salesMap.slice(0, 5);
  const worst = salesMap.length > 3 ? salesMap.slice(-3).reverse() : [];

  const addExpense = async () => {
    if (!expForm.description || !expForm.amount) return;
    setSavingExp(true);
    await addDoc(collection(db, 'expenses'), {
      description: expForm.description,
      amount:      parseInt(expForm.amount),
      category:    expForm.category,
      timestamp:   serverTimestamp(),
      addedBy:     currentUser.name,
    });
    setExpForm({ description: '', amount: '', category: 'Operasional' });
    setShowExpForm(false);
    setSavingExp(false);
  };

  const StatCard = ({ icon: Icon, label, value, sub, colorClass }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="text-white font-bold text-lg leading-tight">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-white text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-1.5">
          {[['daily','Hari Ini'],['monthly','Bulan Ini'],['all','Semua']].map(([f, l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400 hover:text-white border border-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}  label="Pendapatan"  value={formatRp(revenue)}     colorClass="bg-amber-500"  />
        <StatCard icon={TrendingDown} label="HPP (COGS)"  value={formatRp(hpp)}         colorClass="bg-slate-600"  />
        <StatCard icon={TrendingUp}  label="Laba Kotor"  value={formatRp(grossProfit)}  colorClass="bg-blue-600"   />
        <StatCard icon={Wallet}      label="Laba Bersih" value={formatRp(netProfit)}    sub={`Beban: ${formatRp(totalExp)}`} colorClass={netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Best sellers */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Produk Terlaris
          </h3>
          {best.length === 0
            ? <p className="text-slate-500 text-sm">Belum ada data transaksi</p>
            : <div className="space-y-3">
                {best.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : 'bg-slate-600 text-slate-300'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{item.name}</p>
                      <div className="bg-slate-700 rounded-full h-1.5 mt-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.round((item.qty / (best[0]?.qty || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-amber-400 text-sm font-bold flex-shrink-0">{item.qty}×</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Expenses */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Pengeluaran
            </h3>
            {currentUser.role === 'admin' && (
              <button onClick={() => setShowExpForm(!showExpForm)}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                {showExpForm ? 'Tutup' : '+ Tambah'}
              </button>
            )}
          </div>

          {showExpForm && (
            <div className="bg-slate-750 border border-slate-600 rounded-xl p-3 mb-4 space-y-2">
              <input type="text" placeholder="Keterangan pengeluaran" value={expForm.description}
                onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-slate-600 focus:border-amber-500" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Jumlah (Rp)" value={expForm.amount}
                  onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-slate-600 focus:border-amber-500" />
                <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-slate-600">
                  {['Operasional','Bahan Baku','Gaji','Utilitas','Lainnya'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addExpense} disabled={savingExp}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                {savingExp ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {filteredExpenses.length === 0
              ? <p className="text-slate-500 text-sm">Belum ada pengeluaran tercatat</p>
              : filteredExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm truncate">{e.description}</p>
                    <p className="text-slate-500 text-xs">{e.category} · {fmtDate(e.timestamp)}</p>
                  </div>
                  <span className="text-red-400 font-bold text-sm ml-3 flex-shrink-0">{formatRp(e.amount)}</span>
                </div>
              ))
            }
          </div>
          <div className="border-t border-slate-700 pt-3 mt-3 flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Total Pengeluaran</span>
            <span className="text-red-400 font-bold">{formatRp(totalExp)}</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Transaksi Terbaru <span className="text-slate-500 font-normal text-sm">({filteredOrders.length})</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                <th className="text-left pb-3 pr-3">Waktu</th>
                <th className="text-left pb-3 pr-3">Item</th>
                <th className="text-left pb-3 pr-3">Kasir</th>
                <th className="text-left pb-3 pr-3">Platform</th>
                <th className="text-left pb-3 pr-3">Bayar</th>
                <th className="text-right pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 15).map(o => {
                const d = tsToDate(o.timestamp);
                return (
                  <tr key={o.id} className="border-b border-slate-700/50 hover:bg-slate-750">
                    <td className="py-2.5 pr-3 text-slate-400 text-xs whitespace-nowrap">
                      {d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-400 text-xs">{(o.items || []).length} item</td>
                    <td className="py-2.5 pr-3 text-white text-sm">{o.cashierName}</td>
                    <td className="py-2.5 pr-3">
                      <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-md">{o.platform}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${o.paymentMethod === 'QRIS' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{o.paymentMethod}</span>
                    </td>
                    <td className="py-2.5 text-right text-amber-400 font-bold">{formatRp(o.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 size={36} className="mx-auto mb-2 opacity-30" />
              <p>Belum ada transaksi di periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INVENTORY MODULE
// ============================================================
const InventoryModule = ({ currentUser }) => {
  const [inventory, setInventory] = useState([]);
  const [editItem,  setEditItem]  = useState(null);   // item being edited
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ name: '', unit: 'pcs', stock: 0, minStock: 10, cost: 0 });
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    return onSnapshot(collection(db, 'inventory'), snap =>
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const filtered  = useMemo(() =>
    search ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : inventory,
    [inventory, search]);

  const lowStock = inventory.filter(i => i.stock <= i.minStock);

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, unit: item.unit, stock: item.stock, minStock: item.minStock, cost: item.cost });
    setShowAdd(true);
  };

  const resetForm = () => {
    setEditItem(null);
    setShowAdd(false);
    setForm({ name: '', unit: 'pcs', stock: 0, minStock: 10, cost: 0 });
  };

  const saveItem = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = { name: form.name, unit: form.unit, stock: +form.stock, minStock: +form.minStock, cost: +form.cost };
    if (editItem) {
      await updateDoc(doc(db, 'inventory', editItem.id), data);
    } else {
      await addDoc(collection(db, 'inventory'), data);
    }
    setSaving(false);
    resetForm();
  };

  const nudgeStock = async (id, delta) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    await updateDoc(doc(db, 'inventory', id), { stock: Math.max(0, item.stock + delta) });
  };

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-white text-2xl font-bold">Inventori</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Cari bahan..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-40" />
          {currentUser.role === 'admin' && (
            <button onClick={() => { resetForm(); setShowAdd(true); }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors">
              <Plus size={16} /> Tambah
            </button>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <h3 className="text-red-400 font-semibold text-sm flex items-center gap-2 mb-2">
            <AlertTriangle size={16} /> Peringatan Stok Rendah ({lowStock.length} bahan)
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full border border-red-500/30">
                {i.name}: <strong>{i.stock}</strong> {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showAdd && (
        <div className="bg-slate-800 border border-amber-500/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">{editItem ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs block mb-1">Nama Bahan</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama bahan baku"
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Satuan</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
                {['pcs','gram','ml','kg','liter'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Biaya / Satuan (Rp)</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Stok Saat Ini</label>
              <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Stok Minimum (Alert)</label>
              <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveItem} disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={resetForm} className="px-5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl border border-slate-600 text-sm transition-colors">Batal</button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-750 text-slate-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Bahan</th>
              <th className="text-center px-4 py-3">Stok</th>
              <th className="text-center px-4 py-3 hidden sm:table-cell">Min</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Biaya</th>
              {currentUser.role === 'admin' && <th className="px-4 py-3 text-center">Edit</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isLow = item.stock <= item.minStock;
              return (
                <tr key={item.id} className={`border-t border-slate-700 ${isLow ? 'bg-red-500/5' : 'hover:bg-slate-750'} transition-colors`}>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm">{item.name}</p>
                    <p className="text-slate-500 text-xs">{item.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {currentUser.role === 'admin' && (
                        <button onClick={() => nudgeStock(item.id, -1)} className="w-6 h-6 bg-slate-700 hover:bg-red-500/20 rounded-md flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                          <Minus size={10} />
                        </button>
                      )}
                      <div className="text-center">
                        <span className={`font-bold text-sm ${isLow ? 'text-red-400' : 'text-white'}`}>{item.stock}</span>
                        {isLow && <span className="block text-red-400 text-xs">⚠ Rendah</span>}
                      </div>
                      {currentUser.role === 'admin' && (
                        <button onClick={() => nudgeStock(item.id, 1)} className="w-6 h-6 bg-slate-700 hover:bg-emerald-500/20 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors">
                          <Plus size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-sm hidden sm:table-cell">{item.minStock}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-sm hidden md:table-cell">{formatRp(item.cost)}/{item.unit}</td>
                  {currentUser.role === 'admin' && (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(item)} className="text-amber-400 hover:text-amber-300 transition-colors">
                        <Edit size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p>Tidak ada bahan ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ATTENDANCE MODULE
// ============================================================
const AttendanceModule = ({ currentUser }) => {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('clockIn', 'desc'));
    return onSnapshot(q, snap => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const myToday     = records.find(r => r.uid === currentUser.uid && r.date === today);
  const todayAll    = records.filter(r => r.date === today);

  const clockIn = async () => {
    setLoading(true);
    await addDoc(collection(db, 'attendance'), {
      uid:      currentUser.uid,
      name:     currentUser.name,
      role:     currentUser.role,
      date:     today,
      clockIn:  serverTimestamp(),
      clockOut: null,
    });
    setLoading(false);
  };

  const clockOut = async () => {
    if (!myToday) return;
    setLoading(true);
    await updateDoc(doc(db, 'attendance', myToday.id), { clockOut: serverTimestamp() });
    setLoading(false);
  };

  const myRecords   = currentUser.role === 'admin' ? records : records.filter(r => r.uid === currentUser.uid);

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      <h2 className="font-display text-white text-2xl font-bold">Absensi Karyawan</h2>

      {/* My attendance card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <UserCircle size={30} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{currentUser.name}</p>
            <p className="text-slate-400 text-sm capitalize">{currentUser.role}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-750 border border-slate-600 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Clock In</p>
            <p className="text-white font-bold text-2xl">{myToday?.clockIn ? fmtTime(myToday.clockIn) : '--:--'}</p>
          </div>
          <div className="bg-slate-750 border border-slate-600 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Clock Out</p>
            <p className="text-white font-bold text-2xl">{myToday?.clockOut ? fmtTime(myToday.clockOut) : '--:--'}</p>
          </div>
        </div>

        {!myToday ? (
          <button onClick={clockIn} disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-3">
            <Clock size={22} /> {loading ? 'Mencatat...' : 'Clock In Sekarang'}
          </button>
        ) : !myToday.clockOut ? (
          <button onClick={clockOut} disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-3">
            <LogOut size={22} /> {loading ? 'Mencatat...' : 'Clock Out Sekarang'}
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-5 text-center">
            <Check size={24} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Absensi hari ini sudah selesai</p>
            <p className="text-slate-400 text-sm mt-1">{fmtTime(myToday.clockIn)} – {fmtTime(myToday.clockOut)}</p>
          </div>
        )}
      </div>

      {/* All today (admin) */}
      {currentUser.role === 'admin' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">
            Absensi Hari Ini <span className="text-slate-500 font-normal text-sm">({todayAll.length} karyawan)</span>
          </h3>
          {todayAll.length === 0
            ? <p className="text-slate-500 text-sm">Belum ada yang melakukan absensi hari ini</p>
            : <div className="space-y-2.5">
                {todayAll.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-750 border border-slate-600 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <UserCircle size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{r.name}</p>
                        <p className="text-slate-500 text-xs capitalize">{r.role}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-emerald-400 font-semibold">In: {fmtTime(r.clockIn)}</p>
                      <p className={r.clockOut ? 'text-red-400 font-semibold' : 'text-slate-500'}>
                        Out: {fmtTime(r.clockOut)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* History */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Riwayat Absensi</h3>
        <div className="divide-y divide-slate-700">
          {myRecords.slice(0, 20).map(r => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                {currentUser.role === 'admin' && <p className="text-white text-sm font-medium">{r.name}</p>}
                <p className="text-slate-400 text-sm">{r.date}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-emerald-400">In: {fmtTime(r.clockIn)}</p>
                <p className={r.clockOut ? 'text-red-400' : 'text-slate-500'}>Out: {fmtTime(r.clockOut)}</p>
              </div>
            </div>
          ))}
          {myRecords.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">Belum ada riwayat absensi</p>}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS MODULE (Admin only)
// ============================================================
const SettingsModule = ({ currentUser }) => {
  const [settings,    setSettings]    = useState({});
  const [users,       setUsers]       = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser,     setNewUser]     = useState({ username: '', name: '', role: 'cashier', password: '' });
  const [saving,      setSaving]      = useState(false);
  const [savingUser,  setSavingUser]  = useState(false);
  const [msg,         setMsg]         = useState({ text: '', type: 'ok' });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'main'), snap => { if (snap.exists()) setSettings(snap.data()); });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => d.data())));
  }, []);

  const flash = (text, type = 'ok') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'ok' }), 4000); };

  const saveSettings = async () => {
    setSaving(true);
    await setDoc(doc(db, 'settings', 'main'), settings, { merge: true });
    setSaving(false);
    flash('Pengaturan berhasil disimpan!');
  };

  const createEmployee = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    setSavingUser(true);
    const email = `${newUser.username.toLowerCase()}${DOMAIN}`;
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
      await signOut(secondaryAuth);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, username: newUser.username.toLowerCase(),
        name: newUser.name, role: newUser.role, email,
      });
      setNewUser({ username: '', name: '', role: 'cashier', password: '' });
      setShowAddUser(false);
      flash(`Akun ${newUser.name} berhasil dibuat!`);
    } catch (e) {
      flash(e.code === 'auth/email-already-in-use' ? 'Username sudah digunakan' : 'Error: ' + e.message, 'err');
    } finally {
      setSavingUser(false);
    }
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
        <Shield size={48} className="text-slate-600" />
        <p className="text-slate-400 text-lg">Akses Ditolak</p>
        <p className="text-slate-500 text-sm">Hanya Admin yang dapat mengakses halaman ini</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      <h2 className="font-display text-white text-2xl font-bold">Pengaturan</h2>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${msg.type === 'err' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
          {msg.type === 'ok' ? '✓ ' : '✗ '}{msg.text}
        </div>
      )}

      {/* Shop Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Informasi Toko</h3>
        <div className="space-y-4">
          {[
            { label: 'Nama Toko',       key: 'shopName',     placeholder: 'Kedai Mantala' },
            { label: 'Alamat',          key: 'address',      placeholder: 'Jl. ...' },
            { label: 'URL Logo Toko',   key: 'logoUrl',      placeholder: 'https://...' },
            { label: 'URL Gambar QRIS', key: 'qrisImageUrl', placeholder: 'https://...' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-slate-400 text-xs block mb-1.5">{label}</label>
              <input
                value={settings[key] || ''} placeholder={placeholder}
                onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
          ))}
          {settings.qrisImageUrl && (
            <div className="bg-white rounded-xl p-3 w-28 h-28 flex items-center justify-center">
              <img src={settings.qrisImageUrl} alt="QRIS Preview" className="w-24 h-24 object-contain" />
            </div>
          )}
          <button onClick={saveSettings} disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 transition-colors">
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      {/* Employee Management */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Users size={16} className="text-amber-400" /> Manajemen Karyawan
            <span className="text-slate-500 font-normal text-sm">({users.length})</span>
          </h3>
          <button onClick={() => setShowAddUser(!showAddUser)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Tambah Karyawan
          </button>
        </div>

        {showAddUser && (
          <div className="bg-slate-750 border border-amber-500/30 rounded-xl p-4 mb-4 space-y-3">
            <h4 className="text-white text-sm font-semibold">Buat Akun Karyawan Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                placeholder="Username (untuk login)"
                className="bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-600 focus:border-amber-500 col-span-1 sm:col-span-1" />
              <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama Lengkap"
                className="bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-600 focus:border-amber-500" />
              <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                className="bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-600">
                <option value="cashier">Kasir</option>
                <option value="admin">Admin</option>
              </select>
              <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                placeholder="Password"
                className="bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-600 focus:border-amber-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={createEmployee} disabled={savingUser}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                {savingUser ? 'Membuat akun...' : 'Buat Akun'}
              </button>
              <button onClick={() => setShowAddUser(false)} className="px-5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl border border-slate-600 text-sm transition-colors">Batal</button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {users.map(u => (
            <div key={u.uid || u.username} className="flex items-center justify-between bg-slate-750 border border-slate-600 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCircle size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{u.name}</p>
                  <p className="text-slate-400 text-xs">@{u.username}</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {u.role === 'admin' ? 'Admin' : 'Kasir'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP SHELL
// ============================================================
const NAV = [
  { id: 'pos',        label: 'Kasir',      icon: ShoppingCart, adminOnly: false },
  { id: 'dashboard',  label: 'Dashboard',  icon: BarChart3,    adminOnly: false },
  { id: 'inventory',  label: 'Inventori',  icon: Package,      adminOnly: false },
  { id: 'attendance', label: 'Absensi',    icon: Clock,        adminOnly: false },
  { id: 'settings',   label: 'Pengaturan', icon: Settings,     adminOnly: true  },
];

export default function App() {
  const [authUser,    setAuthUser]    = useState(undefined); // undefined = loading
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory,   setInventory]   = useState([]);
  const [settings,    setSettings]    = useState(null);
  const [page,        setPage]        = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seeded,      setSeeded]      = useState(false);

  // One-time seed
  useEffect(() => {
    (async () => {
      await seedFirestore();
      await createInitialUsers();
      setSeeded(true);
    })();
  }, []);

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setAuthUser(u);
        const snap = await getDoc(doc(db, 'users', u.uid));
        setCurrentUser(snap.exists() ? snap.data() : null);
      } else {
        setAuthUser(null);
        setCurrentUser(null);
      }
    });
  }, []);

  // Global real-time data
  useEffect(() => {
    return onSnapshot(collection(db, 'inventory'), snap =>
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'main'), snap => {
      if (snap.exists()) setSettings(snap.data());
    });
  }, []);

  const lowCount = inventory.filter(i => i.stock <= i.minStock).length;
  const visibleNav = NAV.filter(n => !n.adminOnly || currentUser?.role === 'admin');

  // Loading
  if (authUser === undefined || !seeded) return <><GlobalStyle /><LoadingScreen /></>;
  // Login
  if (!authUser || !currentUser)        return <><GlobalStyle /><LoginScreen /></>;

  return (
    <>
      <GlobalStyle />
      <div className="flex h-screen bg-slate-900 overflow-hidden">

        {/* Sidebar backdrop (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-slate-950 border-r border-slate-800
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0 overflow-hidden">
              {settings?.logoUrl
                ? <img src={settings.logoUrl} alt="logo" className="w-10 h-10 object-cover" />
                : <Coffee size={22} className="text-slate-900" />
              }
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-white font-bold text-base leading-tight truncate">
                {settings?.shopName || 'Kedai Mantala'}
              </h1>
              <p className="text-slate-500 text-xs">POS System v2.0</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNav.map(({ id, label, icon: Icon }) => {
              const active = page === id;
              return (
                <button key={id} onClick={() => { setPage(id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}>
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  {id === 'inventory' && lowCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-slate-900/30 text-slate-900' : 'bg-red-500 text-white'}`}>
                      {lowCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User / logout */}
          <div className="px-4 py-4 border-t border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCircle size={20} className="text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
                <p className="text-slate-500 text-xs capitalize">{currentUser.role}</p>
              </div>
            </div>
            <button onClick={() => signOut(auth)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors p-1">
              <Menu size={22} />
            </button>
            <h1 className="font-display text-white font-bold text-base">
              {settings?.shopName || 'Kedai Mantala'}
            </h1>
            <div className="flex items-center gap-2">
              {lowCount > 0 && (
                <button onClick={() => setPage('inventory')} className="relative p-1">
                  <Bell size={20} className="text-slate-400" />
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {lowCount}
                  </span>
                </button>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-hidden p-4 lg:p-6">
            {page === 'pos'        && <POSModule       currentUser={currentUser} inventory={inventory} settings={settings} />}
            {page === 'dashboard'  && <Dashboard       currentUser={currentUser} />}
            {page === 'inventory'  && <InventoryModule currentUser={currentUser} />}
            {page === 'attendance' && <AttendanceModule currentUser={currentUser} />}
            {page === 'settings'   && <SettingsModule  currentUser={currentUser} />}
          </main>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden bg-slate-950 border-t border-slate-800 flex items-stretch flex-shrink-0 safe-bottom">
            {visibleNav.map(({ id, label, icon: Icon }) => {
              const active = page === id;
              return (
                <button key={id} onClick={() => setPage(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
                  <div className="relative">
                    <Icon size={20} />
                    {id === 'inventory' && lowCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
