# My Todo App (twtodo)

Aplicativo de lista de tarefas (To-Do List) construído com [Next.js](https://nextjs.org) 16 (App Router), React 19 e Tailwind CSS 4. O projeto foi migrado de uma versão original em HTML/CSS/JS puro (disponível em [ref/my-html-app](ref/my-html-app)) para Next.js.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack e requisitos](#stack-e-requisitos)
- [Setup do ambiente de desenvolvimento](#setup-do-ambiente-de-desenvolvimento)
- [Como rodar (sem Docker)](#como-rodar-sem-docker)
- [Como rodar com Docker](#como-rodar-com-docker)
- [Ambiente de desenvolvimento (Docker)](#ambiente-de-desenvolvimento-docker)
- [Ambiente de produção (Docker)](#ambiente-de-produção-docker)
- [Scripts disponíveis](#scripts-disponíveis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Health check](#health-check)
- [Deploy](#deploy)
- [Estrutura do projeto](#estrutura-do-projeto)

## Funcionalidades

- **Adicionar tarefa**: informe um texto e clique em "Adicionar" (ou pressione Enter).
- **Validação de entrada**:
  - a tarefa precisa ter pelo menos 3 caracteres;
  - a tarefa precisa começar com letra maiúscula (inclusive acentuada).
- **Remover tarefa**: botão "Remover" em cada item da lista.
- **Reordenar tarefas**: botões ↑ / ↓ para mover um item na lista.
- **Persistência local**: as tarefas são salvas no `localStorage` do navegador (chave `todos`), então elas continuam disponíveis após atualizar a página.
- **Endpoint de health check**: `GET /api/health` retorna `{ "status": "ok" }`, usado por Docker/Fly.io para checar se a aplicação está no ar.

## Stack e requisitos

- [Next.js](https://nextjs.org) 16 (App Router, modo `standalone` para deploy)
- React 19 + Tailwind CSS 4
- Node.js 22+ (ou Docker, caso não queira instalar o Node localmente)
- npm (o projeto usa `package-lock.json`)

## Setup do ambiente de desenvolvimento

Pré-requisitos:

1. [Node.js 22+](https://nodejs.org/) e npm instalados **ou** [Docker](https://www.docker.com/) + Docker Compose (recomendado se não quiser instalar Node na máquina).
2. Clonar o repositório e entrar na pasta do projeto:

   ```bash
   git clone <url-do-repositorio>
   cd twtodo
   ```

Depois disso, escolha uma das opções abaixo: rodar direto com Node/npm, ou rodar com Docker.

## Como rodar (sem Docker)

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. A página recarrega automaticamente conforme você edita os arquivos em [src/app](src/app) e [src/components](src/components).

> Rodando em Windows/WSL2 com o projeto em uma pasta montada (ex: `/mnt/c/...`), o hot reload pode não funcionar sem polling. O script `dev` já usa `next dev --webpack` para permitir habilitar `WATCHPACK_POLLING=true` quando necessário (ver seção Docker de desenvolvimento abaixo).

## Como rodar com Docker

O projeto tem dois Dockerfiles e dois arquivos compose, um para desenvolvimento e outro para produção.

| Arquivo            | Uso                                     |
| ------------------- | ---------------------------------------- |
| `Dockerfile.dev`   | Imagem de desenvolvimento (hot reload)   |
| `compose.dev.yaml` | Sobe o app em modo desenvolvimento        |
| `Dockerfile`       | Build multi-stage de produção             |
| `compose.yaml`     | Sobe o app em modo produção                |

## Ambiente de desenvolvimento (Docker)

Sobe o app com hot reload, montando o código-fonte como volume:

```bash
docker compose -f compose.dev.yaml up --build
```

- Aplicação disponível em [http://localhost:3000](http://localhost:3000).
- O código-fonte é montado (`.:/app`), então alterações no host refletem no container.
- `node_modules` e `.next` do container ficam em volumes anônimos, para não serem sobrescritos pelo bind mount do host.
- `WATCHPACK_POLLING=true` é setado para garantir hot reload em bind mounts do WSL2/Windows.

Para derrubar o ambiente:

```bash
docker compose -f compose.dev.yaml down
```

## Ambiente de produção (Docker)

Faz o build multi-stage (deps → build → runner) e sobe o servidor Next.js standalone:

```bash
docker compose up --build
```

- Aplicação disponível em [http://localhost:3000](http://localhost:3000).
- Container roda como usuário não-root (`nextjs`), usando `node server.js` (saída `standalone` do Next.js).
- Há um healthcheck configurado (`GET /api/health`) com retries e intervalo de 30s.

Para derrubar o ambiente:

```bash
docker compose down
```

Também é possível buildar/rodar a imagem de produção sem compose:

```bash
docker build -t twtodo .
docker run -p 3000:3000 twtodo
```

## Scripts disponíveis

| Script          | Descrição                                                 |
| ---------------- | ----------------------------------------------------------- |
| `npm run dev`   | Sobe o servidor de desenvolvimento (`next dev --webpack`)  |
| `npm run build` | Gera o build de produção (`next build`)                     |
| `npm run start` | Sobe o servidor a partir do build de produção                |

## Variáveis de ambiente

| Variável                  | Onde é usada                        | Descrição                                                                             |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `NODE_ENV`                | `compose.yaml` / `compose.dev.yaml`  | `production` ou `development`                                                            |
| `WATCHPACK_POLLING`       | `compose.dev.yaml`                    | Habilita polling de arquivos (necessário em bind mounts WSL2/Windows)                    |
| `PORT`                     | `Dockerfile`                          | Porta em que o servidor standalone escuta (padrão `3000`)                                |
| `HOSTNAME`                 | `Dockerfile`                          | Host em que o servidor escuta (`0.0.0.0` para aceitar conexões externas ao container)     |
| `NEXT_TELEMETRY_DISABLED` | `Dockerfile` / `Dockerfile.dev`       | Desabilita telemetria do Next.js no build/execução                                       |

## Health check

O endpoint [`GET /api/health`](src/app/api/health/route.ts) retorna `{ "status": "ok" }` e é usado:

- pelo `healthcheck` do [compose.yaml](compose.yaml);
- pelo `[[http_service.checks]]` do [fly.toml](fly.toml) durante o deploy no Fly.io.

## Deploy

O deploy é feito no [Fly.io](https://fly.io) usando o `Dockerfile` de produção (build multi-stage com saída `standalone` do Next.js), conforme configurado em [fly.toml](fly.toml).

Pré-requisitos:

- [flyctl](https://fly.io/docs/flyctl/install/) instalado e autenticado (`fly auth login`).

Passos:

```bash
# primeiro deploy / criação do app (se ainda não existir)
fly launch

# deploys subsequentes
fly deploy
```

Detalhes da configuração atual ([fly.toml](fly.toml)):

- App: `twtodo`, região primária `gru` (São Paulo).
- Porta interna: `3000`, com `force_https = true`.
- Máquinas param automaticamente quando ociosas (`auto_stop_machines`) e sobem sob demanda (`auto_start_machines`), com `min_machines_running = 0`.
- Health check HTTP em `/api/health` a cada 30s.
- VM: 1 CPU compartilhada, 1GB de memória.

Também é possível fazer deploy em qualquer outra plataforma que suporte Docker, usando o `Dockerfile` de produção e expondo a porta `3000`.

## Estrutura do projeto

```
src/
  app/
    layout.tsx        # layout raiz, fontes e metadata
    page.tsx           # página inicial (header + TodoApp + footer)
    globals.css         # estilos globais / Tailwind
    api/
      health/route.ts   # endpoint de health check
  components/
    todo-app.tsx         # componente principal da lista de tarefas
ref/
  my-html-app/           # versão original em HTML/CSS/JS puro (referência)
Dockerfile               # build de produção (multi-stage, standalone)
Dockerfile.dev           # build de desenvolvimento (hot reload)
compose.yaml             # orquestração do ambiente de produção
compose.dev.yaml         # orquestração do ambiente de desenvolvimento
fly.toml                 # configuração de deploy no Fly.io
```

## Aprender mais sobre Next.js

- [Documentação do Next.js](https://nextjs.org/docs) — recursos e API do Next.js.
- [Learn Next.js](https://nextjs.org/learn) — tutorial interativo.
- [Repositório do Next.js no GitHub](https://github.com/vercel/next.js).
