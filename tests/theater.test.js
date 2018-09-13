require('dotenv').config()
const { describe, it, before } = require('mocha')
const assert = require('assert')

const Theater = require('../src/theater')
const theater = new Theater(process.env.BASE_URL, process.env.COOKIE)

describe('# theater', () => {
  before(async () => {
    theater.db.get('movies').remove().write()
  })

  it('should get category', async () => {
    const res = await theater.getCategory(15)
    assert(res.movies.length)
    assert(res.next !== undefined)

    const [movie] = res.movies
    assert(movie.id)
    assert(movie.title)
  })

  it('should get movie', async () => {
    const movie = await theater.getMovie(7225)
    assert(movie.id)
    assert(movie.title)
    assert(movie.m3u8.length)

    const [m3u8] = movie.m3u8
    assert(m3u8.id)
    assert(m3u8.title)
    assert(m3u8.url)
  })

  it('should update category', async () => {
    await theater.updateCategory(15)
    const cate = theater.db.get(`categories.15`).value()
    assert.equal(cate.id, 15)
    assert(cate.movies.length)
  })
})
