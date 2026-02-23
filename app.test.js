const request = require("supertest")
const { initializeDatabase } = require("./dbInit")

// Initialize the database before requiring the app
initializeDatabase()

const app = require("./app")

describe("GET /", () => {
  let ip, req

  beforeEach(() => {
    ip = "8.8.8.8"
    req = request(app).get("/").set("x-forwarded-for", `${ip},1.2.3.4`)
  })

  it("returns ip", async () => {
    const res = await req
    expect(res.body.ip).toBe(ip)
  })

  it("returns country", async () => {
    const res = await req
    expect(res.body.country).toBe("US")
  })

  it("sets cache control to no-cache", async () => {
    const res = await req
    expect(res.headers["cache-control"]).toBe("no-cache")
  })

  describe("with cloudflare", () => {
    let country

    beforeEach(() => {
      country = "DE"
      req.set("cf-ipcountry", country)
    })

    it("returns ip", async () => {
      const res = await req
      expect(res.body.ip).toBe(ip)
    })

    it("returns country", async () => {
      const res = await req
      expect(res.body.country).toBe(country)
    })
  })
})

describe("GET /:ip", () => {
  let ip, req

  describe("given a good ip", () => {
    beforeEach(() => {
      ip = "8.8.8.8"
      req = request(app).get(`/${ip}`).set("x-forwarded-for", "1.2.3.4")
    })

    it("returns ip", async () => {
      const res = await req
      expect(res.body.ip).toBe(ip)
    })

    it("returns country", async () => {
      const res = await req
      expect(res.body.country).toBe("US")
    })

    it("sets cache control to public", async () => {
      const res = await req
      expect(res.headers["cache-control"]).toContain("public")
    })

    describe("with cloudflare", () => {
      beforeEach(() => {
        req.set("cf-ipcountry", "DE")
      })

      it("returns country", async () => {
        const res = await req
        expect(res.body.country).toBe("US")
      })
    })
  })

  describe("given an ip that doesn't return a match", () => {
    beforeEach(() => {
      ip = "192.168.0.1"
      req = request(app).get(`/${ip}`).set("x-forwarded-for", "1.2.3.4")
    })

    it("returns an error", async () => {
      const res = await req
      expect(res.status).toBe(404)
    })
  })

  describe("given an invalid ip", () => {
    beforeEach(() => {
      ip = "9.9.9.9boom"
      req = request(app).get(`/${ip}`).set("x-forwarded-for", "1.2.3.4")
    })

    it("returns an error", async () => {
      const res = await req
      expect(res.status).toBe(422)
    })
  })
})

describe("GET /info", () => {
  let req

  beforeEach(() => {
    req = request(app).get("/info")
  })

  it("returns when last updated", async () => {
    const res = await req
    expect(res.body.lastUpdated).toBeDefined()
  })

  it("returns data sources", async () => {
    const res = await req.set("cf-ipcountry", "DE")
    expect(res.body.dataSources).toBeDefined()
  })

  it("sets cache-control to public", async () => {
    const res = await req
    expect(res.headers["cache-control"]).toContain("public")
  })
})

it("handles bad routes", async () => {
  const res = await request(app).get("/foo/bar")
  expect(res.status).toBe(422)
})

it("returns a robots.txt", async () => {
  const res = await request(app).get("/robots.txt")
  expect(res.status).toBe(200)
})
