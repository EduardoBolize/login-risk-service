# Login Risk Service

[![CI](https://github.com/EduardoBolize/login-risk-service/actions/workflows/ci.yml/badge.svg)](https://github.com/EduardoBolize/login-risk-service/actions/workflows/ci.yml)

Serviço que avalia **em tempo real o risco de uma tentativa de login** e responde com um score (0–100), uma decisão (`ALLOW` / `CHALLENGE` / `DENY`) e os motivos — para que a aplicação cliente decida entre liberar, pedir MFA ou bloquear.

```http
POST /v1/risk/evaluate
x-api-key: dev-api-key

{ "userId": "user-123", "ip": "177.71.0.10", "deviceId": "abc", "success": true }
```

```json
{
  "assessmentId": "4f7c…",
  "score": 80,
  "decision": "DENY",
  "reasons": ["NEW_DEVICE", "IMPOSSIBLE_TRAVEL"],
  "degraded": false,
  "evaluatedAt": "2026-09-23T12:00:00.000Z"
}
```

## Stack

| Camada | Tecnologia |
|---|---|
| API | NestJS (Node.js 22) + Prisma |
| Dados | PostgreSQL (histórico, devices) · Redis (estado quente das regras) |
| Dashboard | React + Vite |
| Infra | AWS (ECS Fargate, RDS, ElastiCache, S3) via Terraform |
| CI/CD | GitHub Actions |

## Motor de regras

Cada regra implementa `RiskRule` (padrão Strategy) com duas fases:

1. **`evaluate`** — leitura pura do estado acumulado de logins anteriores.
2. **`record`** — incorpora o login atual ao estado, *depois* de todas as regras avaliarem.

| Regra | Detecta | Técnica | Peso |
|---|---|---|---|
| `BruteForceRule` | ≥ 5 falhas na mesma conta em 15 min | Redis sorted set (janela deslizante) | 45 |
| `CredentialStuffingRule` | > 5 contas distintas a partir do mesmo IP | Redis set com TTL | 50 |
| `NewDeviceRule` | Device nunca usado num login bem-sucedido | Postgres + cache read-through no Redis | 30 |
| `ImpossibleTravelRule` | Deslocamento > 900 km/h desde o último login | Redis hash + GeoIP + Haversine | 50 |

**Score** = soma dos pesos das regras disparadas (máx. 100) → `< 30 ALLOW` · `30–70 CHALLENGE` · `> 70 DENY`.

**Fail-open:** se uma regra falhar (ex.: timeout de 200 ms no Redis), ela é ignorada, o login é avaliado com as demais e a resposta vem com `degraded: true`. Bloquear todos os logins porque o cache caiu seria pior do que perder um sinal temporariamente.

## Rodando localmente

Pré-requisitos: Node 22, pnpm (`corepack enable`), Docker.

```bash
pnpm install
pnpm infra:up                                  # Postgres + Redis
cp apps/api/.env.example apps/api/.env
pnpm --filter api prisma migrate dev --name init
pnpm dev:api                                   # http://localhost:3000
```

- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/health

Dashboard (em outro terminal):

```bash
cp apps/dashboard/.env.example apps/dashboard/.env
pnpm dev:dashboard                             # http://localhost:5173
```

```bash
pnpm test        # testes unitários
pnpm lint
pnpm simulate    # simula ataques contra a API rodando
```

### Simulação de ataques

`pnpm simulate` executa cenários realistas contra a API e confere cada decisão. Ele também roda na CI como teste de ponta a ponta, com Postgres e Redis reais:

```
✔ Usuário legítimo: primeiro login no laptop (Brasil)
    ALLOW     score   0  —
✔ Device novo: Alice entra pelo celular
    CHALLENGE score  30  NEW_DEVICE
✔ Conta comprometida: Lisboa 30 min depois, device desconhecido
    DENY      score  80  NEW_DEVICE, IMPOSSIBLE_TRAVEL
✔ Brute force: 5 senhas erradas e então a correta
    CHALLENGE score  45  BRUTE_FORCE
✔ Credential stuffing: um IP testando 6 contas
    CHALLENGE score  50  CREDENTIAL_STUFFING
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/v1/risk/evaluate` | Avalia uma tentativa de login |
| `GET` | `/v1/assessments?decision=&userId=&limit=` | Últimas avaliações |
| `GET` | `/v1/assessments/summary` | Contagem por decisão nas últimas 24h |
| `GET` | `/health` | Status do Postgres e do Redis |
