# Show-nin Design System

Show-nin is an operational workspace for moving from a recorded conversation to a customer relationship, an active project, and a completed task. The design language is quiet, dense, and action-oriented: information remains visible while the next action is easy to identify.

This document reflects the implemented product surfaces:

| Surface | Reference implementation | Design role |
| --- | --- | --- |
| Projects list | `src/pages/projects/index.tsx` | Searchable, sortable delivery pipeline |
| Minutes list | `src/pages/minutes/index.tsx` | Intake and association workflow for recorded activity |
| Project editor | `src/components/projects/ProjectDialogForm.tsx` | Fast creation with structured metadata |
| Customer detail | `src/pages/customers/[id].tsx` | Relationship workspace with context panel |
| Task detail | `src/pages/tasks/[id].tsx` | Execution, due-date, and progress management |
| Living showcase | `src/pages/design/index.tsx` (`/design`) | Presentation reference for the system |

## Product Principles

1. **Context stays close to action.** Lists expose status, ownership, and association; details keep related records beside the work; dialogs avoid sending users elsewhere to create dependencies.
2. **Dense does not mean noisy.** Borders, muted surfaces, small labels, and carefully limited semantic color establish hierarchy without competing for attention.
3. **Risk is unmistakable.** Missing associations, approaching deadlines, overdue tasks, and destructive actions use the destructive semantic token consistently.
4. **The path is continuous.** Minutes can be linked to customers and projects inline, projects can be created from context, and tasks can be created within detail views.
5. **Responsive views preserve intent.** Desktop uses parallel context panels; small screens switch those panels into tabs and keep creation actions reachable.

## Foundations

The app uses Vite, React, TypeScript, Tailwind CSS v4, and shadcn/ui primitives configured with the `radix-nova` style. `src/index.css` is the source of truth for CSS variables. New UI must prefer semantic utilities such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`, and `border-border`.

`LayoutConfigProvider` enables dark mode by applying `.theme-dark` to `document.documentElement` and persisting the setting in `show-nin-color-mode`. Custom styling must use semantic tokens or provide equivalent `.theme-dark` behavior.

### Color Tokens

| Role | Variable | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Canvas | `--background` | `#ffffff` | `#0f172a` | Page background and inputs |
| Surface | `--card` | `#ffffff` | `#111827` | Cards, tables, and panels |
| Text | `--foreground` | `#111827` | `#e5e7eb` | Primary content |
| Brand/action | `--primary` | `#2563eb` | `#60a5fa` | Selection, links, and primary actions |
| Quiet surface | `--secondary` | `#f3f4f6` | `#1f2937` | Secondary controls |
| Background wash | `--muted` | `#f9fafb` | `#1f2937` | Headers and grouped regions |
| Supporting text | `--muted-foreground` | `#6b7280` | `#a7b3c4` | Labels and timestamps |
| Attention | `--destructive` | `#dc2626` | `#f87171` | Overdue, unlinked, and delete states |
| Delineation | `--border` | `#e5e7eb` | `#334155` | Subtle structure |
| Focus | `--ring` | `#93c5fd` | `#60a5fa` | Keyboard and input focus |

Use amber and emerald only for supporting business states such as medium priority and completion. The blue primary and red destructive tokens carry interactive and risk meaning across every workflow.

### Typography And Shape

Font family is Inter Variable through `--font-sans`.

| Role | Token or utility | Use |
| --- | --- | --- |
| Presentation heading | `--font-size-h1`, bold/tight | Design page hero only |
| Page heading | `text-lg md:text-xl font-bold tracking-tight` | List and detail page titles |
| Object title | `text-2xl sm:text-3xl font-bold tracking-tight` | Dialog primary input |
| Content | `text-sm font-medium` | Values, row information, form text |
| Metadata | `text-xs font-semibold` | Pills, labels, table secondary content |
| Micro-label | `text-[10px]` or `text-[11px] font-bold` | Counts, section labels, timestamps |

The base radius is `--radius: 0.625rem`. Use `rounded-xl` and `rounded-2xl` for content cards and modal groups, `rounded-full` for pills and prominent icon actions, and restrained token shadows (`--shadow-sm` through `--shadow-lg`) to reinforce elevation.

### Spacing Rhythm

Spacing variables in `src/index.css` range from `--space-1` (`0.25rem`) through `--space-12` (`3rem`). In implemented screens:

- `gap-2` to `gap-3` organizes controls, pills, and compact rows.
- `p-3` to `p-4` defines table/detail cards.
- `p-6` defines dialog information groups and page headers.
- `gap-6` to `gap-8` separates presentation sections or major dialog regions.

## Core Surfaces

### Operational Lists

`/projects` and `/minutes` establish the standard list-screen composition:

- Use `AppLayout` with a quiet `bg-muted/5` scrolling workspace and a `bg-background/95 backdrop-blur-md` header surface.
- Keep the page title, contextual tooltip, responsive primary action, expanding `SearchBar`, and filter controls in one clear header band.
- Synchronize search, sorting, filters, and pagination through `useSearchParams`, so an operational view is bookmarkable and recoverable.
- Render data in `ListTableSurface` from `src/components/ui/list-table.tsx`, matching dashboard widget surfaces: `rounded-xl`, `bg-card`, `border border-border/50`, `ring-1 ring-foreground/10`, and `shadow-none`.
- Keep list table header and row dividers quiet with `border-border/50`; reserve stronger borders for selected, dragged, or risk states.
- Support drag-reordered column headers through `@dnd-kit` where users compare many attributes.
- Make full rows navigable, revealing a primary-colored chevron on hover; stop propagation inside editable controls.

Projects use inline selects for finite status and priority changes. Minutes surface missing customer or project associations first and use searchable `Combobox` controls for association and quick creation. This distinction is intentional: predictable states are compact selects; extensible relationships require search and creation.

### Detail Workspaces

Customer and task detail pages provide contextual execution surfaces:

- Desktop customer detail divides work into an item selector, a central activity/task stream, and a collapsible company profile panel. The right panel collapses to a narrow titled rail rather than disappearing.
- Customer records use selected-card treatment (`border-primary`, `ring-primary/20`, `bg-primary/5`) to show which project controls the middle stream.
- Task detail elevates due date, priority, assignee, linked records, and a progress bar in a single readable work record.
- Overdue or near-due work uses `border-destructive/30 bg-destructive/10 text-destructive`; completed progress may use emerald while normal active progress remains primary.
- Mobile replaces parallel panels with tabs while keeping the title and immediate actions visible.

### Creation And Editing Dialogs

Global add/edit flows use `GlobalDialogProvider`, the primitives in `src/components/ui/dialog.tsx`, and the title-first editing pattern in `src/components/ui/linear-dialog.tsx`.

`ProjectDialogForm` is the reference:

- Start with the editable object name as a large, borderless title field.
- Put rapidly changed metadata into compact pill controls below the title: customer, status, priority, labels, owner, and source.
- Permit creating linked customers or members from a combobox without breaking the active flow.
- Group deeper information into quiet two-column cards at desktop widths and one column on small screens.
- Keep long-form notes visually calm and full-width beneath structured metadata.
- Place cancel and primary save/create actions in the persistent dialog footer.

For destructive confirmations, use an explicit destructive icon and message panel followed by a quiet cancel action and a destructive confirmation button.

## Components And Interaction Rules

### Buttons

`src/components/ui/button.tsx` supplies `primary`, `secondary`, `destructive`, and `ghost` variants with `sm`, `md`, `lg`, and `icon` sizes.

- `primary`: one decisive creation or commit action per local surface.
- `secondary`: cancel and supporting actions.
- `ghost`: low-emphasis filters, disclosure, or inline tooling.
- `destructive`: only irreversible or dangerous operations.
- Icon-only actions require an `aria-label`; pair non-obvious actions with `Tooltip`.

### Pills, Badges, And Status

- Use pills for editable metadata in dialogs and compact selected filters.
- Use badges for read-only state or count summaries.
- Use `bg-primary/10 text-primary` for linked/selected/active state.
- Use `bg-destructive/10 text-destructive` for overdue, deletion, or required-association states.
- Avoid adding semantic colors solely for decoration.

### Tooltips, Popovers, And Inline Editing

- Tooltips explain page purpose or label icon-only actions without adding permanent clutter.
- Popovers hold interactive options or compact record previews.
- Inline selects are appropriate for small finite state sets.
- `Combobox` is appropriate when choices are long, searchable, or creatable.
- Any inline interactive element within a clickable row must prevent accidental row navigation.

### Accessibility And Feedback

- Provide visible focus treatment through `ring` tokens and preserve keyboard operability for all controls.
- Never communicate selection, risk, or completion by color alone; combine color with a label, icon, or progress text.
- Keep Japanese action labels direct and consistent: `追加`, `変更を保存`, `キャンセル`, `削除`.
- Use disabled styling only for genuinely unavailable actions; do not hide required workflow context.

## Presentation Reference

The `/design` route, implemented in `src/pages/design/index.tsx`, is a standalone presentation page. It demonstrates:

- the narrative from meeting record to delivery action;
- semantic colors, type, buttons, and status treatments;
- list-screen density and association handling from projects and minutes;
- the title-first project dialog language;
- customer/task contextual detail patterns and responsive behavior.

When product screens evolve, update this document and `/design` together so the reference depicts shipped UI rather than aspirational components.
