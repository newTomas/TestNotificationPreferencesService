# Notification Preferences Service

Сервис управления предпочтениями уведомлений — единый источник правды о том, можно ли
отправить пользователю уведомление заданного типа по заданному каналу с учётом его
настроек, дефолтов, глобальных политик и тихих часов.

## Стек

- **TypeScript** (strict), **Node.js 22**
- **NestJS 11** на **Fastify**
- **PostgreSQL** + **Prisma 7** (driver-адаптер `@prisma/adapter-pg`)
- **Vitest** (unit) + **Cucumber** (исполняемые Gherkin-спецификации) + e2e на **Testcontainers**
- **zod** (валидация и DTO), **pino** (логи), **prom-client** (метрики), **Swagger**

## Быстрый старт (Docker)

```bash
docker compose up --build
```

Поднимается PostgreSQL, разово применяются миграции и seed, затем стартует приложение.

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Метрики: `http://localhost:3000/metrics`
- Health: `GET /healthz` (liveness), `GET /readyz` (readiness, проверяет БД)

## Локальный запуск (без Docker)

```bash
cp .env.example .env                  # DATABASE_URL и прочие переменные
docker run -d --name nps-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=notification_preferences -p 5432:5432 postgres:18
npm install                           # postinstall сгенерирует Prisma Client
npm run prisma:deploy                 # применить миграции
npm run db:seed                       # каталог типов, дефолты, пример политики
npm run start:dev                     # http://localhost:3000
```

## Тесты

```bash
npm test               # unit-тесты доменного движка (Vitest)
npm run test:acceptance # Gherkin-сценарии поверх in-memory адаптеров (без БД)
npm run test:e2e       # сквозные тесты против реального PostgreSQL (Testcontainers, нужен Docker)
npm run typecheck      # проверка типов (tsc --noEmit)
npm run lint           # ESLint
```

## API

| Метод | Путь | Назначение |
|------|------|-----------|
| `GET`  | `/users/:id/preferences` | Эффективные предпочтения: дефолты, перекрытые оверрайдами пользователя |
| `POST` | `/users/:id/preferences` | Включить/выключить тип по каналу и/или задать quiet hours |
| `POST` | `/evaluate` | Решение `allow`/`deny` с машинной причиной |

```bash
# Проверка возможности отправки
curl -X POST localhost:3000/evaluate -H 'content-type: application/json' -d '{
  "userId": "user-1", "notificationType": "marketing_sms",
  "channel": "sms", "region": "EU", "datetime": "2026-05-21T12:00:00Z"
}'
# -> {"decision":"deny","reason":"blocked_by_global_policy"}
```

`POST`-запросы поддерживают заголовок **`Idempotency-Key`**: повтор с тем же ключом и телом
возвращает сохранённый ответ, тот же ключ с другим телом — `409`.

## Архитектура

Гексагональная (ports & adapters). Зависимости направлены внутрь: доменный слой не знает о
NestJS, Prisma и Fastify (граница закреплена ESLint-правилом).

```
src/
  domain/          # чистый TypeScript: типы, движок evaluate, quiet hours, политики
  application/     # use-cases + порты (интерфейсы репозиториев, логгер, метрики)
  infrastructure/  # Prisma-адаптеры, конфиг, наблюдаемость (pino, prom-client)
  interfaces/http/ # NestJS-контроллеры, DTO (zod), фильтр ошибок, интерсептор идемпотентности
```

- **Движок `evaluate`** — чистая функция без I/O; момент времени берётся из запроса, поэтому
  решение детерминировано и полностью покрыто unit-тестами.
- **Порты с DI-токенами** связываются с Prisma-адаптерами в инфраструктурном модуле; в тестах
  подменяются in-memory реализациями.
- **Каталог типов** хранит признак `suppressibleInQuietHours` как данные — движок не содержит
  правил про конкретные категории.

## Правила принятия решения

Упорядоченный приоритет (срабатывает первое правило). Авторитетность:
**политика (комплаенс) → выбор пользователя → дефолт → время (тихие часы)**.

| # | Условие | Решение | reason |
|---|---------|---------|--------|
| 1 | Глобальная DENY-политика (тип/канал/регион) | `deny` | `blocked_by_global_policy` |
| 2 | Пользователь отключил тип+канал | `deny` | `disabled_by_user` |
| 3 | Глобальная ALLOW-политика (исключение) | `allow` | `allowed_by_global_policy` |
| 4 | Дефолт выключен (нет оверрайда) | `deny` | `disabled_by_default` |
| 5 | Активны тихие часы и тип подавляемый | `deny` | `blocked_by_quiet_hours` |
| 6 | Иначе | `allow` | `allowed_by_user` / `allowed_by_default` |

Ключевые трактовки: глобальный **запрет** (комплаенс) выше любого согласия; при этом
**разрешающая** политика не перекрывает явный опт-аут пользователя — её роль в том, чтобы
включить выключенный по умолчанию тип. Тихие часы
подавляют только маркетинговые уведомления, транзакционные проходят всегда. Тихие часы
сравниваются по «минутам дня» в таймзоне пользователя — корректно к переходу через полночь и
к переводу часов (DST). Идемпотентность изменений достигается декларативным upsert по ключу
`(userId, notificationType, channel)` плюс заголовком `Idempotency-Key`.

## Наблюдаемость

- Структурные JSON-логи (pino) с correlation id (`x-request-id` или сгенерированный).
- Ключевые события: `preference_changed`, `notification_decision`.
- Метрики Prometheus на `/metrics`: `notification_decisions_total{decision,reason}`,
  `preference_changes_total`. Метрики скрыты за портом — в тестах используется no-op.

## Что добавил бы при доведении до продакшена

- Распределённый трейсинг (OpenTelemetry) и гистограммы latency.
- Несколько окон тихих часов и индивидуальные окна по каналам.
- Версионирование/эффективное датирование глобальных политик.
- Кэш дефолтов и политик (read-through), они меняются редко.
- Публикация событий об изменении предпочтений (outbox) для остальных модулей.
- Очистка `idempotency_keys` по TTL, rate limiting, мультиарендность (RLS).
