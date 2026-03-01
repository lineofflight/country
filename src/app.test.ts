import request from "supertest"
import { initializeDatabase } from "./dbInit"

initializeDatabase()

import app from "./app"

describe("GET /", () => {
  let ip: string, req: request.Test

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
    let country: string

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
  let ip: string, req: request.Test

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

describe("GET /:ip?fields=", () => {
  it("returns city when requested", async () => {
    const res = await request(app).get("/8.8.8.8?fields=city")
    expect(res.body.ip).toBe("8.8.8.8")
    expect(res.body.country).toBe("US")
    expect(res.body).toHaveProperty("city")
  })

  it("returns asn when requested", async () => {
    const res = await request(app).get("/8.8.8.8?fields=asn")
    expect(res.body.asn).toBeDefined()
    expect(res.body.asn.number).toBeDefined()
    expect(res.body.asn.organization).toBeDefined()
  })

  it("returns location when requested", async () => {
    const res = await request(app).get("/8.8.8.8?fields=location")
    expect(res.body.location).toBeDefined()
    expect(res.body.location.latitude).toBeDefined()
    expect(res.body.location.longitude).toBeDefined()
  })

  it("returns multiple fields", async () => {
    const res = await request(app).get("/8.8.8.8?fields=city,asn,location")
    expect(res.body).toHaveProperty("city")
    expect(res.body).toHaveProperty("asn")
    expect(res.body).toHaveProperty("location")
  })

  it("ignores unknown fields", async () => {
    const res = await request(app).get("/8.8.8.8?fields=bogus,city")
    expect(res.body).toHaveProperty("city")
    expect(res.body).not.toHaveProperty("bogus")
  })

  it("returns only ip and country without fields param", async () => {
    const res = await request(app).get("/8.8.8.8")
    expect(Object.keys(res.body)).toEqual(["ip", "country"])
  })

  it("returns fields with cloudflare override on GET /", async () => {
    const res = await request(app)
      .get("/?fields=city")
      .set("x-forwarded-for", "8.8.8.8,1.2.3.4")
      .set("cf-ipcountry", "DE")
    expect(res.body.country).toBe("DE")
    expect(res.body).toHaveProperty("city")
  })
})

describe("POST /", () => {
  it("returns results for valid IPs", async () => {
    const res = await request(app).post("/").send(["8.8.8.8", "1.1.1.1"])
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].ip).toBe("8.8.8.8")
    expect(res.body[0].country).toBe("US")
    expect(res.body[1].ip).toBe("1.1.1.1")
    expect(res.body[1].country).toBeDefined()
  })

  it("rejects non-array body", async () => {
    const res = await request(app).post("/").send({ ip: "8.8.8.8" })
    expect(res.status).toBe(422)
  })

  it("rejects invalid IP in batch", async () => {
    const res = await request(app).post("/").send(["8.8.8.8", "not-an-ip"])
    expect(res.status).toBe(422)
  })

  it("rejects more than 100 IPs", async () => {
    const ips = Array(101).fill("8.8.8.8")
    const res = await request(app).post("/").send(ips)
    expect(res.status).toBe(422)
  })

  it("returns null country for private IPs", async () => {
    const res = await request(app).post("/").send(["192.168.0.1"])
    expect(res.status).toBe(200)
    expect(res.body[0].country).toBeNull()
  })

  it("supports fields parameter", async () => {
    const res = await request(app).post("/?fields=city,asn").send(["8.8.8.8"])
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty("city")
    expect(res.body[0]).toHaveProperty("asn")
  })
})

describe("GET /info", () => {
  let req: request.Test

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

  it("sets cache-control to no-cache", async () => {
    const res = await req
    expect(res.headers["cache-control"]).toBe("no-cache")
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
