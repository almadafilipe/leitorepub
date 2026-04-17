import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';

// Supabase Config (Valores fornecidos pelo Sérgio)
const SUPABASE_URL = 'https://oapqoomjqeipezeshhdp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcHFvb21qcWVpcGV6ZXNoaGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTU3OTQsImV4cCI6MjA5MjAzMTc5NH0.6VNGikEgd4wt_FF5oWB5E9X2q58Jbx0DYwuSGRcflwE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dexie (Local DB)
export const db = new Dexie('BookshelfAdminDB');

db.version(2).stores({
  books: '++id, supabase_id, title, author, category, timestamp, synced'
});

// --- FUNÇÕES DE SYNC COM NUVEM ---

// 1. Puxar tudo da Nuvem para o Local (Uso dos Alunos/Professor)
export const pullFromCloud = async () => {
  try {
    const { data: cloudBooks, error } = await supabase
      .from('books')
      .select('*');

    if (error) throw error;

    if (cloudBooks) {
      // Limpa locais e substitui pelos da nuvem para manter consistência total
      // Em apps maiores faríamos um merge, mas aqui o "Master" é a nuvem
      await db.books.clear();
      for (const book of cloudBooks) {
        await db.books.add({
          supabase_id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          format: book.format,
          coverUrl: book.cover_url,
          synopsis: book.synopsis,
          ebookUrl: book.ebook_url,
          timestamp: book.timestamp,
          synced: 1
        });
      }
    }
    return true;
  } catch (err) {
    console.error("Erro no Pull:", err);
    return false;
  }
};

// 2. Enviar Obra para a Nuvem (Uso do Professor)
export const pushToCloud = async (bookData, file = null) => {
  try {
    let finalEbookUrl = bookData.ebookUrl;

    // Se houver arquivo, faz upload para o Supabase Storage
    if (file) {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ebooks')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Pega URL pública
      const { data: publicUrlData } = supabase.storage
        .from('ebooks')
        .getPublicUrl(fileName);
      
      finalEbookUrl = publicUrlData.publicUrl;
    }

    // Salva Metadados no Postgres
    const { data, error } = await supabase
      .from('books')
      .insert([
        {
          title: bookData.title,
          author: bookData.author,
          category: bookData.category,
          format: bookData.format,
          cover_url: bookData.coverUrl,
          synopsis: bookData.synopsis,
          ebook_url: finalEbookUrl,
          timestamp: Date.now()
        }
      ])
      .select();

    if (error) throw error;

    // Atualiza local (Dexie)
    await pullFromCloud(); 
    return true;
  } catch (err) {
    console.error("Erro no Push:", err);
    alert("Erro ao sincronizar com a nuvem. Verifique se a tabela 'books' e o bucket 'ebooks' existem no seu Supabase.");
    return false;
  }
};

// --- FUNÇÕES HELPER ---

export const addBook = async (bookData) => {
  return await db.books.add({
    ...bookData,
    timestamp: Date.now(),
    synced: 0
  });
};

export const updateBook = async (id, bookData) => {
  return await db.books.update(id, {
    ...bookData,
    synced: 0
  });
};

export const deleteBook = async (id, supabaseId) => {
  // Se tiver ID do supabase, deleta lá primeiro
  if (supabaseId) {
    await supabase.from('books').delete().eq('id', supabaseId);
  }
  return await db.books.delete(id);
};

export const getPendingBooks = async () => {
  return await db.books.where('synced').equals(0).toArray();
};

export const markAsSynced = async (id) => {
  return await db.books.update(id, { synced: 1 });
};
