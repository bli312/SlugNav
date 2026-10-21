# Sprint 1 Plan - SlugNav

**Team Name:** SlugNavDev  
**Sprint Completion Date:** 10/21/26  
**Revision:** 4 (search, full class catalog, and classroom locations moved to Sprint 2)  
**Week 1:** 10/13/26

[Scrum poker](https://www.scrumpoker-online.org/en/room/45959815/scrum-poker)

---

## User Stories and Tasks

### [1.1]

As a UCSC student, I want to sign in and land on a simple home screen with clear navigation, so that I can start using the app without confusion.

- [ ] **SPIKE:** Decide the tech stack and architecture, and document it **(1 SP) (all of us)**
  - [ ] Frontend: Expo + React Native (TypeScript). Backend/DB: decide and document. How the app talks to the backend.
  - [ ] Note auth, security, and location-data storage considerations.
- [ ] Define primary user flows and rough wireframes **(2 SP) (all of us)**
  - [ ] Flows: open app, sign in, home, etc.
  - [ ] Screen navigation and basic UI conventions.
- [ ] Set up dev infra: repo, linter/formatter, CI, AI tooling md files, and folder structure **(2 SP) (Ian)**
- [ ] Set up Expo app with navigation shell **(3 SP) (Ian)**
- [ ] Set up backend / database **(1 SP) (Noah)**
- [ ] Create login functionality **(1 SP) (Leo)**
- [ ] Create login page and home page **(2 SP) (Leo)**

**Total for 1.1: 12 SP**

### [1.2]

As a UCSC student, I want to see a list of classes with their building and room, so that I can check where each class meets.

- [ ] Classes table + API with sample data (read required; create/update/delete if time) **(2 SP) (Noah)**
- [ ] Class list screen (build against mock data first) **(2 SP) (Dan)**
- [ ] Connect the app to the backend **(1 SP) (Dan + Noah)**

**Total for 1.2: 5 SP**

> Searching, the full UCSC class catalog, and classroom locations on a map are Sprint 2.

### [1.3] (SPIKE this sprint, story moves to Sprint 2)

As a UCSC student, I want my classes to load in automatically, so that I don't have to get each one from MyUCSC.

- [ ] **SPIKE:** How to pull in all UCSC class data, including building and room. Public class catalog first, personal MyUCSC login later. Short written recommendation. **(2 SP) (Noah)**

**Total for 1.3 spike: 2 SP**

### [1.4]

As a UCSC student, I want my account and class data to be visible only to me, so that my information stays private unless I choose to share it.

- [ ] Define security and privacy requirements (what we store, who can see it, location permission wording, per-user data rule for the backend) **(1 SP) (Leo)**

**Total for 1.4: 1 SP**

### Map (SPIKE this sprint, integration moves to Sprint 2)

- [ ] **SPIKE:** How to show a class's location on a map (map options, where building coordinates come from, rooms maps can't identify). Short written recommendation. **(1 SP) (Dan)**

**Total for map spike: 1 SP**

### Team tasks

- [x] Create the GitHub sprint board **(1 SP) (Dan)**

**Total for team tasks: 1 SP**

**Sprint total: 12 + 5 + 2 + 1 + 1 + 1 = 22 SP**

---

## Moved to Sprint 2

- [1.2b] Search classes
- [1.2c] Import the full UCSC class catalog (based on the data spike)
- [1.2d] Show class locations on the map (based on the map spike)
- [1.3] Load a student's own classes automatically (based on the data spike)

## Team Roles

- **Dan:** SCRUM Master, Developer
- **Noah:** Developer
- **Ian:** Product Owner, Developer
- **Leo:** Developer

## Initial Task Assignment

- **Dan:** Class list screen, map spike
- **Noah:** [1.1] Backend/database, classes table + API, data spike
- **Ian:** Set up repository development environment with Deno/Node (Formatter, Lint), React, Expo + React Native, Set up basic app functionality with Expo + React
- **Leo:** [1.1] Create login functionality, login page and home page, privacy requirements

## Initial Scrum Board

In our GitHub repository

## Scrum Times

- Monday 12:00PM
- Wednesday 12:00PM (TA meeting)
- Friday 1:30PM
