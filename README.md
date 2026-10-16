<!-- Banner -->
<p align="center">
  <img src="assets/img/banner-header.svg" alt="banner" />
</p>

<!-- Typing subtitle -->
<p align="center">
  <a href="https://github.com/Mnourkh01">
    <img src="assets/img/typing.svg" alt="typing" />
  </a>
</p>

<!-- Primary CTAs -->
<p align="center">
  <a href="https://github.com/Mnourkh01/echoflow-releases/releases/latest">
    <img src="assets/img/badge-download-echoflow-for-windows-00c24e-for-the-badge.svg" alt="Download EchoFlow" />
  </a>
  &nbsp;
  <a href="https://portfolio.m-nourkh01.workers.dev">
    <img src="assets/img/badge-live-portfolio-7f52ff-for-the-badge.svg" alt="Live portfolio" />
  </a>
</p>

<!-- Quick facts -->
<p align="center">
  <img src="assets/img/badge-amman-jordan-2e3440-flat-square.svg" alt="Location" />
  <a href="https://portfolio.m-nourkh01.workers.dev"><img src="assets/img/badge-portfolio-0b0f0c-flat-square.svg" alt="Portfolio" /></a>
  <a href="https://www.linkedin.com/in/mohammad-nour-al-khusheiny-467bbb3b6/"><img src="assets/img/badge-linkedin-0a66c2-flat-square.svg" alt="LinkedIn" /></a>
  <a href="mailto:m.nourkh01@gmail.com"><img src="assets/img/badge-email-d14836-flat-square.svg" alt="Email" /></a>
  <img src="https://komarev.com/ghpvc/?username=Mnourkh01&style=flat-square&color=7F52FF&label=Profile+views" alt="views" />
</p>

<!-- Self-playing snake game, hand-built in animated SVG (no game engine, just SVG + CSS + SMIL) -->
<p align="center">
  <img src="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/main/assets/snake-game.svg" width="92%" alt="Self-playing neon snake game: an autopilot snake runs a winding tour, eats orbs and a gold bonus, grows to length 14, sets a new record and clears the stage" />
</p>

---

## About Me

```kotlin
val mohammad = Developer(
    role       = "Backend-focused Full-Stack Developer",
    company    = "Folowise",
    location   = "Amman, Jordan",
    experience = "2.5+ years shipping to production",
    speaks     = listOf("Kotlin", "Java", "TypeScript", "PHP", "Rust", "SQL"),
    builds     = listOf("Spring Boot", "Ktor", "NestJS", "Next.js", "Laravel", "Tauri"),
    caresAbout = listOf("clean architecture", "API security", "production readiness"),
    motto      = "Get the fundamentals right before reaching for the clever stuff."
)
```

I started on the backend (Kotlin, Java, Spring Boot) and grew outward into TypeScript, PHP, and Rust across real production work at **Folowise**. My deepest build is a **multi-tenant commerce engine** (foloengine v3) that powers live storefronts. Alongside it I ship my own products, most recently **EchoFlow**, an offline voice-to-text app for Windows. I care about clean architecture, boundary validation, consistent error envelopes, and systems that behave predictably under load. I own work end to end, from API contracts to CI/CD.

<details>
<summary><b>How I approach production systems</b></summary>

<br>

- Input validation at the API boundary, with a single consistent error envelope.
- Stateless JWT auth, refresh-token rotation with reuse detection, and role-based access control.
- Tenant isolation enforced at the data layer (database per tenant, no cross-tenant access paths).
- Observability through structured logging, Sentry, and request tracing across services.
- Small reversible migrations, CI gates, and predictable rollbacks.

</details>

---

## Featured Work

### EchoFlow · offline voice-to-text for Windows

<p>
  <a href="https://github.com/Mnourkh01/echoflow-releases/releases/latest"><img src="https://img.shields.io/github/v/release/Mnourkh01/echoflow-releases?style=flat-square&label=latest&color=6DB33F" alt="latest release" /></a>
  <a href="https://github.com/Mnourkh01/echoflow-releases/releases/latest"><img src="assets/img/badge-download-windows-x64-00c24e-flat-square.svg" alt="download" /></a>
</p>

> Press a hotkey anywhere in Windows, speak, and your words are typed into whatever app you are in. All on your own machine.

EchoFlow runs **OpenAI Whisper locally on your CPU** through `whisper.cpp` (models from `tiny` to `large-v3-turbo`), so your audio never has to leave the device. Push to talk, it transcribes, then auto-types the result. English and Arabic, with optional **translate / clean / prompt** modes powered by cloud providers (OpenAI, Anthropic) when you want them. It keeps a searchable local history in SQLite, updates itself in one click, evicts idle models from memory, and protects its own window from screen capture.

Built with **Rust + Tauri v2** for a tiny, native footprint, a TypeScript UI, `cpal` for audio capture, and SQLite for history.

<p>
  <img src="assets/img/badge-rust-000000-flat-square.svg" alt="Rust" />
  <img src="assets/img/badge-tauri-v2-24c8db-flat-square.svg" alt="Tauri" />
  <img src="assets/img/badge-whisper-cpp-111111-flat-square.svg" alt="whisper.cpp" />
  <img src="assets/img/badge-typescript-3178c6-flat-square.svg" alt="TypeScript" />
  <img src="assets/img/badge-sqlite-003b57-flat-square.svg" alt="SQLite" />
</p>

### Folowise Commerce Engine · foloengine v3

> My deepest project. A multi-tenant commerce **engine**, not just a store.

The engine is the shared brain and control plane for a fleet of storefronts. It owns **licensing, billing, capability authority, update policy, and operational visibility**, while each website owns its own runtime commerce data (database-per-tenant isolation, no cross-tenant leakage). It ships a **server-side PHP SDK** plus a scoped browser JS client, Stripe-hosted checkout, and 30+ commerce HTTP endpoints. ADR-driven architecture, deployed through GitHub Actions CI, observed with Sentry, and already powering live production storefronts (FoloPrint among them).

<p>
  <img src="assets/img/badge-laravel-ff2d20-flat-square.svg" alt="Laravel" />
  <img src="assets/img/badge-filament-fdae4b-flat-square.svg" alt="Filament" />
  <img src="assets/img/badge-server-side-php-sdk-777bb4-flat-square.svg" alt="PHP SDK" />
  <img src="assets/img/badge-multi-tenant-4169e1-flat-square.svg" alt="Multi-tenant" />
  <img src="assets/img/badge-stripe-checkout-635bff-flat-square.svg" alt="Stripe" />
  <img src="assets/img/badge-sentry-362d59-flat-square.svg" alt="Sentry" />
</p>

---

## More I've Built

| Project | What it is | Stack |
| --- | --- | --- |
| [**EchoFlow**](https://github.com/Mnourkh01/echoflow-releases) ↗ | Offline voice-to-text desktop app, local Whisper, auto-type, EN/AR, live and downloadable | `Rust` `Tauri` `whisper.cpp` `TypeScript` |
| **Warsha** (private beta) | One Windows workspace for terminals and AI coding agents: Claude Code, Codex and Gemini side by side, every pane and AI conversation survives a restart | `Rust` `Tauri v2` `React` `TypeScript` |
| [**Karmetta**](https://karmetta.com) ↗ | Restaurant platform on the engine: QR table ordering, bilingual menu, kitchen display split by station, live in production | `Laravel` `Alpine.js` `Tailwind` |
| [**FoloPrint**](https://foloprint.folowise.com/) ↗ | Print-on-demand storefront running on the engine, live in production | `Laravel` `Filament` `Vite` |
| [**Inside the Harness**](https://inside-the-harness.pages.dev) ↗ | Free interactive course in English and Arabic on how AI agents really work: 30 levels, hands-on labs, narrated videos | `JavaScript` `HTML` `Cloudflare Pages` |
| [**Adaptive AI Skill Assessment**](https://github.com/Mnourkh01/dynamic-wizard-questions) | 25-question adaptive test for technical roles: AI agents do the language work, tested code owns every number, EN/AR | `Next.js` `TypeScript` `Claude Agent SDK` `Prisma` |
| [**FoloPrint Design Studio**](https://github.com/Mnourkh01/FoloPrint-design-studio) | In-browser print design and mockup studio (production print file plus rendered preview per side) | `TypeScript` `React` `Canvas` |
| **qrfolo** | QR product: REST API, web app, and an analytics pipeline | `NestJS` `Prisma` `PostgreSQL` `Redis` `NATS` |
| [**Spring Boot API Starter**](https://github.com/Mnourkh01/Starter-Project) | Backend template: JWT auth + refresh-token rotation, layered structure, global error envelope | `Spring Boot` `Kotlin` `Flyway` |
| [**URL Shortener**](https://github.com/Mnourkh01/url-shortener) | Short links with a Redis-cached redirect hot path and click analytics | `Kotlin` `Spring Boot` `Redis` |
| [**Java 21 Auth Starter**](https://github.com/Mnourkh01/spring-boot-java-starter) | The auth baseline rebuilt in record-driven Java 21, Docker + CI | `Java 21` `Spring Boot` `Docker` |
| [**Portfolio**](https://github.com/Mnourkh01/portfolio) | Matrix-themed developer portfolio, Next.js 15 + GSAP, full-page digital-rain canvas | `Next.js` `React` `GSAP` |
| [**CarVerse**](https://github.com/Mnourkh01/CarVerse-website-project) | Car discovery platform practice build | `Next.js` `React` `Tailwind` |
| **CMS Core Starter** | Reusable, step-gated CMS backend starter package | `NestJS` `Prisma` `TypeScript` |

---

## Tech Stack

**Languages**

![Kotlin](assets/img/badge-kotlin-7f52ff-for-the-badge.svg)
![Java](assets/img/badge-java-ed8b00-for-the-badge.svg)
![TypeScript](assets/img/badge-typescript-3178c6-for-the-badge.svg)
![PHP](assets/img/badge-php-777bb4-for-the-badge.svg)
![Rust](assets/img/badge-rust-000000-for-the-badge.svg)
![SQL](assets/img/badge-sql-336791-for-the-badge.svg)

**Backend**

![Spring Boot](assets/img/badge-spring-boot-6db33f-for-the-badge.svg)
![Spring Security](assets/img/badge-spring-security-6db33f-for-the-badge.svg)
![Ktor](assets/img/badge-ktor-087cfa-for-the-badge.svg)
![NestJS](assets/img/badge-nestjs-e0234e-for-the-badge.svg)
![Laravel](assets/img/badge-laravel-ff2d20-for-the-badge.svg)
![JWT](assets/img/badge-jwt-000000-for-the-badge.svg)

**Frontend & Desktop**

![Next.js](assets/img/badge-next-js-000000-for-the-badge.svg)
![React](assets/img/badge-react-61dafb-for-the-badge.svg)
![Tailwind](assets/img/badge-tailwind-06b6d4-for-the-badge.svg)
![Tauri](assets/img/badge-tauri-24c8db-for-the-badge.svg)

**Data & Infra**

![PostgreSQL](assets/img/badge-postgresql-4169e1-for-the-badge.svg)
![Prisma](assets/img/badge-prisma-2d3748-for-the-badge.svg)
![Redis](assets/img/badge-redis-dc382d-for-the-badge.svg)
![SQLite](assets/img/badge-sqlite-003b57-for-the-badge.svg)
![Flyway](assets/img/badge-flyway-cc0200-for-the-badge.svg)
![Docker](assets/img/badge-docker-2496ed-for-the-badge.svg)
![GitHub Actions](assets/img/badge-actions-2088ff-for-the-badge.svg)

**Tools**

![Git](assets/img/badge-git-f05032-for-the-badge.svg)
![IntelliJ IDEA](assets/img/badge-intellij-000000-for-the-badge.svg)
![Postman](assets/img/badge-postman-ff6c37-for-the-badge.svg)
![Gradle](assets/img/badge-gradle-02303a-for-the-badge.svg)
![Sentry](assets/img/badge-sentry-362d59-for-the-badge.svg)

---

## GitHub Activity

<p align="center">
  <img src="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/main/assets/stats.svg" width="92%" alt="GitHub stats: contributions, commits, pull requests, repos, and most-used languages" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/main/assets/contributions.svg" width="92%" alt="Contribution activity heatmap for the last year" />
</p>

---

<p align="center">
  <img src="assets/img/banner-footer.svg" alt="footer" />
</p>
