const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = require('url');

const baseURL = 'https://example.com';  // Change this to the website you want to scrape
const downloadDirectory = './downloaded_pdfs';  // Directory to save downloaded PDFs

// Ensure the download directory exists
if (!fs.existsSync(downloadDirectory)){
    fs.mkdirSync(downloadDirectory, { recursive: true });
}

async function fetchPDFs(link) {
  try {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);
    const pdfLinks = $("a[href$='.pdf']").map((i, el) => {
      let href = $(el).attr('href');
      if (!href.startsWith('http')) {
        // Handle relative URLs
        href = url.resolve(baseURL, href);
      }
      return href;
    }).get();

    downloadPDFs(pdfLinks);
  } catch (error) {
    console.error(`Error fetching the page: ${error.message}`);
  }
}

function downloadPDFs(links) {
  links.forEach(async (link, index) => {
    const response = await axios.get(link, {
      responseType: 'arraybuffer'
    });
    const fileName = path.basename(link);
    const filePath = path.join(downloadDirectory, fileName);
    fs.writeFile(filePath, response.data, (err) => {
      if (err) {
        console.log(`Failed to download ${fileName}: ${err.message}`);
      } else {
        console.log(`${fileName} has been downloaded to ${downloadDirectory}.`);
      }
    });
  });
}

fetchPDFs(baseURL);
