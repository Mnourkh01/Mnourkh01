<!-- Banner -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6DB33F,100:7F52FF&height=190&section=header&text=Mohammad%20Nour&fontSize=58&fontColor=ffffff&fontAlignY=36&desc=Backend-focused%20Full-Stack%20Developer%20%40%20Folowise&descAlignY=58&descSize=18" alt="banner" />
</p>

<!-- Typing subtitle -->
<p align="center">
  <a href="https://github.com/Mnourkh01">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=6DB33F&center=true&vCenter=true&width=680&lines=Backend-focused+Full-Stack+Developer;Building+foloengine+v3%2C+a+multi-tenant+commerce+engine;Shipping+EchoFlow%2C+offline+voice-to-text+for+Windows;Kotlin+%7C+Java+%7C+TypeScript+%7C+PHP+%7C+Rust;Spring+Boot+%7C+Ktor+%7C+NestJS+%7C+Next.js+%7C+Tauri;Clean+architecture+%2B+secure%2C+production-ready+systems" alt="typing" />
  </a>
</p>

<!-- Primary CTAs -->
<p align="center">
  <a href="https://github.com/Mnourkh01/echoflow/releases/latest">
    <img src="https://img.shields.io/badge/Download%20EchoFlow%20for%20Windows-00C24E?style=for-the-badge&logo=windows&logoColor=white&labelColor=0B0F0C" alt="Download EchoFlow" />
  </a>
  &nbsp;
  <a href="https://portfolio.m-nourkh01.workers.dev">
    <img src="https://img.shields.io/badge/Live%20portfolio-7F52FF?style=for-the-badge&logo=react&logoColor=white&labelColor=0B0F0C" alt="Live portfolio" />
  </a>
</p>

<!-- Quick facts -->
<p align="center">
  <img src="https://img.shields.io/badge/Amman,%20Jordan-2E3440?style=flat-square&logo=googlemaps&logoColor=white" alt="Location" />
  <a href="https://portfolio.m-nourkh01.workers.dev"><img src="https://img.shields.io/badge/Portfolio-0B0F0C?style=flat-square&logo=react&logoColor=00ff5f" alt="Portfolio" /></a>
  <a href="https://www.linkedin.com/in/mohammad-nour-alkhusheiny-467bbb3b6/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="mailto:m.nourkh01@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
  <img src="https://komarev.com/ghpvc/?username=Mnourkh01&style=flat-square&color=7F52FF&label=Profile+views" alt="views" />
</p>

<!-- Self-playing snake game, hand-built in animated SVG (no game engine, just SVG + CSS + SMIL) -->
<h3 align="center">A real snake game, hand-built in pure animated SVG. The autopilot runs a winding Hamiltonian tour, the D-pad shows its inputs live, and the stage clears itself. No JS, no game engine.</h3>

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
  <a href="https://github.com/Mnourkh01/echoflow/releases/latest"><img src="https://img.shields.io/github/v/release/Mnourkh01/echoflow?style=flat-square&label=latest&color=6DB33F" alt="latest release" /></a>
  <a href="https://github.com/Mnourkh01/echoflow/releases/latest"><img src="https://img.shields.io/badge/Download-Windows%20x64-00C24E?style=flat-square&logo=windows&logoColor=white" alt="download" /></a>
  <a href="https://github.com/Mnourkh01/echoflow"><img src="https://img.shields.io/badge/Source-1f2328?style=flat-square&logo=github&logoColor=white" alt="source" /></a>
  <img src="https://img.shields.io/github/stars/Mnourkh01/echoflow?style=flat-square&color=ffd166&label=stars" alt="stars" />
</p>

> Press a hotkey anywhere in Windows, speak, and your words are typed into whatever app you are in. All on your own machine.

EchoFlow runs **OpenAI Whisper locally on your CPU** through `whisper.cpp` (models from `tiny` to `large-v3-turbo`), so your audio never has to leave the device. Push to talk, it transcribes, then auto-types the result. English and Arabic, with optional **translate / clean / prompt** modes powered by cloud providers (OpenAI, Anthropic) when you want them. It keeps a searchable local history in SQLite, updates itself in one click, evicts idle models from memory, and protects its own window from screen capture.

Built with **Rust + Tauri v2** for a tiny, native footprint, a TypeScript UI, `cpal` for audio capture, and SQLite for history.

<p>
  <img src="https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Tauri%20v2-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/whisper.cpp-111111?style=flat-square" alt="whisper.cpp" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
</p>

### Folowise Commerce Engine · foloengine v3

> My deepest project. A multi-tenant commerce **engine**, not just a store.

The engine is the shared brain and control plane for a fleet of storefronts. It owns **licensing, billing, capability authority, update policy, and operational visibility**, while each website owns its own runtime commerce data (database-per-tenant isolation, no cross-tenant leakage). It ships a **server-side PHP SDK** plus a scoped browser JS client, Stripe-hosted checkout, and 30+ commerce HTTP endpoints. ADR-driven architecture, deployed through GitHub Actions CI, observed with Sentry, and already powering live production storefronts (FoloPrint among them).

<p>
  <img src="https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/Filament-FDAE4B?style=flat-square&labelColor=FDAE4B&color=1f1f1f" alt="Filament" />
  <img src="https://img.shields.io/badge/Server--side%20PHP%20SDK-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP SDK" />
  <img src="https://img.shields.io/badge/Multi--tenant-4169E1?style=flat-square" alt="Multi-tenant" />
  <img src="https://img.shields.io/badge/Stripe%20Checkout-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Sentry-362D59?style=flat-square&logo=sentry&logoColor=white" alt="Sentry" />
</p>

---

## More I've Built

| Project | What it is | Stack |
| --- | --- | --- |
| [**EchoFlow**](https://github.com/Mnourkh01/echoflow) ↗ | Offline voice-to-text desktop app, local Whisper, auto-type, EN/AR, live and downloadable | `Rust` `Tauri` `whisper.cpp` `TypeScript` |
| [**FoloPrint**](https://foloprint.folowise.com/) ↗ | Print-on-demand storefront running on the engine, live in production | `Laravel` `Filament` `Vite` |
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

![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

**Backend**

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![Ktor](https://img.shields.io/badge/Ktor-087CFA?style=for-the-badge&logo=ktor&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**Frontend & Desktop**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)

**Data & Infra**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

**Tools**

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ-000000?style=for-the-badge&logo=intellijidea&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)

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
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:7F52FF,100:6DB33F&height=110&section=footer" alt="footer" />
</p>
