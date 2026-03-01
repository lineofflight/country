# Country

[![Build](https://github.com/lineofflight/country/workflows/Build/badge.svg)][action]

Country is an IP-to-country geolocation API that returns a user’s country based on their IP address.

[We run a free instance][free-instance]—no API key
needed. You can also self-host if preferred.

## Usage

The API has a minimal interface.

### GET /

Returns the country of the IP making the request, typically the user’s browser or app.

```json
/* https://api.country.is/ */
{
  "ip": "77.249.1.1",
  "country": "NL"
}
```

### GET /{ip}

Returns the country of any given IP. The API supports both with IPv4 and IPv6.

```json
/* https://api.country.is/77.1.2.3 */
{
  "ip": "77.1.2.3",
  "country": "DE"
}
```

### Extra fields

Add `?fields=` to any GET request to include additional data. Available fields: `city`, `continent`, `subdivision`, `postal`, `location`, `asn`.

```json
/* https://api.country.is/8.8.8.8?fields=city,asn,location */
{
  "ip": "8.8.8.8",
  "country": "US",
  "city": "Mountain View",
  "asn": { "number": 15169, "organization": "Google LLC" },
  "location": { "latitude": 37.386, "longitude": -122.0838, "accuracy_radius": 1000, "time_zone": "America/Los_Angeles" }
}
```

### POST /

Look up multiple IPs in a single request (up to 100). Supports `?fields=` as well.

```sh
curl -X POST -H 'Content-Type: application/json' \
  -d '["8.8.8.8","1.1.1.1"]' \
  https://api.country.is/
```

```json
[
  { "ip": "8.8.8.8", "country": "US" },
  { "ip": "1.1.1.1", "country": "AU" }
]
```

### GET /info

Provides metadata about the API, including when the data sources were last updated.

```json
/* https://api.country.is/info */
{
  "dataSources": ["maxmind", "cloudflare"],
  "lastUpdated": "2024-08-20T18:34:36.000Z"
}
```

The API automatically updates MaxMind data every 24 hours in the background. A machine-readable [OpenAPI spec](/openapi.json) is also available.

## Deployment

If you prefer not to use our hosted service, you can self-host with Docker.

```
docker run -d -p 3000:3000 \
  -e ACCOUNT_ID=YOUR_MAXMIND_ACCOUNT_ID \
  -e LICENSE_KEY=YOUR_MAXMIND_LICENSE_KEY \
  -v country-data:/app/data \
  --pull always \
  lineofflight/country
```

Replace `YOUR_MAXMIND_ACCOUNT_ID` and `YOUR_LICENSE_KEY` with your MaxMind account ID and the license key associated with it.

### Cloudflare Integration

To improve performance, deploy behind [Cloudflare][cloudflare]:

1. Point your domain to Cloudflare's nameservers
2. Enable Cloudflare proxying for your API endpoint (click the cloud icon next to your DNS record until it turns orange)

When deployed with Cloudflare, the API will automatically use Cloudflare's geolocation data as the primary source, falling back to MaxMind when needed.

[free-instance]: https://api.country.is
[action]: https://github.com/lineofflight/country/actions
[cloudflare]: https://www.cloudflare.com
