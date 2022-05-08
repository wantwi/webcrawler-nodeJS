const request = require("request");
const cheerio = require("cheerio");
const urlParse = require("url-parse");
const fs = require("fs");

const params = process.argv.slice(2);

const start_url = params[0];
const DEPT = params[1];

const url = new urlParse(start_url);
const baseUrl = url.protocol + "//" + url.hostname;
const HOST = url.host;
const PROTOCOL = url.protocol;

let results = [],
  pagesToVisit = [],
  pagesVisited = {};
let numPagesVisited = -1;

const crawlPage = () => {
  if (numPagesVisited >= DEPT) {
    console.log("Done");
    return;
  }

  //console.log({pagesToVisit})

  let nextPage = pagesToVisit.shift();

  //console.log({nextPage})

  if (nextPage in pagesVisited) {
    //console.log("page already visited")
    crawlPage();
  } else {
    //console.log("page not visited")
    visitPage(renderUrlPath(nextPage), crawlPage);
  }
};

const visitPage = (urlPath, Callback) => {
  pagesVisited[url] = true;
  numPagesVisited++;

  let newObj = {};

  request(urlPath, function (error, response, body) {
    if (response.statusCode !== 200) {
      Callback();
      return;
    }

    console.log("response" + response.statusCode);

    var $ = cheerio.load(body);
    // const anchortagLinks = $("a")
    //   .map((i, link) => link.attribs.href)
    //   .get()
    //   .map((x) => renderUrlPath(x))
    // .filter((el) => el !== undefined)
    // .filter((el) => el.includes(`${HOST}`));

    const anchortagLinks = $("a")
      .map((i, link) => link.attribs.href)
      .get()
      .map((x) => renderUrlPath(x));

    let filteredList = anchortagLinks
      .filter((el) => el !== undefined)
      .filter((x) => x.includes(`${HOST}`));

    console.log(filteredList.length, anchortagLinks.length);

    //return;

    const imgSrc = $("img")
      .map((i, link) => link.attribs.src)
      .get()
      .map((x) => renderUrlPath(x))
      .filter((el) => el !== undefined)
      .filter((el) => el.includes(`${HOST}`));

    newObj.imageUrl = imgSrc;
    newObj.sourceUrl = urlPath;
    newObj.dept = numPagesVisited;

    results = [...results, newObj];
    writeToJsonFile();

    //console.log('total',[...pagesToVisit, ...anchortagLinks].length)

    pagesToVisit = [...new Set([...pagesToVisit, ...filteredList])];
    //console.log('total2',pagesToVisit.length);

    if (pagesToVisit.length !== 0) {
      Callback();
    }
  });
};

const renderUrlPath = (link) => {
  // console.log(`${baseUrl}/`, link);
  if (link.startsWith("//")) {
    return `${PROTOCOL}${link}`;
  } else if (link.startsWith("#")) {
    return `${baseUrl}/${link}`;
  } else if (link.startsWith("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${baseUrl}${link}`;
  } else {
    return `${baseUrl}/${link}`;
  }
};

const writeToJsonFile = () => {
  fs.writeFileSync("results.json", JSON.stringify({ results }), (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
};

visitPage(start_url, crawlPage);
