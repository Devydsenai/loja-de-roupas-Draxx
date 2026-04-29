# Backend - Draxx

API REST da loja de roupas Draxx.

## Tecnologias
- Node.js + Express
- PostgreSQL (Supabase)
- JWT (autenticação)
- Zod (validação)

## Como executar
1. Copie `.env.example` para `.env`.
2. Preencha `DATABASE_URL` e `JWT_SECRET`.
3. Rode o SQL em `database/schema.sql` no Supabase SQL Editor.
4. Instale dependências e suba a API:

```bash
npm install
npm run dev
```

## Rotas principais
- `POST /api/auth/register` - cadastro de cliente
- `POST /api/auth/login` - login (cliente, funcionário, admin)
- `GET /api/products` - catálogo público
- `POST /api/products` - criar produto (admin)
- `GET /api/users/me` - perfil do usuário logado
- `POST /api/users/employees` - cadastrar funcionário (admin)
- `GET /api/cart` - carrinho do usuário
- `POST /api/orders` - criar pedido a partir do carrinho
- `GET /api/orders/me` - histórico de compras do cliente
- `GET /api/orders/admin/all` - todas as compras (admin)

## Organização
- `src/modules/*` contém controllers, rotas e schemas por domínio.
- `src/middlewares/*` contém autenticação, validação e erros.
- `database/schema.sql` contém tabelas e tipos para Supabase.
- `docs/` contém levantamento e quadro Kanban/Trello.
