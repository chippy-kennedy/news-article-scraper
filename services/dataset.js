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
	if(!key || typeof(key) == 'undefined'){
		let datasets = await Dataset.findAll()
		let choices = datasets.map(d => {
			return({
				title: d.name,
				description: `${d.itemCount} articles // ${d.size} b`, 
				value: d.key
			})
		})

		const response = await prompts({
			type: 'select',
			name: 'key',
			message: 'Choose dataset',
			choices: choices
		});

		datasetKey = response.key
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
	dataset.key = uuid.v4()
	let url = `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${dataset.key}`

	dataset.name = response.dataset_name;
	dataset.itemType = response.dataset_item_type,
	dataset.status = options.status || 'EMPTY'
	dataset.createdAt = options.created_at || Date.now()
	dataset.updatedAt = Date.now()
	dataset.items = options.items || []
	dataset.itemCount = options.items ? options.items.length : 0
	dataset.spaceUrl = url

	let output = JSON.stringify(dataset);

	let uploadResponse = await uploadObject(dataset.key, output)

	let size = Buffer.byteLength(output)

	let localDataset = await Dataset.create({
		key: dataset.key,
		itemCount: dataset.itemCount,
		spacesUrl: url,
		format: 'json',
		name: dataset.name,
		size: size
	})

	console.log(`Dataset created. [${localDataset.name}]`)
	return localDataset.get({plain: true});
}

const updateDataset = async (key, dataset={}) => {
	console.log('Updating dataset...')
	delete dataset.key;

	//TODO: robust validation
	if(isEmptyObject(dataset)){
		console.log('No updates provided.')
		return;
	}

	/*
	 * If target dataset id is not specified,
	 * ask the user to select dataset via CLI
	 */
	if(!key){
		let datasets = await Dataset.findAll()
		let choices = datasets.map(d => {
			return({
				title: d.name,
				description: `${d.itemCount} ${d.itemType} // ${d.size} b`, 
				value: d.key
			})
		})

		const response = await prompts({
			type: 'select',
			name: 'key',
			message: 'Choose dataset to update',
			choices: choices
		});

		key = response.key
	}

	let localDataset = await Dataset.findOne({where: {key: key}})
	let cloudDataset = localDataset ? await getObject(localDataset.key) : null
	
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
	let cloudUpdates = await uploadObject(localDataset.key, output)

	console.log(`Dataset updated. [${localDataset.name}]`)
	return localDataset;
}

module.exports = { createDataset, updateDataset, getDataset }
