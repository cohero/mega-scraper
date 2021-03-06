const log = require('debug')('mega-scraper:scrapers:with-queue')

module.exports = async function withQueue ({ queue, events, browser, processFn }) {
  queue.process(processFn)

  queue.on('drained', async function () {
    log('-- queue drained')
    events.emit('done')
  })

  queue.on('active', () => log('-- queue active'))
  queue.on('completed', () => log('-- queue completed'))

  return { queue, events, browser }
}
