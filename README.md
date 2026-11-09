# EventWise Portal

I have an existing semester project called:

Smart Event Certificate Generator and Verification Portal

The project is currently around 15% complete. I need to bring it to approximately 30% completion for Monitoring 1.

I am providing the existing project files/code. First inspect the existing project carefully and understand its current structure, UI, naming, styling and functionality. Do NOT completely rebuild the project from scratch. Extend the existing project.

EXISTING COMPLETED PART — DO NOT BREAK IT

The current project already has:

Home / Landing Page

Navbar

Hero section

Upcoming Events section

Event cards

Footer

Existing blue + dark navy visual theme

Responsive card layout

The current home page contains events such as:

Tech Fest 2026

Hackathon

Workshop

Preserve the existing visual identity and improve it rather than replacing it with an unrelated design.

GOAL: INCREASE PROJECT FROM 15% → 30%

Implement the following four major modules:

1. EVENTS PAGE — FULL EVENT LISTING

Create a separate Events page.

When the user clicks "Events" in the navbar, it should navigate to the Events page.

The page should contain a professional heading such as:

All Events

Display a larger grid of events instead of only the 3 events currently shown on the Home page.

Create approximately 8–10 sample events, for example:

Tech Fest 2026

Hackathon 2026

Web Development Workshop

Cybersecurity Awareness Seminar

Python Programming Workshop

AI & Machine Learning Seminar

Coding Competition

Project Exhibition

Data Science Workshop

Entrepreneurship Seminar

Each event card should contain:

Event icon/image

Event name

Date

Venue

Short description

Register button

Use the same basic card design and visual language as the existing Home page, but make it more polished and responsive.

Add a simple:

Search Events

input at the top.

Also add an optional category filter such as:

All

Workshop

Seminar

Competition

Technical

The search/filter should actually work on the displayed events.

2. REGISTRATION FORM PAGE

When a user clicks Register on any event card, navigate to a separate Registration page.

The selected event should be automatically passed into the form and displayed as:

Event Name: [Selected Event]

Create a clean professional registration form with these fields:

Full Name

Roll Number

PRN

Email

Event Name — automatically filled

Branch

Year

Branch options:

Information Technology

Computer Engineering

Electronics & Telecommunication

Mechanical Engineering

Civil Engineering

Year options:

First Year

Second Year

Third Year

Final Year

Add:

Submit Registration

button.

For this stage, this is only a frontend/UI implementation.

Do NOT create a real backend/database/authentication system yet.

When the user submits:

Validate required fields

Show suitable validation messages

If valid, show a professional success message such as:
"Registration submitted successfully!"

Do not actually send/store data on a server.

Add a clear Back to Events option.

3. LOGIN / SIGNUP PAGE

Create a proper Login / Signup page.

The existing navbar's Login link should navigate to this page.

The page should have two clear tabs:

Student Login

Fields:

Email

Password

Button:

Login

Below it:

Don't have an account? Sign up

Organizer/Admin Login

Fields:

Email

Password

Button:

Admin Login

For signup, create a simple registration UI containing:

Full Name

Email

Password

Confirm Password

Button:

Create Account

At this stage, authentication can be frontend-only/demo functionality.

Do NOT implement real authentication or database integration yet.

After a successful demo login, show a simple message or redirect to an appropriate placeholder dashboard.

Keep the design consistent with the rest of the project.

4. CERTIFICATE PAGE — STATIC CERTIFICATE TEMPLATE

Create a separate Certificate page.

When the user clicks Certificate in the navbar, it should open this page.

This is an important part of the semester project because the project is a:

Smart Event Certificate Generator and Verification Portal

Create a professional-looking certificate preview.

The certificate should contain:

College/institute name:
RCPIT Shirpur

College logo placeholder

Heading:
CERTIFICATE OF PARTICIPATION

Student name placeholder:
[Student Name]

Event name:
[Event Name]

Date:
[Event Date]

A short certificate statement

Organizer/Coordinator signature line

Principal/Authorized signature line

Certificate ID placeholder

QR code dummy placeholder

The QR placeholder should be positioned realistically in the bottom-right corner.

Use a professional certificate layout with:

Decorative border

Good spacing

Typography hierarchy

Professional colors

Center alignment where appropriate

Responsive design

The certificate should look like a realistic digital certificate template, not simply a normal webpage card.

Add buttons such as:

Download Certificate

and

Verify Certificate

However, for this 30% stage:

Download can be a frontend placeholder/demo action.

Verification does not need a backend yet.

Clearly structure the UI so real certificate generation and QR verification can be implemented later.

NAVIGATION REQUIREMENTS

Make sure all navigation links actually work.

Navbar should contain:

Home | Events | Certificate | Login

Expected navigation:

Home → Home page

Events → Events page

Certificate → Certificate page

Login → Login/Signup page

Home's Explore Events button → Events page

Every Register button → Registration page with the selected event automatically filled.

Add appropriate navigation/back buttons where required.

Do NOT leave href="#" links that do nothing.

DESIGN REQUIREMENTS

Very important:

Preserve and extend the existing design instead of replacing it.

The existing project uses:

Dark navy navbar

Blue primary color

White cards

Light background

Rounded cards

Simple clean typography

Hover effects

Maintain this visual identity across all new pages.

Improve the UI where necessary, but don't turn it into an unrelated modern SaaS template.

The website should look like a real college semester project, not an overcomplicated commercial application.

Use:

Clean spacing

Consistent buttons

Consistent card design

Responsive layouts

Mobile-friendly navigation

Hover effects

Form validation

Professional certificate styling

TECHNICAL REQUIREMENTS

Before making changes:

Inspect the existing project structure.

Reuse existing components/styles wherever possible.

Do not unnecessarily delete existing files.

Do not break the existing Home page.

Keep the code organized and readable.

Avoid unnecessary dependencies.

Make all pages responsive.

Make all navigation functional.

Make search/filter functionality work.

Make event-to-registration flow work.

Use reusable components for event cards where appropriate.

Use realistic sample data.

Keep backend/database integration for a later phase.

If the project already uses a framework, continue using the existing framework and architecture instead of migrating to another technology.

IMPORTANT SCOPE LIMIT

This is Monitoring 1 / approximately 30% completion.

Do NOT attempt to implement the complete final project yet.

Do NOT add:

Real database

Real authentication

Real admin dashboard

Real QR verification backend

Email service

Cloud storage

Payment gateway

Complex AI features

Advanced security infrastructure

Those are future phases.

For now, focus on making these modules functional at the frontend/demo level:

Home → Events → Registration → Login/Signup → Certificate

FINAL QUALITY CHECK

After implementation, test the complete user flow:

Open Home

Click Explore Events

Events page opens

Search/filter events

Click Register

Registration page opens

Event name is automatically filled

Fill the registration form

Submit and see success message

Return to Home

Open Certificate page

View the certificate template

Open Login

Switch between Student Login and Organizer/Admin Login

Test Signup UI

Test responsive layout

Fix any broken links, console errors, layout issues or missing functionality before finishing.

Finally, give me a short summary of:

What was already present

What you added

What percentage of the project these changes represent

What should be implemented in the next phase (30% → 50%)

Do not just create a visual mockup. Implement the actual working frontend pages and navigation.   VERY IMPORTANT — FILE ORGANIZATION

I want the project code to be properly separated into different files so I can easily understand, manage, present, and modify each part of my semester project.

Do NOT put the entire project into one HTML file or one large component.

Create separate files/pages for each major module.

Use a clean and beginner-friendly folder structure similar to:

project/
│
├── index.html
├── events.html
├── registration.html
├── login.html
├── certificate.html
│
├── css/
│   ├── style.css
│   ├── events.css
│   ├── registration.css
│   ├── login.css
│   └── certificate.css
│
├── js/
│   ├── main.js
│   ├── events.js
│   ├── registration.js
│   ├── login.js
│   └── certificate.js
│
└── assets/
    ├── images/
    ├── icons/
    └── logo/


File responsibilities

index.html

Home / Landing page

Navbar

Hero section

Featured/upcoming events

Footer

events.html

Complete event listing

Event cards

Search

Category filtering

Register buttons

registration.html

Student registration form

Event name auto-filled from selected event

Form validation

Success message

login.html

Student Login

Organizer/Admin Login

Signup interface

Login/signup UI logic

certificate.html

Certificate preview/template

Student name placeholder

Event name

Date

Certificate ID

Signature sections

Dummy QR code placeholder

Download/Verify buttons as demo UI

CSS separation

Keep styling organized.

style.css → shared/global styles

events.css → Events page specific styles

registration.css → Registration page specific styles

login.css → Login page specific styles

certificate.css → Certificate page specific styles

Do not duplicate the same CSS unnecessarily across files.

Reuse common navbar, button, card and footer styles where possible.

JavaScript separation

Keep JavaScript functionality separated.

main.js → Home page interactions and common functionality

events.js → Event data, search and filtering

registration.js → Registration form, validation and selected-event handling

login.js → Login/signup tab switching and frontend validation

certificate.js → Certificate page interactions and demo buttons

IMPORTANT

If the existing project is already using a particular framework or structure, do not unnecessarily migrate the project.

Adapt this file organization to the existing technology while maintaining the same principle:

One major feature = separate file/component.

Do not create unnecessarily complicated architecture.

I am a second-year IT student and this is a semester project, so the code should remain:

Easy to understand

Easy to explain to my teacher

Easy to edit

Properly commented

Logically organized

Beginner-friendly

Existing files

I am also providing my current:

index.html

design.css

Use these as the starting point.

Preserve useful existing code and styling where possible.

If you rename design.css to style.css, update all references correctly and make sure no functionality is broken.

DO NOT

Put all HTML into one huge file

Put all CSS into one huge file

Put all JavaScript into one huge file

Create unnecessary backend files

Add a database at this stage

Add unnecessary frameworks

Delete existing functionality without reason

Replace the project with a completely different design

FINAL REQUIREMENT

After completing the implementation, show me the complete project file structure and briefly explain what each file does.

Make sure every file is actually connected correctly and that there are no broken paths or missing imports.BASIC JAVASCRIPT ONLY

Use basic JavaScript only where it is necessary for frontend interaction.

Keep the JavaScript simple, beginner-friendly, and easy for a second-year IT student to understand and explain during project monitoring.

Create only these JavaScript files:

js/
├── events.js
├── registration.js
└── login.js


events.js

Use JavaScript only for:

Event search

Basic category filtering

Register button interaction

Passing the selected event name to the Registration page

registration.js

Use JavaScript only for:

Reading the selected event

Automatically displaying the selected event name

Basic required-field validation

Basic email validation

Showing a registration success message

login.js

Use JavaScript only for:

Switching between Student Login and Organizer/Admin Login

Showing the Signup form

Basic form validation

Simple demo login/signup behavior

IMPORTANT

Do NOT implement:

Real authentication

Database

Backend

API

Advanced JavaScript architecture

Real QR verification

Real certificate generation

Complex state management

Any unnecessary JavaScript functionality

Do not put large amounts of JavaScript directly inside HTML.

Keep JavaScript separate in the appropriate .js files.

The purpose of JavaScript at this stage is only to make the basic frontend interactions work.

Priority: clean UI + separate pages + proper navigation + basic JavaScript functionality.

Do not over-engineer the project.FINAL SOURCE CODE REQUIREMENT

After completing the project, keep the entire project properly organized in separate files.

I need to be able to clearly distinguish:

HTML files

CSS files

JavaScript files

Image/assets files

Do not combine everything into one file or one large code block.

Make sure all files are actually created inside the project and correctly connected to each other.

At the end, show me the complete project folder/file structure and briefly explain the purpose of each file.

I need the complete source code of the project so I can continue developing it in VS Code later.

If the platform provides an option to export/download the project source code, keep the project ready for export as a complete project rather than separate unrelated snippets.

Do not remove or overwrite my original functionality unless it is necessary for improving the project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e666bc4e-de71-41a6-968e-dd8fc4c922c1).

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
