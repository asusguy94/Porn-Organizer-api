import { FastifyInstance } from 'fastify'

import homeRoute from './home'
import videoRoute from './video'
import starRoute from './star'
import categoryRoute from './category'
import attributeRoute from './attribute'
import locationRoute from './location'
import bookmarkRoute from './bookmark'
import searchRoute from './search'
import websiteRoute from './website'
import siteRoute from './site'
import countryRoute from './country'

export default async (fastify: FastifyInstance) => {
	fastify.register(homeRoute, { prefix: 'home' })
	fastify.register(videoRoute, { prefix: 'video' })
	fastify.register(starRoute, { prefix: 'star' })
	fastify.register(categoryRoute, { prefix: 'category' })
	fastify.register(attributeRoute, { prefix: 'attribute' })
	fastify.register(locationRoute, { prefix: 'location' })
	fastify.register(bookmarkRoute, { prefix: 'bookmark' })
	fastify.register(searchRoute, { prefix: 'search' })
	fastify.register(websiteRoute, { prefix: 'website' })
	fastify.register(siteRoute, { prefix: 'site' })
	fastify.register(countryRoute, { prefix: 'country' })
}
