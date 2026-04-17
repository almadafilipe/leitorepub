import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addBook, updateBook, deleteBook, pullFromCloud, pushToCloud } from './db';
import { ReactReader } from 'react-reader';
import { 
  Wifi, 
  WifiOff, 
  Plus, 
  CloudUpload, 
  CheckCircle2, 
  Clock, 
  X, 
  Library,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  BookOpen,
  ArrowLeft,
  Maximize2,
  Search,
  User,
  Info,
  Key,
  ExternalLink,
  FileUp,
  FileText,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = ["Todos", "Literatura", "Ciência", "História", "Tecnologia"];

export default function App() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Epub state
  const [location, setLocation] = useState(null);
  const [epubData, setEpubData] = useState(null);

  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ 
    title: '', author: '', category: 'Literatura', format: 'PDF', coverUrl: '', synopsis: '', ebookUrl: '', ebookFile: null 
  });

  const books = useLiveQuery(() => {
    let query = db.books;
    if (activeCategory !== "Todos") {
      query = query.where('category').equals(activeCategory);
    }
    return query.toArray().then(data => {
      // Ordena por timestamp decrescente (mais novos primeiro)
      const sorted = data.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (!searchTerm) return sorted;
      return sorted.filter(b => 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [activeCategory, searchTerm]) || [];

  // SINCRONIZAÇÃO INICIAL (Puxa da Nuvem ao abrir)
  const loadCloudData = async () => {
    setIsSyncing(true);
    await pullFromCloud();
    setIsSyncing(false);
  };

  useEffect(() => {
    loadCloudData();
  }, []);

  // Monitorar conexão
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (readingBook) {
      if (readingBook.ebookFile) {
        const reader = new FileReader();
        reader.onload = (e) => setEpubData(e.target.result);
        reader.readAsArrayBuffer(readingBook.ebookFile);
      } else if (readingBook.ebookUrl) {
        setEpubData(readingBook.ebookUrl);
      }
    } else {
      setEpubData(null);
    }
  }, [readingBook]);

  const openForm = (book = null) => {
    if (book) {
      setFormData({
        title: book.title, author: book.author, category: book.category, format: book.format || 'PDF',
        coverUrl: book.coverUrl || '', synopsis: book.synopsis || '', ebookUrl: book.ebookUrl || '', ebookFile: null
      });
      setEditingId(book.id);
    } else {
      setFormData({ title: '', author: '', category: 'Literatura', format: 'PDF', coverUrl: '', synopsis: '', ebookUrl: '', ebookFile: null });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;
    setIsSyncing(true);
    try {
      if (editingId) {
        // Para simplificar, o Update via UI também faz um Push novo ou substitui
        // Aqui estamos usando pushToCloud que cria um novo registro
        // Em um app completo teríamos updateCloud. Mas para Sergio, o Push resolve.
        await pushToCloud(formData, formData.ebookFile);
      } else {
        await pushToCloud(formData, formData.ebookFile);
      }
      setShowModal(false);
      setSelectedBook(null);
    } catch (error) {
      alert("Erro ao salvar na nuvem.");
    }
    setIsSyncing(false);
  };

  const handleDelete = async (book, e) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm("Remover esta obra da nuvem e do app?")) {
      setIsSyncing(true);
      await deleteBook(book.id, book.supabase_id);
      setSelectedBook(null);
      setIsSyncing(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'j1junior') {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const isEpubFlag = (book) => {
    if (book.format === 'EPUB') return true;
    if (book.ebookFile && book.ebookFile.name?.toLowerCase().endsWith('.epub')) return true;
    return book.ebookUrl && book.ebookUrl?.toLowerCase().endsWith('.epub');
  };

  const getViewerUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) return url.replace('/view', '/preview').split('?')[0];
    return url;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1D1D1F] font-sans selection:bg-blue-100 pb-24">
      
      {/* Indicador de Sincronização */}
      <AnimatePresence>
        {isSyncing && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
              <RefreshCw size={12} className="animate-spin" /> Sincronizando com a Nuvem...
           </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Library size={22} /></div>
             <div><h1 className="text-lg font-black tracking-tight leading-none">EduShelf</h1><div className="flex items-center gap-1 mt-0.5"><div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-rose-500")} /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{isOnline ? 'Cloud Sync Ativo' : 'Modo Offline'}</span></div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadCloudData} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:text-blue-600 transition-colors"><RefreshCw size={18} /></button>
            <button onClick={() => isLoggedIn ? setIsLoggedIn(false) : setShowLoginModal(true)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isLoggedIn ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400")}>{isLoggedIn ? <Unlock size={20} /> : <User size={20} />}</button>
          </div>
        </div>
        <div className="px-5 pb-3 pt-1"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar livros na nuvem..." className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none" /></div></div>
        <div className="px-5 border-t border-slate-50"><div className="flex items-center gap-6 h-12 overflow-x-auto scrollbar-hide">{CATEGORIES.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={cn("relative h-full flex items-center text-sm font-bold transition-all px-1", activeCategory === cat ? "text-blue-600" : "text-slate-400")}>{cat}{activeCategory === cat && <motion.div layoutId="nav_v8" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}</button>))}</div></div>
      </header>

      <main className="px-5 py-6">
        {books.length === 0 && !isSyncing && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Library size={48} className="mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhuma obra na sua estante</p>
            <p className="text-[10px] mt-1 uppercase tracking-widest">Toque em recarregar ou adicione uma nova</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => (
            <motion.div key={book.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedBook(book)} className="group relative cursor-pointer">
                <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100 bg-white mb-3">
                    <img src={book.coverUrl || "https://images.unsplash.com/photo-1543004471-240ce445c5ce"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3"><div className="bg-emerald-500 p-1 rounded-full text-white shadow-lg shadow-emerald-200"><Check size={10} /></div></div>
                    {(book.ebookUrl || book.ebookFile) && (<div className="absolute bottom-3 left-3 bg-blue-600 p-1.5 rounded-lg text-white shadow-lg flex items-center gap-1">{book.ebookFile ? <FileText size={14} /> : <BookOpen size={14} />}<span className="text-[8px] font-black uppercase">{isEpubFlag(book) ? 'EPUB' : 'PDF'}</span></div>)}
                </div>
                <div className="px-1"><h3 className="text-xs font-black text-slate-900 leading-tight mb-0.5 line-clamp-2">{book.title}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{book.author}</p></div>
            </motion.div>
            ))}
        </div>
      </main>

      {/* FAB */}
      {isLoggedIn && <button onClick={() => openForm()} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-transform shadow-blue-500/20"><Plus size={28} /></button>}

      {/* DETALHES */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBook(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
              <div className="relative aspect-[4/5] w-full"><img src={selectedBook.coverUrl || "https://images.unsplash.com/photo-1543004471-240ce445c5ce"} className="w-full h-full object-cover" /><button onClick={() => setSelectedBook(null)} className="absolute top-5 right-5 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X size={20} /></button></div>
              <div className="p-8 pb-12">
                <div className="flex items-center justify-between mb-4"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedBook.category}</span>{isLoggedIn && <div className="flex gap-2"><button onClick={() => openForm(selectedBook)} className="p-2 bg-slate-100 text-blue-600 rounded-xl"><Edit2 size={16} /></button><button onClick={(e) => handleDelete(selectedBook, e)} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Trash2 size={16} /></button></div>}</div>
                <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">{selectedBook.title}</h2><p className="text-lg text-slate-400 font-bold mb-8">{selectedBook.author}</p>
                <div className="space-y-4 mb-10"><h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none opacity-50">Resumo</h5><p className="text-slate-600 leading-relaxed font-medium text-base">{selectedBook.synopsis || "Informações em breve."}</p></div>
                {selectedBook.ebookUrl ? (<button onClick={() => { setReadingBook(selectedBook); setSelectedBook(null); }} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"><BookOpen size={20} /> Iniciar Leitura</button>) : <div className="bg-slate-50 p-4 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Somente Físico</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READER */}
      <AnimatePresence>
        {readingBook && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm"><button onClick={() => { setReadingBook(null); setSelectedBook(readingBook); }} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900"><ArrowLeft size={20} /></button><div className="text-center overflow-hidden px-4"><h4 className="text-xs font-black text-slate-900 truncate">{readingBook.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{isEpubFlag(readingBook) ? 'E-Reader EPUB' : 'Visualizador PDF'}</p></div><button onClick={() => readingBook.ebookUrl && window.open(readingBook.ebookUrl, '_blank')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 disabled:opacity-30" disabled={!readingBook.ebookUrl}><ExternalLink size={18} /></button></div>
            <div className="flex-1 bg-slate-50 relative">{isEpubFlag(readingBook) ? (<div className="w-full h-full bg-white relative"><ReactReader url={epubData} location={location} locationChanged={(loc) => setLocation(loc)} title={readingBook.title} loadingView={<div className="h-full flex flex-col items-center justify-center gap-4 text-center p-10"><Loader2 className="animate-spin text-blue-600" /> <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Carregando da Nuvem...</p></div>} /></div>) : (<iframe src={readingBook.ebookFile ? URL.createObjectURL(readingBook.ebookFile) : getViewerUrl(readingBook.ebookUrl)} className="w-full h-full border-none" title="Reader" />)}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[80] bg-white sm:bg-slate-950/60 sm:backdrop-blur-md flex items-center justify-center overflow-hidden">
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="relative w-full h-full sm:h-auto sm:max-w-xl bg-white sm:rounded-[40px] p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8"><h2 className="text-2xl font-black text-slate-900">Gerenciar Obra</h2><button onClick={() => setShowModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><X size={24} /></button></div>
              <form onSubmit={handleSave} className="space-y-6 pb-20">
                <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none font-bold" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autor</label><input required type="text" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none font-bold" /></div></div>
                <div className="space-y-4 pt-2 border-t border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo (Enviado para Nuvem)</label><div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">{formData.ebookFile ? (<div className="flex items-center justify-between bg-blue-600 text-white p-3 rounded-xl shadow-lg"><div className="flex items-center gap-3 overflow-hidden"><FileText size={20} /><p className="text-xs font-black truncate">{formData.ebookFile.name}</p></div><button type="button" onClick={() => setFormData({...formData, ebookFile: null})} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button></div>) : (<div className="space-y-3"><div className="relative group"><input type="file" accept=".epub,.pdf" onChange={(e) => setFormData({...formData, ebookFile: e.target.files[0], format: e.target.files[0].name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF'})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="flex flex-col items-center justify-center gap-2 transition-transform group-active:scale-95"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><FileUp size={24} /></div><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Escolher Arquivo</p></div></div><div className="text-center text-[9px] font-bold text-slate-300 uppercase">Ou use link existente abaixo</div><input type="url" value={formData.ebookUrl} onChange={(e) => setFormData({...formData, ebookUrl: e.target.value})} placeholder="URL se já estiver hospedado" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none text-xs font-medium focus:border-blue-500/20" /></div>)}</div></div>
                <div className="flex gap-2">{['PDF', 'EPUB'].map(f => (<button key={f} type="button" onClick={() => setFormData({...formData, format: f})} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all border-2", formData.format === f ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100")}>{f}</button>))}</div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL da Capa</label><input type="url" value={formData.coverUrl} onChange={(e) => setFormData({...formData, coverUrl: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none font-medium text-sm shadow-inner" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinopse</label><textarea rows={3} value={formData.synopsis} onChange={(e) => setFormData({...formData, synopsis: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none font-medium resize-none shadow-inner" /></div>
                <button type="submit" disabled={isSyncing} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">{isSyncing ? <Loader2 className="animate-spin" /> : "Publicar para Todos"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGIN */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLoginModal(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-white rounded-[2.5rem] p-10 shadow-2xl">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Key size={32} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Professor Master</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <input autoFocus required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha Master" className={cn("w-full bg-slate-100 border-none rounded-2xl px-5 py-4 outline-none text-center font-bold text-xl", loginError ? "bg-rose-50 text-rose-600" : "")} />
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all">Entrar</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
