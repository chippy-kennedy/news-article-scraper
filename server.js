require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const app = express()
const url = require("url");
const axios = require('axios');
const fs = require('fs');
const {updateItemCategory} = require('./data-labeler')

app.use(express.json());

app.post('/scale-task-completed', (req, res) => {
	console.log(req.body)
	//TODO: find dataset based on ID, for now use local hardcode
	let dataset_id = req.body.task.metadata.dataset_id
	let dataset = fs.readFileSync('./dataset-examples/example-raw-dataset-25.json')
	dataset = JSON.parse(dataset)

	if(dataset){
		let task_id = req.body.task.task_id
		let category = req.body.task.response.taxonomies.category[0]

		if(dataset.items.find(item => item.scale_task_id == task_id)){
			dataset.items.find(item => item.scale_task_id == task_id).category = category
			dataset.itemLabeledCount++;
		} else {
			//TODO: handle task not found
		}

		// Write Data to File
		let output = JSON.stringify(dataset);
		fs.writeFileSync('./dataset-examples/example-raw-dataset-25.json', output);
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
})

app.listen(5000);
console.log('Node.js web server at port 5000 is running..')
