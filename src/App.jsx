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
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = ["Todos", "Clássicos", "Romance", "Conto", "Crônica", "Poesia"];

// COMPONENTE DE LOADING ESTILOSO
const LoadingScreen = () => (
    <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
        <div className="relative">
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    borderRadius: ["20%", "50%", "20%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-20 blur-2xl"
            />
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center text-blue-500"
            >
                <Library size={48} />
            </motion.div>
        </div>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
        >
            <h2 className="text-white font-black text-xl tracking-[0.3em] uppercase mb-2">LPT Digital</h2>
            <div className="flex gap-1 justify-center">
                {[0, 1, 2].map((i) => (
                    <motion.div 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                    />
                ))}
            </div>
        </motion.div>
    </motion.div>
);

// COMPONENTE DE LANDING PAGE
const LandingPage = ({ onEnter }) => (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Efeito de Luz de Fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 text-center max-w-lg"
        >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-8 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles size={14} /> Projeto LPT 2026
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-[0.9] tracking-tighter">
                Sua próxima <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic font-serif pr-2">grande aventura</span> <br /> 
                começa aqui.
            </h1>

            <p className="text-slate-400 text-base sm:text-lg mb-12 font-medium leading-relaxed max-w-md mx-auto">
                Explore o acervo digital literário do Professor Sérgio Araújo. Clássicos e contemporâneos em um só lugar.
            </p>

            <div className="flex flex-col gap-4 items-center">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEnter}
                    className="group relative px-10 py-5 bg-white text-slate-950 rounded-full font-black text-lg overflow-hidden flex items-center gap-3 transition-all"
                >
                    Entrar na Biblioteca
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-4">
                    Suporte Offline • Leitura E-PUB • PWA 
                </p>
            </div>
        </motion.div>

        {/* Floating Elements Decorativos */}
        <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[10%] opacity-20 hidden md:block"
        >
            <BookMarked size={120} className="text-blue-500 rotate-12" />
        </motion.div>
    </div>
);

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'loading' | 'app'
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
    title: '', author: '', category: 'Clássicos', format: 'PDF', coverUrl: '', synopsis: '', ebookUrl: '', ebookFile: null 
  });

  // Web Search States
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webResults, setWebResults] = useState([]);
  const [gutenbergResults, setGutenbergResults] = useState([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [isDownloadingEpub, setIsDownloadingEpub] = useState(false);

  const books = useLiveQuery(() => {
    let query = db.books;
    if (activeCategory !== "Todos") {
      query = query.where('category').equals(activeCategory);
    }
    return query.toArray().then(data => {
      const sorted = data.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (!searchTerm) return sorted;
      return sorted.filter(b => 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [activeCategory, searchTerm]) || [];

  const handleEnterApp = () => {
    setView('loading');
    setTimeout(() => {
        setView('app');
    }, 2500);
  };

  const loadCloudData = async () => {
    setIsSyncing(true);
    await pullFromCloud();
    setIsSyncing(false);
  };

  useEffect(() => {
    if (view === 'app') loadCloudData();
  }, [view]);

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
      setFormData({ title: '', author: '', category: 'Clássicos', format: 'PDF', coverUrl: '', synopsis: '', ebookUrl: '', ebookFile: null });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;
    setIsSyncing(true);
    try {
      await pushToCloud(formData, formData.ebookFile);
      setShowModal(false);
      setSelectedBook(null);
    } catch (error) {
      alert("Erro ao salvar na nuvem.");
    }
    setIsSyncing(false);
  };

  const handleDelete = async (book, e) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm("Remover esta obra definitivamente?")) {
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
    }
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) return;
    setIsSearchingWeb(true);
    try {
      // 1. Busca Google Books (Metadados e Capa)
      const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(webSearchQuery)}&langRestrict=pt&maxResults=8`);
      const googleData = await googleRes.json();
      setWebResults(googleData.items || []);

      // 2. Busca Project Gutenberg (Arquivos EPUB Reais)
      const gutenRes = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(webSearchQuery)}&languages=pt`);
      const gutenData = await gutenRes.json();
      setGutenbergResults(gutenData.results || []);

    } catch (error) {
      console.error("Erro na busca hibrida:", error);
    }
    setIsSearchingWeb(false);
  };

  const importWebBook = (item) => {
    const info = item.volumeInfo;
    setFormData({
      ...formData,
      title: info.title || '',
      author: info.authors ? info.authors.join(', ') : '',
      synopsis: info.description ? info.description.substring(0, 800) : '',
      coverUrl: info.imageLinks ? info.imageLinks.thumbnail.replace('http:', 'https:') : '',
      format: 'PDF',
      ebookUrl: '',
      ebookFile: null
    });
    setShowWebSearch(false);
    setWebResults([]);
    setWebSearchQuery('');
  };

  const importGutenbergBook = async (item) => {
    setIsDownloadingEpub(true);
    try {
      let epubUrl = item.formats['application/epub+zip'] || item.formats['application/epub+images'];
      if (!epubUrl) throw new Error("Link EPUB não encontrado.");

      epubUrl = epubUrl.replace('http:', 'https:');
      
      // Uso de um Proxy de CORS para evitar o erro "Failed to Fetch"
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(epubUrl)}`;

      // Busca Blob do arquivo através do proxy
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Erro ao acessar o servidor de livros.");
      
      const blob = await response.blob();
      const file = new File([blob], `${item.title.replace(/\s/g, '_')}.epub`, { type: 'application/epub+zip' });

      setFormData({
        ...formData,
        title: item.title || '',
        author: item.authors ? item.authors.map(a => a.name).join(', ') : '',
        category: 'Clássicos',
        synopsis: `Obra do acervo Project Gutenberg. ID: ${item.id}`,
        coverUrl: item.formats['image/jpeg'] || '',
        format: 'EPUB',
        ebookFile: file,
        ebookUrl: '' 
      });

      setShowWebSearch(false);
      setGutenbergResults([]);
      setWebSearchQuery('');
    } catch (error) {
      console.error("Erro no download:", error);
      alert("Erro ao baixar o arquivo: " + error.message + ". Tente outro livro ou verifique sua conexão.");
    }
    setIsDownloadingEpub(false);
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
    <div className="font-sans antialiased text-slate-900 overflow-x-hidden">
      
      <AnimatePresence mode="wait">
        {view === 'landing' && (
            <motion.div key="landing" exit={{ opacity: 0 }}>
                <LandingPage onEnter={handleEnterApp} />
            </motion.div>
        )}

        {view === 'loading' && <LoadingScreen key="loading" />}

        {view === 'app' && (
            <motion.div 
                key="app" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="min-h-screen bg-[#F8FAFC] flex flex-col"
            >
                {/* Indicador de Sincronização */}
                <AnimatePresence>
                    {isSyncing && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                        <RefreshCw size={12} className="animate-spin" /> Atualizando...
                    </motion.div>
                    )}
                </AnimatePresence>

                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-100">
                    <div className="px-5 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Library size={22} /></div>
                            <div><h1 className="text-lg font-black tracking-tight leading-none">Biblioteca LPT</h1><div className="flex items-center gap-1 mt-0.5"><div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-rose-500")} /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isOnline ? 'Cloud' : 'Offline'}</span></div></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={loadCloudData} className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:text-blue-600 transition-all active:scale-90"><RefreshCw size={16} /></button>
                            <button onClick={() => isLoggedIn ? setIsLoggedIn(false) : setShowLoginModal(true)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm", isLoggedIn ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400")}>{isLoggedIn ? <Unlock size={18} /> : <User size={18} />}</button>
                        </div>
                    </div>
                    <div className="px-5 pb-3 pt-1"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Busque livros..." className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white shadow-inner" /></div></div>
                    <div className="px-5 pb-1"><div className="flex items-center gap-5 h-10 overflow-x-auto scrollbar-hide">{CATEGORIES.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={cn("relative h-full flex items-center text-xs font-black transition-all px-1 whitespace-nowrap uppercase tracking-widest", activeCategory === cat ? "text-blue-600" : "text-slate-400")}>{cat}{activeCategory === cat && <motion.div layoutId="nav_v10" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}</button>))}</div></div>
                </header>

                <main className="px-5 py-6 flex-1">
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                        {books.map((book) => (
                        <motion.div key={book.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedBook(book)} className="group relative cursor-pointer">
                            <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden shadow-md border border-white bg-white mb-3">
                                <img src={book.coverUrl || "https://images.unsplash.com/photo-1543004471-240ce445c5ce"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                <div className="absolute top-3 right-3"><div className="bg-emerald-500 p-1 rounded-full text-white shadow-lg ring-2 ring-white"><Check size={8} /></div></div>
                                {(book.ebookUrl || book.ebookFile) && (<div className="absolute bottom-3 left-3 bg-slate-900/40 backdrop-blur-md p-1.5 rounded-lg text-white flex items-center gap-1 border border-white/20">{book.ebookFile ? <Download size={12} /> : <BookOpen size={12} />}<span className="text-[7px] font-black uppercase tracking-tighter">{isEpubFlag(book) ? 'EPUB' : 'PDF'}</span></div>)}
                            </div>
                            <div className="px-1"><h3 className="text-xs font-black text-slate-800 leading-tight mb-0.5 line-clamp-2">{book.title}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{book.author}</p></div>
                        </motion.div>
                        ))}
                    </div>
                </main>

                <footer className="px-5 py-10 border-t border-slate-100 bg-white text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">LPT 2026 PROF. SÉRGIO ARAÚJO</p>
                    <div className="w-10 h-1 bg-blue-600/20 rounded-full mx-auto" />
                </footer>

                {isLoggedIn && <button onClick={() => openForm()} className="fixed bottom-8 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform"><Plus size={28} /></button>}
            </motion.div>
        )}
      </AnimatePresence>

      {/* DETALHES MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBook(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[2.5rem] max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
              <div className="relative aspect-[4/5] w-full"><img src={selectedBook.coverUrl || "https://images.unsplash.com/photo-1543004471-240ce445c5ce"} className="w-full h-full object-cover" /><button onClick={() => setSelectedBook(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X size={20} /></button></div>
              <div className="p-8 pb-12">
                <div className="flex items-center justify-between mb-4"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedBook.category}</span>{isLoggedIn && <div className="flex gap-2"><button onClick={() => openForm(selectedBook)} className="p-2 bg-slate-50 text-blue-600 rounded-xl"><Edit2 size={16} /></button><button onClick={(e) => handleDelete(selectedBook, e)} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Trash2 size={16} /></button></div>}</div>
                <h2 className="text-3xl font-black text-slate-900 leading-none mb-1">{selectedBook.title}</h2><p className="text-lg text-slate-400 font-bold mb-8 uppercase tracking-widest">{selectedBook.author}</p>
                <div className="space-y-4 mb-10 text-left"><h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-50">Resumo da Obra</h5><p className="text-slate-600 leading-relaxed font-medium text-base">{selectedBook.synopsis || "Exploração pedagógica pendente."}</p></div>
                {selectedBook.ebookUrl ? (<button onClick={() => { setReadingBook(selectedBook); setSelectedBook(null); }} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><BookOpen size={20} /> Começar Leitura</button>) : <div className="bg-slate-50 p-4 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border border-slate-100">Exemplar Físico</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READER VIEW */}
      <AnimatePresence>
        {readingBook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-white z-20"><button onClick={() => { setReadingBook(null); setSelectedBook(readingBook); }} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><ArrowLeft size={20} /></button><div className="text-center overflow-hidden px-4"><h4 className="text-xs font-black text-slate-900 truncate tracking-tight">{readingBook.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-1">{isEpubFlag(readingBook) ? 'E-Reader EPUB' : 'Visualizador PDF'}</p></div><button onClick={() => readingBook.ebookUrl && window.open(readingBook.ebookUrl, '_blank')} className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center" disabled={!readingBook.ebookUrl}><ExternalLink size={18} /></button></div>
            <div className="flex-1 bg-white relative">
               {isEpubFlag(readingBook) ? (<div className="w-full h-full bg-white relative reader-dark-btns"><ReactReader url={epubData} location={location} locationChanged={(loc) => setLocation(loc)} title={readingBook.title} styles={{ arrow: { color: '#000', fontSize: '30px' }, arrowPrev: { left: '10px' }, arrowNext: { right: '10px' } }} loadingView={<div className="h-full flex flex-col items-center justify-center gap-4 text-center p-10"><Loader2 className="animate-spin text-blue-600" /> <p className="font-black text-slate-900/30 uppercase tracking-[0.4em] text-[8px]">Preparando páginas...</p></div>} /></div>) : (<iframe src={readingBook.ebookFile ? URL.createObjectURL(readingBook.ebookFile) : getViewerUrl(readingBook.ebookUrl)} className="w-full h-full border-none" title="Reader" />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .reader-dark-btns button { color: #000 !important; filter: brightness(0); opacity: 0.8 !important; }
      `}} />

      {/* ADMIN FORM */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[80] bg-white sm:bg-slate-950/60 sm:backdrop-blur-md flex items-center justify-center overflow-hidden">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full h-full sm:h-auto sm:max-w-xl bg-white sm:rounded-[40px] p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Gerenciar Obra</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adicione ou edite livros no acervo</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><X size={24} /></button>
              </div>

              {!showWebSearch ? (
                <div className="mb-8">
                  <button 
                    type="button"
                    onClick={() => setShowWebSearch(true)}
                    className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all"
                  >
                    <Search size={16} /> Buscar Metadados na Web
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pesquisa Inteligente</h3>
                    <button onClick={() => setShowWebSearch(false)} className="text-slate-400 p-1"><X size={14} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Título ou Autor..."
                      value={webSearchQuery}
                      onChange={(e) => setWebSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-blue-500/20 focus:ring-4"
                    />
                    <button 
                      onClick={handleWebSearch}
                      disabled={isSearchingWeb}
                      className="bg-slate-900 text-white px-4 rounded-xl flex items-center justify-center"
                    >
                      {isSearchingWeb ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                  </div>

                    <div className="mt-4 space-y-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {isDownloadingEpub && (
                         <div className="flex flex-col items-center justify-center py-6 bg-blue-50 rounded-2xl border border-blue-100 animate-pulse">
                            <Loader2 className="animate-spin text-blue-600 mb-2" />
                            <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Baixando arquivo EPUB...</p>
                         </div>
                      )}

                      {/* Resultados Gutenberg (Arquivos) */}
                      {gutenbergResults.length > 0 && (
                        <div className="space-y-2">
                           <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest pl-1">Livros com EPUB (Gutenberg)</h4>
                           {gutenbergResults.map((item, idx) => (
                              <div key={`g-${idx}`} onClick={() => importGutenbergBook(item)} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer hover:border-emerald-500 transition-all">
                                <img src={item.formats['image/jpeg']} className="w-10 h-14 object-cover rounded-md bg-slate-100" />
                                <div className="flex-1 min-width-0">
                                  <p className="text-[10px] font-black text-slate-900 truncate">{item.title}</p>
                                  <p className="text-[9px] font-bold text-slate-400 truncate">{item.authors?.map(a => a.name).join(', ')}</p>
                                </div>
                                <div className="bg-emerald-500 text-white p-1 rounded-full"><Download size={10} /></div>
                              </div>
                           ))}
                        </div>
                      )}

                      {/* Resultados Google (Metadados) */}
                      {webResults.length > 0 && (
                        <div className="space-y-2">
                           <h4 className="text-[8px] font-black text-indigo-600 uppercase tracking-widest pl-1">Apenas Metadados (Google)</h4>
                           {webResults.map((item, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => importWebBook(item)}
                              className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-blue-500 transition-all"
                            >
                              <img src={item.volumeInfo.imageLinks?.thumbnail} className="w-10 h-14 object-cover rounded-md bg-slate-100" />
                              <div className="flex-1 min-width-0">
                                <p className="text-[10px] font-black text-slate-900 truncate">{item.volumeInfo.title}</p>
                                <p className="text-[9px] font-bold text-slate-400 truncate">{item.volumeInfo.authors?.join(', ')}</p>
                              </div>
                              <Plus size={14} className="text-blue-500 mr-2" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {webResults.length === 0 && gutenbergResults.length === 0 && !isSearchingWeb && (
                        <p className="text-[9px] text-center py-4 text-slate-400 font-bold uppercase tracking-widest">Digite e pesquise por clássicos em pt-br</p>
                      )}
                    </div>
                  </motion.div>
                )
              }

              <form onSubmit={handleSave} className="space-y-6 pb-20 text-left">
                <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold focus:bg-white" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autor</label><input required type="text" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold focus:bg-white" /></div></div>
                <div className="space-y-4 pt-2 border-t border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload para Nuvem</label><div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center">{formData.ebookFile ? (<div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-xl"><div className="flex items-center gap-3 overflow-hidden"><FileText size={20} className="text-blue-400" /><p className="text-xs font-black truncate">{formData.ebookFile.name}</p></div><button type="button" onClick={() => setFormData({...formData, ebookFile: null})} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button></div>) : (<div className="relative group flex flex-col items-center"><input type="file" accept=".epub,.pdf" onChange={(e) => setFormData({...formData, ebookFile: e.target.files[0], format: e.target.files[0].name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF'})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm ring-1 ring-slate-200 mt-2"><FileUp size={28} /></div><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">Escolher Arquivo</p></div>)}</div></div>
                <div className="grid grid-cols-2 gap-2">{CATEGORIES.filter(c => c !== "Todos").map(f => (<button key={f} type="button" onClick={() => setFormData({...formData, category: f})} className={cn("py-3 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-tighter", formData.category === f ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100")}>{f}</button>))}</div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capa (URL)</label><input type="url" value={formData.coverUrl} onChange={(e) => setFormData({...formData, coverUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none font-medium text-xs focus:bg-white" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</label><textarea rows={3} value={formData.synopsis} onChange={(e) => setFormData({...formData, synopsis: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none font-medium resize-none focus:bg-white" /></div>
                <button type="submit" disabled={isSyncing} className="w-full bg-blue-600 text-white py-5 rounded-[2.2rem] font-black text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">{isSyncing ? <Loader2 className="animate-spin" /> : editingId ? "Atualizar Obra" : "Publicar para Todos"}</button>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-blue-100"><Key size={32} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Painel Master</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <input autoFocus required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 outline-none text-center font-bold text-2xl tracking-[0.5em] focus:bg-white shadow-inner", loginError ? "bg-rose-50 text-rose-600" : "")} />
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95">Entrar</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
