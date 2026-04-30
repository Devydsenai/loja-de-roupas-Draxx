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
3. Aplique as migrações em `supabase/migrations/` no SQL Editor do Supabase (ou CLI).
4. Instale dependências e suba o servidor:

```bash
npm install
npm run dev
```

O mesmo processo entrega a **API** (`/api`) e o **site estático** em HTML/CSS/JS (`/` — pasta `public/`).

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
- `public/` — vitrine em HTML, Bootstrap (CDN), CSS e JavaScript (sem build).
- `src/modules/*` — controllers, rotas e schemas por domínio.
- `src/middlewares/*` — autenticação, validação e tratamento de erros.
- `src/config/*` — ambiente e pool PostgreSQL.
- `src/lib/logger.js` — logs com timestamp.
- `supabase/migrations/` — SQL versionado para o banco.
