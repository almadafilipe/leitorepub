# Offline-First Demo (Prof. Sérgio)

Este projeto é uma demonstração prática do conceito de **Offline-First**, inspirado no repositório do MongoDB Realm, mas adaptado para as tecnologias que você já utiliza (**React + Vite + Dexie.js**).

## 🚀 Objetivo
Mostrar como uma aplicação pode continuar funcional sem internet, armazenando dados localmente e sincronizando-os automaticamente quando a conexão é restabelecida.

## 🛠️ Tech Stack
- **React (Vite)**: Framework principal.
- **Dexie.js**: Wrapper do IndexedDB para armazenamento persistente no navegador.
- **Tailwind CSS**: Estilização premium com Glassmorphism.
- **Framer Motion**: Animações fluidas de feedback.
- **Lucide React**: Ícones modernos.

## 🕹️ Como Testar
1. Acesse o servidor local (geralmente `http://localhost:5174`).
2. Digite uma nota e clique em "Salvar". Você verá que ela fica com o status **"Nuvem OK"** (sincronizada).
3. Agora, clique no botão **"ON-LINE"** para mudar para **"OFF-LINE"**.
4. Salve novas notas. Elas aparecerão com um ícone de relógio e a etiqueta **"LOCAL APENAS"**.
5. Mude o status de volta para **"ON-LINE"**. Observe que o app detecta a conexão e começa a sincronizar as notas pendentes automaticamente.

## 📝 Changelog / Histórico
- **v1.0.0**: Setup inicial, integração com Dexie, lógica de sincronização simulada e UI Premium Dark Mode.

---
*Desenvolvido por Antigravity para Sérgio - Vibe Coding 2026*
