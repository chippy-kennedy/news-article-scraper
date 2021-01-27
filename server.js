require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const app = express()

app.use(express.json());

app.post('/scale-task-completed', (req, res) => {
	let dataset_id = req.body.task.metadata.dataset_id
	let dataset = readFileSync('./dataset-examples/example-raw-dataset-25.json')
	dataset = JSON.parse(dataset)

	if(dataset){
		let task_id = req.body.task.task_id
		let category = req.body.task.response.taxonomies.category[0]
		let item = dataset.items.find(item => item.scale_task_id == task_id)

		// Don't Update Item if Category is Already Set
		if(item && !item.category){
			dataset.items.find(item => item.scale_task_id == task_id).category = category
			dataset.itemLabeledCount++;
		}

		// Write Data to File
		let output = JSON.stringify(dataset);
		writeFileSync('./dataset-examples/example-raw-dataset-25.json', output);
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
})

app.listen(5000);
console.log('Node.js web server at port 5000 is running..')
