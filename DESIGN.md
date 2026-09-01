---
name: Froe
description: Inspectable AI coding work recorded as a sequenced evidence ledger.
colors:
  brass: "#d9a927"
  brass-pale: "#f0ca62"
  danger: "#ff8b73"
  ink: "#11100d"
  deep-ink: "#0b0b09"
  raised: "#211e17"
  chalk: "#f2ecde"
  paper: "#d8cfbd"
  muted: "#aaa08d"
  line: "#675e4f"
  line-soft: "#3f392f"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 5.2rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
  mono-detail:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  square: "0"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0.95rem"
  button-primary-hover:
    backgroundColor: "{colors.brass-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0.95rem"
  button-secondary:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0.95rem"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0.95rem"
  field:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0.7rem"
  workspace-picker:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "1.2rem"
  rail-button:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "0.65rem 1.25rem"
  approval-gate:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "1.2rem 1.75rem"
---

# Design System: Froe

## Overview

**Creative North Star: "The Marking Bench"**

Froe feels like work inspected on a machinist's marking bench: matte charcoal fields hold the work, fine scored rules establish order, chalk-warm text remains legible for long runs, and brass identifies the proof-bearing moments. The interface is dense, explicit, and deliberately unsoftened. Its visual hierarchy comes from sequence, contrast, and ruled structure rather than decorative containers.

The Evidence Ledger is the world's signature expression. User tasks, model statements, Actions, results, approval boundaries, and outcomes all occupy one ordered record with a fixed sequence gutter. Authority is never hidden behind generic chat chrome: decisions appear as high-contrast interruptions inside the same evidence stream.

**Key Characteristics:**

- Matte charcoal surfaces separated by scored one-pixel rules.
- Square controls and containers with no corner rounding.
- Warm, hyperlegible sans-serif text with monospaced operational detail.
- Brass reserved for proof, primary action, active status, and authority boundaries.
- Dense two-column ledger rows that remain legible at the minimum desktop width.

## Colors

The palette is a warm industrial dark scheme: near-black inks form the work surface, chalk and paper tones carry text, and brass is the single proof signal.

### Primary

- **Proof Brass** (`brass`): marks primary actions, active diamonds, the wedge brand mark, user authorship, successful terminal outcomes, and approval gates.
- **Pale Brass** (`brass-pale`): raises interactive emphasis for hover states, links, summaries, and focus-adjacent text without introducing a second hue.

### Secondary

- **Danger Coral** (`danger`): appears only for errors, failed results, invalid fields, and the destructive visual edge of Cancel Run.

### Neutral

- **Bench Ink** (`ink`): default app field and dark text on brass.
- **Deep Bench Ink** (`deep-ink`): recessed rail, code output, secondary controls, and scrollbar track.
- **Raised Charcoal** (`raised`): toolbar, composer, selected user-row field, hover fill, and other structurally raised regions.
- **Chalk White** (`chalk`): strongest headings and primary reading text.
- **Ledger Paper** (`paper`): default interface copy and control text.
- **Dusty Annotation** (`muted`): metadata, paths, hints, captions, and supporting copy.
- **Scored Rule** (`line`): primary dividers, control borders, and structural edges.
- **Soft Score** (`line-soft`): row subdivisions and lower-emphasis separators.

### Named Rules

**The Brass Proof Rule.** Brass marks authorship, evidence-bearing state, primary action, and explicit authority boundaries; no other brand accent competes with it.

**The Semantic Exception Rule.** Danger Coral is reserved for failure, invalid input, and cancellation. It never decorates neutral or successful states.

**The Contrast Ratchet Rule.** When the operating system requests more contrast, annotation and rule tones become lighter while the palette's roles remain unchanged.

## Typography

**Display Font:** Atkinson Hyperlegible Next (with system sans-serif fallbacks)  
**Body Font:** Atkinson Hyperlegible Next (with system sans-serif fallbacks)  
**Label/Mono Font:** `ui-monospace`, SFMono-Regular, Menlo, monospace

**Character:** One highly legible family keeps dense operational screens calm and direct. Weight, tracking, case, and monospace detail create hierarchy without adding a decorative display face.

### Hierarchy

- **Display** (700, fluid `2.6rem` to `5.2rem`, `0.95` line height): onboarding and Workspace-choice statements; tight tracking gives these brief phrases a cut-metal firmness.
- **Headline** (700, `2rem`, approximately `1.2` line height): empty-ledger prompts and major contextual calls to action.
- **Title** (700, `1.25rem`, `1.2` line height): Evidence Ledger and Settings headers.
- **Body** (400, `1rem`, `1.5` line height): tasks, model narration, and explanatory text; long ledger reading is capped near `70–76ch`.
- **Label** (600, `0.68rem`, `0.08em` tracking, uppercase): sequence gutters, rail headings, status metadata, and compact evidence labels.
- **Mono Detail** (400, `0.75rem`, `1.6` line height): commands, paths, structured results, and Action parameters.

### Named Rules

**The Evidence Type Rule.** Natural-language reasoning stays in the hyperlegible sans-serif; executable or machine-shaped evidence switches to monospace.

**The Gutter Label Rule.** Ledger and rail metadata is compact, tracked, and uppercase so it reads as indexing rather than narration.

## Layout

The main operating surface is a fixed-height two-column shell. A `15.5rem` Workspace rail anchors the left edge and the Evidence Ledger occupies the remaining width; the rail tightens to `13.5rem` below `1100px` and `11.75rem` below `920px`. The rail never becomes an overlay in the implemented desktop range, preserving visible Workspace and authority context.

The ledger itself is a centered stream capped at `74rem`. Each row pairs a `7rem` sequence-and-type gutter with flexible evidence content; below `1100px`, the gutter contracts to `6rem`. Repeated padding between roughly `0.5rem` and `2rem` produces a compact but breathable rhythm, with larger fluid spacing reserved for onboarding screens.

Headers, ledger scroll, approval gate, run status, and composer form a vertical operating stack. The ledger owns remaining height and scrolls internally. At heights below `720px`, header, rail, composer, approval, and run-status padding tighten together so decision controls remain visible.

**The Visible Authority Rule.** Workspace, Session state, model, directory authority, MCP status, and Run record remain in the persistent rail throughout active work.

**The Ordered Stream Rule.** Responsive changes may tighten gutters and padding, but they do not reorder or visually detach evidence from its sequence label.

## Elevation & Depth

The system has no resting elevation shadows. Depth is structural: Deep Bench Ink recedes, Raised Charcoal advances, brass interrupts, and one- or two-pixel rules cut surfaces into functional layers. The only shadow-like treatment is the stacked focus ring used to keep controls visible on a brass approval gate.

### Shadow Vocabulary

- **Approval Focus Stack** (`0 0 0 2px var(--brass), 0 0 0 5px var(--ink)`): restores a crisp dark focus boundary when a control sits on the brass authority surface.

### Named Rules

**The Scored-Not-Floating Rule.** Resting surfaces are separated by tone and rules, never by drop shadows, blur, or glass effects.

## Shapes

The form language is uncompromisingly rectilinear. Buttons, fields, pickers, tags, code blocks, and structural containers use square corners (`0` radius). One-pixel rules handle ordinary division; two-pixel rules announce stronger boundaries such as setup limits and the approval transition.

Identity comes from a small set of angular marks rather than rounded silhouettes: the forward wedge represents Froe, rotated squares become status diamonds, and line-built arrows, checks, crosses, and approval marks label evidence without adding filled icon tiles.

**The Square Instrument Rule.** Interactive and informational containers stay square; circles and pills are not part of this system's container vocabulary.

## Components

### Buttons

Buttons feel like compact bench controls: square, firm, and label-forward.

- **Shape:** square corners with a `1px` boundary and a minimum operating height of `2.65rem`.
- **Primary:** Proof Brass background with Bench Ink text, bold label, and `0.6rem 0.95rem` padding; hover shifts to Pale Brass.
- **Secondary:** Deep Bench Ink with Ledger Paper text and a Scored Rule border; hover changes the border to brass and the text to chalk.
- **Danger:** transparent background with Danger Coral border and text; it is used for Cancel Run rather than routine secondary actions.
- **Hover / Focus:** color and border changes are immediate; keyboard focus uses a `3px` Pale Brass outline offset by `3px`. On brass surfaces the focus treatment switches to the Approval Focus Stack.

### Chips

- **Attachment:** square Deep Bench Ink chip with a Scored Rule border, small image mark, filename, and an unboxed remove action.
- **Configured State:** compact uppercase outlined state; brass indicates configured or active, while a Scored Rule and muted text indicate inactive.

### Cards / Containers

- **Corner Style:** square throughout.
- **Background:** containers are role-based fields rather than generic cards—Deep Bench Ink for recession, Raised Charcoal for tool regions, and Proof Brass for proof-bearing interruptions.
- **Shadow Strategy:** none at rest; use ruled separation from Elevation & Depth.
- **Border:** `1px` Scored Rule for standard containment and `2px` boundaries where authority changes.
- **Internal Padding:** compact operating containers generally use `0.75rem–1.75rem`; setup and empty states may use larger fluid spacing.

### Inputs / Fields

- **Style:** square Deep Bench Ink fields with Chalk White input text, Scored Rule border, a minimum height of `2.75rem`, and `0.6rem 0.7rem` internal padding.
- **Labels:** bold compact labels sit above optional Dusty Annotation helper text.
- **Focus:** the global Pale Brass outline remains primary; compact model input also exposes its rule border on focus.
- **Error / Disabled:** invalid and error states switch to Danger Coral. Disabled controls retain form but reduce opacity to `0.55` and use a not-allowed cursor.

### Navigation

The Workspace rail is a continuous Deep Bench Ink column split by full-width rules. Navigation buttons are borderless except for their scored bottom edge, align a small line icon with their label, and fill with Raised Charcoal on hover. Disabled rail actions remain visible during a Run so unavailable authority changes are explicit rather than disappearing.

### Approval Gate

The approval gate is the strongest interruption in the system. It spans the work area in Proof Brass, pairs a square exclamation mark with the reason and machine-shaped details, and places explicit deny/allow actions at the trailing edge. Deny receives initial focus and uses the darkest filled treatment; allow choices remain outlined on brass.

### Evidence Ledger

Every evidence row shares the sequence gutter and content column, then changes only the surface and marker needed to communicate type. Actions and results sit on a subtly warmer dark field, boundaries use a brown-brass field, successful outcomes turn fully brass, and errors use a dark coral field. Machine details remain monospace and can expand in place; they never open a detached card.

### Composer

The composer is docked below the ledger on Raised Charcoal. Its task textarea is borderless and transparent so it reads as part of the workbench, while attachments, model selection, and the primary Start Run control occupy the ruled toolbar beneath it. During a Run, the composer is replaced by a status strip and Cancel Run control rather than left in a misleading editable state.

## Do's and Don'ts

### Do:

- **Do** preserve the two-column ledger row with its visible sequence-and-type gutter for every evidence event.
- **Do** use brass to identify primary action, active status, authored task, outcome, and authority boundary.
- **Do** keep machine-shaped values in monospace and human explanation in Atkinson Hyperlegible Next.
- **Do** separate regions with one-pixel scored rules and reserve two-pixel rules for stronger boundaries.
- **Do** keep Workspace and Session authority visible while a Run is active.

### Don't:

- **Don't** introduce rounded cards, pill buttons, circular status badges, or softened container corners.
- **Don't** add floating shadows, gradients, glass blur, or decorative texture to resting surfaces.
- **Don't** add a second brand accent or use Danger Coral outside failure, invalid-input, and cancellation states.
- **Don't** turn the Evidence Ledger into chat bubbles or detach Actions, approvals, and verification from their ordered sequence.
- **Don't** hide disabled authority-changing actions during a Run; show their unavailable state explicitly.
