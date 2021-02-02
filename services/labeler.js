'use strict';

require('dotenv').config()
const util = require('util');
var scaleapi = require('scaleapi');
const choices = require('./../categories.json');
var client = scaleapi.ScaleClient(process.env.SCALE_API_KEY);
const { updateDataset } = require('./dataset')
const { getObject } = require('./s3')

const requestDatasetCategories = async (datasetKey) => {
	console.log('Requesting data labels...')
	let key = datasetKey || process.env['npm_config_key']

	if(!key){
		console.log("No datasetKey provided.")
		return;
	}

	/*
	 * Pull In Dataset from Cloud
	*/
	let cloudDataset = await getObject(key)
	cloudDataset.itemSentForLabelingCount = 0

	if(!cloudDataset){
		console.log("Dataset not found")
		return;
	}

	let tasks = await Promise.all(cloudDataset.items.map(async (item) => {
		let createdTask = await requestItemCategory(item, key).then(task => {
			return task;
		}).catch(error => {
			console.log(error)
			return null;
		});

		if(createdTask){
			item.scaleTaskId = createdTask.task_id
			++cloudDataset.itemSentForLabelingCount;
		}
	}))

	console.log(`\u2714 ${cloudDataset.itemSentForLabelingCount} Labels Requested.\n`)

	await updateDataset(key, {
		status: 'PROCESSING',
		itemSentForLabelingCount: cloudDataset.itemSentForLabelingCount,
		items: cloudDataset.items
	})
}

const requestItemCategory = (item, datasetKey) => {
	return new Promise(
		(resolve, reject) => {
			//TODO: validate dataset item (need util)
			client.createCategorizationTask(
				{
					callback_url: process.env.CALLBACK_URL, //can just be ngrok endpoint
					metadata: {dataset_key: datasetKey},
					instruction: 'Categorize this news article',
					attachment_type: 'website',
					attachment: item.url, //e.g. 'https://www.nytimes.com/2021/01/13/at-home/newsletter.html',
					taxonomies: {
						category: {
							type: 'category',
							description: 'What category best describes this news article?',
							choices: choices,
							//allow_multiple: true
						},
					}
				},
				(err, task) => {
					if(!err){
						resolve(task);
					} else {
						console.log(err)
						reject(err);
					}
				}
			)
	 }
 );
};

const updateItemCategory = async () => {
}

module.exports = { requestDatasetCategories, updateItemCategory }
