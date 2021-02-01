require('dotenv').config()
const prompts = require('prompts');
const uuid = require('uuid').v4;
const { Dataset, Item } = require('./../db/models')
const { getObject, uploadObject } = require('./s3')
const { isEmptyObject, isEmptyArray } = require('./../utils')
const { printTable } = require('console-table-printer');
var dayjs = require('dayjs')

const synced = (dataset) => {
	return !dataset.items || isEmptyArray(dataset.items) || !dataset.items.some(item => !item.synced)
}

const listDatasets = async (key) => {
	let datasets = await Dataset.findAll({include: Item})
	
	if(isEmptyArray(datasets)){
		console.log("No datasets found")
		return;
	} else {
		printTable(datasets.map(d => {
			return {
				'Dataset': d.name,
				'Size': d.size,
				'Status': d.status,
				'Items': `${d.itemCount} ${d.itemType}`,
				'Last Updated': dayjs(d.updatedAt).format('ddd MMM D YYYY H:MM'),
				'Synced?': synced(d),
				'Cloud URL': d.spacesUrl, 
			}
		}))
		return;
	}
}

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
				description: `${d.itemCount} ${d.itemType} // ${d.size} b`, 
				value: d.key
			})
		})

		choices.push({
			title: 'Create New',
			description: '',
			value: null
		})

		const response = await prompts({
			type: 'select',
			name: 'key',
			message: 'Choose dataset',
			choices: choices
		});

		key = response.key
	}

	if(!key){
		return createDataset()
	} else {
		return await Dataset.findOne({where: { key: key }})
	}
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
	dataset.itemType = response.dataset_item_type;
	dataset.status = options.status || 'EMPTY'
	dataset.createdAt = options.created_at || Date.now()
	dataset.updatedAt = Date.now()
	dataset.items = options.items || []
	dataset.itemCount = options.items ? options.items.length : 0
	dataset.spacesUrl = url

	await Promise.all(dataset.items.map(async (item) => {
		let newItem = await Item.create({
			status: 'RAW'
		})
		return;
	}))

	let output = JSON.stringify(dataset);

	let uploadResponse = await uploadObject(dataset.key, output)

	let size = `${Buffer.byteLength(output, 'utf8')} bytes`

	let localDataset = await Dataset.create({
		key: dataset.key,
		itemCount: dataset.itemCount,
		itemType: dataset.itemType,
		status: dataset.status,
		spacesUrl: url,
		format: 'json',
		name: dataset.name,
		size: size
	})

	console.log(`\u2714 Dataset created. [${localDataset.name}]\n`)
	return localDataset.get({plain: true});
}

const updateDataset = async (key, dataset={}) => {
	console.log('Updating dataset...')
	delete dataset.key;
	dataset.updatedAt = Date.now()

	//TODO: more robust validation and sanitization
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

	/*
	* Update local Dataset Instance (items)
	*/
	if(dataset.items && !isEmptyArray(dataset.items)){
		await Promise.all(dataset.items.map((i) => {
			let data = {}
			if(i.key) {data.key = i.key; delete i.key} else { data.key = uuid.v4() }
			if(i.scaleTaskId) {data.scaleTaskId = i.scaleTaskId; delete i.scaleTaskId}
			data.datasetKey = key;
			data.synced = false
			data.data = JSON.stringify({...i})

			return Item.findOne({
				where: { key: data.key }
			}).then(item => {
				if(item) return item.update(data);
				return Item.create(data)
			}).catch(err => {
				console.log(err)
				return null;
			})
		}))

		delete dataset.items;
	}
	
	/*
	* Update local Dataset Instance (metadata)
	*/
	await localDataset.update({...dataset})

	console.log(`\u2714 Local Dataset updated. [${localDataset.name}]\n`)
	return localDataset;
}

const syncDataset = async (datasetKey) => {
	console.log('Syncing dataset...')

	let key = datasetKey || process.env['npm_config_key']

	let localDataset = await Dataset.findOne({
		where: {key: key},
		include: Item
	})

	if(!localDataset){
		throw "No local dataset found with that key"
		return;
	}

	let { Items, ...dataset } = localDataset.get()
	let cloudDataset = await getObject(dataset.key)

	/*
	 * Map all unsynced local dataset items to the cloud dataset
	 *  - will overwrite any cloud item values with local dataset values
	 *  - will ignore any local dataset items set to synced
	 */
	Promise.all(Items.map(async Item => {
		let item = Item.get()

		if(!item.synced){
			let data = item.data;

			if(data) {
				let idx = cloudDataset.items.findIndex(el => el.key == item.key)

				if(idx >= 0) {
					cloudDataset.items[idx] = {...cloudDataset.items[idx], ...data}
				} else {
					cloudDataset.items.push(data)
				}

				Item.synced = true
				Item.data = null //no need to hold onto data locally
				await Item.save()
			}
		}
	}))

	/* Update Cloud Dataset metadata
	 *  - will overwrite any cloud dataset metadata with local dataset metadata
	 */
	cloudDataset = {...cloudDataset, ...dataset}

	/*
	 * JSONify Cloud Dataset copy and upload to Cloud Storage
	 */
	let output = JSON.stringify(cloudDataset)
	let cloudUpdates = await uploadObject(localDataset.key, output)

	/*
	 * Update Local Dataset Metadata
	 */
	localDataset.size = `${Buffer.byteLength(output, 'utf8')} bytes`
	await localDataset.save()

	console.log(`\u2714 Dataset synced. [${dataset.name}]\n`)
}

module.exports = { createDataset, updateDataset, getDataset, syncDataset, listDatasets }
