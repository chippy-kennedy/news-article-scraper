# 📰 News Site Article Scraper
A web scraper to pull basic meta information from new website articles. Creates raw datasets of article content from news websites, stores datasets, and processes data into (opionated) training datasets, useful for ML applications.
Uses clever APIs (apify + scale) and cloud storage (digital ocean)

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

## Use Cases
- Create an ML training dataset of labeled news websites articles

## Project Breakdown
### Prerequisites
- Node.js
- Apify API Key (raw dataset creation // web scraping)
- Scale API Key (training dataset creation // ML pre-labeling + human review)

### How it Works
The scraper is really three seperate services to gather data (web scraping via apify), store data (in a cloud storage space), and label the data (via scale AI).

#### 🪛  Article Scraper Service
The article scraper service uses a pre-made actor in the apify cloud marketplace. If you're new to apify, start with [their docs](https://docs.apify.com/). Once you're familiar, you can read up on the [Smart Article Extractor actor](https://apify.com/lukaskrivka/article-extractor-smart) that
powers the service.
**Input**
- list of news websites (*required*)
- actor options (*optional*)

**Output**
- raw dataset (csv, unless otherwise specified) of scraped news websites

#### ☁️  Dataset Storage Service
The dataset storage service packages, labels, and stores datasets in the cloud.
**Input**
- raw dataset

#### 🏷 Dataset Labeling Service
The dataset labeling service uses the [scale api](https://docs.scale.com/reference) to turn raw datasets into useful ML training data. It specifically labels scraped articles with topics and subtopics defined in this service.
**Input**
- raw dataset

**Output**
- labeled dataset
