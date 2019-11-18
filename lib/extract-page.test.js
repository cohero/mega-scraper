const test = require('ava')
const extactPage = require('./extract-page')

test('extracts page 1 given amazon.it product-reviews url', t => {
  t.is(
    1,
    extactPage('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
test('extracts page 1 given amazon.com product-reviews url', t => {
  t.is(
    1,
    extactPage('https://www.amazon.com/Echo-Dot-3rd-Gen-Charcoal/product-reviews/B07FZ8S74R/')
  )
})
test('extracts page 2 given amazon.it product-reviews url', t => {
  t.is(
    2,
    extactPage('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/?pageNumber=2')
  )
})
test('extracts page 2 given amazon.com product-reviews url', t => {
  t.is(
    2,
    extactPage('https://www.amazon.com/Echo-Dot-3rd-Gen-Charcoal/product-reviews/B07FZ8S74R/?pageNumber=2')
  )
})