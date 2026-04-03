---
name: bright-data
description: Bright Data web scraping and proxy integration. MANDATORY - must fetch current documentation before ANY Bright Data implementation or modification. Use when working with Bright Data proxies, Web Scraper API, SERP API, Browser API, or data collection.
---

# Bright Data Integration Skill

## MANDATORY REQUIREMENT

Before ANY Bright Data implementation, modification, or troubleshooting:

1. **ALWAYS fetch current documentation first** using WebFetch from https://docs.brightdata.com/
2. **Search for the specific feature** you're implementing
3. **Verify API parameters, endpoints, and patterns** against current docs
4. **Only then proceed** with implementation

This is non-negotiable. Bright Data APIs evolve frequently - cached knowledge may be outdated.

## Documentation Lookup Workflow

### Step 1: Identify the Bright Data Product

| Product | Documentation URL | Use Case |
|---------|-------------------|----------|
| Web Scraper API | https://docs.brightdata.com/scraping-automation/web-scraper-api | Structured data extraction |
| SERP API | https://docs.brightdata.com/scraping-automation/serp-api | Search engine results |
| Browser API | https://docs.brightdata.com/scraping-automation/browser-api | Dynamic pages, JS rendering |
| Scraping Browser | https://docs.brightdata.com/scraping-automation/scraping-browser | Puppeteer/Playwright integration |
| Datacenter Proxies | https://docs.brightdata.com/proxy-networks/datacenter-proxies | Fast, cost-effective proxies |
| Residential Proxies | https://docs.brightdata.com/proxy-networks/residential-proxies | High-success-rate proxies |
| ISP Proxies | https://docs.brightdata.com/proxy-networks/isp-proxies | Static residential IPs |
| Mobile Proxies | https://docs.brightdata.com/proxy-networks/mobile-proxies | Mobile network IPs |
| Web Unlocker | https://docs.brightdata.com/scraping-automation/web-unlocker | Auto-unlock blocked sites |

### Step 2: Fetch Documentation

```
WebFetch: https://docs.brightdata.com/scraping-automation/web-scraper-api
```

Or use WebSearch for specific questions:
```
WebSearch: "Bright Data [feature] API documentation"
```

### Step 3: Verify Before Implementing

Check these against current docs:
- [ ] Authentication method (API key, credentials)
- [ ] Endpoint URLs (they may have changed)
- [ ] Request/response format
- [ ] Rate limits and quotas
- [ ] Error codes and handling

## Common Integration Patterns

### Proxy Setup (verify endpoint in docs first)

```typescript
// ALWAYS verify these values against current documentation
const BRIGHTDATA_HOST = 'brd.superproxy.io'; // CHECK DOCS
const BRIGHTDATA_PORT = 22225; // CHECK DOCS

interface BrightDataConfig {
  username: string;
  password: string;
  zone: string;
  country?: string;
}

function createProxyUrl(config: BrightDataConfig): string {
  const { username, password, zone, country } = config;
  const user = country 
    ? `${username}-zone-${zone}-country-${country}`
    : `${username}-zone-${zone}`;
  
  return `http://${user}:${password}@${BRIGHTDATA_HOST}:${BRIGHTDATA_PORT}`;
}
```

### Web Scraper API (verify endpoint in docs first)

```typescript
// FETCH https://docs.brightdata.com/scraping-automation/web-scraper-api FIRST
async function scrapeWithBrightData(url: string, datasetId: string) {
  const response = await fetch(
    `https://api.brightdata.com/datasets/v3/trigger`, // VERIFY IN DOCS
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BRIGHTDATA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: datasetId,
        url,
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Bright Data API error: ${response.status}`);
  }
  
  return response.json();
}
```

### SERP API (verify endpoint in docs first)

```typescript
// FETCH https://docs.brightdata.com/scraping-automation/serp-api FIRST
async function searchWithSERP(query: string) {
  const params = new URLSearchParams({
    query,
    engine: 'google',
    country: 'us',
  });
  
  const response = await fetch(
    `https://api.brightdata.com/serp/v1/search?${params}`, // VERIFY IN DOCS
    {
      headers: {
        'Authorization': `Bearer ${process.env.BRIGHTDATA_API_TOKEN}`,
      },
    }
  );
  
  return response.json();
}
```

### With Puppeteer/Playwright (Scraping Browser)

```typescript
// FETCH https://docs.brightdata.com/scraping-automation/scraping-browser FIRST
import puppeteer from 'puppeteer-core';

async function scrapeWithBrowser(url: string) {
  // VERIFY connection string format in docs
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${process.env.BRIGHTDATA_AUTH}@brd.superproxy.io:9222`,
  });
  
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  await browser.close();
  
  return content;
}
```

## Error Handling

```typescript
// Common Bright Data error codes - VERIFY CURRENT CODES IN DOCS
const BRIGHTDATA_ERRORS = {
  407: 'Authentication failed - check credentials',
  403: 'Forbidden - check zone permissions',
  429: 'Rate limited - reduce request frequency',
  502: 'Bad gateway - proxy network issue',
  503: 'Service unavailable - try again',
} as const;

async function handleBrightDataRequest<T>(
  request: () => Promise<T>
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      const status = (error as { status: number }).status;
      const message = BRIGHTDATA_ERRORS[status as keyof typeof BRIGHTDATA_ERRORS];
      if (message) {
        throw new Error(`Bright Data error ${status}: ${message}`);
      }
    }
    throw error;
  }
}
```

## Environment Variables

```bash
# Required
BRIGHTDATA_USERNAME=your_username
BRIGHTDATA_PASSWORD=your_password
BRIGHTDATA_API_TOKEN=your_api_token

# Optional
BRIGHTDATA_ZONE=residential  # or datacenter, isp, mobile
BRIGHTDATA_COUNTRY=us        # 2-letter country code
```

## Pre-Implementation Checklist

Before writing ANY Bright Data code:

- [ ] Fetched current documentation for the specific product
- [ ] Verified authentication method (token vs username/password)
- [ ] Confirmed endpoint URLs haven't changed
- [ ] Checked rate limits and pricing for the zone/product
- [ ] Reviewed error codes and handling requirements
- [ ] Tested with a simple request before full implementation

## Quick Reference Commands

When you need Bright Data help:

```
# Fetch main documentation
WebFetch: https://docs.brightdata.com/

# Search for specific feature
WebSearch: "Bright Data [feature name] documentation"

# Check API reference
WebFetch: https://docs.brightdata.com/api-reference
```

## Important Notes

- Bright Data APIs change frequently - NEVER rely on cached knowledge
- Zone configurations and proxy formats vary by product
- Authentication differs between proxy access and API access
- Always test in a non-production environment first
- Monitor usage to avoid unexpected charges
