import Ajv from "ajv"
import addFormats from "ajv-formats"
import request from "supertest"
import { initializeDatabase } from "./dbInit"

initializeDatabase()

import app from "./app"
import spec from "../public/openapi.json"

const ajv = new Ajv({ strict: false })
addFormats(ajv)

const schemas = spec.components.schemas
const responses = spec.components.responses

const lookupResult = ajv.compile(schemas.LookupResult)
const lookupArray = ajv.compile({
  type: "array",
  items: schemas.LookupResult,
})
const errorResponse = ajv.compile(
  responses.NotFound.content["application/json"].schema,
)
const infoSchema = ajv.compile(
  spec.paths["/info"].get.responses["200"].content["application/json"].schema,
)

describe("OpenAPI schema validation", () => {
  it("GET / conforms to LookupResult", async () => {
    const res = await request(app)
      .get("/")
      .set("x-forwarded-for", "8.8.8.8,1.2.3.4")
    expect(lookupResult(res.body)).toBe(true)
  })

  it("GET /{ip} conforms to LookupResult", async () => {
    const res = await request(app).get("/8.8.8.8")
    expect(lookupResult(res.body)).toBe(true)
  })

  it("GET /{ip}?fields conforms to LookupResult", async () => {
    const res = await request(app).get("/8.8.8.8?fields=city,asn,location")
    expect(lookupResult(res.body)).toBe(true)
  })

  it("POST / conforms to LookupResult array", async () => {
    const res = await request(app).post("/").send(["8.8.8.8"])
    expect(lookupArray(res.body)).toBe(true)
  })

  it("GET /info conforms to info schema", async () => {
    const res = await request(app).get("/info")
    expect(infoSchema(res.body)).toBe(true)
  })

  it("404 conforms to error schema", async () => {
    const res = await request(app).get("/192.168.0.1")
    expect(res.status).toBe(404)
    expect(errorResponse(res.body)).toBe(true)
  })

  it("422 conforms to error schema", async () => {
    const res = await request(app).get("/999.999.999.999")
    expect(res.status).toBe(422)
    expect(errorResponse(res.body)).toBe(true)
  })
})
