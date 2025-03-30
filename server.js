const { initializeDatabase, scheduleDatabaseUpdates } = require("./dbInit")

// Initialize and schedule database updates
initializeDatabase()
scheduleDatabaseUpdates()
const app = require("./app")

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
