import { spawn, spawnSync } from "child_process"
import { existsSync } from "fs"

export const cityFile = "./data/GeoLite2-City.mmdb"
export const asnFile = "./data/GeoLite2-ASN.mmdb"

export function initializeDatabase(): void {
  if (!existsSync(cityFile) || !existsSync(asnFile)) {
    if (process.env.LICENSE_KEY === undefined) {
      throw new Error(
        "Set license credentials to download GeoIP data from MaxMind",
      )
    }
    console.log("Creating database")
    spawnSync("./getdb")
  }
}

export function scheduleDatabaseUpdates(): void {
  if (process.env.LICENSE_KEY && process.env.RUN_INTERVAL !== "false") {
    setInterval(
      () => {
        console.log("Updating database")
        spawn("./getdb")
      },
      24 * 3600 * 1000,
    )
  }
}
