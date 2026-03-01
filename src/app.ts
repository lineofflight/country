import { version } from "../package.json"
import cors from "cors"
import express, { Request, Response } from "express"
import morgan from "morgan"
import {
  validate,
  initReaders,
  getMetadata,
  lookupCountry,
  lookupIp,
  parseFields,
} from "./lookup"

initReaders()

const app = express()

app.use(morgan("combined", { skip: () => process.env.NODE_ENV === "test" }))
app.enable("trust proxy")

app.use(cors())

app.enable("etag")

app.use(express.json())

app.use((req, res, next) => {
  if (req.path == "/") {
    res.set("Cache-Control", "no-cache")
  } else {
    res.set("Cache-Control", "public, max-age=3600")
  }
  next()
})

app.use(express.static("public"))

app.get("/info", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-cache")
  const dataSources = ["maxmind"]
  if (req.headers["cf-ipcountry"] !== undefined) {
    dataSources.push("cloudflare")
  }
  res.json({
    version,
    dataSources,
    lastUpdated: getMetadata().buildEpoch.toISOString(),
  })
})

app.post("/", (req: Request, res: Response) => {
  const ips = req.body
  if (!Array.isArray(ips)) {
    return res
      .status(422)
      .json({ error: { code: 422, message: "Expected JSON array of IPs" } })
  }
  if (ips.length > 100) {
    return res
      .status(422)
      .json({ error: { code: 422, message: "Maximum 100 IPs per request" } })
  }
  for (const ip of ips) {
    if (typeof ip !== "string" || !validate(ip)) {
      return res
        .status(422)
        .json({ error: { code: 422, message: `Invalid IP: ${ip}` } })
    }
  }

  const fields = parseFields(req.query.fields as string | undefined)
  const results = ips.map((ip: string) => {
    const result = lookupIp(ip, fields)
    return result ?? { ip, country: null }
  })

  res.json(results)
})

app.get("/:ip?", (req: Request, res: Response) => {
  const ip = (req.params.ip as string | undefined) || req.ip!
  const fields = parseFields(req.query.fields as string | undefined)

  if (req.params.ip) {
    if (!validate(ip)) {
      return res
        .status(422)
        .json({ error: { code: 422, message: "Unprocessable Entity" } })
    }
  }

  if (fields.size > 0) {
    const result = lookupIp(ip, fields)

    if (!req.params.ip) {
      const cfCountry = req.headers["cf-ipcountry"] as string | undefined
      if (cfCountry && cfCountry !== "XX") {
        if (result) {
          result.country = cfCountry
        } else {
          return res.json({ ip, country: cfCountry })
        }
      }
    }

    if (result) {
      return res.json(result)
    }
    return res.status(404).json({ error: { code: 404, message: "Not Found" } })
  }

  let country: string | undefined

  if (!req.params.ip) {
    const cfCountry = req.headers["cf-ipcountry"] as string | undefined
    if (cfCountry && cfCountry !== "XX") {
      country = cfCountry
    }
  }

  if (!country) {
    country = lookupCountry(ip)
  }

  if (country) {
    res.json({ ip, country })
  } else {
    res.status(404).json({ error: { code: 404, message: "Not Found" } })
  }
})

app.get("*", (req: Request, res: Response) => {
  return res
    .status(422)
    .json({ error: { code: 422, message: "Unprocessable Entity" } })
})

export default app
