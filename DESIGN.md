# Design System

This project is a Vite React TypeScript app using Tailwind CSS v4. shadcn/ui is initialized with `components.json` using the `radix-nova` style, neutral base color, CSS variables, and `src/index.css` as the token source.

Dark mode is already part of the app. `LayoutConfigProvider` toggles `theme-dark` on `document.documentElement`, stores the choice in `show-nin-color-mode`, and Tailwind's `dark:` variant is configured to target `.theme-dark`.

## Color Tokens

Source of truth: `src/index.css`.

| Token | CSS variable | Light value | Dark value |
| --- | --- | --- | --- |
| Background | `--background` | `#ffffff` | `#0f172a` |
| Foreground | `--foreground` | `#111827` | `#e5e7eb` |
| Primary | `--primary` | `#2563eb` | `#60a5fa` |
| Primary foreground | `--primary-foreground` | `#ffffff` | `#0f172a` |
| Secondary | `--secondary` | `#f3f4f6` | `#1f2937` |
| Secondary foreground | `--secondary-foreground` | `#111827` | `#f8fafc` |
| Muted | `--muted` | `#f9fafb` | `#1f2937` |
| Muted foreground | `--muted-foreground` | `#6b7280` | `#a7b3c4` |
| Destructive | `--destructive` | `#dc2626` | `#f87171` |
| Border | `--border` | `#e5e7eb` | `#334155` |
| Input | `--input` | `#e5e7eb` | `#334155` |
| Ring | `--ring` | `#93c5fd` | `#60a5fa` |

Components must consume these semantic variables through Tailwind tokens such as `bg-primary`, `text-foreground`, and `border-border`, or through `var(--token-name)` for custom CSS. Dark-mode overrides must live under `.theme-dark` so they follow the existing application setting.

## Typography

Font family: `--font-sans`, mapped to Inter Variable by shadcn/Tailwind in `src/index.css`.

| Role | CSS variable | Size | Line height |
| --- | --- | --- | --- |
| H1 | `--font-size-h1` | `2.25rem` | `--line-height-heading: 1.15` |
| H2 | `--font-size-h2` | `1.875rem` | `--line-height-heading: 1.15` |
| H3 | `--font-size-h3` | `1.5rem` | `--line-height-heading: 1.15` |
| H4 | `--font-size-h4` | `1.25rem` | `--line-height-heading: 1.15` |
| Body | `--font-size-body` | `1rem` | `--line-height-body: 1.5` |
| Caption | `--font-size-caption` | `0.875rem` | `--line-height-body: 1.5` |
| Code | `--font-size-code` | `0.875rem` | `--line-height-body: 1.5` |

## Spacing

| Token | CSS variable | Value |
| --- | --- | --- |
| 1 | `--space-1` | `0.25rem` |
| 2 | `--space-2` | `0.5rem` |
| 3 | `--space-3` | `0.75rem` |
| 4 | `--space-4` | `1rem` |
| 6 | `--space-6` | `1.5rem` |
| 8 | `--space-8` | `2rem` |
| 12 | `--space-12` | `3rem` |

## Radius

Base radius is `--radius: 0.625rem`.

| Token | CSS variable | Value |
| --- | --- | --- |
| Small | `--radius-sm` | `calc(var(--radius) * 0.6)` |
| Medium | `--radius-md` | `calc(var(--radius) * 0.8)` |
| Large | `--radius-lg` | `var(--radius)` |
| Extra large | `--radius-xl` | `calc(var(--radius) * 1.4)` |

## Shadows

| Token | CSS variable | Value |
| --- | --- | --- |
| Small | `--shadow-sm` | `0 1px 2px rgb(17 24 39 / 0.06)` |
| Medium | `--shadow-md` | `0 8px 24px rgb(17 24 39 / 0.08)` |
| Large | `--shadow-lg` | `0 18px 48px rgb(17 24 39 / 0.12)` |

## Component Standard

All new shared UI components live in `src/components/ui/` and follow shadcn conventions: TypeScript, named exports, `class-variance-authority` variants, and the `cn` helper from `src/lib/utils.ts`.

The first standardized component is `Button` in `src/components/ui/button.tsx`.

Supported variants:

- `primary`: filled brand action using `--primary`.
- `destructive`: quiet destructive action using a light `--destructive` tint, border, and label color; reserved for irreversible actions such as record deletion.
- `secondary`: outlined/muted action using `--secondary` and `--border`.
- `ghost`: subtle action with no default background.

Supported sizes:

- `sm`
- `md`
- `lg`

Disabled buttons use token-driven patterned backgrounds, muted text, and dashed borders so the state is visually distinct without hardcoded colors.

### Global Dialog

Global add/edit flows use `GlobalDialogProvider` from `src/context/GlobalDialogContext.tsx`, built on the shadcn-style primitive in `src/components/ui/dialog.tsx`.

Dialog usage should follow the Linear-inspired application pattern:

- Use a soft `bg-foreground/20` overlay with light backdrop blur.
- Keep the panel large, quiet, and work-focused: `rounded-2xl`, token borders, `bg-background`, and `--shadow-lg`.
- Put entity context in the top breadcrumb row, the main editable object name as the title, and supporting copy in `DialogDescription`.
- Keep form content scrollable while the footer remains fixed at the bottom.
- Use the footer for `キャンセル` plus the primary add/save action.
- New and modify flows should share the same form component where possible by passing `initialValues`, `submitLabel`, and `onSubmit`.

### Tooltips & Popovers

Inline helpful text and micro-copy should use the `Tooltip` component from `src/components/ui/tooltip.tsx` to keep the UI clean, information-dense, and avoid click/hover event conflicts:

- Wrap the trigger and content in `<TooltipProvider delayDuration={200}>`.
- Use an `Info` icon (`w-4 h-4 text-muted-foreground/60 hover:text-primary`) inside `<TooltipTrigger asChild>` as the trigger button.
- Style `<TooltipContent>` with `backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs text-foreground/90 leading-relaxed animate-in zoom-in-95 duration-200 z-50`.
- Always set `side="bottom"` and `align="end"` on `<TooltipContent>` when used next to tab bars or action rows so the popup doesn't obscure adjacent controls.
- Reserve `Popover` from `src/components/ui/popover.tsx` for complex interactive metrics (like project counts) or click-driven dropdown menus.

#### Icon-Button Tooltip Pattern

When an action button contains only an icon (no visible label), the tooltip **replaces** the label and is mandatory for accessibility. Follow this pattern:

```tsx
<TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="primary"
        size="sm"
        className="h-8 w-8 rounded-full px-0 shadow-xs"
        aria-label="ボタンの説明"  {/* always include aria-label */}
      >
        <Icon className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      align="end"
      className="px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
    >
      ボタンの説明
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

- Do **not** use the native `title` attribute — use `TooltipContent` instead.
- The `aria-label` on the button must match the `TooltipContent` text.
- Icon-only buttons must be square (`h-8 w-8 px-0`) and use `rounded-full` for action bars, or `rounded-md` for inline contexts.

### High-Density Tables & Column Reordering

For CRUD/table-intensive interfaces like `CustomerList`, implement high-density data tables:
- **Interactive Drag-and-Drop Columns:** Use `@dnd-kit/core` with `SortableContext` and `horizontalListSortingStrategy` to enable users to drag and reorder columns dynamically.
- **Hover-Activated Navigation Cues:** Add class-based hover styles that shift backgrounds (`bg-muted/40`) and smoothly fade/slide in a right-pointing chevron on the rightmost cell (`group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`).
- **Inline Actions & Metric Popovers:** Standardize inline toggle-actions (e.g. Pin/Unpin) using button components with `e.stopPropagation()` to prevent triggering parent row click handlers. Embed interactive mouse-hover metrics using Popovers to display descriptive breakdowns without leaving the page.

#### Inline Table Selects

Use `Select` from `src/components/ui/select.tsx` for finite editable selections inside data-table rows. Follow the quiet trigger styling established in the minutes page filters without adding a search field.

- Keep row controls compact with an `h-8` trigger and `text-xs`; choose a fixed width appropriate to the cell, such as `w-20`, `w-28`, or `w-52`.
- Use `border-none bg-secondary/50 shadow-none` on normal table select triggers. Apply semantic tints such as `bg-destructive/5 text-destructive border border-destructive/30` only for attention-required states such as an unlinked entity.
- Stop click propagation at the interactive table cell or its wrapper so opening or choosing an option does not navigate the row.
- Reserve searchable `Combobox` controls for long or user-extensible option sets where filtering or quick creation is necessary, such as missing association linking on the minutes page.

### Responsive Multi-Column Layouts & Collapsible Drawers

For object detail interfaces, structure the page into a 3-column architecture for desktop, collapsing gracefully to a single tab-bar column on mobile viewports:
- **Navigation/Filters (Left Column):** Focus on sidebar-nested search query parameters and quick list filtering.
- **Dynamic Content Feed (Center Column):** Keep checklists, audio transcripts, activity summaries, and progress widgets in the primary middle view.
- **Collapsible Context Panel (Right Column):** Utilize a toggleable right drawer (`PanelRightClose`/`PanelRightOpen`) that collapses to a compact `w-13` sidebar when closed. Display vertical writing-mode titles (`[writing-mode:vertical-rl]`) on the collapsed sidebar to save screen real estate.

### Checklist & Task Progress Cards

Feed items and task listings must adopt visual cards (`Card`) using standardized, high-density elements:
- **Checklist Summary Badges:** Use thin borders and primary colored iconography (e.g. `CheckSquare`) displaying completion states (e.g. `チェックリスト 2/5 完了`).
- **Progress Tracking Bars:** Include high-contrast linear progress bars matching entity states (e.g., emerald backgrounds for completed, primary brand colors for active progress).
- **Time/Alert Bounds:** For overdue objects, use a muted alert tint (`bg-destructive/5 border-destructive/40`) and add semantic tags like `期限切れ`.

### URL State Synchronization

All search, pagination, and multi-filter configurations must synchronize state with the browser's address bar using `useSearchParams`:
- Maintain clear and intuitive URL state variables (e.g., `q` for search query, `sort` / `order` for sorting, `page` for paging).
- Ensure state parameters are cleanly restored on page refresh or direct bookmark access.

## Living Style Guide

The visual reference page is available at `/design` and implemented in `src/pages/DesignShowcase.tsx`.
