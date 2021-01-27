require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const app = express()
const { getDataset, updateDataset } = require('./services/dataset')

app.use(express.json());

app.post('/scale-task-completed', async (req, res) => {
	let key = req.body.task.metadata.dataset_key
	let dataset = await getDataset(key)

	if(dataset){
		let task_id = req.body.task.task_id
		let category = req.body.task.response.taxonomies.category[0]
		let item = dataset.items.find(item => item.scale_task_id == task_id)

		// Don't Update Item if Category is Already Set
		if(item && !item.category){
			dataset.items.find(item => item.scale_task_id == task_id).category = category
			dataset.itemLabeledCount++;
		}

		await updateDataset(dataset.key, {
			itemLabeledCount: dataset.itemLabledCount,
			items: dataset.items
		})
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
})

app.listen(5000);
console.log('Node.js web server at port 5000 is running..')
