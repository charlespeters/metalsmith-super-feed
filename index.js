const validate = (metadata, settings) => {
  if (!metadata.collections) {
    return 'No collections found. You must use metalsmith-collections with this plugin.'
  }

  if (!settings.json.title && !(metadata.site && metadata.site.title)) {
    return 'No title set. This is required in a JSON Feed.'
  }
}

module.exports = (options = {}) => {
  const settings = Object.assign(
    {
      destination: 'feed.json',
      limit: 20,
      json: {}
    },
    options
  )

  if (!settings.collection) {
    throw new Error('No `collection` option specified.')
  }

  return (files, metalsmith, done) => {
    const metadata = metalsmith.metadata()

    const error = validate(metadata, settings)
    if (error) return done(new Error(error))

    const allCollections = Object.keys(metadata.collections)

    let feed = {
      version: 'https://jsonfeed.org/version/1',
      title: metadata.site.title,
      items: []
    }

    // Add home_page_url and feed_url automatically if the correct metadata exists
    if (metadata.site && metadata.site.url) {
      feed.home_page_url = metadata.site.url
      feed.feed_url = `${metadata.site.url}${settings.destination}`
    }

    // Add author.name automatically if the correct metadata exists
    if (metadata.site && metadata.site.author) {
      feed.author = { name: metadata.site.author }
    }

    Object.assign(feed, settings.json)

    allCollections.map(collection => metadata.collections[collection].forEach(file => {
        feed.items.push({
          id: file.slug,
          title: file.title,
          date: file.date,
          permalink: file.permalink,
          contents: file.contents.toString('utf8')
        })
      })
    )

    files[settings.destination] = {
      contents: Buffer.from(JSON.stringify(feed, null, '\t'), 'utf8')
    }

    done()
  }
}
