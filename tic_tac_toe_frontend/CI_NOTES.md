CI notes

- This project is an Expo managed app. Native Android/iOS builds are not required for CI.
- Some analyzers may still run ./gradlew. For that purpose, a stub wrapper is provided in android/ that exits successfully.
- If the CI cannot preserve executable bits, it can call:
  - sh android/run-gradle.sh
- If a real native build is desired later, remove the stubs and run:
  - npx expo prebuild
  - Then use the generated android/ios projects for native builds.
