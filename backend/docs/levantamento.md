# Levantamento do Projeto Draxx

## Regras de Negócio
- Apenas usuário autenticado pode finalizar compra.
- Cliente pode adicionar itens ao carrinho sem comprar; checkout exige login.
- CPF e e-mail são únicos por usuário.
- Apenas `admin` pode cadastrar funcionários (`employee`).
- Apenas `admin` pode criar, editar e remover produtos.
- Produto inativo não pode ser comprado.
- Quantidade comprada não pode ultrapassar o estoque disponível.
- Toda compra gera histórico por cliente.
- Pedido deve registrar forma de pagamento: `PIX`, `CARTAO` ou `BOLETO`.

## Requisitos Funcionais
- Cadastro e login de clientes.
- Login de funcionários e administrador.
- CRUD de produtos (admin).
- Carrinho do cliente (adicionar, atualizar, remover, listar).
- Fechamento de pedido com baixa de estoque.
- Histórico de compras por cliente.
- Listagem geral de compras para administração.
- Edição de perfil do cliente e funcionários.

## Requisitos Não Funcionais
- API REST padronizada.
- Segurança com JWT + autorização por papel.
- Senhas armazenadas com hash (`bcrypt`).
- Tratamento centralizado de erros.
- Validação de entrada com `zod`.
- Código modular e documentado.
- Compatível com PostgreSQL/Supabase.

## Critérios de Entrega (06/05/2026)
- Banco criado no Supabase com `database/schema.sql`.
- Endpoints principais disponíveis e testáveis via Insomnia/Postman.
- Usuário admin inicial configurado.
- Documentação mínima para setup e rotas.
