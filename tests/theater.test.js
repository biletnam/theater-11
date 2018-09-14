require('dotenv').config()
const { describe, it, before } = require('mocha')
const assert = require('assert')
const request = require('supertest')

const Theater = require('../src/theater')
const app = require('../server')

const theater = new Theater(process.env.BASE_URL, process.env.COOKIE)

describe('# theater', () => {
  before(async () => {
    theater.db.get('movies').remove().write()
  })

  it('should get category', async () => {
    const res = await theater.crawlCategory(15)
    assert(res.movies.length)
    assert(res.next !== undefined)

    const [movie] = res.movies
    assert(movie.id)
    assert(movie.title)
  })

  it('should get movie', async () => {
    const movie = await theater.crawlMovie(7225)
    assert(movie.id)
    assert(movie.title)
    assert(movie.m3u8.length)

    const [m3u8] = movie.m3u8
    assert(m3u8.id)
    assert(m3u8.title)
    assert(m3u8.url)
  })

  it('should sync category', async () => {
    await theater.syncCategory(15)
    const cate = theater.db.get('categories.15').value()
    assert.equal(cate.id, 15)
    assert(cate.movies.length)
  })

  it('should sync movie', async () => {
    await theater.syncMovie(7225)
    const movie = theater.db.get('movies.7225').value()
    assert(movie.id)
    assert(movie.m3u8.length)
  })

  it('should get movies', async () => {
    const movies = await theater.search('เด็ก')
    assert(movies.length)
    const [movie] = movies
    assert(movie.id)
    assert(movie.title)
  })
})

describe('GET /movies/:id', () => {
  it('should get movie', async () => {
    let res = await request(app).get('/movies/7225').expect(200)
    let movie = res.body
    assert(movie.m3u8.length)

    res = await request(app).get('/movies/7222').expect(200)
    movie = res.body
    assert(movie.m3u8.length)
  })
})

describe('GET /categories/:id', () => {
  it('should get category', async () => {
    let res = await request(app).get('/categories/15').expect(200)
    let cate = res.body
    let [movie] = cate.movies
    assert(movie.id)
    assert(movie.title)
  })
})

describe.only('GET /search/:q', () => {
  it('should get movie', async () => {
    let res = await request(app).get('/search/%E0%B8%95%E0%B8%B2%E0%B8%A2').expect(200)
    const movies = res.body
    assert(movies.length)
    const [movie] = movies
    assert(movie.id)
    assert(movie.title)
  })
})
