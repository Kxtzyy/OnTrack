# OnTrack

OnTrack is a cross-platform habit and activity tracker built with Expo, React Native, and TypeScript. It is designed around fast daily logging, flexible tracker customisation, local-first persistence, and optional cloud backup.

## Features

- Create custom trackers with titles, goals or limits, units, icons, colours, and uploaded images.
- Organise trackers into Daily, Weekly, and Monthly sections.
- Log progress from the home screen with one-tap tracker updates.
- Review current and historical progress through calendar-based views.
- Persist data locally with SQLite and hydrate UI state through Zustand.
- Back up and restore tracker data through Supabase.
- Switch between light and dark themes stored with AsyncStorage.

## Tech Stack

- **App:** Expo, React Native, Expo Router, TypeScript
- **State:** Zustand, React Context
- **Storage:** Expo SQLite, AsyncStorage
- **Cloud:** Supabase
- **UI:** React Native components, Expo Vector Icons, React Native Reanimated colour picker
- **Device APIs:** Expo Image Picker, Expo Notifications, Expo Navigation Bar

## Architecture

```text
app/
  (tabs)/              Main Home, Calendar, and Settings tabs
  Account/             Login, password, and email screens
  Contexts/            Theme and authentication providers
  Settings/            Backup, account, tracker list, and support screens
  newTrackerView.tsx   Tracker creation flow
  editTracker.tsx      Tracker editing flow
  selectImage.tsx      Icon, colour, and image picker flow
components/            Shared calendar, section modal, and hydration logic
storage/               SQLite, Supabase, and Zustand store layer
types/                 Tracker and section domain models
assets/app.db          Seed SQLite database schema
```

The app follows a local-first model: SQLite is the source of persisted device data, Zustand holds the live in-memory view model, and Supabase is used for account-based backup and restore.

## Getting Started

### Prerequisites

- Node.js
- npm
- Expo Go, an iOS Simulator, or an Android Emulator

### Installation

```bash
npm install
npx expo start
```

From the Expo terminal UI, open the app in Expo Go, iOS, Android, or web.

## Scripts

```bash
npm start        # Start the Expo development server
npm run ios      # Start Expo and open iOS
npm run android  # Start Expo and open Android
npm run web      # Start Expo for web
npm test         # Start Jest in watch mode
npx tsc --noEmit # Type-check the project
```

## Configuration

Expo configuration lives in `app.json`, with EAS build profiles in `eas.json`. Supabase connection details are currently defined in `storage/supabase.ts`; replace them with your own project values before running cloud backup or restore against a different backend.

## Development Notes

This project demonstrates mobile product engineering across navigation, persistent storage, state hydration, calendar-based history, custom tracker creation, theming, and cloud sync. For a production release, the next priorities would be moving cloud credentials into environment configuration, expanding automated test coverage, and hardening authentication around Supabase Auth.
