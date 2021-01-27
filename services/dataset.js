require('dotenv').config()
const prompts = require('prompts');
const uuid = require('uuid').v4;
//const sequelize = require('./../db_connection')
const { Dataset } = require('./../db/models')
const { getObject, uploadObject } = require('./s3')
const { isEmptyObject } = require('./../utils')

const getDataset = async (key) => {
	/*
	 * If target dataset id is not specified,
	 * ask the user to select dataset via CLI
	 */
	if(!key){
		let datasets = await Dataset.findAll()
		let choices = datasets.map(d => {
			return({
				title: d.name,
				description: `${d.item_count} articles // ${d.spaces_url}`, 
				value: d.spaces_key
			})
		})

		const response = await prompts({
			type: 'select',
			name: 'id',
			message: 'Choose dataset',
			choices: choices
		});

		datasetKey = response.id
	}

	let dataset = await getObject(datasetKey)
	return dataset;
}

const createDataset = async (options={}) => {
	console.log('Creating dataset...')
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
	let url = `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${dataset.id}`

	dataset.name = response.dataset_name;
	dataset.item_type = response.dataset_item_type,
	dataset.status = options.status || 'EMPTY'
	dataset.created_at = options.created_at || Date.now()
	dataset.updated_at = Date.now()
	dataset.items = options.items || []
	dataset.item_count = options.items ? options.items.length : 0
	dataset.space_url = url

	let output = JSON.stringify(dataset);

	let uploadResponse = await uploadObject(dataset.id, output)

	let size = Buffer.byteLength(output)

	let localDataset = await Dataset.create({
		item_count: dataset.item_count,
		spaces_key: dataset.id,
		spaces_url: url,
		format: 'json',
		name: dataset.name,
		size: size
	})

	console.log(`Dataset created. [${localDataset.name}]`)
	return localDataset.get({plain: true});
}

const updateDataset = async (id, dataset={}) => {
	console.log('Updating dataset...')
	delete dataset.id;

	//TODO: robust validation
	if(isEmptyObject(dataset)){
		console.log('No updates provided.')
		return;
	}

	/*
	 * If target dataset id is not specified,
	 * ask the user to select dataset via CLI
	 */
	if(!id){
		let datasets = await Dataset.findAll()
		let choices = datasets.map(d => {
			return({
				title: d.name,
				description: `${d.item_count} articles // ${d.spaces_url}`, 
				value: d.id
			})
		})

		const response = await prompts({
			type: 'select',
			name: 'id',
			message: 'Choose dataset to update',
			choices: choices
		});

		id = response.id
	}

	let localDataset = await Dataset.findOne({where: {id: id}})
	let cloudDataset = localDataset ? await getObject(localDataset.spaces_key) : null
	
	/*
	* Update local Dataset Instance (dataset metadata)
	*/
	await localDataset.update({...dataset})

	/*
	 * Update cloud Dataset Instance (dataset metadata + items)
	 */
	//TODO: Assure that we are doing a createORupdate call
	cloudDataset = {...cloudDataset, ...dataset}
	let output = await JSON.stringify(cloudDataset);

	//TODO: check for error here
	let cloudUpdates = await uploadObject(localDataset.spaces_key, output)

	console.log(`Dataset updated. [${localDataset.name}]`)
	return localDataset;
}

module.exports = { createDataset, updateDataset, getDataset }
