# AGENTS.md – Full Deployment & KPI Dashboard Agent

## 🎯 Objetivo Geral

Você é um **agente de implementação completa**. Sua missão é colocar a aplicação **100% funcional no ar**, integrada com **Supabase** (como banco de dados e autenticação) e **backend Flask**, servindo um **dashboard com KPIs**. Mesmo que os valores comecem em zero, o objetivo é que o sistema esteja **pronto para uso em produção**.

---

## 🛠️ Stack Tecnológica

| Camada             | Tecnologia                                     |
| ------------------ | ---------------------------------------------- |
| **Frontend**       | React + Vite (SPA), TailwindCSS                |
| **Backend**        | Flask (Python), REST API                       |
| **Banco de Dados** | Supabase (PostgreSQL)                          |
| **Auth**           | Supabase Auth + JWT                            |
| **Infraestrutura** | Frontend no **Vercel** e Backend no **Render** |

---

## 🔑 Entregáveis Principais

1. **Autenticação Completa**:

   * Login, registro e gerenciamento de sessão via Supabase Auth.
   * Tokens JWT utilizados para proteger rotas no backend.

2. **Backend Flask**:

   * API REST para CRUD de usuários, leads e KPIs.
   * Integração com Supabase para consultas seguras.

3. **Dashboard Funcional**:

   * Layout limpo com TailwindCSS.
   * Exibição de KPIs (mesmo que todos com valores iniciais 0).
   * Filtros básicos de período (diário, semanal, mensal).

4. **Deploy Automatizado**:

   * Frontend publicado na **Vercel**.
   * Backend com **Render**.
   * Variáveis de ambiente seguras.

5. **Banco de Dados Supabase**:

   * Tabelas criadas conforme DDL já definida (clients, users, etc.).
   * Permissões RLS configuradas.

---

## 🚀 Fluxo de Desenvolvimento

1. **Configuração do Supabase**:

   * Criar projeto no Supabase e configurar tabelas com a DDL.
   * Ativar políticas RLS com permissões adequadas.
   * Configurar chaves `anon` e `service_role`.

2. **Backend Flask**:

   * Criar endpoints RESTful `/auth`, `/dashboard`, `/clients`, `/kpis`.
   * Configurar autenticação JWT validando tokens do Supabase.

3. **Frontend React**:

   * Login e cadastro integrados ao Supabase Auth.
   * Dashboard inicial com cards para KPIs (zerados inicialmente).
   * Navegação entre páginas e rotas protegidas.

4. **Integração & Testes**:

   * Garantir que ao logar o usuário veja o dashboard.
   * Conectar APIs do backend e exibir dados do Supabase.

5. **Deploy Final**:

   * Frontend: Vercel com variáveis de ambiente.
   * Backend: Render conectado ao banco Supabase.
   * Testes ponta a ponta para validar login e exibição de KPIs.

---

## 📊 KPIs Iniciais (Placeholder)

* Total de clientes: **0**
* Leads ativos: **0**
* Interações registradas: **0**
* Receita estimada: **0**

Esses valores serão populados automaticamente quando houver dados.

---

## 🔐 Segurança

* Variáveis de ambiente `.env` para chaves Supabase e secrets JWT.
* RLS configurado para acesso apenas dos dados do usuário autenticado.
* CORS liberado para o frontend.

---

## ✅ Meta Final

Ao concluir este projeto, teremos:

* Um **sistema CRM online**, acessível via browser.
* Backend seguro e escalável.
* Dashboard pronto, sem erros, mesmo com dados iniciais zerados.
* Pipeline de deploy simplificado e documentado.
