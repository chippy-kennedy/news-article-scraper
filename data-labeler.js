'use strict';

require('dotenv').config()
const util = require('util');
const fs = require('fs');
const axios = require('axios').default;
var scaleapi = require('scaleapi');
const choices = require('./categories.json');
var client = scaleapi.ScaleClient(process.env.SCALE_API_KEY);

const requestDatasetCategories = async (dataset) => {
	//TODO: unhardcode 'dis
	dataset = fs.readFileSync('./dataset-examples/example-raw-dataset-25.json')
	dataset = JSON.parse(dataset)

	//TODO: validate dataset (need util)
	if(!dataset){
		console.log("Error: No dataset provided")
		return;
	}

	dataset.items.forEach(async item => {
		let createdTask = await requestItemCategory(item).then(task => {
			return task;
		}).catch(error => {
			console.log(error)
			return null;
		});

		//TODO: check for error

		item.scale_task_id = createdTask.task_id
		dataset.itemSentForLabelingCount++;
	})

	// Write Data to File
	let output = JSON.stringify(dataset);
	fs.writeFileSync('./dataset-examples/example-raw-dataset-25', output);
}

const requestItemCategory = (item) => {
	return new Promise(
		(resolve, reject) => {
			//TODO: validate dataset item (need util)
			client.createCategorizationTask(
				{
					callback_url: process.env.CALLBACK_URL, //can just be ngrok endpoint
					metadata: {dataset_id: 1}, //TODO: un-hardcode 'dis
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
