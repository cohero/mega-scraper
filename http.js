const got = require('got')
const log = require('debug')('sar:http')
const getFreeHttpsProxy = require('get-free-https-proxy')
const tunnel = require('tunnel')
const UA = require('user-agents')

module.exports = get

async function get ({ url, headers = {}, useProxy = false || process.env.USE_PROXY === 'TRUE' }) {
  if (useProxy) {
    const proxies = await getFreeHttpsProxy()
    const index = parseInt(Math.random() * proxies.length, 10)
    const proxy = proxies[index]
    headers.agent = tunnel.httpsOverHttps({ proxy })
    // headers.agent = tunnel.httpOverHttp({ proxy })
    log('using proxy', proxy, index)
  }
  headers['user-agent'] = randomUA()

  return got(url, { headers })
}

function randomUA () {
  return new UA().toString()
}
