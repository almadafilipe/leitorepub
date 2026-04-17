# EduShelf - E-Reader Cloud-Synced 📚

Plataforma mobile-first para gestão e leitura de acervos pedagógicos, desenvolvida para o Professor Sérgio. Focada em acessibilidade, leitura offline e sincronização em tempo real via Supabase.

## 🚀 Tecnologias
- **Frontend**: React + Vite + TailwindCSS
- **Banco Local**: Dexie.js (IndexedDB) para funcionamento 100% Offline-First.
- **Nuvem**: Supabase (Postgres + Storage) para sincronização entre dispositivos.
- **E-Reader**: React Reader (epub.js) para suporte nativo a arquivos .epub.
- **Animações**: Framer Motion.
- **Ícones**: Lucide React.

## 📖 Funcionalidades
- **Gestão de Acervo**: Interface para o professor cadastrar livros, capas e arquivos via UI.
- **Sincronização**: O que o professor publica fica disponível instantaneamente para todos os alunos.
- **Leitura Offline**: Após abrir o livro uma vez, o aluno pode ler sem internet.
- **Upload Local**: Suporte para carregar arquivos .epub e .pdf diretamente no app.

## 🛠️ Configuração Inicial (Supabase)
Para o app funcionar, execute o SQL abaixo no editor do seu projeto Supabase:

```sql
create table books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  category text,
  format text,
  cover_url text,
  synopsis text,
  ebook_url text,
  timestamp bigint default extract(epoch from now()) * 1000
);

alter table books enable row level security;
create policy "Public Access" on books for all using (true) with check (true);

-- No Storage, crie um bucket público chamado 'ebooks'
```

## 📦 Deployment
Hospedado via Surge.sh:
URL: [https://biblioteca-lpt.surge.sh](https://biblioteca-lpt.surge.sh)

## 🕒 Changelog
- **v1.0**: Setup inicial Mobile-First.
- **v1.1**: Implementação do leitor E-PUB.
- **v1.2**: Integração com Supabase (Cloud Sync).
- **v1.3**: Suporte a Upload Local de arquivos.
