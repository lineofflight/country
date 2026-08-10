import { initializeDatabase } from "./src/dbInit"

// Runs once before any test module is evaluated. Importing ./src/app calls
// initReaders(), which reads the mmdb files, so they must exist by then.
export default function setup(): void {
  initializeDatabase()
}
