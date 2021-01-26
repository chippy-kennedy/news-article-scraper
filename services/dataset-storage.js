require('dotenv').config()
const prompts = require('prompts');
const axios = require('axios').default;
const uuid = require('uuid').v4;
const sequelize = require('./../db_connection')
const { Dataset } = require('./../db/models')

const createDataset = async (options={}) => {
	let dataset = {}

	const questions = [
		{
			type: 'text',
			name: 'dataset_name',
			message: '(new dataset) dataset name?'
		},
		{
			type: 'text',
			name: 'dataset_item_type',
			message: 'type of item?',
			initial: `articles`
		}
	]

	const response = await prompts(questions);

	dataset.id = uuid.v4()
	dataset.name = response.dataset_name;
	dataset.item_type = response.dataset_item_type,
	dataset.status = options.status || 'EMPTY'
	dataset.created_at = options.created_at || Date.now()
	dataset.updated_at = Date.now()
	dataset.items = options.items || []
	dataset.item_count = options.items ? options.items.length : 0

	let url = `https://${process.env.SPACE_BUCKET}.${process.env.SPACE_REGION}.digitaloceanspaces.com/${dataset.id}`
	dataset.space_url = url

	let output = JSON.stringify(dataset);

	//https://developers.digitalocean.com/documentation/spaces/#object
	let storageRequest = await axios.put(url, output).then(res => {
		return res;
	}).catch(err => {
		console.log(err)
		return null;
	})

	let size = Buffer.byteLength(output)

	let localStorageRequest = await Dataset.create({
		space_url: url,
		name: dataset.name,
		item_count: dataset.item_count,
		size: size
	})

	return localStorageRequest.get({plain: true});
}

const updateDataset = async (id, options={}) => {
	let datasetId = id;

	if(!datasetId){
		let datasets = await Dataset.getAll()
		let choices = datasets.map(d => {
			return({
				title: d.name,
				description: `${d.item_count} items // ${d.space_url}`, 
				value: d.id
			})
		})

		const response = await prompts({
			type: 'select',
			name: 'id',
			message: 'Choose dataset to update',
			choices: choices
		});

		datasetId = response.id
	}

	let dataset = Dataset.findOne({id: datasetId})

	//fetch cloud dataset
	//perform update
	//	- parse JSON
	//	- update object
	//	- stringify JSON
	//	- PUT to DO Space
	//update local dataset
	//return local dataset
}

module.exports = { createDataset, updateDataset }
