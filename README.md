<!-- Banner -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6DB33F,100:7F52FF&height=190&section=header&text=Mohammad%20Nour&fontSize=58&fontColor=ffffff&fontAlignY=36&desc=Backend-focused%20Full-Stack%20Developer%20%40%20Folowise&descAlignY=58&descSize=18" alt="banner" />
</p>

<!-- Typing subtitle -->
<p align="center">
  <a href="https://github.com/Mnourkh01">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=6DB33F&center=true&vCenter=true&width=640&lines=Backend-focused+Full-Stack+Developer;Building+foloengine+v3%2C+a+multi-tenant+commerce+engine;Kotlin+%7C+Java+%7C+TypeScript+%7C+PHP;Spring+Boot+%7C+Ktor+%7C+NestJS+%7C+Next.js+%7C+Laravel;Clean+architecture+%2B+secure%2C+production-ready+APIs" alt="typing" />
  </a>
</p>

<!-- Quick facts -->
<p align="center">
  <img src="https://img.shields.io/badge/Amman,%20Jordan-2E3440?style=flat-square&logo=googlemaps&logoColor=white" alt="Location" />
  <img src="https://img.shields.io/badge/Full--Stack-6DB33F?style=flat-square&logo=spring&logoColor=white" alt="Role" />
  <a href="mailto:m.nourkh01@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
  <img src="https://komarev.com/ghpvc/?username=Mnourkh01&style=flat-square&color=7F52FF&label=Profile+views" alt="views" />
</p>

---

## 👋 About Me

```kotlin
val mohammad = Developer(
    role     = "Backend-focused Full-Stack Developer",
    company  = "Folowise",
    location = "Amman, Jordan",
    speaks   = listOf("Kotlin", "Java", "TypeScript", "PHP", "SQL"),
    builds   = listOf("Spring Boot", "Ktor", "NestJS", "Next.js", "Laravel"),
    caresAbout = listOf("clean architecture", "API security", "production readiness"),
    motto    = "Get the fundamentals right before reaching for the clever stuff."
)
```

I started on the backend (Kotlin, Java, Spring Boot) and grew outward into TypeScript and PHP across real production work at **Folowise**. My strongest build is a **multi-tenant commerce engine** (foloengine v3) that powers live storefronts, plus a QR product, CMS starters, and storefronts around it. I care about clean architecture, boundary validation, consistent error envelopes, and APIs that behave predictably under load. Roughly a year in, and shipping for real.

---

## 🛠️ Tech Stack

**Languages**

![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

**Backend**

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![Ktor](https://img.shields.io/badge/Ktor-087CFA?style=for-the-badge&logo=ktor&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Data & Infra**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
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

## ⭐ Featured: Folowise Commerce Engine (foloengine v3)

> My strongest project. A multi-tenant commerce **engine**, not just a store.

The engine is the shared brain and control plane for a fleet of storefronts. It owns **licensing, billing, capability authority, update policy, and operational visibility**, while each website owns its own runtime commerce data (DB-per-tenant isolation, no cross-tenant leakage). It ships a **server-side PHP SDK** plus a scoped browser JS client, Stripe-hosted checkout, and 30+ commerce HTTP endpoints. ADR-driven architecture, deployed through GitHub Actions CI, observed with Sentry, and already powering live production storefronts (FoloPrint among them).

<p>
  <img src="https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/Filament-FDAE4B?style=flat-square&logo=laravel&logoColor=white" alt="Filament" />
  <img src="https://img.shields.io/badge/PHP%20SDK-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP SDK" />
  <img src="https://img.shields.io/badge/Multi--tenant-4169E1?style=flat-square" alt="Multi-tenant" />
  <img src="https://img.shields.io/badge/Stripe%20Checkout-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Sentry-362D59?style=flat-square&logo=sentry&logoColor=white" alt="Sentry" />
</p>

---

## 🚀 More I've Worked On

| Project | What it is | Stack |
| --- | --- | --- |
| **FoloPrint** | Print-on-demand storefront running on the engine, live in production | `Laravel` `Filament` `Vite` |
| **qrfolo** | QR product: REST API, web app, and an analytics pipeline | `NestJS` `Prisma` `PostgreSQL` `Redis` `NATS` |
| **CMS Core Starter** | Reusable, step-gated CMS backend starter package | `NestJS` `Prisma` `TypeScript` |
| **CarVerse** | Premium car discovery platform | `Next.js` `React` `Tailwind` |
| **Spring Boot API Starter** | Backend template: JWT security, layered structure, global error handling | `Spring Boot` `Spring Security` `Flyway` |
| **FoloStore** | WordPress + WooCommerce starter theme built from editable patterns | `WordPress` `WooCommerce` `Elementor` |

---

## 🌱 Currently Learning

- Advanced Spring Security and JWT (access + refresh, rotation)
- Microservices and message-driven systems
- Testing: JUnit, integration tests, and contract tests
- CI/CD with GitHub Actions

---

## 📊 GitHub Stats

<p align="center">
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=Mnourkh01&show_icons=true&hide_border=true&theme=tokyonight&count_private=true&include_all_commits=true" alt="stats" />
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=Mnourkh01&layout=compact&hide_border=true&theme=tokyonight&langs_count=8" alt="top langs" />
</p>

<p align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=Mnourkh01&hide_border=true&theme=tokyonight" alt="streak" />
</p>

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=Mnourkh01&theme=tokyonight&no-frame=true&no-bg=true&margin-w=4&row=1&column=7" alt="trophies" />
</p>

<p align="center">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=Mnourkh01&theme=tokyo-night&hide_border=true&area=true&custom_title=Contribution%20Graph" alt="activity graph" />
</p>

---

## 🐍 Watch the snake eat my contributions

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/output/github-snake-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/output/github-snake.svg" />
    <img alt="github contribution snake animation" src="https://raw.githubusercontent.com/Mnourkh01/Mnourkh01/output/github-snake.svg" />
  </picture>
</p>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:7F52FF,100:6DB33F&height=110&section=footer" alt="footer" />
</p>
