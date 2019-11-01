const { test } = require('tap')

const {
  parseProductReviews,
  reviewFromHtml
} = require('./parsers/amazon')

const {
  getProductReviewsHtml
} = require('../amazon')

test('parses product reviews paginated', async t => {
  const html = await getProductReviewsHtml({ asin: 'B07747FR44', pageNumber: 1 })
  const reviews = parseProductReviews(html)
  t.plan(2)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
})

test('extracts review from html', async t => {
  const html = await getProductReviewsHtml({ asin: 'B07747FR44', pageNumber: 1 })
  t.plan(6)
  const reviews = parseProductReviews(html)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviewFromHtml(reviews[0])
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
