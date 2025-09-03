This repository contains an Expo (React Native) managed workflow app.

- Native Android/iOS builds are not required for CI.
- Some CI analyzers attempt to run ./gradlew from the repository root.
- To prevent failures, a root-level gradlew stub is provided that exits successfully.
- If your CI requires invoking a script, use:
  - sh ./run-gradle.sh
- If you need a real native build later:
  1) cd tic_tac_toe_frontend
  2) npx expo prebuild
  3) Use the generated android/ (with proper Gradle wrapper) and ios/ as needed.
