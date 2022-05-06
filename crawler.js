const request = require("request");
const cheerio = require("cheerio");
const urlParse = require("url-parse");
const fs = require("fs");

const params= process.argv.slice(2)
//test url
//const start_url =  "https://stevescooking.blogspot.com";

const start_url =params[0]
const DEPT = params[1];

const url = new urlParse(start_url);
const baseUrl = url.protocol + "//" + url.hostname;
const HOST = url.host
const PROTOCOL=  url.protocol

let results =[],pagesToVisit=[],pagesVisited = {};
let numPagesVisited = -1;

const crawlPage =()=>{
    let nextPage =''
    if (numPagesVisited >= DEPT) {
        console.log("Reached max limit of number of pages to visit.");
        return;
      }

       nextPage = pagesToVisit.pop();

      
    visitPage(renderUrlPath(nextPage), crawlPage);
}



const visitPage = (urlPath, Callback)=>{
    pagesVisited[url] = true;
    numPagesVisited++;

    console.log("Visiting page " + urlPath);

    let newObj ={}

    request(urlPath, function (error, response, body) {
       
        if (response.statusCode !== 200) {
            Callback();
          return;
        }
       
      
        var $ = cheerio.load(body);
        const anchortagLinks = $("a")
          .map((i, link) => link.attribs.href)
          .get().map(x => renderUrlPath(x)).filter(el => el.includes(`${HOST}`) )
    
          console.log({anchortagLinks})
    
        const imgSrc = $("img")
          .map((i, link) => link.attribs.src)
          .get().map(x => renderUrlPath(x));
    
          newObj.imageUrl = imgSrc;
          newObj.sourceUrl = urlPath
          newObj.dept =numPagesVisited
    
        results = [...results, newObj]
        writeToJsonFile();
    
        pagesToVisit =  [...pagesToVisit, ...anchortagLinks]

        if (pagesToVisit.length !== 0) {
            Callback();
          }
      
      });


}

const renderUrlPath = (link) => {
   
if (link.startsWith("/") ) {
  return `${baseUrl}${link}`;
}else if(link.startsWith("#")){
  return `${baseUrl}/${link}`;
} 
else if (link.startsWith("http")) {
  return link;
} 
else if (link.startsWith("//")) {
    return `${PROTOCOL}${link}`;
  } 
};

const writeToJsonFile = () => {
    fs.writeFileSync("results.json", JSON.stringify({results}), (err) => {
      if (err) {
        console.log(err);
        return;
      }
    });
  };
  

  visitPage(start_url,crawlPage)