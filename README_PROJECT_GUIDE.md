# NaturEssence - Project Guide (Single Reference)

This file is the operational reference for the whole project.
Use it to understand architecture, flows, key endpoints, and major changes without scanning all source files.

---

## 1) Project Snapshot

NaturEssence is a full-stack e-commerce platform with:
- Backend: Spring Boot + PostgreSQL
- Backoffice: React + Vite (admin)
- Frontoffice: React + Vite (customer)

Core idea:
- Backoffice manages catalog/content (products, categories, banners, promotions, orders, etc.)
- Frontoffice consumes public APIs and renders live data for visitors/customers

---

## 2) Runtime and Ports

- Backend API: http://localhost:8080
- Backoffice: http://localhost:3000
- Frontoffice: http://localhost:3001

Main API namespaces:
- Public APIs: /api/v1/public/*
- Admin APIs: /api/v1/admin/*
- Auth APIs: /api/v1/auth/*

---

## 3) Repository Layout (High-level)

- Backend/
  - src/main/java/com/ecommerce/
    - controller/
    - service/
    - repository/
    - entity/
    - dto/
    - enums/
    - security/
  - src/main/resources/
    - application.properties

- Frontend/
  - backoffice/
    - src/pages/
    - src/api/
    - src/components/
  - src/ (frontoffice)
    - pages/
    - components/
    - api/

---

## 4) Authentication and User Context

Frontoffice login writes user context in localStorage:
- accessToken
- refreshToken
- user (JSON)

The `user` object contains fields like:
- firstName, lastName, email
- roleName
- segmentName (NOUVEAU, FIDELE, VIP, INACTIF)

This segment is used by frontoffice to request audience-targeted banners.

---

## 5) Banner System (Backoffice -> Backend -> Frontoffice)

### 5.1 Data flow

1. Admin creates/updates banner in backoffice page:
- /bannieres/nouveau
- /bannieres/edit/:id

2. Backoffice sends payload to admin APIs:
- POST /api/v1/admin/banners
- PUT /api/v1/admin/banners/{id}

3. Backend stores and exposes public banners:
- GET /api/v1/public/banners?position=HOMEPAGE_HERO&segment=VIP

4. Frontoffice homepage fetches those banners and renders hero slideshow.

### 5.2 Banner fields linked end-to-end (major)

The following fields are now linked from admin form to front rendering:

- titre -> Hero main title
- sousTitre -> Hero subtitle
- imageUrl -> Desktop hero image
- mobileImageUrl -> Mobile hero image
- videoUrl -> Optional video hero source
- ctaTexte -> CTA button label
- ctaLien -> CTA button target
- ctaType -> Internal/external behavior
- alignement -> Hero text alignment (left/center/right)
- animation -> Banner transition/entry style
- dureeSecondes -> Auto-slide timing
- audience -> Segment targeting logic
- actif/statut/dateDebut/dateFin -> Publication validity
- visibleHomepage -> Include/exclude from homepage list
- visibleMobile -> Show/hide on mobile
- visibleDesktop -> Show/hide on desktop
- priorite/ordre -> Ordering in list

### 5.3 Hero behavior in frontoffice

Homepage uses public banner API and applies:
- device-aware image selection (mobileImageUrl on mobile, imageUrl on desktop)
- device visibility filtering (visibleMobile/visibleDesktop)
- homepage visibility filtering (visibleHomepage)
- CTA behavior by ctaType and link format
- animation classes (fade, slide, zoom, blur, ken-burns)
- auto refresh every 30 seconds + refresh on tab focus/visibility

---

## 6) Backoffice Modules

Main admin pages include:
- Dashboard
- Produits (products)
- Categories
- Collections
- Bannieres
- Promotions
- Commandes
- Clients
- Avis
- Tva/Livraison
- Roles/Permissions

Banner page specifics:
- Add/edit images, mobile image, text, CTA, planning, targeting, animation
- Save to admin API
- Public homepage consumes these values live

---

## 7) Frontoffice Modules

Main pages:
- HomePage
- CategoryPage
- ProductPage
- Login
- Inscription

Navbar behavior:
- Visitor menu: Se connecter / Creer un compte
- Logged-in menu: user identity + profile/order shortcuts + logout

Homepage hero:
- Dynamic banners from API
- Fallback hero if no banner is returned

---

## 8) Key Public API Calls Used by Frontoffice

- GET /api/v1/public/categories/homepage
- GET /api/v1/public/categories
- GET /api/v1/public/products
- GET /api/v1/public/products/{slug}
- GET /api/v1/public/products/parent-category/{id}
- GET /api/v1/public/banners?position=HOMEPAGE_HERO&segment={segment}

---

## 9) Environment and Configuration Notes

Main backend config:
- spring.jpa.hibernate.ddl-auto=update
- app.cors.allowed-origins includes ports 3000 and 3001

Because ddl-auto=update is enabled:
- New banner fields are added to DB schema on backend startup.
- Restart backend after model changes.

---

## 10) Startup / Build Runbook

Backend:
- cd Backend
- .\mvnw.cmd spring-boot:run

Frontend workspace:
- cd Frontend
- npm install
- npm run dev:backoffice
- npm run dev:frontoffice

Build checks:
- npm run build:backoffice
- npm run build:frontoffice
- cd Backend && .\mvnw.cmd -DskipTests compile

---

## 11) Major Changes and Improvements (Changelog)

### 2026-04-16 - Banner linkage major upgrade

- Added mobile banner image support end-to-end:
  - `mobileImageUrl` persisted in backend
  - backoffice uploads/saves real mobile image data
  - frontoffice switches image by viewport

- Linked major banner configuration fields end-to-end:
  - ctaType, alignement, videoUrl
  - visibleHomepage, visibleMobile, visibleDesktop

- Frontoffice homepage upgraded:
  - device-aware banner filtering
  - animation rendering by banner setting
  - optional video hero rendering
  - periodic + focus-based refresh

- Backoffice banner form improved:
  - loads/saves the new fields on create/edit
  - better animation preview support
  - mobile preview uses mobile image first

### 2026-04-16 - Auth UX distinction improvement

- Navbar now distinguishes visitor vs authenticated user:
  - guest dropdown: login/signup
  - logged-in dropdown: identity + logout path

- Added inscription route and page to complete signup flow.

---

## 12) Quick QA Checklist (Banner)

After creating/editing a banner in backoffice:

1. Confirm banner is ACTIF
2. Confirm date range includes today (or leave blank)
3. Confirm audience is correct (ALL or segment)
4. Confirm `visibleHomepage=true`
5. Confirm `visibleDesktop=true` for desktop tests
6. Confirm `visibleMobile=true` for mobile tests
7. Confirm desktop image and mobile image are both present
8. Open frontoffice home:
   - desktop view should show desktop image
   - mobile responsive mode should show mobile image
9. Check title/subtitle/CTA/alignment/animation behavior

---

## 13) Known Limitations / Next Improvements

- Backoffice A/B test UI is present but not yet wired to backend logic.
- Banner scheduling currently uses dates (no persisted hour-level filtering).
- Public endpoint currently returns data wrapped in ApiResponse; keep this contract stable.
- Large JS bundles in backoffice can be split for better performance.

---

## 14) Troubleshooting

If banner does not appear:
- Verify backend is running and API responds:
  - GET /api/v1/public/banners?position=HOMEPAGE_HERO
- Verify banner is ACTIF and audience/date conditions match.
- Verify visibility flags for the current device.
- Hard refresh frontoffice tab.
- Restart backend after schema/model updates.

If backend fails to start after model change:
- Run compile to get exact error:
  - .\mvnw.cmd -DskipTests compile
- Ensure database user has ALTER TABLE permissions.

---

Last updated: 2026-04-16
