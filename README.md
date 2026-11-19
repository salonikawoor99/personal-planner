# Personal Planner

A mobile-first Expo / React Native planner for managing Fixed, Flexible and Someday tasks, finding suitable time slots, rescheduling work and recovering unfinished tasks.

## Run locally

```bash
npm install
npx expo start
```

## Validate the project

```bash
npm run typecheck
npx expo export --platform android
```

## Build an installable Android APK

The `preview` EAS profile is configured to produce an installable APK.

1. Install / sign in to Expo's EAS CLI:

   ```bash
   npx eas-cli@latest login
   ```

2. Configure the project for EAS (the CLI will create or link an Expo project):

   ```bash
   npx eas-cli@latest build:configure
   ```

3. Start the APK build:

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

When the cloud build completes, open the build URL on the Android phone and install the APK.

## Local data

Planner tasks are stored on the device: native builds use the app's document storage, and web builds use browser local storage. Data is local to that installation/browser and is not synced between devices.
