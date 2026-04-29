# Presentation — NaturEssence (Master’s Thesis)

> Slide-by-slide content + speaking notes. This deck describes the **target solution (final output)**; when relevant, it highlights **status** (already implemented vs to be finalized / integrated).

---

## Slide 1 — Title (Cover Page)
**Full-Stack Architecture & Development**  
**Engineering a predictive and data-driven e-commerce ecosystem**

- Role: Web Development Engineer
- Context: Master’s in Management & Business Strategy
- Tech Stack: Spring Boot, React (Vite), PostgreSQL, FastAPI (ML Services)

**Speaker notes (20–30s)**
- “Hello everyone. As a web development engineer, I will be presenting the full-stack architecture and development of NaturEssence. It's a modern e-commerce ecosystem engineered from the ground up to integrate AI and solve real business strategy challenges.”

---

## Slide 2 — Agenda (use your “Plan” visual)
- Introduction
- Problem statement
- Current-state analysis
- Proposed solution
- Technologies & tools
- Implementation & conclusion

---

## Slide 3 — Introduction (project context)
- Modern e‑commerce requires:
  - **content & catalog administration**
  - **fast, reliable UX**
  - **personalization** (segmentation)
  - **security** (auth, roles)
- NaturEssence delivers this via Backoffice + Frontoffice + API

---

## Slide 4 — Problem statement (value-oriented)
**How to deliver an e‑commerce platform that is:**
- easy to administer (content, promotions, orders)
- consistent end‑to‑end (admin → backend → customer)
- personalized (audience‑targeted homepage banners)
- secure (JWT, protected admin access)

Success indicator:
- admin edits instantly influence frontoffice rendering (e.g., homepage hero banners)

---

## Slide 5 — Current-state analysis (Market Solutions)

| Solution Type | Market Examples | Main Advantages | Major Limitations & Problems |
| :--- | :--- | :--- | :--- |
| **SaaS / Turnkey** | Shopify, PrestaShop | Extremely fast launch, intuitive UI, integrated hosting | Subscription + transaction fees, Vendor Lock-in (data ownership), expensive dependency on third-party AI plugins. |
| **Monolithic CMS** | WordPress (WooCommerce) | Extensive community, thousands of ready-to-use themes and plugins | Aging technical architecture (PHP), heavy plugins severely slow down load times, very hard to inject native Machine Learning without major structural changes. |
| **Enterprise Monoliths** | Magento, Salesforce Commerce | Extremely robust, capable of handling massive transaction volumes | Prohibitive Total Cost of Ownership (TCO) for growing brands, permanent need for dedicated maintenance teams, slow deployment cycles. |

**Speaker notes (30–45s)**
- “Before building NaturEssence, we analyzed the market. Shopify is fast but makes you a tenant of your own data and limits custom AI. WordPress/WooCommerce is popular, but its monolithic architecture quickly hits performance and behavioral tracking limits. NaturEssence was engineered to be the ideal alternative: leveraging React’s flexibility to avoid CMS heavy-lifting, and retaining the freedom to plug in our own algorithms via microservices without being boxed in.”

---

## Slide 6 — Proposed solution (use your “Solution proposée” visual)
Target solution (final output):
- advanced management: products, categories, collections, promotions, orders
- dynamic appearance + **homepage hero banner system**
- secured authentication + roles (admin) and customer segmentation

Planned extensions (phase 2):
- recommendation service (AI)
- behavioral tracking (events) and advanced segmentation
- progressive service decomposition (only if scale/complexity requires it)

---

## Slide 7 — Overall architecture & ports
- Backend API: `http://localhost:8080`
- Backoffice: `http://localhost:3000`
- Frontoffice: `http://localhost:3001`
- ML Services (optional/premium): `http://localhost:8001`

API namespaces:
- Public: `/api/v1/public/*`
- Admin: `/api/v1/admin/*`
- Auth: `/api/v1/auth/*`

AI/ML integration (separate service):
- The platform consumes a FastAPI ML service over HTTP to provide premium features such as product recommendations.

---

## Slide 8 — Security: JWT + user context
Frontoffice stores:
- `accessToken`, `refreshToken`, `user` (incl. `segmentName`)

Backend:
- JWT generation/validation + auth filter (Bearer token)

Backoffice:
- route protection (`RequireAuth`)

---

## Slide 9 — Focus: Banner system end‑to‑end
Why it matters:
- admin‑driven content
- public API exposure
- frontoffice rendering rules (device/segment/dates)

Flow:
1) admin creates/updates banner
2) backend stores & exposes it
3) frontoffice homepage renders hero slideshow

---

## Slide 10 — Banner fields & rendering rules
End‑to‑end fields:
- text, images (desktop + mobile), optional video
- CTA (type/link/label)
- alignment, animation, duration
- audience targeting (segments)
- visibility rules (homepage/mobile/desktop)

Frontoffice behavior:
- device-aware image selection
- filtering by visibility + homepage
- CTA behavior by `ctaType`
- animation classes
- auto refresh + refresh on tab focus

---

## Slide 11 — Demo scenario
1) admin creates `HOMEPAGE_HERO` banner for `VIP`
2) login as a `VIP` user
3) homepage displays correct banner (and mobile image in responsive mode)

---

## Slide 12 — Modules overview
Backoffice:
- products, categories, collections
- banners, appearance, promotions
- orders, clients, reviews
- VAT/shipping, roles/permissions

Frontoffice:
- homepage (dynamic hero), category & product pages
- login + signup
- navbar: guest vs logged-in UX

---

## Slide 13 — Runbook & QA
Run:
- backend: `./mvnw.cmd spring-boot:run`
- frontend: `npm run dev:backoffice`, `npm run dev:frontoffice`

Banner QA checklist:
- status/date/audience match
- visibility flags
- desktop + mobile images present

---

## Slide 14 — AI/ML (Premium) + improvements
AI/ML capability (via ML Services):
- product recommendations served by a FastAPI microservice (port 8001)

Known limitations:
- A/B test UI exists in backoffice but is not wired to backend logic yet
- banner scheduling is date-based (no persisted hour-level filtering)
- public endpoints wrap payloads in `ApiResponse` (contract stability)

Priority improvement:
- performance: split large backoffice bundles

---

## Slide 15 — Conclusion
- complete admin-driven e‑commerce platform
- key differentiator: targeted, device-aware homepage banners
- business value: campaign agility without redeployment

