#!/usr/bin/env node

const amazon = require('./lib/scrapers/amazon')
const { createServer } = require('./server')
const amazonParser = require('./lib/parsers/amazon')
const fs = require('fs')
const path = require('path')
const pages = require('./lib/create-queue')('pages')
pages.clean(0, 'wait')
pages.clean(0, 'active')
pages.clean(0, 'delayed')
pages.clean(0, 'failed')
const debug = require('debug')
const log = debug('sar:bin')
debug.enable('sar*')

const scrapingOptions = {
  puppeteer: process.env.USE_PUPPETEER === 'true',
  lambda: process.env.USE_LAMBDA === 'true',
  cache: process.env.USE_CACHE !== 'false',
  useProxy: process.env.USE_PROXY === 'true'
}

if (require.main === module) {
  main(process.argv[2], process.argv[3])
    .then(() => {
      // process.exit(0)
    })
    .catch((err) => {
      log(err)
      process.exit(1)
    })
} else {
  module.exports = main
}

async function main (asin, startingPageNumber = 1) {
  log({ asin, startingPageNumber, scrapingOptions })
  const httpInstance = createServer()
  const stats = createStats()

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber: startingPageNumber }, scrapingOptions)
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    return []
  }
  stats.productReviewsCount = productReviewsCount
  httpInstance.update(stats)

  const { reviews: firstPageReviews } = await amazon.scrapeProductReviews({ asin, pageNumber: startingPageNumber }, scrapingOptions)

  stats.pageSize = firstPageReviews.length
  stats.totalPages = parseInt(productReviewsCount / stats.pageSize, 10) + 1

  httpInstance.update(stats)
  log(JSON.stringify(stats, null, 2))

  pages.process(async (job, done) => {
    if (stats.noMoreReviewsPageNumber) {
      log(`Skipping ${job.data.pageNumber} / ${stats.totalPages} (noMoreReviewsPageNumber ${stats.noMoreReviewsPageNumber})`)
      return []
    }
    log(`Processing ${job.data.pageNumber} / ${stats.totalPages} (lastPageSize ${stats.lastPageSize})`)
    try {
      await scrape({ asin, pageNumber: job.data.pageNumber }, scrapingOptions)
      Object.assign(stats, { scrapedPages: stats.scrapedPages + 1 })
    } catch (err) {
      log(`failed job ${err.message}`, err)
    }
    Object.assign(stats, { elapsed: Date.now() - +new Date(stats.start) })
    log(JSON.stringify(pick(stats, ['start', 'elapsed', 'productReviewsCount', 'scrapedReviewsCount', 'accuracy', 'pageSize', 'scrapedPages', 'lastPageSize', 'totalPages', 'noMoreReviewsPageNumber', 'screenshots']), null, 2))
    httpInstance.update(stats)
    done()

    async function scrape ({ asin, pageNumber } = {}, options = { cache: true }) {
      if (!asin) throw new Error(`missing asin ${asin}`)
      if (!Number.isFinite(pageNumber)) throw new Error(`missing pageNumber ${pageNumber}`)
      const htmlPath = path.resolve(__dirname, 'html', `${asin}/${asin}-${pageNumber}.html`)
      const jsonPath = path.resolve(__dirname, 'json', `${asin}/${asin}-${pageNumber}.json`)
      const asinPageNumberExistsHTML = fs.existsSync(htmlPath)
      const asinPageNumberExistsJSON = fs.existsSync(jsonPath)

      console.log({ htmlPath, asinPageNumberExistsHTML, jsonPath, asinPageNumberExistsJSON })

      if (asinPageNumberExistsJSON && options.cache) {
        log(`Using json/${asin}/${asin}-${pageNumber}.json`)
        const content = fs.readFileSync(jsonPath, { encoding: 'utf8' })
        const reviews = JSON.parse(content)
        return { reviews }
      } else if (asinPageNumberExistsHTML && options.cache) {
        log(`Using html/${asin}/${asin}
        -${pageNumber}.html`)
        const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
        const reviews = await amazonParser.parseProductReviews(html)
        return { reviews }
      }

      log(`Scraping page ${pageNumber} for asin ${asin}`)
      return amazon.scrapeProductReviews({ asin, pageNumber }, scrapingOptions)
        .then(processProductReviews({ asin, pageNumber }))

      function processProductReviews ({ asin, pageNumber } = {}) {
        return ({ reviews, screenshotPath }) => {
          if (reviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
            stats.noMoreReviewsPageNumber = pageNumber
          }

          stats.lastPageSize = reviews.length
          stats.scrapedReviewsCount += reviews.length

          log(`Found ${reviews && reviews.length} product reviews on page ${pageNumber} / ${stats.totalPages} for asin ${asin}`)
          const accuracy = (stats.scrapedReviewsCount / productReviewsCount)
          stats.accuracy = accuracy
          stats.reviews = stats.reviews.concat(reviews)
          log({ screenshotPath })
          stats.screenshots = stats.screenshots.concat([screenshotPath]).filter(Boolean)
          stats.reviews = stats.reviews.slice(-10)
          stats.screenshots = stats.screenshots.slice(-10)

          log(`Accuracy ${(accuracy).toFixed(1)} (${stats.scrapedReviewsCount} / ${productReviewsCount})`)
          return reviews
        }
      }
    }
  })

  const pageNumbers = Array.from({ length: stats.totalPages - startingPageNumber + 1 }, (_, i) => i + startingPageNumber)

  for (const pageNumber of pageNumbers) {
    log('adding', { pageNumber })
    await pages.add({ pageNumber })
  }

  function pick (object, keys) {
    return keys.reduce((acc, key) => Object.assign(acc, { [key]: object[key] }), {})
  }

  function createStats () {
    return {
      asin,
      startingPageNumber,
      start: new Date().toISOString(),
      elapsed: 0,
      finish: undefined,
      productReviewsCount: 0,
      scrapedReviewsCount: 0,
      accuracy: 0,
      pageSize: 0,
      scrapedPages: 0,
      lastPageSize: 0,
      totalPages: 0,
      noMoreReviewsPageNumber: 0,
      reviews: [],
      screenshots: []
    }
  }
}
