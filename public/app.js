/* global Vue, axios */
/* eslint-disable no-new */

new Vue({
  el: '#search',
  data: {
    q: '',
    movies: []
  },
  methods: {
    search: async function () {
      const { q } = this
      if (q.length > 2) {
        const res = await axios.get(`/search/${q}`)
        this.movies = res.data
      } else {
        this.movies = []
      }
    }
  }
})

Vue.component('movie', {
  props: ['movie'],
  template: `
    <div class="box">
      <article class="media">
        <div class="media-content">
          <div class="content">
            <p>
              <strong><a v-on:click="expand">{{movie.title}}</a></strong>
              <ul v-if="movie.m3u8">
                <m3u8
                  v-for="m3u8 in movie.m3u8"
                  v-bind:m3u8="m3u8"
                ></m3u8>
              </ul>
            </p>
          </div>
        </div>
      </article>
    </div>
  `,
  methods: {
    expand: async function () {
      const res = await axios.get(`/movies/${this.movie.id}`)
      if (res.data.m3u8) {
        Vue.set(this.movie, 'm3u8', res.data.m3u8)
      }
    }
  }
})

Vue.component('m3u8', {
  props: ['m3u8'],
  template: `
    <li>
      <a v-bind:href="m3u8.url" target="_blank">{{m3u8.title}}</a>
    </li>
  `
})
