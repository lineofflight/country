import cluster from "cluster"
import os from "os"
import { initializeDatabase, scheduleDatabaseUpdates } from "./dbInit"

if (cluster.isPrimary) {
  initializeDatabase()
  scheduleDatabaseUpdates()

  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork()
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`)
  })
} else {
  const { default: app } = require("./app")
  const { initReaders } = require("./lookup")

  process.on("message", (msg: string) => {
    if (msg === "reload") {
      initReaders()
      console.log("Database updated")
    }
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Worker ${cluster.worker!.id} listening on port ${port}`)
  })
}
