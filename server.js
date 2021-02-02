require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const app = express()
const { Item } = require('./db/models')
const { getDataset, updateDataset } = require('./services/dataset')
const { isJSON } = require('./utils')

app.use(express.json());

app.post('/scale-task-completed', async (req, res) => {
	let key = req.body.task.metadata.dataset_key
	let Dataset = await getDataset(key)

	if(Dataset){
		let task_id = req.body.task.task_id
		let category = req.body.task.response.taxonomies.category[0]
		let item = await Item.findOne({where: {
			datasetKey: key,
			scaleTaskId: task_id
		}})

		//NOTE: this will always overwrite
		//TODO: handle replacement wholesale of the data
		if(item){
			let data = item.data
			if(isJSON(item.data)) data = JSON.parse(item.data)

			item.synced = false;
			item.data = JSON.stringify({...data, category: category})
			Dataset.itemLabeledCount++;
			await item.save()
		}
	}
	await Dataset.save()

	res.writeHead(200, { 'Content-Type': 'application/json' });
})

app.listen(5000);
console.log('Node.js web server at port 5000 is running..')
