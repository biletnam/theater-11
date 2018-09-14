const axios = require('axios')
const cheerio = require('cheerio')
const Entities = require('html-entities').AllHtmlEntities
const queryString = require('query-string')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const mixin = require('./mixin')
const categories = require('./categories')

const entities = new Entities()

module.exports = class Theater {
  constructor (baseURL, cookie) {
    this.baseURL = baseURL
    this.cookie = cookie

    this.db = low(new FileSync('db.json'))
    this.db._.mixin(mixin)
    this.db.defaults({
      categories: {},
      movies: {}
    }).write()
    categories.map(c => this.db.get('categories').store(c).write())
  }

  get (url) {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': this.cookie
    }
    return axios.request({ url, method: 'get', baseURL: this.baseURL, headers })
  }

  post (url, data) {
    const headers = { 'Cookie': this.cookie }
    return axios.request({ url, method: 'post', baseURL: this.baseURL, headers, data })
  }

  async crawlCategory (id, page = 1) {
    const url = `category/type_list/${id}?page=${page}`
    const res = await this.get(url)
    const $ = cheerio.load(res.data)
    const movies = $('.type-list.list li').map((i, el) => {
      const title = entities.decode($(el).find('.description').html())
      const url = queryString.parseUrl($(el).find('a').attr('href'))
      const id = +url.query.cid
      return ({ id, title })
    }).toArray()

    let next = false
    if (movies.length) {
      next = () => this.crawlCategory(id, page + 1)
    }

    return { movies, next }
  }

  async crawlMovie (id) {
    const res = await this.get(`channelview?cid=${id}`)
    const $ = cheerio.load(res.data)
    const title = entities.decode($('title').html()).replace('HD2LivePlus Movie : ', '')
    const m3u8 = await Promise.all($('.channel-list').map(async (i, el) => {
      const id = $(el).find('a').attr('onclick')
      const title = $(el).find('img').attr('title')
      const res = await this.post('channelview/getChannelSource', `id=${id}`)
      return { id, title, url: res.data }
    }).toArray())
    return { id, title, m3u8 }
  }

  async syncCategory (id) {
    let res = await this.crawlCategory(id)
    const movies = []
    while (res.next) {
      for (let i = 0; i < res.movies.length; i++) {
        const movie = res.movies[i]
        movies.push(movie.id)
        this.db.get('movies').store(movie).write()
      }
      res = await res.next()
    }
    this.db.get('categories').store({ id, movies }).write()
  }

  async syncMovie (id) {
    const movie = await this.crawlMovie(id)
    this.db.get('movies').store(movie).write()
    return this.db.get(`movies.${id}`).value()
  }

  async getCategory (id) {
    const cate = this.db.get(`categories.${id}`).value()
    if (cate) {
      cate.movies = cate.movies.map((id) => {
        return this.db.get(`movies.${id}`).value()
      }).filter(m => !!m)
      return cate
    }
    return null
  }

  async getMovie (id) {
    let movie = this.db.get(`movies.${id}`).value()
    if (!movie || movie.m3u8 === undefined) {
      movie = await this.syncMovie(id)
    }
    return movie
  }
}
