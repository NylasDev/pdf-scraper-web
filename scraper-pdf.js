const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = require('url');

const baseURL = 'https://www.nautitechcatamarans.com';  // Base URL to start crawling from
const downloadDirectory = './downloaded_pdfs';  // Directory to save downloaded PDFs
const visitedLinks = new Set();  // To keep track of visited links and avoid loops

// Ensure the download directory exists
if (!fs.existsSync(downloadDirectory)){
    fs.mkdirSync(downloadDirectory, { recursive: true });
}

async function fetchPDFs(link) {
  if (visitedLinks.has(link)) return;  // Skip if already visited
  visitedLinks.add(link);

  try {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);

    const pdfLinks = $("a[href$='.pdf']").map((i, el) => {
      let href = $(el).attr('href');
      if (!href.startsWith('http')) {
        href = url.resolve(baseURL, href);
      }
      return href;
    }).get();

    downloadPDFs(pdfLinks);

    // Find all links and recursively call fetchPDFs
    $("a[href]").each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        const nextPage = url.resolve(link, href);
        if (nextPage.startsWith(baseURL) && !visitedLinks.has(nextPage)) {  // Stay within the same domain
          fetchPDFs(nextPage);
        }
      }
    });

  } catch (error) {
    console.error(`Error fetching the page: ${error.message}`);
  }
}

function downloadPDFs(links) {
  links.forEach(async (link, index) => {
    if (!visitedLinks.has(link)) {
      visitedLinks.add(link);
      try {
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
      } catch (downloadError) {
        console.log(`Failed to download from ${link}: ${downloadError.message}`);
      }
    }
  });
}

fetchPDFs(baseURL);