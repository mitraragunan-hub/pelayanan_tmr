import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  Users, UserPlus, GraduationCap, BookOpen, Globe, 
  ClipboardList, PlusCircle, Save, CheckCircle, Zap,
  BarChart2, Activity, Filter, Calendar, Cloud, Edit2, Trash2, AlertTriangle, 
  Lock, Mail, LogOut, FileText, Printer
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAQ4J0orZMgNYz1jPi-2-Io4_0hTXgnvBs",
  authDomain: "datalayanangratis.firebaseapp.com",
  projectId: "datalayanangratis",
  storageBucket: "datalayanangratis.firebasestorage.app",
  messagingSenderId: "269081913775",
  appId: "1:269081913775:web:f8b3c5ab0a6661bb94e75a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  // --- STATE OTENTIKASI ---
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- STATE APLIKASI UTAMA ---
  const [activeMenu, setActiveMenu] = useState('dashboard'); 
  const [selectedService, setSelectedService] = useState('lansia');
  const [reportFilter, setReportFilter] = useState('all');
  
  // --- STATE CETAK LAPORAN ---
  const [printService, setPrintService] = useState('lansia');
  const [printMonth, setPrintMonth] = useState('04');
  const [printYear, setPrintYear] = useState('2026');
  
  const [records, setRecords] = useState([]);
  const [masterDataLansia, setMasterDataLansia] = useState({});
  const [masterDataKJP, setMasterDataKJP] = useState({});
  
  const [toastMsg, setToastMsg] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [formData, setFormData] = useState({
    tglKunjungan: new Date().toISOString().split('T')[0],
    nik: '', nama: '', tempatLahir: '', tglLahir: '', alamat: '',
    jenisDisabilitas: 'Pribadi', namaInstansi: '', noSurat: '',
    nisn: '', namaSekolah: '', jenjang: 'SD',
    jumlahMurid: '', diskonRombongan: 'Tidak',
    asalNegara: '', kategoriUmur: 'Dewasa', jumlahWisman: '1'
  });

  // --- EFEK: CEK LOGIN & UBAH JUDUL TAB ---
  useEffect(() => {
    document.title = "pelayanan-tmr";
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNGSI LOGIN / LOGOUT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      setAuthError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRecords([]); setMasterDataLansia({}); setMasterDataKJP({});
    } catch (error) { console.error('Logout error:', error); }
  };

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const resetForm = () => {
    setFormData({
      tglKunjungan: new Date().toISOString().split('T')[0],
      nik: '', nama: '', tempatLahir: '', tglLahir: '', alamat: '',
      jenisDisabilitas: 'Pribadi', namaInstansi: '', noSurat: '',
      nisn: '', namaSekolah: '', jenjang: 'SD',
      jumlahMurid: '', diskonRombongan: 'Tidak',
      asalNegara: '', kategoriUmur: 'Dewasa', jumlahWisman: '1'
    });
    setEditId(null); setIsAutoFilled(false);
  };

  // --- AMBIL DATA DARI FIREBASE ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'kunjungan'), orderBy('tglKunjungan', 'desc'));
    const unsubKunjungan = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    });
    const unsubLansia = onSnapshot(collection(db, 'master_lansia'), (snap) => {
      const data = {}; snap.forEach(doc => { data[doc.id] = doc.data(); });
      setMasterDataLansia(data);
    });
    const unsubKJP = onSnapshot(collection(db, 'master_kjp'), (snap) => {
      const data = {}; snap.forEach(doc => { data[doc.id] = doc.data(); });
      setMasterDataKJP(data);
    });
    return () => { unsubKunjungan(); unsubLansia(); unsubKJP(); };
  }, [user]);

  // --- FUNGSI AUTOFILL ---
  const handleAutoFillCheck = (type, value) => {
    if (editId) return; 
    if (type === 'lansia' && value && masterDataLansia[value]) {
      const data = masterDataLansia[value];
      setFormData(prev => ({ ...prev, nama: data.nama, tempatLahir: data.tempatLahir, tglLahir: data.tglLahir, alamat: data.alamat }));
      setIsAutoFilled(true);
    } else if (type === 'kjp' && value && masterDataKJP[value]) {
      const data = masterDataKJP[value];
      setFormData(prev => ({ ...prev, nama: data.nama, namaSekolah: data.namaSekolah, jenjang: data.jenjang }));
      setIsAutoFilled(true);
    } else {
      setIsAutoFilled(false);
    }
  };

  const handleKeyDown = (e, type, value) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAutoFillCheck(type, value); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isAutoFilled && !['nik', 'nisn', 'tglKunjungan'].includes(name)) setIsAutoFilled(false);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getKategoriKJP = (jenjang) => {
    if (['TK/KB', 'SD'].includes(jenjang)) return 'Anak';
    return 'Dewasa';
  };

  // --- FUNGSI CRUD ---
  const handleEditAction = (record) => {
    const details = record.details || {};
    let newFormData = { ...formData, tglKunjungan: record.tglKunjungan || new Date().toISOString().split('T')[0] };
    if (record.layanan === 'lansia') {
        const ttl = details.TTL ? details.TTL.split(', ') : ['', ''];
        newFormData = { ...newFormData, nik: details.NIK || '', nama: details.Nama || '', tempatLahir: ttl[0] || '', tglLahir: ttl[1] || '', alamat: details.Alamat || '' };
    } else if (record.layanan === 'disabilitas') {
        newFormData = { ...newFormData, jenisDisabilitas: details.Jenis || 'Pribadi', namaInstansi: details['Nama/Instansi'] || '', noSurat: details['No Surat'] || '', alamat: details.Alamat || '' };
    } else if (record.layanan === 'kjp') {
        newFormData = { ...newFormData, nisn: details.NISN || '', nama: details.Nama || '', namaSekolah: details['Asal Sekolah/PT'] || '', jenjang: details.Jenjang || 'SD' };
    } else if (record.layanan === 'rombongan') {
         newFormData = { ...newFormData, namaSekolah: details['Nama Sekolah'] || '', jenjang: details.Jenjang || 'SD', jumlahMurid: details['Jumlah Murid'] || '', diskonRombongan: details['Potongan Harga'] || 'Tidak' };
    } else if (record.layanan === 'wisman') {
         newFormData = { ...newFormData, asalNegara: details['Asal Negara'] || '', kategoriUmur: details.Kategori || 'Dewasa', jumlahWisman: details['Jumlah Pengunjung'] || '1' };
    }
    setFormData(newFormData); setSelectedService(record.layanan); setEditId(record.id); setIsAutoFilled(false); setActiveMenu('form');
  };

  const executeDelete = async () => {
    if (!recordToDelete) return;
    try { await deleteDoc(doc(db, 'kunjungan', recordToDelete)); showNotification('Data berhasil dihapus dari sistem!'); } 
    catch (error) { console.error(error); } finally { setRecordToDelete(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); 
    let newRecord = {
      layanan: selectedService, tglKunjungan: formData.tglKunjungan,
      timestamp: editId ? records.find(r => r.id === editId)?.timestamp || new Date().toISOString() : new Date().toISOString(), 
      timestampTampil: new Date().toLocaleString('id-ID') + (editId ? ' (Diedit)' : ''),
      details: {}, headCount: 1 
    };

    try {
        switch (selectedService) {
        case 'lansia':
            newRecord.details = { NIK: formData.nik, Nama: formData.nama, TTL: `${formData.tempatLahir}, ${formData.tglLahir}`, Alamat: formData.alamat };
            await setDoc(doc(db, 'master_lansia', formData.nik), { nama: formData.nama, tempatLahir: formData.tempatLahir, tglLahir: formData.tglLahir, alamat: formData.alamat }); break;
        case 'disabilitas':
            newRecord.details = { Jenis: formData.jenisDisabilitas, 'Nama/Instansi': formData.namaInstansi, ...(formData.jenisDisabilitas === 'Rombongan' && { 'No Surat': formData.noSurat }), Alamat: formData.alamat }; break;
        case 'kjp':
            newRecord.details = { NISN: formData.nisn, Nama: formData.nama, 'Asal Sekolah/PT': formData.namaSekolah, Jenjang: formData.jenjang, Kategori: getKategoriKJP(formData.jenjang) };
            await setDoc(doc(db, 'master_kjp', formData.nisn), { nama: formData.nama, namaSekolah: formData.namaSekolah, jenjang: formData.jenjang }); break;
        case 'rombongan':
            newRecord.details = { 'Nama Sekolah': formData.namaSekolah, 'Jenjang': formData.jenjang, 'Jumlah Murid': formData.jumlahMurid, 'Potongan Harga': formData.diskonRombongan };
            newRecord.headCount = parseInt(formData.jumlahMurid) || 1; break;
        case 'wisman':
            newRecord.details = { 'Asal Negara': formData.asalNegara, Kategori: formData.kategoriUmur, 'Jumlah Pengunjung': formData.jumlahWisman };
            newRecord.headCount = parseInt(formData.jumlahWisman) || 1; break;
        }

        if (editId) { await updateDoc(doc(db, 'kunjungan', editId), newRecord); showNotification('Data berhasil diperbarui!'); } 
        else { await addDoc(collection(db, 'kunjungan'), newRecord); showNotification('Data berhasil disimpan ke Firebase!'); }
        resetForm();
    } catch (error) { alert("Gagal memproses data! Periksa koneksi internet Anda."); } finally { setIsLoading(false); }
  };

  const ServiceButton = ({ id, label, icon: Icon }) => (
    <button type="button" onClick={() => { setSelectedService(id); setIsAutoFilled(false); setEditId(null); }}
      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 w-full md:w-auto ${selectedService === id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'} ${editId && selectedService !== id ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={editId && selectedService !== id}
    >
      <Icon size={20} className={selectedService === id ? 'text-white' : 'text-blue-500'} /><span className="font-medium text-sm md:text-base">{label}</span>
    </button>
  );

  // --- NAMA BULAN UNTUK HEADER LAPORAN ---
  const getBulanName = (monthNum) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[parseInt(monthNum) - 1];
  };

  // --- TAMPILAN LOADING ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-blue-600 flex flex-col items-center"><Cloud className="animate-bounce mb-2" size={32} /><p className="font-medium text-slate-500">Memeriksa Akses...</p></div>
      </div>
    );
  }

  // --- TAMPILAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-blue-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><Lock className="text-white" size={32} /></div>
            <h2 className="text-2xl font-bold text-white">Layanan Terpadu</h2>
            <p className="text-blue-100 text-sm mt-2">Portal Pendataan Pengunjung TMR</p>
          </div>
          <div className="p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">Login Petugas</h3>
            {authError && (<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center border border-red-100"><AlertTriangle size={16} className="mr-2 flex-shrink-0" /> {authError}</div>)}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Akses</label>
                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-slate-400" /></div><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="admin@layanan.com" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-slate-400" /></div><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" /></div>
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-70 mt-4 flex items-center justify-center shadow-md shadow-blue-200">
                {isLoggingIn ? 'Memproses...' : 'Masuk ke Sistem'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- DATA UNTUK LAPORAN CETAK ---
  const targetYearMonth = `${printYear}-${printMonth}`;
  const filteredPrintRecords = records.filter(r => r.layanan === printService && r.tglKunjungan && r.tglKunjungan.startsWith(targetYearMonth));

  // --- TAMPILAN UTAMA APLIKASI ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Modal Hapus */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 transition-opacity print:hidden">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-600 mb-4"><div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={24} /></div><h3 className="text-lg font-bold">Hapus Data?</h3></div>
            <p className="text-slate-600 mb-6 text-sm">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setRecordToDelete(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Batal</button>
              <button onClick={executeDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar (Sembunyikan saat di-print) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg"><ClipboardList className="h-6 w-6 text-white" /></div>
              <span className="text-xl font-bold text-slate-800 hidden lg:block">Layanan<span className="text-blue-600">Terpadu</span></span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
              <button onClick={() => setActiveMenu('dashboard')} className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors ${activeMenu === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}><BarChart2 size={18} /> <span className="hidden md:inline">Dashboard</span></button>
              <button onClick={() => {setActiveMenu('form'); if(!editId) resetForm();}} className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors ${activeMenu === 'form' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}><PlusCircle size={18} /> <span className="hidden md:inline">Input</span></button>
              <button onClick={() => setActiveMenu('data')} className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors ${activeMenu === 'data' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}><Cloud size={18} /> <span className="hidden md:inline">Live</span></button>
              <button onClick={() => setActiveMenu('print')} className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors ${activeMenu === 'print' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}><Printer size={18} /> <span className="hidden md:inline">Cetak</span></button>
              <div className="h-6 border-l border-slate-300 mx-1"></div>
              <button onClick={handleLogout} className="flex items-center space-x-1 px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium"><LogOut size={18} /> <span className="hidden md:inline">Keluar</span></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        {toastMsg && (<div className="fixed top-20 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-bounce print:hidden"><CheckCircle className="text-emerald-500" size={20} /><span className="font-medium">{toastMsg}</span></div>)}

        {/* --- MENU DASHBOARD --- */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300 print:hidden">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center"><Activity size={18} className="mr-2 text-blue-600"/> Data Input Live (Monitoring Dashboard)</h3>
                  <div className="flex items-center space-x-2"><Filter size={16} className="text-slate-400" /><select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} className="bg-white border border-slate-300 text-sm rounded-lg p-2 outline-none"><option value="all">Semua Kategori</option><option value="lansia">Lansia</option><option value="disabilitas">SLB / Disabilitas</option><option value="kjp">KJP</option><option value="rombongan">Rombongan Sekolah</option><option value="wisman">Wisatawan Asing</option></select></div>
                </div>
                <div className="p-0 overflow-x-auto">
                    {records.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Belum ada input data baru.</div>
                    ) : (
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">Kategori</th><th className="px-6 py-3">Detail Layanan</th><th className="px-6 py-3 text-center">Jml Pengunjung</th></tr>
                            </thead>
                            <tbody>
                                {records.filter(r => reportFilter === 'all' || r.layanan === reportFilter).slice(0, 10).map(record => (
                                    <tr key={record.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{record.tglKunjungan || '-'}</td>
                                        <td className="px-6 py-4 uppercase font-medium text-slate-700"><span className={`px-2 py-1 rounded-md text-xs font-bold ${record.layanan === 'lansia' ? 'bg-purple-100 text-purple-700' : record.layanan === 'disabilitas' ? 'bg-red-100 text-red-700' : record.layanan === 'kjp' ? 'bg-yellow-100 text-yellow-700' : record.layanan === 'rombongan' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{record.layanan}</span></td>
                                        <td className="px-6 py-4 text-slate-800">
                                            {record.layanan === 'lansia' && record.details && `${record.details.Nama} (NIK: ${record.details.NIK})`}
                                            {record.layanan === 'disabilitas' && record.details && `${record.details['Nama/Instansi']} (${record.details.Jenis})`}
                                            {record.layanan === 'kjp' && record.details && `${record.details.Nama} - ${record.details['Asal Sekolah/PT']}`}
                                            {record.layanan === 'rombongan' && record.details && `${record.details['Nama Sekolah']} (${record.details.Jenjang})`}
                                            {record.layanan === 'wisman' && record.details && `${record.details['Asal Negara']} (${record.details.Kategori})`}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-800">{record.headCount || 1}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
          </div>
        )}

        {/* --- MENU INPUT FORM --- */}
        {activeMenu === 'form' && (
          <div className="space-y-6 animate-in fade-in duration-300 print:hidden">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 px-2">Kategori Layanan</h2>
              {editId && <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><Edit2 size={12} className="mr-1"/> MODE EDIT AKTIF</div>}
              <div className="grid grid-cols-2 md:flex md:flex-row gap-3">
                <ServiceButton id="lansia" label="Lansia (KTP)" icon={UserPlus} />
                <ServiceButton id="disabilitas" label="SLB / Disabilitas" icon={Users} />
                <ServiceButton id="kjp" label="KJP" icon={GraduationCap} />
                <ServiceButton id="rombongan" label="Rombongan" icon={BookOpen} />
                <ServiceButton id="wisman" label="Wisatawan Asing" icon={Globe} />
              </div>
            </div>

            <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${editId ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'}`}>
              <div className={`px-6 py-4 border-b flex justify-between items-center ${editId ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-lg font-semibold text-slate-800 capitalize flex items-center">
                  {editId ? <><Edit2 size={18} className="mr-2 text-amber-600"/> Edit Data - </> : 'Form - '} {selectedService.replace('-', ' ')}
                </h3>
                {isAutoFilled && !editId && (<span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md"><Zap size={14} className="mr-1" />Terisi Otomatis</span>)}
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kunjungan</label>
                  <input type="date" name="tglKunjungan" required value={formData.tglKunjungan} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none ${editId ? 'border-amber-200 bg-amber-50/30' : 'border-slate-300'}`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  {selectedService === 'lansia' && (<>
                    {!editId && <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2"><p className="text-sm text-blue-800">Ketik NIK lalu tekan Tab/Enter. Data lama akan terisi otomatis.</p></div>}
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">NIK KTP</label><input type="number" name="nik" required value={formData.nik} onChange={handleInputChange} onBlur={() => handleAutoFillCheck('lansia', formData.nik)} onKeyDown={(e) => handleKeyDown(e, 'lansia', formData.nik)} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'}`} placeholder="Ketik NIK..." /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label><input type="text" name="nama" required value={formData.nama} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label><input type="text" name="tempatLahir" required value={formData.tempatLahir} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tgl Lahir</label><input type="date" name="tglLahir" required value={formData.tglLahir} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><textarea name="alamat" required value={formData.alamat} onChange={handleInputChange} rows="2" className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`}></textarea></div>
                  </>)}

                  {selectedService === 'disabilitas' && (<>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-2">Jenis</label><div className="flex space-x-4"><label className="flex items-center cursor-pointer"><input type="radio" name="jenisDisabilitas" value="Pribadi" checked={formData.jenisDisabilitas === 'Pribadi'} onChange={handleInputChange} className="mr-2 text-blue-600"/>Pribadi</label><label className="flex items-center cursor-pointer"><input type="radio" name="jenisDisabilitas" value="Rombongan" checked={formData.jenisDisabilitas === 'Rombongan'} onChange={handleInputChange} className="mr-2 text-blue-600"/>Rombongan</label></div></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">{formData.jenisDisabilitas === 'Pribadi' ? 'Nama' : 'Nama Instansi'}</label><input type="text" name="namaInstansi" required value={formData.namaInstansi} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>
                    {formData.jenisDisabilitas === 'Rombongan' && (<div><label className="block text-sm font-medium text-slate-700 mb-1">No Surat</label><input type="text" name="noSurat" required value={formData.noSurat} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>)}
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><textarea name="alamat" required value={formData.alamat} onChange={handleInputChange} rows="2" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"></textarea></div>
                  </>)}

                  {selectedService === 'kjp' && (<>
                    {!editId && <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2"><p className="text-sm text-blue-800">Ketik NISN lalu tekan Tab/Enter.</p></div>}
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">NISN</label><input type="number" name="nisn" required value={formData.nisn} onChange={handleInputChange} onBlur={() => handleAutoFillCheck('kjp', formData.nisn)} onKeyDown={(e) => handleKeyDown(e, 'kjp', formData.nisn)} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'}`} placeholder="Ketik NISN..." /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Siswa</label><input type="text" name="nama" required value={formData.nama} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Asal Sekolah</label><input type="text" name="namaSekolah" required value={formData.namaSekolah} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg outline-none ${isAutoFilled || editId ? 'bg-amber-50/50 border-amber-200' : 'border-slate-300'}`} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label><select name="jenjang" value={formData.jenjang} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 bg-white rounded-lg outline-none"><option value="TK/KB">TK/KB</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="Perguruan Tinggi">PT</option></select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label><input type="text" readOnly value={getKategoriKJP(formData.jenjang)} className="w-full px-4 py-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg outline-none" /></div>
                    </div>
                  </>)}

                  {selectedService === 'rombongan' && (<>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label><input type="text" name="namaSekolah" required value={formData.namaSekolah} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label><select name="jenjang" value={formData.jenjang} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 bg-white rounded-lg outline-none"><option value="TK/KB">TK/KB</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="Perguruan Tinggi">PT</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Murid</label><input type="number" name="jumlahMurid" required value={formData.jumlahMurid} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-2">Dapat Diskon?</label><div className="flex space-x-6"><label className="flex items-center space-x-2 bg-slate-50 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer"><input type="radio" name="diskonRombongan" value="Tidak" checked={formData.diskonRombongan === 'Tidak'} onChange={handleInputChange}/><span className="text-slate-700">Tidak Ada</span></label><label className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 border border-emerald-200 rounded-lg cursor-pointer"><input type="radio" name="diskonRombongan" value="Ya" checked={formData.diskonRombongan === 'Ya'} onChange={handleInputChange}/><span className="text-emerald-800 font-medium">Ya, Diskon</span></label></div></div>
                  </>)}

                  {selectedService === 'wisman' && (<>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Asal Negara</label><input type="text" name="asalNegara" required value={formData.asalNegara} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label><select name="kategoriUmur" value={formData.kategoriUmur} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 bg-white rounded-lg outline-none"><option value="Dewasa">Dewasa</option><option value="Anak">Anak</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label><input type="number" min="1" name="jumlahWisman" required value={formData.jumlahWisman} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" /></div>
                  </>)}
                </div>
                
                <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                  {editId && <button type="button" onClick={resetForm} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-6 rounded-xl transition-colors">Batal</button>}
                  <button type="submit" disabled={isLoading} className={`${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2.5 px-6 rounded-xl flex items-center space-x-2 disabled:opacity-50 transition-colors shadow-sm`}>
                    <Save size={18} /><span>{isLoading ? 'Memproses...' : editId ? 'Update Data' : 'Simpan ke Cloud'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MENU DATA LIVE --- */}
        {activeMenu === 'data' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 print:hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-800">Database Input (Live)</h3><span className="text-sm text-emerald-600 flex items-center space-x-1 font-medium"><Cloud size={14} /> <span>Tersinkronisasi</span></span></div>
            <div className="p-6">
              {records.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">Belum ada data input baru di Firebase.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {records.map((record) => (
                    <div key={record.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase">{record.layanan}</span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{record.tglKunjungan || '-'}</span>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        {record.details && Object.entries(record.details).map(([key, value]) => (
                          <div key={key} className="flex flex-col"><span className="text-slate-500 text-[11px] uppercase tracking-wider">{key}</span><span className="font-medium text-slate-800">{value || '-'}</span></div>
                        ))}
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-[10px] text-slate-400">{record.timestampTampil || 'Baru Saja'}</div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEditAction(record)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={16} /></button>
                           <button onClick={() => setRecordToDelete(record.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MENU CETAK LAPORAN (PRINT) --- */}
        {activeMenu === 'print' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Panel Kontrol Cetak (Sembunyikan saat diprint) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center"><Printer size={20} className="mr-2 text-blue-600"/> Modul Cetak Laporan Resmi</h2>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"><Printer size={16} className="mr-2"/> Cetak ke PDF / Printer</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Laporan</label>
                        <select value={printService} onChange={(e)=>setPrintService(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none">
                            <option value="lansia">Layanan Gratis Lansia</option>
                            <option value="disabilitas">Layanan Gratis Disabilitas / SLB</option>
                            <option value="kjp">Peserta Didik KJP</option>
                            <option value="rombongan">Kunjungan Rombongan Sekolah</option>
                            <option value="wisman">Kunjungan Wisatawan Mancanegara</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                        <select value={printMonth} onChange={(e)=>setPrintMonth(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none">
                            <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option><option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option><option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option><option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                        <select value={printYear} onChange={(e)=>setPrintYear(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none">
                            <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- KERTAS LAPORAN CETAK --- */}
            {/* Font diubah menjadi Arial dan Size menjadi 12pt */}
            <div className="bg-white p-8 md:p-12 border border-slate-200 shadow-lg min-h-[297mm] print:shadow-none print:border-none print:p-0 print:m-0 w-full text-black" style={{fontFamily: "Arial, sans-serif", fontSize: "12pt"}}>
                
                {/* Header Laporan */}
                <div className="mb-6 border-b-2 border-black pb-4">
                    <h1 className="text-center font-bold text-[14pt] uppercase tracking-wide">
                        {printService === 'lansia' && 'DATA LAYANAN GRATIS BAGI LANJUT USIA'}
                        {printService === 'disabilitas' && 'DATA LAYANAN GRATIS BAGI PENYANDANG DISABILITAS'}
                        {printService === 'kjp' && 'DATA LAYANAN GRATIS BAGI PESERTA DIDIK KARTU JAKARTA PINTAR'}
                        {printService === 'rombongan' && 'DATA KUNJUNGAN ROMBONGAN SEKOLAH'}
                        {printService === 'wisman' && 'DATA KUNJUNGAN WISATAWAN MANCANEGARA'}
                    </h1>
                    <h2 className="text-center font-bold text-[12pt] uppercase mt-2">UNIT PENGELOLA TAMAN MARGASATWA RAGUNAN</h2>
                    <h2 className="text-center font-bold text-[12pt] uppercase">DINAS PERTAMANAN DAN HUTAN KOTA PROVINSI DKI JAKARTA</h2>
                    <h3 className="text-center font-bold text-[12pt] uppercase mt-2">BULAN {getBulanName(printMonth)} {printYear}</h3>
                </div>

                {/* Tabel Laporan */}
                <div className="w-full mb-8">
                    <table className="w-full border-collapse border border-black text-center">
                        <thead>
                            {/* Format Header Lansia */}
                            {printService === 'lansia' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-10">NO</th><th className="border border-black p-2 w-24">TANGGAL</th><th className="border border-black p-2">NAMA / INSTANSI</th><th className="border border-black p-2">TEMPAT / TGL LAHIR</th><th className="border border-black p-2">NIK</th><th className="border border-black p-2">ALAMAT</th><th className="border border-black p-2 w-20">JUMLAH</th></tr>
                            )}
                            
                            {/* Format Header SLB / Disabilitas */}
                            {printService === 'disabilitas' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-10">NO</th><th className="border border-black p-2 w-24">TANGGAL</th><th className="border border-black p-2">NAMA / INSTANSI</th><th className="border border-black p-2">NO. SURAT</th><th className="border border-black p-2">ALAMAT</th><th className="border border-black p-2 w-20">JUMLAH</th></tr>
                            )}

                            {/* Format Header KJP */}
                            {printService === 'kjp' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-10" rowSpan="2">NO</th><th className="border border-black p-2 w-24" rowSpan="2">TANGGAL</th><th className="border border-black p-2" rowSpan="2">NAMA</th><th className="border border-black p-2" rowSpan="2">NISN</th><th className="border border-black p-2" rowSpan="2">SEKOLAH / PT</th><th className="border border-black p-2" colSpan="2">JUMLAH</th></tr>
                            )}
                            {printService === 'kjp' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-16">DEWASA</th><th className="border border-black p-2 w-16">ANAK</th></tr>
                            )}

                            {/* Format Header Rombongan */}
                            {printService === 'rombongan' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-10" rowSpan="2">NO</th><th className="border border-black p-2 w-24" rowSpan="2">TANGGAL</th><th className="border border-black p-2" rowSpan="2">NAMA SEKOLAH</th><th className="border border-black p-2" colSpan="5">JUMLAH MURID</th><th className="border border-black p-2" rowSpan="2">KETERANGAN</th></tr>
                            )}
                            {printService === 'rombongan' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-12">TK/KB</th><th className="border border-black p-2 w-12">SD</th><th className="border border-black p-2 w-12">SMP</th><th className="border border-black p-2 w-12">SMA</th><th className="border border-black p-2 w-12">PT</th></tr>
                            )}

                            {/* Format Header Wisman */}
                            {printService === 'wisman' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-10" rowSpan="2">NO</th><th className="border border-black p-2 w-24" rowSpan="2">TANGGAL</th><th className="border border-black p-2" rowSpan="2">ASAL NEGARA</th><th className="border border-black p-2" colSpan="2">JUMLAH WISMAN</th><th className="border border-black p-2" rowSpan="2">TOTAL</th></tr>
                            )}
                            {printService === 'wisman' && (
                                <tr className="bg-gray-100 font-bold uppercase"><th className="border border-black p-2 w-20">DEWASA</th><th className="border border-black p-2 w-20">ANAK</th></tr>
                            )}
                        </thead>
                        
                        <tbody>
                            {filteredPrintRecords.length === 0 ? (
                                <tr><td colSpan="10" className="border border-black p-4 text-center italic text-gray-500">Tidak ada data kunjungan pada bulan ini.</td></tr>
                            ) : (
                                filteredPrintRecords.map((item, index) => {
                                    const d = item.details || {};
                                    const tglFormat = item.tglKunjungan ? item.tglKunjungan.split('-').reverse().join('-') : '-';
                                    const hCount = parseInt(item.headCount) || 1;

                                    if(printService === 'lansia') {
                                        return (<tr key={item.id}><td className="border border-black p-2">{index+1}</td><td className="border border-black p-2">{tglFormat}</td><td className="border border-black p-2 text-left">{d.Nama||'-'}</td><td className="border border-black p-2">{d.TTL||'-'}</td><td className="border border-black p-2">{d.NIK||'-'}</td><td className="border border-black p-2 text-left">{d.Alamat||'-'}</td><td className="border border-black p-2">{hCount}</td></tr>);
                                    }
                                    if(printService === 'disabilitas') {
                                        return (<tr key={item.id}><td className="border border-black p-2">{index+1}</td><td className="border border-black p-2">{tglFormat}</td><td className="border border-black p-2 text-left">{d['Nama/Instansi']||'-'}</td><td className="border border-black p-2">{d['No Surat']||'-'}</td><td className="border border-black p-2 text-left">{d.Alamat||'-'}</td><td className="border border-black p-2">{hCount}</td></tr>);
                                    }
                                    if(printService === 'kjp') {
                                        return (<tr key={item.id}><td className="border border-black p-2">{index+1}</td><td className="border border-black p-2">{tglFormat}</td><td className="border border-black p-2 text-left">{d.Nama||'-'}</td><td className="border border-black p-2">{d.NISN||'-'}</td><td className="border border-black p-2 text-left">{d['Asal Sekolah/PT']||'-'}</td><td className="border border-black p-2">{d.Kategori==='Dewasa'?hCount:'-'}</td><td className="border border-black p-2">{d.Kategori==='Anak'?hCount:'-'}</td></tr>);
                                    }
                                    if(printService === 'rombongan') {
                                        const tk = d.Jenjang === 'TK/KB' ? hCount : '-';
                                        const sd = d.Jenjang === 'SD' ? hCount : '-';
                                        const smp = d.Jenjang === 'SMP' ? hCount : '-';
                                        const sma = d.Jenjang === 'SMA' ? hCount : '-';
                                        const pt = d.Jenjang === 'Perguruan Tinggi' ? hCount : '-';
                                        const diskon = d['Potongan Harga']==='Ya' ? 'Diskon' : 'Tidak Diskon';
                                        return (<tr key={item.id}><td className="border border-black p-2">{index+1}</td><td className="border border-black p-2">{tglFormat}</td><td className="border border-black p-2 text-left">{d['Nama Sekolah']||'-'}</td><td className="border border-black p-2">{tk}</td><td className="border border-black p-2">{sd}</td><td className="border border-black p-2">{smp}</td><td className="border border-black p-2">{sma}</td><td className="border border-black p-2">{pt}</td><td className="border border-black p-2">{diskon}</td></tr>);
                                    }
                                    if(printService === 'wisman') {
                                        return (<tr key={item.id}><td className="border border-black p-2">{index+1}</td><td className="border border-black p-2">{tglFormat}</td><td className="border border-black p-2 text-left">{d['Asal Negara']||'-'}</td><td className="border border-black p-2">{d.Kategori==='Dewasa'?hCount:'-'}</td><td className="border border-black p-2">{d.Kategori==='Anak'?hCount:'-'}</td><td className="border border-black p-2 font-bold">{hCount}</td></tr>);
                                    }
                                    return null;
                                })
                            )}
                            
                            {/* Row Total diletakkan di dalam tbody agar HANYA MUNCUL DI AKHIR TABEL SAJA (Tidak berulang di setiap halaman print) */}
                            {filteredPrintRecords.length > 0 && (
                                <tr className="font-bold bg-gray-50 uppercase print:break-inside-avoid">
                                    {printService === 'lansia' && <><td colSpan="6" className="border border-black p-2 text-right pr-4">TOTAL</td><td className="border border-black p-2">{filteredPrintRecords.reduce((acc, curr)=> acc + (parseInt(curr.headCount)||1), 0)}</td></>}
                                    {printService === 'disabilitas' && <><td colSpan="5" className="border border-black p-2 text-right pr-4">TOTAL</td><td className="border border-black p-2">{filteredPrintRecords.reduce((acc, curr)=> acc + (parseInt(curr.headCount)||1), 0)}</td></>}
                                    {printService === 'kjp' && <><td colSpan="5" className="border border-black p-2 text-right pr-4">TOTAL</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Kategori==='Dewasa').reduce((acc, curr)=>acc+(parseInt(curr.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Kategori==='Anak').reduce((acc, curr)=>acc+(parseInt(curr.headCount)||1), 0)}</td></>}
                                    {printService === 'rombongan' && <><td colSpan="3" className="border border-black p-2 text-right pr-4">J U M L A H</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Jenjang==='TK/KB').reduce((acc, c)=>acc+(parseInt(c.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Jenjang==='SD').reduce((acc, c)=>acc+(parseInt(c.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Jenjang==='SMP').reduce((acc, c)=>acc+(parseInt(c.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Jenjang==='SMA').reduce((acc, c)=>acc+(parseInt(c.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Jenjang==='Perguruan Tinggi').reduce((acc, c)=>acc+(parseInt(c.headCount)||1), 0)}</td><td className="border border-black p-2">-</td></>}
                                    {printService === 'wisman' && <><td colSpan="3" className="border border-black p-2 text-right pr-4">J U M L A H</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Kategori==='Dewasa').reduce((acc, curr)=>acc+(parseInt(curr.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.filter(r=>r.details?.Kategori==='Anak').reduce((acc, curr)=>acc+(parseInt(curr.headCount)||1), 0)}</td><td className="border border-black p-2">{filteredPrintRecords.reduce((acc, curr)=> acc + (parseInt(curr.headCount)||1), 0)}</td></>}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="flex justify-end mt-12 text-center text-[12pt] print:break-inside-avoid">
                    <div className="w-80">
                        <p className="mb-1">Jakarta, ....... {getBulanName(printMonth)} {printYear}</p>
                        <p className="mb-1">Kepala Seksi Pelayanan dan Informasi</p>
                        <p className="mb-1">Unit Pengelola Taman Margasatwa Ragunan</p>
                        <p className="mb-24">Dinas Pertamanan dan Hutan Kota Provinsi DKI Jakarta</p>
                        <p className="font-bold underline mb-1">Afriana Pulungan, S.Si., M.AP.</p>
                        <p>NIP 197304212007012021</p>
                    </div>
                </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
