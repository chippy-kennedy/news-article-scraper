# 📰 News Site Article Scraper
A CLI set of services to create, clean, label, and manage datasets in the cloud. Useful for creating machine learning-ready datasets. Uses Apify web scraper to pull in data; Scale AI to categorize data; and Digital Ocean to store and manage datasets;

**Product Owners**
- [Chip Kennedy](https://github.com/chippy-kennedy) | chip@codesleep.run

## Project Notes on Data and Biases
**This Scraper is Opionated**
The service creates raw datasets and turns them into training datasets for one specific ML application. If it's useful for future projects or for other people, I'd be happy to generalize the services for other training dataset creation
applications. If anything, I hope it's a good tutorial of creating a raw dataset from scraped content and turning it into a useful training dataset.

**News Website Seed List**
The news website seed list (`/news-sites.txt`) is a list of the top 100 US-based news websites based on SEO, relevancy, Alexa Web Traffic Rank. The ranking comes from [FeedSpot](https://blog.feedspot.com/usa_news_websites/) and was
lightly edited to assure useful data (e.g. adding category pages from major sites) and diversity of news source (e.g. adding news sites across the ideological spectrum). The seed list is useful, but not entirely objective.

**Categories List**
The categoy list (`/categories.txt`) is a list of useful political topics and subtopics. It comes from the Harvard Kennedy School's [Government Innovators Network](https://www.innovations.harvard.edu/find-innovative-solutions/all-topics).
This list is also useful, but was not built to be objective or unbiased.

**Copyrighted Material**
The article scraper service pulls material from news websites. This content is often copyrighted and you should check with an individual website's terms and policies before republishing copyrighted material anywhere.
This application's ISC lisense does *not* apply to content scraped from the internet.

## Use Cases
- Create an ML training dataset of labeled news websites articles

## Project Breakdown
### Prerequisites
- Node.js
- MySQL + Sequelize (simple database + ORM)
- Apify API Key (raw dataset creation // web scraping)
- Scale API Key (training dataset creation // ML pre-labeling + human review)
- AWS S3 or DigitalOcean Spaces (cloud storage)

### Costs
Note that both Apify and Scale AI have both free tiers and paid subscriptions. Create accounts with those services to learn more.

### How it Works
The scraper is made up of seperate services and a web server to gather data (web scraping via apify), store data (in a cloud storage space), and label the data (via scale AI).

#### 🪛  Scraper Service
Scrapes web articles. Uses a pre-made actor in the apify cloud marketplace. If you're new to apify, start with [their docs](https://docs.apify.com/). Once you're familiar, you can read up on the [Smart Article Extractor actor](https://apify.com/lukaskrivka/article-extractor-smart) that
powers the service. 

##### Scrape Data to New or Existing Dataset
You can scrape data to a new or existing dataset by initiating the scraper. You'll be prompted to select
an existing dataset or create a new one.
```
npm run scrape
```

If you have a specific dataset you want to scrape data to, you can pass in the datasetKey as an argument:
```
npm run scrape --key=<datasetKey>
```

**Input**
- list of news websites to crawl (*required*). default list is located in `sites.json` 
- actor options (*optional*)

**Output**
- raw dataset (json, unless otherwise specified) of scraped news websites stored in DO Space

#### 📊 Dataset Service
Creates, retrieves, and updates datasets. Each dataset is stored as a cloud object (with metadata and items) and as an object in the database (with metadata only). Both objects share a UUID as their ID.

##### Listing All Datasets
You can list all datasets:
```
npm run list
```

##### Create New Empty Dataset
You can create a new, empty dataset:
```
npm run create
```

##### Sync Dataset Cloud Object w/ Local Dataset
Syncing a dataset is the process of matching it's cloud object data and it's local model instance data.
See #datastructures# for more information on this relationship.

###### Syncing Dataset after Scraping
A dataset will automatically sync itself after scraping data. This will assure that the scraped data lives in cloud storage
and the local dataset metadata is up to date.

###### Syncing Dataset after Labeling
A dataset does not automatically sync itself after labeling data. This is because the process of labeling data happens is asynchronous
and the server can't effectively write data to cloud storage for each item labeled.

To sync a dataset, run sync command. You can optionally include a datasetKey:
```
npm run sync --key=<datasetKey>
```

#### ☁️ S3 Service
Authenticates, uploads to, and downloads from cloud storage bucket. This project uses a digital ocean space, which is interchangable with an Amazon S3 bucket.

#### 🏷 Dataset Labeling Service
Requests labels for dataset items. Uses the [scale api](https://docs.scale.com/reference) to turn raw datasets into useful ML training data. It specifically labels scraped articles with topics and subtopics defined in this service.
It also uses a simple webserver to handle individual task callbacks from scale's service. 

##### Label Entire Dataset
*Note: requests to label dataset items can only be completed if the webserver is running to acknowledge successes

To label a dataset, run the `label` command. You can optionally include a datasetKey:
```
npm run label
```
**Input**
- raw dataset

**Output**
- labeled dataset

## Data Structures
### The Dataset Object
The dataset object is a json object that contains metadata and all items of a given dataset. It lives as two sibling objects.
(1) as a semi-structured object in the cloud, containing metadata and all dataset items.
(2) as a structured objected in the project database, containing metadata of the dataset and its items.
The objects share a key.

The Dataset has a `status`, which can be:
- `EMPTY`, meaning the dataset is newly created and has no items
- `PROCESSING`, meaning the dataset is having some service augment or modify it
- `RAW`, meaning the dataset has items, but has had no cleaning or labeling done to it
- `CLEANED`, meaning the dataset has been cleaned (manual process)
- `LABELED`, meaning the dataset is labeled

### The Item Object
A Dataset contains many items. Each Dataset Item has a `synced` boolean attribute - that tells us if the item has been updated.
An entire Dataset is considered synced if every child Item is `synced`.

## Project Development
- installing prerequisites
- initializing database
- connecting to Apify
- connecting to cloud storage
- connecting to Scale AI

### Local Development
- ngrok
- running server locally

## CLI Recipies
#### Creating, Populating, and Labeling a New Dataset
1. Create a new dataset
```
npm run create
```

2. Certify your local dataset exists
```
npm list
```

3. Scape and sync data to your local dataset
```
npm run scrape
```
You should now be able to see your dataset metadata and all items in cloud storage

4. Send your dataset out for labeling
- assure a webserver is running (use ngrok if needed)
- update process.env.CALLBACK_URL
- run `npm run label`

