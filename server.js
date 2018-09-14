require('dotenv').config()
const express = require('express')
const app = express()

const Theater = require('./src/theater')

const port = process.env.PORT
const theater = new Theater(process.env.BASE_URL, process.env.COOKIE)

app.get('/movies/:id', async (req, res) => {
  const id = req.params.id
  const movie = await theater.getMovie(id)
  res.json(movie)
})

app.get('/categories/:id', async (req, res) => {
  const id = req.params.id
  const cate = await theater.getCategory(id)
  res.json(cate)
})

app.get('/search/:q', async (req, res) => {
  const q = req.params.q
  const movies = await theater.search(q)
  res.json(movies)
})

if (!module.parent) {
  app.listen(port, () => console.log(`Started on port ${port}!`))
}

module.exports = app
