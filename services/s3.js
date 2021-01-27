require('dotenv').config()
const aws = require('aws-sdk');

aws.config.update({
	accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
	secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
});

const spacesEndpoint = new aws.Endpoint(`${process.env.SPACES_REGION}.digitaloceanspaces.com`);

const s3 = new aws.S3({
  endpoint: spacesEndpoint
});

/*
 * Create or Update Spaces Object
 */
const uploadObject = async (key, file) => {
	let params = {Bucket: process.env.SPACES_BUCKET, Key: key, Body: file};

	return s3.putObject(params, function(err, data) {
		if (err) {
			console.log(err);
			return err;
		} else {
			//console.log("Successfully uploaded data to " + process.env.SPACES_BUCKET + "/" + key);
			return data;
		}
	})
}

/*
 * Get Single Spaces Object
 */
const getObject = async (key) => {
	let params = {Bucket: process.env.SPACES_BUCKET, Key: key};

	try{
		let data = await s3.getObject(params).promise()
		return JSON.parse(data.Body)
	} catch (err) {
		console.log(err)
		return null;
	}
}

/*
 * List Spaces Objects
 */
const listObjects = async () => {
	return s3.listObjects({}, function(err, data) {
		if (err) {
			console.log(err);
			return err;
		} else {
			console.log("Successfully fetched object list from " + process.env.SPACES_BUCKET);
			return data;
		}
	})
}

module.exports = { uploadObject, getObject, listObjects }
