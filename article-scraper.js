const axios = require('axios').default;
const cliProgress = require('cli-progress');
const startUrls = require('./sites.json');
require('dotenv').config()

const scrape = async () => {
	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	let dataset = null;

	// https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
	console.log("Creating new run...")
	let initiateRunRequest = await axios.post(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs?token=${process.env.APIFY_API_TOKEN}`,
		{
			"startUrls": startUrls,
			"onlyNewArticles": false,
			"onlyInsideArticles": true,
			"saveHtml": false,
			"useGoogleBotHeaders": false,
			"mustHaveDate": false,
			"isUrlArticleDefinition": {
				"minDashes": 1
			},
			"pseudoUrls": [
				{
					"url": "https://www.cnn.com/us",
					"method": "GET"
				}
			],
			"maxDepth": 4,
			"proxyConfiguration": {
				"useApifyProxy": false
			},
			"useBrowser": false,
			"extendOutputFunction": "($, currentItem) => {\n    return {\n        links: undefined,\n        videos: undefined,\n        author: undefined,\n        canonicalLink: undefined,\n        copyright: undefined,\n        favicon: undefined,\n        keywords: undefined,\n        lang: undefined,\n        loadedDomain: undefined,\n        loadedUrl: undefined,\n        publisher: undefined,\n        softTitle: undefined,\n        tags: undefined\n    }\n}"
		}
	).then((response) => {
		if(response.statusText == 'Created'){
			console.log('Run created.')
		}
	})

	console.log('Scraping articles...')
	bar1.start(startUrls.length * 20, 0);

	while(!dataset){
		//https://docs.apify.com/api/v2?utm_source=app#/reference/actors/last-run-object-and-its-storages
		let currentRunRequestQueue = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/request-queue?token=${process.env.APIFY_API_TOKEN}`)
		let responseQueue = currentRunRequestQueue.data

		setTimeout(function () {
			if(responseQueue.data.totalRequestCount > 100){
				bar1.setTotal(responseQueue.data.totalRequestCount)
			}
			bar1.update(responseQueue.data.handledRequestCount)
		}, 3000)

		if(responseQueue.data.totalRequestCount > 10 && responseQueue.data.totalRequestCount == responseQueue.data.handledRequestCount){
			let currentRunDataset = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/dataset?token=${process.env.APIFY_API_TOKEN}&status=SUCCEEDED`)
			dataset = currentRunDataset.data.data;
		}
	}

	bar1.stop();
	console.log('Dataset created');
	let format = 'csv'
	let items = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/items?format=${format}&token=${process.env.APIFY_API_TOKEN}&status=SUCCEEDED`)
}

module.exports = { scrape }
