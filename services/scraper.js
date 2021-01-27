require('dotenv').config()
const axios = require('axios').default;
const cliProgress = require('cli-progress');
const startUrls = require('./../sites.json');
const { createDataset, updateDataset } = require('./dataset')
const { beforeQuit } = require('./../utils')

const scrapeToNewDataset = async () => {
	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	let scrapedDataset = null;
	let actRunId = null;
	let failedRun = false;

	/*
	 * Util For Passing a Callback to run before process quits
	 */
	beforeQuit(async function() {
		console.log('Aborting actor run...')
		//https://docs.apify.com/api/v2?utm_source=app#/reference/actors/abort-run/abort-run
		let abortRunRequest = await axios.post(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/${actRunId}/abort?token=${process.env.APIFY_API_TOKEN}`)
	})

	let dataset = await createDataset({
		status: 'EMPTY',
	})

	// https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
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
			console.log(`Run started. [${response.data.data.id}]`)
			actRunId = response.data.data.id;
		}
		return response;
	}).catch(err => {
		console.log(err);
		failedRun = true;
		return err;
	})

	if(!failedRun){
		await updateDataset(dataset.id, {
			status: 'PROCESSING',
			apify_run_id: actRunId
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
		console.log(`Scraping completed. [${scrapedDataset.itemCount} items]`);
	}

	if(!failedRun){
		let format = 'json'
		let items = await axios.get(`https://api.apify.com/v2/acts/lukaskrivka~article-extractor-smart/runs/last/dataset/items?format=${format}&token=${process.env.APIFY_API_TOKEN}&status=SUCCEEDED`).then((res) => {
			return res.data;
		}).catch(err => {
			console.log(err);
			return null;
		})

		updateDataset(dataset.id, {
			status: 'RAW',
			items: items,
			item_count: items.length
		})
	}
}

const scrapeToExistingDataset = async () => {
	//fetch list of datasets
	//ask user to select dataset
	//run scraper
	//update dataset via dataset service
}

module.exports = { scrapeToNewDataset, scrapeToExistingDataset }
