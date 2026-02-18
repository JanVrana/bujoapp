# Context – Stav práce (aktualizováno 2026-02-18)

## Kde jsem skončil
Právě jsem vytvořil CLAUDE.md pro projekt. Žádný task ještě nebyl zahájen v této session.

## Stav tasků

| # | Úkol | Stav | Poznámky |
|---|------|------|----------|
| 1 | Implement recurring tasks (Step 21) | **Rozpracováno z minulé session** | Byl in-progress před vyčištěním kontextu. Potřeba zkontrolovat co už je v API `PATCH /api/tasks/:id` při dokončení recurring tasku – pravděpodobně chybí logika generování nové instance přes rrule. |
| 2 | Add DnD to upcoming view (Step 22) | Čeká | Upcoming view existuje (`app/(app)/upcoming/page.tsx`), potřeba přidat dnd-kit pro přetahování tasků mezi dny. |
| 3 | Add remaining keyboard shortcuts (Step 39) | Čeká | Q/N=quick add, Ctrl+K=search (už funguje přes SearchDialog), 1-6=nav, Space=complete, ↑↓=navigace, Enter=detail, Backspace=delete. |
| 4 | Add mobile swipe actions + haptic (Steps 42-43) | Čeká | Swipe right=complete, swipe left=actions menu. Haptic via `navigator.vibrate()`. TaskItem potřebuje touch event handlery. |
| 5 | Add skeleton loading states (Step 45) | Čeká | `TaskItemSkeleton` komponenta existuje, potřeba wire do loading states v Today, Backlog, Archive views. |
| 6 | Wire onboarding flow (Step 47) | Čeká | `OnboardingFlow` + `ContextTemplateSelector` komponenty existují. Propojit s registrací – po registraci redirect na `/onboarding`, po dokončení nastavit `preferences.onboardingCompleted=true`. |
| 7 | Wire offline/Dexie into hooks (Steps 33-36) | Čeká | `db.ts` (Dexie schema) + `operationQueue.ts` + `sync.ts` existují. Hooks v `use-tasks.ts` a `use-contexts.ts` už mají offline fallback (enqueueOperation při network error). Zbývá: při query čtení z Dexie jako fallback, sync pull do Dexie, Background Sync API registration. |
| 8 | Add deadline filters (Step 41) | Čeká | `TaskFilters` komponenta existuje. Přidat filtry: dnes, tento týden, po deadline. API `/api/tasks` už podporuje `hasDeadline` query param. |

## Doporučené pořadí práce
1. **Recurring tasks (#1)** – bylo rozpracováno, dokončit jako první
2. **Keyboard shortcuts (#3)** – rychlé, velký UX impact
3. **Deadline filters (#8)** – rychlé, TaskFilters už existuje
4. **Skeleton loading (#5)** – rychlé, komponenta existuje
5. **Onboarding (#6)** – komponenty existují, jen propojit
6. **DnD upcoming (#2)** – středně složité
7. **Mobile swipe (#4)** – složitější, touch eventy
8. **Offline/Dexie (#7)** – nejsložitější, hodně moving parts

## Klíčové soubory pro jednotlivé tasky

### Recurring tasks (#1)
- `app/api/tasks/[id]/route.ts` – PATCH handler (při status→done pro recurring task)
- `lib/types.ts` – recurringRule field
- `components/tasks/TaskDetail.tsx` – UI pro nastavení opakování
- Knihovna: `rrule` (už v dependencies)

### Keyboard shortcuts (#3)
- `app/(app)/layout.tsx` – globální event listener
- `lib/stores/ui-store.ts` – quickAddOpen, searchOpen, focusedTaskId
- `components/tasks/TaskItem.tsx` – Space/Enter/Delete handlery

### Offline/Dexie (#7)
- `lib/db.ts` – Dexie schema (hotovo)
- `lib/operationQueue.ts` – queue logic (hotovo)
- `lib/sync.ts` – push/pull logic (hotovo)
- `lib/hooks/use-tasks.ts` – potřeba přidat Dexie fallback reads
- `lib/hooks/use-contexts.ts` – potřeba přidat Dexie fallback reads
- `app/providers.tsx` – OnlineStatusListener (hotovo)

## Poznámky k projektu
- Databáze je SQLite (dev), ne PostgreSQL jak říká spec – pro dev stačí
- Jazyk UI je **čeština**
- Working directory: `/home/claude/bujo-app` (NE `/work`)
- Git: 1 commit (`ae25ce1 Initial implementation`)
- Node modules nainstalované přes pnpm
