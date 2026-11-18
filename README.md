# Statybų rangos įmonė

An interactive Lithuanian construction management prototype. React 19.2, TypeScript strict, Vite 7, Mantine 9, Mantine Form with Zod 4 validation, TanStack Query 5, TanStack Table 8 and React Router 7.

## Run locally

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
```

`npm test` verifies seeded entity references, dates, dependency order, supplier categories, tender-to-contract consistency, estimate arithmetic, domain translations and coverage of all statuses. `npm run build` runs the strict TypeScript check and creates the production build in `dist/`.

## Walkthrough

1. Open a project and inspect its estimate. Edit positions, import the simulated Excel preview, or apply a process template.
2. Open Planning. Drag or resize Gantt bars; dependent work moves when needed. Use Kanban to change statuses and Calendar for dated tasks and processes.
3. Create a tender from an estimate position. Choose category-matched suppliers and recipients, attach Drive references, preview a translated letter and simulate sending.
4. Enter offers, choose a winner and create a contract. The selected supplier, scope and price carry into the draft.
5. Upload a document (maximum 1 MB) or generate a demo draft, submit it for sequential internal approval, send it to the simulated Dokobit flow, and simulate signatures in order. Download the saved signed demo document.
6. Use the sidebar avatar menu to switch to a team member. Complete tasks in My Work, add comments or photos, and open a prefilled Google Calendar event.
7. Switch to Management / Administrator to edit users and roles.

## Data and boundaries

The default UI is Lithuanian; English is available in the sidebar. Language, demo role and mock database persist in browser localStorage. The reference date is 2026-11-18 so overdue examples stay reproducible. The seed contains 7 projects, 12 people, 42 estimate positions, 84 processes, 24 tasks, 9 suppliers, 7 tenders, 6 contracts, 35 documents and 21 handover stages.

This is a browser-local prototype with no backend. Email, Excel import and Dokobit integrations are explicitly simulated. Excel exports generate real `.xlsx` files. Google Calendar links create real event templates without automatically saving events. Seeded Drive links open Drive search; shared document links can be entered through the document form. Demo signatures are not legally valid digital signatures. Roles demonstrate UI behavior and are not a security boundary. Clearing this site's browser storage restores the seed.

## Source layout

`src/features/` contains feature pages, feature APIs, types, planning components, estimate components and seed fixtures. `src/components/` contains reusable tables, forms, drawers and the app shell; `src/config/routes.ts` defines navigation. `src/lib/` holds shared domain types, translation context, persistence and workbook export.
