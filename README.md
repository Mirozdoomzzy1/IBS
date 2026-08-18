# Enterprise System Design Studio — v1

A local-first HTML/CSS/JavaScript prototype for designing an enterprise system before implementation.

## Included

- Left navigation
- 9 core modules:
  - Personnel
  - Medical
  - Operation
  - Payroll
  - Finance
  - Legal
  - Transfer
  - Cost
  - General
- Layer 1: Business Requirements
- Layer 2: Screen Designer
- Layer 3: ERD / Database Designer
- Layer 4: Backend Logic
- CRUD dialogs for modules, requirements, screens, entities, relationships, APIs and workflows
- Visual ERD canvas with draggable tables and saved coordinates
- Screen component designer with entity/field mapping
- Requirement traceability matrix
- Basic validation engine
- Documentation HTML export
- Traceability CSV export
- JSON project export/import
- LocalStorage persistence

## Run

No build tools are required.

Open:

    index.html

in a modern browser.

For best results, use a local static server:

    python -m http.server 8080

Then browse to:

    http://localhost:8080

## Data

The prototype stores its working project in browser localStorage under:

    enterpriseSystemDesignStudio

Use "Save JSON" / "Export" to create a portable project file.

## Next recommended evolution

1. Replace localStorage with an API + Oracle/PostgreSQL.
2. Add user accounts and role-based access.
3. Add true drag/drop screen layout.
4. Add field-level traceability.
5. Add Oracle DDL generation.
6. Add OpenAPI generation.
7. Add React component generation.
8. Add .NET/Node backend skeleton generation.


## Architecture Map

The **Architecture Map** page provides a one-page circular view of the system:

- **Center:** Employee & Client as the core business context.
- **Middle ring:** the 9 modules.
- **Inside each module:** compact business-requirement notes and screen markers.
- **Outer ring:** ERD entities.
- **Module → Entity lines:** indicate entity ownership by module.
- **Entity → Entity lines:** visualize the stored ERD relationships.
- Click a module to open its requirements.
- Click an ERD entity to open the ERD designer.


## v3 navigation + technical architecture

The Architecture Map is now a true project navigation hub:

- Global navigation buttons open every major Design Studio page.
- Each module has direct **Req / Screens / ERD / Backend** shortcuts.
- The technical architecture page documents the recommended **React + TypeScript → ASP.NET Core → Oracle** stack.
- The technical page includes seven layers, request flow, security boundaries, and mapping from Design Studio artifacts to implementation artifacts.


## Detailed Screen Designer

The Screen Designer is a visual UI workspace with:

- Screen library by module
- Component palette with searchable controls
- Desktop / tablet / mobile canvas modes
- Drag-style visual component cards
- Component duplication and deletion
- Detailed component properties
- Oracle entity/field mapping
- API field mapping
- Required/read-only/visibility behavior
- Validation-oriented metadata
- Component-level comments
- Screen-level comments
- Preview mode
- Direct links to Requirements, ERD, Backend and Traceability
- Local persistence

## v6 additions

- Master Timeline / Project Plan with Gantt view, dates, status, priority, owner, dependencies and comments.
- Timeline CRUD with editable work items and a rebuildable default delivery plan.
- All nine modules now have a starter screen library (list/form/details/dashboard/approval/report screens as appropriate).
- Screen Designer opens from a global screen catalog and module-specific screen libraries.
- Screen component properties are persisted locally, including label, data mapping, API field, required/read-only behavior and comments.
- Screen property tabs now navigate to the relevant configuration sections.

## V9 Enhancements

### Screen Designer
- Live item inspector with basic, data mapping, validation, behavior and comments sections.
- Property changes persist without losing typing focus.
- Screen components can be reordered by drag/drop or Move Up / Move Down.
- Width controls (Full / Half / Third) affect the canvas layout.
- Duplicate/delete/edit controls remain available per component.

### Interactive ERD
- Explicit source → target connection mode.
- Click a table's Connect icon, then click the target table.
- Connections are persisted in `project.relations`.
- Relationship list supports edit/delete.
- Full Project ERD uses the same relationship model.
- Tables can be dragged around and positions are saved.

### 3D System View
- New `3D System View` page with a perspective layer stack.
- Carousel navigation through Requirements, Screens, Oracle ERD, TypeScript API/Logic, Traceability and Validation.
- Each layer shows live project counts and direct navigation.


## v12 Harmonized Workspace

- Removed the 3D System View entirely.
- One Screen Designer implementation with a live component inspector.
- Screen components support add, select, edit, duplicate, move up/down, delete, mapping, validation and comments.
- Full and module ERDs share the same relationship model.
- ERD connections use explicit source-table then target-table selection and persist to local JSON.
- Relationship list provides a reliable fallback for editing/deleting connections.
- Navigation carousel exposes all major workspace pages.


## V12 updates

- Fully responsive mobile layout across the studio.
- Mobile slide-out navigation with backdrop.
- Screen Designer stacks cleanly on phones and keeps the canvas horizontally scrollable.
- ERD and architecture canvases remain usable on small screens through controlled horizontal scrolling.
- Passwords are never displayed in the login or user-management UI. Existing demo credentials are migrated to the local demo password `123`; change them before any real deployment.
- Editing an existing user never pre-fills or reveals the stored password.

## v13 module-first redesign

The navigation and information model are now centered on the **System Blueprint**:

- **System Blueprint** is the primary entry point and displays all modules on one horizontal rail.
- Every module follows the same four-stage lifecycle:
  1. Gather Requirements
  2. Suggested Screens — Oracle/current form → new suggested screen
  3. Backend Logic — APIs, validation, workflows and automation
  4. ERD — tables, fields and relationships
- Clicking a module opens a dedicated **Module Workspace** with the four stages as tabs.
- The existing Screen Designer, Module ERD, Full Project ERD, Backend Designer and Timeline are preserved as specialist tools.
- **Tasks & Traceability** is a new execution-oriented board for planned, in-progress, blocked and completed work, with module-level artifact progress.
- Project data now reserves explicit relationship fields between requirements, screens, APIs, workflows, entities and timeline tasks so later field-level traceability can be added without changing the overall model.
- The existing JSON/localStorage format remains backward-compatible through normalization.
