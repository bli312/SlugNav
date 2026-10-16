# Sprint 1 Plan - SlugNav

**Team Name:** SlugNavDev  
**Sprint Completion Date:** 10/21/26  
**Revision:** 1  
**Week 1:** 10/13/26

[Scrum poker](https://www.scrumpoker-online.org/en/room/45959815/scrum-poker)

---

## User Stories and Tasks

### [1.1]

As a UCSC student, I want an app with an easy and intuitive UI, so that I can actually use it easily.

- [ ] Research and decide on the application technology stack and architecture **(2 SP) (all of us)**
  - [ ] Evaluate mobile development frameworks (React Native, Flutter, etc.).
  - [ ] Decide on programming languages and frameworks.
  - [ ] Evaluate database and backend options.
  - [ ] Determine how the mobile app communicates with the backend.
  - [ ] Consider scalability, authentication, security, and location-data storage.
  - [ ] Document architectural decisions.
- [ ] Design the initial user experience and application structure **(2 SP) (all of us)**
  - [ ] Define primary user flows (opening the app, finding classrooms, viewing schedules).
  - [ ] Design navigation between screens.
  - [ ] Decide how login and account creation will work.
  - [ ] Create preliminary wireframes.
  - [ ] Establish basic UI conventions
- [ ] Setup development infra and CI/CD **(2 SP) (Ian)**
  - [ ] Setup AI tooling, linter, GitHub, etc.
- [ ] Setup App **(3 SP) (Ian)**
- [ ] Setup Backend / Database **(1 SP) (Noah)**
- [ ] Create login functionality (with authenticator) **(1 SP) (Leo)**
- [ ] Create basic login page and home page **(2 SP) (Leo)**

**Total for User Story 1: 13 SP**

### [1.2]

As a UCSC student, I want to be able to find class locations, so that I can find them easily without using the confusing UCSC interactive map.

- [ ] Integrate Google Maps (*maybe* in a later sprint add classrooms Google Maps cannot identify) **(3 SP) (Dan)**
- [ ] Allow users to search for classes **(2 SP) (Dan)**

**Total for User Story 2: 5 SP**

### [1.3]

As a UCSC student, I want my classes to load in automatically, so that I don’t have to get each one from MyUCSC.

- [ ] Research and implementing allowing user to securely connect to MyUCSC (or Canvas if need be) **(4 SP) (Noah)**

**Total for User Story 3: 4 SP**

### [1.4]

As a UCSC student, I want the app to be secure and private, so that no one else can see my info (such as location) unless I choose to allow it.

- [ ] Define security and privacy requirements for user data. **(2 SP) (Leo)**

**Total for User Story 4: 2 SP**

---

## Team Roles

- **Dan:** SCRUM Master, Developer
- **Noah:** Developer
- **Ian:** Product Owner, Developer
- **Leo:** Developer

## Tasks Requirements

- **Infrastructure & Spikes**
  - Research and determine the technology stacks for the front end, back end, and database
  - Set up the code Repository and the development environment
- **[1.1] and [1.4] UI Framework and Basic Security**
  - Design and implement an easy-to-use and intuitive initial UI framework (such as the bottom navigation bar, sidebar, etc.). Complete the basic wireframe design.
  - Implement the basic user login logic and geographical location authorization prompts to ensure the security of user privacy data (such as location information)
- **[1.2]**
  - Integrate Google Maps into the application.
  - Allow users to search for campus buildings and classroom locations.
  - Display the selected location on the map.
  - Handle classroom locations that Google Maps cannot identify directly. ?
- **[1.3]**
  - Research how to safely obtain class schedule data
    - Canvas calendar or other export mechanisms

## Initial Task Assignment

- **Dan:** User story 2, Integrate Google Maps
- **Noah:** [1.1]: Setup backend/database
- **Ian:**
  - Set up repository development environment with Deno/Node (Formatter, Lint), React, Expo + React Native,
  - Set up basic app functionality with Expo + React
- **Leo:** [1.1]: Create login functionality

## Initial Scrum Board

In our GitHub repository

## Scrum Times

- Monday 12:00PM
- Wednesday 12:00PM (TA meeting)
- Friday 1:30PM

---