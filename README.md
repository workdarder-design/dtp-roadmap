# DCAA Roadmap Central

Build a modern, professional, lightweight web application called "DCAA Project Roadmap".

The application is a project roadmap management system. The main page MUST be the Roadmap page. Do not start with a separate dashboard homepage.

The first supported framework is SAFe ONLY. Design the architecture so Scrum can be added later, but do not expose Scrum in the UI for now.

==================================================

1. MAIN CONCEPT

==================================================

The Roadmap is the primary screen.

The system should allow an Admin to manage the complete project roadmap from the same screen without navigating through multiple pages.

The roadmap data is based on this structure:

- ID

- Module

- Feature

- Priority

- Sprint

- ETA on Staging

- ETA on Production

- Business Status

- Dev Status

- Delivery Status

- Remarks / Notes

Example records:

DCAA-001 | Employee Appraisal | UI Enhancements & BIGs | High | Sprint 10 | 07/05/2026 | | Planned | Done | Handover (to Client)

DCAA-002 | Employee Appraisal | KPI Calculation | High | Sprint 10 | 07/05/2026 | | Gathering Req | Done |

DCAA-003 | Employee Appraisal | UAT & Extra Courses | High | Sprint 12 | 20/07/2026 | | In Analysis | Done |

DCAA-004 | Performance | UAT Enhancements & BUGs | High | Sprint 10 | 07/05/2026 | | Planned | Done | Handover (to Client)

DCAA-005 | Committee | Committee CR | High | Sprint 11 | 21/07/2026 | | Validation | Done |

DCAA-006 | Filter Unification | Projects | Medium | Sprint 12 | 30/07/2026 | | Planned | In Progress |

DCAA-007 | Filter Unification | Committees | High | Sprint 12 | 30/07/2026 | | Planned | In Progress |

DCAA-008 | Filter Unification | Performance | Medium | Sprint 13 | | | Planned | In Progress |

DCAA-009 | Filter Unification | Services | High | Sprint 13 | 30/07/2026 | | Planned | In Progress |

DCAA-010 | Filter Unification | Innovation | Medium | Sprint 13 | | | Planned | In Progress |

DCAA-011 | Filter Unification | BAU | High | Sprint 13 | 30/07/2026 | | Planned | In Progress |

DCAA-012 | Filter Unification | Audit | Medium | Sprint 13 | | | Planned | In Progress |

DCAA-013 | Audit | Data Migration | High | Sprint 11 | 07/07/2026 | 07/07/2026 | Planned | Done | Handover (to Client)

DCAA-014 | Committee MOM Enhancements | Apply Dubai Font in Meeting Minutes | High | Sprint 14 | | | | |

DCAA-015 | Committee MOM Enhancements | Enhance Agenda Items Structure | High | Sprint 14 | | | | |

DCAA-016 | Committee MOM Enhancements | Enhance External Attendees (Guests) Entry Form | High | Sprint 14 | | | | |

DCAA-017 | Committee MOM Enhancements | Display Meeting Information on Tasks and Decisions | Medium | Sprint 14 | | | | |

DCAA-018 | Committee MOM Enhancements | Add Concerned Person Field to Tasks | Medium | Sprint 14 | | | | |

Use this data as seed/demo data.

==================================================

2. TECHNOLOGY

==================================================

Use modern production-quality technologies:

- Next.js with App Router

- TypeScript

- Tailwind CSS

- shadcn/ui

- TanStack Table

- Recharts for analytics

- React Hook Form

- Zod validation

- PostgreSQL

- Prisma ORM

Use clean reusable components and a scalable architecture.

==================================================

3. DESIGN

==================================================

Create a professional enterprise SaaS UI.

Style:

- Clean

- Minimal

- Modern

- Corporate

- Easy to read

- Not overly colorful

- Excellent spacing

- Rounded cards

- Subtle borders and shadows

- Semantic status colors

- Responsive desktop-first design

The application should feel like a modern combination of:

- Azure DevOps

- Jira

- Linear

- Product Roadmap tools

BUT do not copy any product directly.

Use a dark compact sidebar and a clean light main content area.

Brand:

DCAA Project Roadmap

Top header:

- Project name

- SAFe badge

- Search

- Notifications

- Admin profile

==================================================

4. ROADMAP VIEWS

==================================================

The most important requirement:

Create MULTIPLE views for the SAME roadmap data.

Add a view switcher:

1. Table View

2. SAFe Program Train View

3. Timeline / Gantt View

4. Kanban View

5. Analytics View

The data must be shared between all views.

Changing an item in one view must immediately reflect in the other views.

==================================================

5. TABLE VIEW

==================================================

This is the default and primary view.

Create a highly professional editable data table.

Columns:

ID

Module

Feature

Priority

Sprint

ETA on Staging

ETA on Production

Business Status

Dev Status

Delivery Status

Remarks / Notes

Actions

Features:

- Search

- Sort

- Filter

- Column visibility

- Column resizing

- Pagination

- Sticky header

- Horizontal scrolling

- Row selection

- Multi-select

- Export

- Add Item button

IMPORTANT:

Admin can edit data INLINE directly inside the table.

Examples:

Click "High" → dropdown appears.

Click "Sprint 12" → sprint dropdown appears.

Click date → date picker appears.

Click Business Status → status dropdown appears.

Click Remarks → inline text editor appears.

Save automatically after change.

Show a small:

"Saved ✓"

Do not require opening a separate edit page.

==================================================

6. ROADMAP SCOPE / FILTER

==================================================

The user must be able to change the roadmap scope.

Create:

View By:

[ Whole Project ▼ ]

Options:

- Whole Project

- Module

- Feature

- Sprint

- PI

If Module is selected:

[ Performance ▼ ]

Only Performance items are displayed.

If Feature is selected:

[ KPI Calculation ▼ ]

Only KPI Calculation items are displayed.

The KPI cards and analytics must dynamically update based on the selected scope.

Example:

Whole Project:

24 Items | 14 Completed | 6 In Progress | 2 Blocked | 2 Delayed

Performance Module:

7 Items | 5 Completed | 1 In Progress | 1 Delayed

==================================================

7. SAFE PROGRAM TRAIN VIEW

==================================================

This is a VERY IMPORTANT view.

Create a visual SAFe Program Train / PI Planning style roadmap.

The screen should show:

PI

↓

Sprints

↓

Modules / ART lanes

↓

Features

Example:

                PI-2026 Q3

---------------------------------------------------------

Sprint 10 | Sprint 11 | Sprint 12 | Sprint 13 | Sprint 14

---------------------------------------------------------

Employee Appraisal

    [ UI Enhancements ]

                 [ KPI Calculation ]

                            [ UAT & Extra Courses ]

Performance

                 [ UAT Enhancements & BUGs ]

Committee

                       [ Committee CR ]

Audit

                 [ Data Migration ]

Filter Unification

                       [ Projects ]

                                  [ Committees ]

                                             [ Performance ]

Use horizontal timeline behavior.

Each feature should be represented as a draggable-looking roadmap bar.

Color the bars based on Module or status.

Show a vertical "Today" line.

Show PI boundaries.

Allow zoom:

- Sprint

- Month

- PI

Hovering over a feature should show:

ID

Module

Feature

Priority

Sprint

Staging ETA

Production ETA

Business Status

Dev Status

Delivery Status

Admin should be able to click a feature and edit it.

==================================================

8. TIMELINE / GANTT VIEW

==================================================

Create a clean Gantt-style roadmap.

Rows:

Modules / Features

Timeline:

Months → Weeks → Sprints

Each item appears as a bar from:

Start / Sprint

to

ETA on Production

Use different visual states:

Planned

In Progress

Completed

Delayed

Blocked

Clicking a bar opens an edit popover.

==================================================

9. KANBAN VIEW

==================================================

Create a simple Kanban view based on Dev Status.

Columns:

Not Started

In Progress

Blocked

Done

Cards contain:

ID

Module

Feature

Priority

Sprint

ETA

Delivery Status

Allow Admin to drag cards between columns.

Changing a card's column updates Dev Status.

==================================================

10. DASHBOARD / ANALYTICS

==================================================

Analytics must be integrated into the Roadmap page.

Do NOT create unnecessary complicated dashboards.

At the top of the Roadmap show KPI cards:

Total Items

Completed

In Progress

Blocked

Delayed

Staging Ready

Production Ready

Example:

24

Total Items

14

Completed

6

In Progress

2

Blocked

2

Delayed

18

Staging Ready

12

Production Ready

All KPI values must dynamically update based on the selected scope/filter.

==================================================

11. IMPORTANT ANALYTICS

==================================================

Create useful charts:

1. Roadmap Completion

- Overall completion percentage

2. Items by Module

- Donut chart

3. Development Status

- Donut chart

4. Business Status

- Horizontal bar chart

5. Priority Distribution

- High / Medium / Low

6. Delivery Status

7. Sprint Distribution

8. Upcoming Deliveries

9. Delayed Items

10. Staging vs Production readiness

Charts should be simple and readable.

Avoid excessive charts.

==================================================

12. SMART CALCULATIONS

==================================================

Automatically calculate:

Completion % =

Completed Items / Total Items

Delayed:

ETA date is before today

AND item is not completed.

Staging Ready:

ETA on Staging exists

AND Dev Status = Done

Production Ready:

ETA on Production exists

OR Delivery Status indicates production readiness.

Blocked:

Dev Status = Blocked

Pending Client:

Delivery Status = Handover (to Client)

or UAT / Client-related pending state.

These rules should be implemented centrally.

==================================================

13. BUSINESS STATUS

==================================================

Initial Business Status options:

- Gathering Req

- Ready To Planning

- In Analysis

- Validation

- Planned

- No Action

- On Hold

- Completed

- Cancelled

==================================================

14. DEVELOPMENT STATUS

==================================================

Options:

- Not Started

- In Progress

- Blocked

- Done

==================================================

15. DELIVERY STATUS

==================================================

Options:

- Pending

- Ready for UAT

- UAT

- Handover (to Client)

- Production

- Completed

==================================================

16. PRIORITY

==================================================

Options:

- High

- Medium

- Low

Use semantic visual badges.

==================================================

17. ADD ITEM

==================================================

Admin can click:

+ Add Roadmap Item

Open a modern modal.

Fields:

ID

Module

Feature

Priority

Sprint

PI

ETA on Staging

ETA on Production

Business Status

Dev Status

Delivery Status

Remarks / Notes

Validate using Zod.

After creation:

- Add item immediately

- Update table

- Update SAFe Train

- Update Timeline

- Update Kanban

- Update Analytics

No page refresh.

==================================================

18. ADMIN PERMISSIONS

==================================================

Admin:

- Add

- Edit

- Delete

- Change status

- Change sprint

- Change dates

- Change priority

- Change module

- Change feature

- Drag & drop

- Export

Viewer:

- Read-only

- Can filter

- Can search

- Can change views

- Cannot edit

==================================================

19. SAFe DATA MODEL

==================================================

Keep the data model compatible with SAFe.

Entities:

Project

ART

PI

Sprint

Module / Value Stream

Feature

Roadmap Item

User

Relationships:

Project

→ ART

→ PI

→ Sprint

→ Module

→ Feature

→ Roadmap Item

However, keep the first version simple.

The existing Excel-like fields should remain the primary roadmap fields.

==================================================

20. UX REQUIREMENTS

==================================================

The application must feel fast.

Avoid unnecessary page navigation.

The Admin should be able to manage the roadmap from the main screen.

Use:

- Inline editing

- Popovers

- Modals

- Tooltips

- Toast notifications

- Skeleton loading

- Empty states

- Confirmation dialogs for destructive actions

When an item changes:

Table updates

↓

SAFe Train updates

↓

Timeline updates

↓

Kanban updates

↓

Analytics update

without refreshing the page.

==================================================

21. RESPONSIVE

==================================================

Desktop-first because this is an enterprise project management application.

Support:

- Desktop

- Laptop

- Tablet

For mobile, prioritize:

- KPI cards

- Filters

- Roadmap cards

- Kanban

The large roadmap table can become horizontally scrollable.

==================================================

22. IMPORTANT UI DETAILS

==================================================

Top navigation should contain:

Roadmap

Analytics

Reports

Settings

But Roadmap must be the default page.

View tabs:

[Table]

[SAFe Train]

[Timeline]

[Kanban]

[Analytics]

Filter bar:

View By: [Whole Project]

PI: [PI-2026 Q3]

Sprint: [All Sprints]

Module: [All Modules]

Priority: [All]

Status: [All]

Search field.

==================================================

23. SAMPLE SAFe TRAIN

==================================================

Use these initial modules:

Employee Appraisal

Performance

Committee

Audit

Filter Unification

Committee MOM Enhancements

Use these initial sprints:

Sprint 10

Sprint 11

Sprint 12

Sprint 13

Sprint 14

Sprint 15

Sprint 16

Use PI:

PI-2026 Q3

==================================================

24. CODE QUALITY

==================================================

Use reusable components.

Suggested structure:

/app

  /roadmap

  /api

/components

  /roadmap

    RoadmapTable

    RoadmapFilters

    RoadmapKpis

    SafeTrainView

    TimelineView

    KanbanView

    AnalyticsView

    RoadmapItemModal

    InlineEditor

    StatusBadge

/lib

  database

  calculations

  roadmap

  validations

/prisma

Use TypeScript strictly.

Avoid duplicated logic.

Centralize roadmap calculations.

==================================================

25. FINAL RESULT

==================================================

Build a polished staging-ready MVP.

The primary experience must be:

OPEN APPLICATION

↓

LAND DIRECTLY ON ROADMAP

↓

SEE KPI SUMMARY

↓

SEE ROADMAP TABLE

↓

SWITCH TO SAFe TRAIN

↓

SWITCH TO TIMELINE

↓

SWITCH TO KANBAN

↓

VIEW ANALYTICS

↓

ADMIN CAN EDIT EVERYTHING DIRECTLY

The application should look like a professional internal enterprise product, not a generic admin template.

Focus on usability, clean visual hierarchy, excellent table UX, SAFe Program Train visualization, and meaningful project analytics.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dtp-roadmap.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4721e031-48b2-49fd-9649-0efb368a1c2f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
