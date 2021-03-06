## api

### browser

browser + puppeteer + proxy + screenshot + blocker + stealth utilitlies

#### createBrowser(options)

create a new browser based on puppeteer, with the following options

- proxy: pass each browser request through a free proxy service, defaults to true (can make you less detectable as a scraper)
- headless: use puppeteer in headless mode, defaults to true
- stylesheets: load css files, defaults to false (set to true to load css)
- javascript: load js files, defaults to false (set to true to load js)
- images: load images, defaults to false (set to true to load images)
- cookie:  defaults to undefined (can make you less detectable as a scraper)
- width: defaults to 1280
- height: defaults to 800
- slowMo: slow down browser interaction, defaults to undefined (useful when in headful mode)
- userAgent: a user agent string (e.g. "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36")
- timeout: timeout requests, defaults to 5000

```js
const {browser: {createBrowser}} = require('mega-scraper')

const browser = await createBrowser()

const page = await browser.newPage('https://www.wikipedia.org/')
```

##### browser.createBrowser.newPage(url, options)

opens a new page, reuses "free" pages by default to use less resources

```js
const browser = await createBrowser()

const page = await browser.newPage('https://www.wikipedia.org/', {reusePage: true})
```

#### getPuppeteerOptions(options = {headless: true, slowMo: undefined})

used as internal api.

returns puppeteer options ready to be passed to `puppeteer.launch` and `createBrowser`'s internal api

```js
const {browser: {getPuppeteerOptions}} = require('mega-scraper')

const puppeteerOptions = getPuppeteerOptions()
const instance = await puppeteer.launch(puppeteerOptions)
```

#### preparePage(page, options)

used as internal api.

enhances a puppeteer browser page. supports same `createBrowser` options

```js
const {browser: {getPuppeteerOptions, preparePage}} = require('mega-scraper')

const puppeteerOptions = getPuppeteerOptions()
const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = preparePage(page)
```

#### setStealth

used as internal api.

enhances a page with stealth functionality. sets some defaults to look less like a scraper.

```js
const {browser: {getPuppeteerOptions, setStealth}} = require('mega-scraper')

const puppeteerOptions = getPuppeteerOptions()
const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = setStealth(page)
```

#### takeScreenshot

used as internal api.

takes a screenshots of a page and saves it in pwd / `screenshots`.

```js
const {browser: {getPuppeteerOptions, takeScreenshot}} = require('mega-scraper')

const puppeteerOptions = getPuppeteerOptions()
const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = takeScreenshot(page, 'https://wikipedia.org')
```



### queue

utilities for managing the scraper queue

#### createQueue(queueNameOrUrl, options = {redis_port: 6379, redis_host: '0.0.0.0', redis_password})

creates a queue based on redis (bull api) to handle the scraping jobs

```js
const {queue: {createQueue}} = require('mega-scraper')

const wikipediaQueue = createQueue('wikipedia')

const url = 'https://www.wikipedia.org/'
const job = await wikipediaQueue.add({ url })
```

#### getQueueName(url)

generate a unique queue name

something like `scrape_c10307d9-9f43-4f9b-91a0-be96f4c3a2af`

```js
const {queue: {getQueueName, createQueue}} = require('mega-scraper')

const queueName = getQueueName()
const queue = createQueue(queueName)
```


### cache(key)

creates a cache for the scraper

```js
const {cache} = require('mega-scraper')
const statsCache = cache(statsCacheName)
```

### options

used as internal api.

parses the cli args.

```js
const {options} = require('mega-scraper')
```

### createServer

used as internal api.

creates a web server used as a small scraping monitor.


```js
const {createServer} = require('mega-scraper')
createServer()
```
