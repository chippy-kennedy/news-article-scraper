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

##### Scrape Data to New Dataset
```
npm run scrape:new
```
**Input**
- list of news websites to crawl (*required*). default list is located in `sites.json` 
- actor options (*optional*)

**Output**
- raw dataset (json, unless otherwise specified) of scraped news websites stored in DO Space

#### 📊 Dataset Service
Creates, retrieves, and updates datasets. Each dataset is stored as a cloud object (with metadata and items) and as an object in the database (with metadata only). Both objects share a UUID as their ID.

#### ☁️ S3 Service
Authenticates, uploads to, and downloads from cloud storage bucket. This project uses a digital ocean space, which is interchangable with an Amazon S3 bucket.

#### 🏷 Dataset Labeling Service
Requests labels for dataset items. Uses the [scale api](https://docs.scale.com/reference) to turn raw datasets into useful ML training data. It specifically labels scraped articles with topics and subtopics defined in this service.
It also uses a simple webserver to handle individual task callbacks from scale's service. 

##### Label Entire Dataset
*Note: requests to label dataset items can only be completed if the webserver is running to acknowledge successes
```
npm run label
```
**Input**
- raw dataset

**Output**
- labeled dataset

## Data Structures
### The Dataset Object
The dataset object is a json object that contains metadata and all items of a given dataset.

It has a `status`, which can be:
- `EMPTY`, meaning the dataset is newly created and has no items
- `PROCESSING`, meaning the dataset is having some service augment or modify it
- `RAW`, meaning the dataset has items, but has had no cleaning or labeling done to it
- `CLEANED`, meaning the dataset has been cleaned (manual process)
- `LABELED`, meaning the dataset is labeled
