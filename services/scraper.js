require('dotenv').config()
const axios = require('axios').default;
const cliProgress = require('cli-progress');
const startUrls = require('./../sites.json');
const { createDataset, syncDataset, getDataset, updateDataset } = require('./dataset')
const { beforeQuit } = require('./../utils')

const scrape = async (datasetKey) => {
	let key = datasetKey || process.env['npm_config_key']

	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	let scrapedDataset = null;
	let actRunId = null;
	let failedRun = false;

	/*
	 * Util For Passing a Callback to run before process quits
	 * API Reference: https://docs.apify.com/api/v2?utm_source=app#/reference/actors/abort-run/abort-run
	 */
	beforeQuit(async function() {
		console.log('Aborting actor run...')
		let abortRunRequest = await axios.post(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/${actRunId}/abort?token=${process.env.APIFY_API_TOKEN}`)
		console.log('Scrape run aborted. Dataset not updated. To view data collected, view the run on Apify dashboard')
	})

	//TODO: business logic around adding data to existing dataset - do we deduplicate?
	let dataset = await getDataset(key)

	/*
	 * Initiate Apify Actor Scraper
	 * API Reference: https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
	 */
	console.log("Creating new scraper actor run...")
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
			console.log(`\u2714 Run started. [${response.data.data.id}]\n`)
			actRunId = response.data.data.id;
		}
		return response;
	}).catch(err => {
		console.log(err);
		failedRun = true;
		return err;
	})

	if(!failedRun){
		await updateDataset(dataset.key, {
			status: 'PROCESSING',
			apifyRunId: actRunId
		})
		console.log('Scraping articles...')
		bar1.start(100, 0);

		/*
		 * Check for Last Run Request Queue to Update Progress Bar
		 */
		while(!scrapedDataset){
			try{
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
			} catch (err) {
				//console.log(err)
			}
		}

		bar1.stop();
		console.log(`\u2714 Scraping completed. [${scrapedDataset.itemCount} items]\n`);
	}

	if(!failedRun){
		let format = 'json'
		let items = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/dataset/items?format=${format}&token=${process.env.APIFY_API_TOKEN}&status=SUCCEEDED`).then((res) => {
			return res.data;
		}).catch(err => {
			console.log(err);
			return null;
		})

		await updateDataset(dataset.key, {
			status: 'RAW',
			items: items,
			itemCount: items.length
		})

		await syncDataset(dataset.key)
	}
}

module.exports = { scrape }
