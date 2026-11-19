# Personal Planner

A personal planning app designed to reduce the friction of planning and replanning. It helps users organise commitments, find realistic times for flexible tasks, and adapt when plans change — while keeping the user in control.

The product follows a **“co-pilot, not autopilot”** philosophy: the planner can suggest when and how to schedule work, but the user makes the final decision.

## Try the app

### Web app

Open the browser version:

**[Try Personal Planner](https://personal-planner-ten-xi.vercel.app/)**

## Features

- **Three task types:** Fixed commitments, Flexible tasks, and Someday tasks.
- **Today, Week, and Month views:** See your schedule at different levels.
- **Flexible task scheduling:** Get suggestions for suitable time slots based on task details and availability.
- **Free-slot suggestions:** Explore tasks that could fit into an available slot, or leave the time free.
- **Rescheduling:** Find alternative times for an existing flexible task.
- **Unfinished-task recovery:** Revisit unfinished work and find another suitable time.
- **Recurring tasks:** Set up repeating commitments without recreating them manually.
- **User control:** Review and approve scheduling suggestions rather than having the app silently rearrange the schedule.

## Run locally

### Prerequisites

- Node.js and npm
- A local copy of this repository

### Install dependencies

```bash
npm install
```

### Run in a web browser

```bash
npx expo start --web
```

### Run on Android

With an Android emulator configured:

```bash
npx expo start --android
```

You can also build and install an Android preview APK using the project's EAS Build configuration.

## Tech stack

- **React Native** — cross-platform application UI
- **Expo** — development and build tooling
- **Expo Router** — file-based navigation
- **TypeScript** — application development
- **Vercel** — web deployment

## Data and privacy

The current app stores planner data locally on the device or browser where it is used. It does not currently provide user accounts or automatic cross-device synchronisation.

This means:
- Tasks created in one browser are stored in that browser's local data.
- Different visitors to the web app have separate planner data.
- Browser data and Android app data are not automatically shared with each other.
- Clearing the browser's site data may remove locally stored planner information.

## Project status

This is an ongoing personal product project. The app is being developed and improved iteratively, with a focus on practical scheduling workflows, clear user control, and a usable cross-platform experience.
