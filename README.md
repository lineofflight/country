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

### GET /info

Provides metadata about the API, including when the data sources were last updated.

```json
/* https://api.country.is/info */
{
  "dataSources": ["maxmind", "cloudflare"],
  "lastUpdated": "2024-08-20T18:34:36.000Z"
}
```

The API automatically updates MaxMind data every 24 hours in the background.

## Deployment

If you prefer not to use our hosted service, you can self-host with Docker.

```
docker run -d -p 3000:3000 -e ACCOUNT_ID=YOUR_MAXMIND_ACCOUNT_ID -e LICENSE_KEY=YOUR_MAXMIND_LICENSE_KEY lineofflight/country
```

Replace `YOUR_MAXMIND_ACCOUNT_ID` and `YOUR_LICENSE_KEY` with your MaxMind account ID and the license key associated with it.

[free-instance]: https://api.country.is
[action]: https://github.com/lineofflight/country/actions
