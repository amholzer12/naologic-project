# Naologic — Work Order Schedule Timeline

A pixel-perfect, interactive Gantt-style work order scheduling interface built as part of the Naologic frontend engineering take-home challenge.

---

## Getting Started

**Prerequisites:** Node.js 20+ and npm 11+

```bash
npm install
npm start
```

Then open [http://localhost:4200](http://localhost:4200) in your browser.

---

## What Was Built

A fully interactive **Work Order Schedule Timeline** for a manufacturing ERP system. Users can visualize, create, edit, and delete work orders across multiple work centers on a horizontally-scrollable calendar grid.

---

## Features

### Core

| Feature | Details |
|---|---|
| **Timeline Grid** | Horizontally scrollable Gantt-style grid with fixed left panel |
| **Timescale Zoom** | Switch between Hour / Day / Week / Month views — grid recenters on today |
| **Work Order Bars** | Percentage-positioned bars with name, status badge, and three-dot context menu |
| **Create Panel** | Click any empty grid area to open a slide-in form, pre-filled with the clicked date |
| **Edit Panel** | Click ••• → Edit on any bar to open the same panel pre-populated with existing data |
| **Delete** | Click ••• → Delete to remove a work order instantly |
| **Overlap Detection** | Saving a work order that overlaps an existing one on the same work center shows an inline error banner |
| **Today Indicator** | Subtle vertical line marking the current date on the grid |
| **Date Validation** | End date must be after start date — enforced with a reactive form error |

### Status System

Four statuses with distinct color coding that runs consistently from the grid bars through to the panel dropdown:

- **Open** — Teal
- **In Progress** — Indigo
- **Complete** — Green
- **Blocked** — Amber

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Angular 21 (standalone) | Required |
| Language | TypeScript (strict mode) | Required |
| Styles | SCSS | Required |
| Forms | Reactive Forms (`FormGroup`, `FormControl`, `Validators`) | Required |
| Dropdown | `@ng-select/ng-select` | Required |
| Date Picker | `@ng-bootstrap/ng-bootstrap` (`ngbDatepicker`) | Required |
| CSS Framework | Bootstrap 5 | Required |
| State | Angular Signals (`signal`, `computed`) | Reactive, no external state library needed |
| Testing | Vitest + jsdom | Lightweight, fast |

---

## Architecture

### Signal-Based State

All reactive state lives in `WorkOrderService` as an Angular `signal<WorkOrderDocument[]>`. Components read it directly — no `BehaviorSubject`, no `async` pipe, no `subscribe`. When data changes, the signal notifies every computed consumer automatically.

```typescript
// Service
workOrders = signal<WorkOrderDocument[]>([...]);

// Component — just reads the signal
getBarsForWorkCenter(id: string) {
  return this.svc.workOrders().filter(wo => wo.data.workCenterId === id);
}
```

### Date-to-Pixel Math

Bar positions are computed as percentages of the visible grid range, not fixed pixel values. This means bars stay correctly positioned at any screen width and across all timescales:

```typescript
const left  = ((clampedStart - gridStartMs) / totalMs) * 100;
const width = ((clampedEnd   - clampedStart) / totalMs) * 100;
```

The same math is used in reverse when translating a grid click back into a calendar date, enabling click-to-create with accurate date pre-fill.

### Single Panel Component

One `WorkOrderPanel` component handles both create and edit via a `mode: 'create' | 'edit'` input signal. `ngOnChanges` re-populates the form whenever inputs change, so there's no duplicated form logic.

### Overlap Detection

```typescript
hasOverlap(order, excludeId?) {
  return others.some(o => start < otherEnd && end > otherStart);
}
```

Standard interval overlap check: two ranges overlap when neither ends before the other starts. `excludeId` prevents a work order from flagging itself during an edit.

---

## Project Structure

```
src/
├── app/
│   ├── models/
│   │   └── work-order.models.ts       # WorkOrderDocument, WorkCenterDocument types
│   ├── services/
│   │   ├── work-order.ts              # Signal-based state + CRUD + overlap detection
│   │   └── work-order.spec.ts
│   ├── timeline/
│   │   ├── timeline.ts                # Grid, bar positioning, panel/menu state
│   │   ├── timeline.html
│   │   └── timeline.scss
│   ├── work-order-panel/
│   │   ├── work-order-panel.ts        # Reactive form, create/edit logic, validation
│   │   ├── work-order-panel.html
│   │   └── work-order-panel.scss
│   └── app.config.ts                  # MM.DD.YYYY date formatter, datepicker config
├── styles.scss                        # Global styles, Bootstrap + ng-select imports
```

---

## Sample Data

5 work centers and 8 seed work orders are pre-loaded, covering all four statuses and including multiple non-overlapping orders on the same work center.

| Work Center | Orders |
|---|---|
| Apex Fabrication | Bracket Assembly – Lot 22 (Complete), Fastener Restock Run (Open) |
| Volt Systems | PCB Rework – Batch 7 (In Progress) |
| Meridian Assembly | Drive Housing – Q4 Run (In Progress), Gearbox Rebuild – Series B (In Progress) |
| Harwick Logistics | Outbound Pallet Prep (Blocked) |
| Blackstone Precision | Shaft Turning – Run A (Open), Shaft Turning – Run B (Open) |

---

## Design

UI is implemented pixel-perfect against the provided Sketch file. Key values extracted directly from Sketch inspect:

- **Panel width:** 591px with `border-radius: 12px 0 0 12px`
- **Primary color:** `rgba(86, 89, 255, 1)`
- **Text primary:** `rgba(3, 9, 41, 1)`
- **Text secondary:** `rgba(104, 113, 150, 1)`
- **Border color:** `rgba(200, 207, 233, 1)`
- **Font:** Circular Std (Book 400, Medium 500)
- **Status badges:** exact background/foreground values per status from Sketch

---

## Testing

```bash
ng test --watch=false
```

54 tests across 3 spec files, all passing:

| File | Tests | What's covered |
|---|---|---|
| `work-order.spec.ts` | 15 | CRUD operations, overlap detection edge cases, ID generation |
| `timeline.spec.ts` | 17 | Column generation per timescale, bar positioning math, panel state |
| `work-order-panel.spec.ts` | 21 | Form validation, create vs edit mode, overlap error, output emissions |

---

## If I Had More Time

- **localStorage persistence** — work orders survive a page refresh
- **Animations** — slide-in panel transition, bar appear/remove transitions
- **Infinite scroll** — extend the grid as the user approaches either edge
- **"Today" button** — scroll the grid back to center on the current date
- **Tooltips** — hover a bar to see full dates and work center name
- **Drag to resize** — extend or shrink a work order by dragging its edges

### A Note on the NAOLOGIC Wordmark

The Sketch file renders the NAOLOGIC logo as a vector **Shape** (SVG path), not as live text. Inspecting it via Sketch's CSS export only surfaces the bounding rectangle's dimensions and fill color (`rgba(62, 64, 219, 1)`) — the actual custom letterforms, including the stylized characters, are embedded as path data that isn't accessible through the inspector.

To match it as closely as possible, the current implementation renders the wordmark as styled text using the correct brand color, with **NAO** at font-weight 700 and **LOGIC** at font-weight 400 to approximate the visual weight contrast visible in the design. A pixel-perfect match would require the original SVG asset from the Naologic team.
