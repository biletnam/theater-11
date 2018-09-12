const axios = require('axios')
const cheerio = require('cheerio')
const Entities = require('html-entities').AllHtmlEntities
const queryString = require('query-string')

const entities = new Entities()

module.exports = class Theater {
  constructor (baseURL, cookie) {
    this.baseURL = baseURL
    this.cookie = cookie
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

  async getCategory (id, page = 1) {
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
      next = () => this.getCategory(id, page + 1)
    }

    return { movies, next }
  }

  async getMovie (id) {
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
}
