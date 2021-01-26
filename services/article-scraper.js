require('dotenv').config()
const axios = require('axios').default;
const cliProgress = require('cli-progress');
const startUrls = require('./../sites.json');

const scrape = async () => {
	let dataset = createDataset({
		status: 'EMPTY',
	})

	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	let scrapedDataset = null;
	let actRunId = null;

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
			console.log(`Run created. [${response.data.data.id}]`)
			actRunId = response.data.data.id;
		}
	})

	console.log('Scraping articles...')
	bar1.start(100, 0);
	updateDataset(dataset.id, {
		status: 'PROCESSING',
		apifyRunId: actRunId
	})

	/*
	 * Check for Last Run Request Queue to Update Progress Bar
	 */
	while(!scrapedDataset){
		//https://docs.apify.com/api/v2?utm_source=app#/reference/actors/last-run-object-and-its-storages
		let currentRunRequestQueue = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/request-queue?token=${process.env.APIFY_API_TOKEN}`)
		let requestQueue = currentRunRequestQueue.data
		let totalRequestCount = requestQueue.data.totalRequestCount;
		let handledRequestCount = requestQueue.data.handledRequestCount;

		setTimeout(function () {
			if(totalRequestCount > 100){
				bar1.setTotal(totalRequestCount)
			}
			bar1.update(handledRequestCount)
		}, 3000)

		/*
		 * If All Requested Articles Have Been Scraped, Request the Dataset
		 */
		if(totalRequestCount > 10 && totalRequestCount == handledRequestCount){
			bar1.setTotal(totalRequestCount)
			bar1.update(handledRequestCount)
			let currentRunDataset = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/dataset?token=${process.env.APIFY_API_TOKEN}`)
			let currentRun = currentRunDataset.data.data
			
			if(currentRun.actRunId == actRunId){
				scrapedDataset = currentRunDataset.data.data;
			}
		}
	}

	bar1.stop();
	console.log('Dataset created');
	let format = 'json'
	let items = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/dataset/items?format=${format}&token=${process.env.APIFY_API_TOKEN}&status=SUCCEEDED`).then((res) => {
		return res.data;
	}).catch(err => {
		console.log(err);
		return null;
	})

	updateDataset(dataset.id, {
		updated_at: time.now,
		items: items,
		itemCount; items.length
	})
}

module.exports = { scrape }
