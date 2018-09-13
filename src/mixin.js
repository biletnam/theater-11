const lodashId = require('lodash-id')

lodashId.store = function (collection, doc) {
  const id = doc[this.__id()]
  if (id) {
    var d = collection[id]
    if (d) {
      Object.assign(d, doc)
    } else {
      collection[id] = doc
    }
  }

  return doc
}

module.exports = lodashId
