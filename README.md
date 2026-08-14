# Company Forge

You are the lead full-stack engineer for COVENL.

Build a FUNCTIONAL MVP of COVENL in one project.

COVENL is a virtual company platform where a company owner can create a company, hire real developers, hire AI employees, and manage everyone from one workspace.

IMPORTANT:

This is NOT a landing-page-only project.

Build a working product with real navigation, forms, database operations, authentication, and functional user flows.

==================================================

1. PRODUCT CONCEPT

==================================================

Brand:

COVENL

Tagline:

BUILD YOUR COMPANY.

Core idea:

A user creates a company on COVENL.

The company owner is the Director.

Developers can create profiles, upload CVs, browse jobs, and apply to companies.

The Director can accept or reject developer applications.

Accepted developers become members of the company team.

The Director can also hire AI Employees.

AI Employees have skill levels and monthly prices:

Beginner — $5/month

Intermediate — $10/month

Advanced — $15/month

Expert — $20/month

For this MVP, DO NOT implement real payment processing.

Simulate the hiring/subscription process in the database.

The company also has a Virtual Office where the Director, developers and AI employees are displayed.

==================================================

2. TECH STACK

==================================================

Use:

- Next.js

- TypeScript

- Tailwind CSS

- shadcn/ui

- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Storage

Use a clean scalable architecture.

Do not use unnecessary libraries.

Do not create fake frontend-only functionality.

==================================================

3. BRAND DESIGN

==================================================

COVENL visual identity:

Primary:

Dark navy

Secondary:

Deep purple

Accent:

Electric cyan / blue

Text:

White and light gray

Style:

Premium

Minimal

Futuristic

Professional

Modern SaaS

Use Inter font.

Logo concept:

A white open "C" inside a dark navy/purple rounded square with a small cyan dot in the opening.

The logo should be used throughout the application.

Avoid excessive gradients, excessive glassmorphism, or childish UI.

The interface should feel like a serious global technology company.

==================================================

4. USER ROLES

==================================================

There are two main user types:

DIRECTOR

DEVELOPER

There is NO separate admin authentication.

Platform admin permissions should be associated with a Director account.

Create a role field in the user/profile system.

==================================================

5. AUTHENTICATION

==================================================

Create:

/login

/signup

Users should be able to:

- Sign up

- Log in

- Log out

- Persist their session

- Be redirected based on their role

During signup allow the user to select:

Director

Developer

Protect authenticated routes.

==================================================

6. DIRECTOR FLOW

==================================================

A Director should be able to:

1. Sign up

2. Create a company

3. Add:

   - company name

   - logo

   - description

   - industry

   - location

4. View company dashboard

5. Create jobs

6. View applications

7. Accept applications

8. Reject applications

9. View company team

10. Browse AI employees

11. Hire AI employees

12. Enter Virtual Office

Create:

/dashboard

/company

/company/settings

/jobs

/applications

/team

/ai-employees

/office

==================================================

7. DEVELOPER FLOW

==================================================

A Developer should be able to:

1. Sign up

2. Create a profile

3. Add:

   - full name

   - profile photo

   - headline

   - bio

   - skills

   - experience

   - GitHub

   - LinkedIn

4. Upload CV as PDF

5. Browse companies

6. Browse jobs

7. Apply to a job

8. See application status

9. See accepted company/team

10. Enter Virtual Office

Create:

/developer

/developers

/jobs

/applications

/office

==================================================

8. DEVELOPER PROFILE

==================================================

Create a beautiful developer profile page.

Example:

Developer Name

Full Stack Developer

Skills:

React

Next.js

Node.js

PostgreSQL

TypeScript

Experience:

2 years

CV:

[View CV]

[Apply to Job]

Do not expose private information unnecessarily.

==================================================

9. CV UPLOAD

==================================================

Use Supabase Storage.

Allow developers to upload PDF CV files.

Store the CV URL/path in the database.

Director should be able to view a developer's CV from an application.

Validate file type and reasonable file size.

==================================================

10. COMPANY SYSTEM

==================================================

A Director can create exactly the company structure required for the MVP.

Company fields:

- id

- name

- logo

- description

- industry

- location

- owner_id

- created_at

Company profile should show:

Company logo

Company name

Description

Industry

Location

Team size

Open jobs

==================================================

11. JOB SYSTEM

==================================================

Director can create jobs.

Job fields:

- title

- description

- required skills

- employment type

- company_id

- created_at

- status

Example:

Frontend Developer

Required skills:

React

TypeScript

Next.js

Show:

[Apply]

==================================================

12. APPLICATION SYSTEM

==================================================

Developer clicks:

[Apply]

Create an application.

Application status:

pending

accepted

rejected

Director sees:

Applicant

Role

CV

Skills

Application date

Buttons:

[Accept]

[Reject]

When Director accepts:

The developer automatically becomes a team member.

Prevent duplicate applications to the same job.

==================================================

13. TEAM SYSTEM

==================================================

Company team page should show:

Director

Developers

AI Employees

Example:

TEAM

Director

Akmal

Developers

John — Full Stack Developer

Sarah — Frontend Developer

AI Employees

Coven Developer

Coven Designer

Show profile cards.

==================================================

14. AI EMPLOYEE MARKETPLACE

==================================================

Create an AI Employee marketplace.

Categories:

Developer

Designer

Marketing

Researcher

Product Manager

Create at least 6 demo AI employees.

Example:

AI Developer

Level:

Beginner

Skills:

HTML

CSS

JavaScript

Price:

$5/month

Other levels:

Intermediate — $10/month

Advanced — $15/month

Expert — $20/month

Maximum price MUST be $20/month.

Each AI employee needs:

- id

- name

- role

- avatar

- description

- skills

- level

- monthly_price

Create:

/ai-employees

Each card should have:

[View]

[Hire]

==================================================

15. HIRING AI EMPLOYEES

==================================================

When Director clicks:

[Hire AI Employee]

Create a hired_ai_employee record.

Show:

"AI Employee successfully added to your company."

The AI employee should then appear in:

- Team

- Company dashboard

- Virtual Office

For now, do NOT charge real money.

Clearly label this as an MVP/demo subscription.

==================================================

16. AI EMPLOYEE PROFILE

==================================================

Create a detailed profile page.

Example:

AI Developer

Advanced

$15/month

Skills:

React

Next.js

Node.js

API Integration

Debugging

Description:

An AI software developer designed to help your team build and maintain applications.

Show:

Level progression:

Beginner $5

Intermediate $10

Advanced $15

Expert $20

==================================================

17. VIRTUAL OFFICE

==================================================

Create a polished 2D virtual office for the MVP.

DO NOT spend most of the development time creating a complicated 3D environment.

The office should visually contain:

- Director desk

- Developer desks

- AI Employee desks

- Meeting room

- Company logo

- Team member avatars

Example layout:

+------------------------------------------------+

|                 COVENL OFFICE                  |

|                                                |

|   [Director]          [Meeting Room]           |

|                                                |

|   [Developer]   [Developer]   [AI Employee]   |

|                                                |

|   [Developer]   [AI Employee]                 |

|                                                |

+------------------------------------------------+

Make it visually impressive using CSS.

Add status labels:

ONLINE

WORKING

IN MEETING

OFFLINE

Use demo status data for the MVP.

==================================================

18. DASHBOARD

==================================================

Director dashboard should show:

Welcome back

Company

Team members

Open jobs

Applications

AI employees

Active projects

Cards:

Team

Applications

AI Employees

Jobs

Quick actions:

[Create Job]

[View Applications]

[Hire AI Employee]

[Enter Office]

==================================================

19. NAVIGATION

==================================================

Desktop sidebar:

COVENL logo

Dashboard

Company

Jobs

Applications

Team

AI Employees

Virtual Office

Messages

Settings

Top bar:

Search

Notifications

User profile

Mobile navigation should also work.

==================================================

20. DATABASE

==================================================

Create Supabase schema for:

profiles

companies

developer_profiles

jobs

applications

team_members

ai_employees

hired_ai_employees

notifications

Use proper:

Primary keys

Foreign keys

Indexes

Timestamps

Relationships

Create appropriate Row Level Security policies.

Users should only be able to modify data they are authorized to modify.

==================================================

21. DEMO DATA

==================================================

Create realistic seed/demo data.

Include:

1 demo company

6 demo developers

6 AI employees

4 demo jobs

Several demo applications

Make the application easy to test.

==================================================

22. RESPONSIVENESS

==================================================

The entire application must work on:

Desktop

Tablet

Mobile

Do not create desktop-only layouts.

==================================================

23. ERROR HANDLING

==================================================

Implement:

Loading states

Empty states

Error states

Form validation

Success notifications

Confirmation dialogs

Do not leave buttons that do nothing.

If a feature is not implemented yet, clearly label it as "Coming soon" instead of pretending it works.

==================================================

24. MVP PRIORITY

==================================================

PRIORITY 1:

Authentication

Director

Developer

Company

Developer profile

CV

Jobs

Applications

Accept/Reject

Team

PRIORITY 2:

AI Employees

AI hiring

Dashboard

PRIORITY 3:

Virtual Office

Notifications

Messages

Do not spend excessive time polishing secondary features before the main user flow works.

==================================================

25. MOST IMPORTANT USER FLOW

==================================================

The following complete flow MUST work:

Developer:

Sign up

↓

Create profile

↓

Upload CV

↓

Browse jobs

↓

Apply

Director:

Sign up

↓

Create company

↓

Create job

↓

Receive application

↓

View developer profile/CV

↓

Accept

System:

Developer becomes team member

↓

Developer appears in company team

↓

Director opens AI Employees

↓

Hires AI Developer

↓

AI Developer appears in team

↓

Director enters Virtual Office

↓

Developer + AI Employee are visible

This is the core COVENL MVP.

==================================================

26. CODE QUALITY

==================================================

Write production-quality code.

Use:

- reusable components

- reusable hooks where appropriate

- TypeScript types

- clear naming

- modular architecture

- server-side validation where appropriate

- secure database access

Do not put everything into one giant component.

Keep the codebase easy for another developer to understand.

==================================================

27. DEVELOPMENT PROCESS

==================================================

Before implementing:

1. Inspect the existing project.

2. Create the architecture.

3. Create database schema.

4. Set up authentication.

5. Build the core user flows.

6. Test each flow.

7. Fix errors.

8. Then polish the UI.

Do not stop after creating static pages.

The goal is a WORKING COVENL MVP.

At the end, provide:

- what was built

- how to run it

- required environment variables

- Supabase setup instructions

- remaining limitations

- recommended next steps

Start building now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://covenl.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/749cd26a-2a7f-4149-968f-dc0ae5fc676b).

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
