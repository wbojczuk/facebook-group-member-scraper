const puppeteer = require('puppeteer');
const fsPromise = require("fs/promises")
const express = require("express")
const router = express.Router()
const converter = require('json-2-csv');
const { existsSync } = require('fs');

// ---------------- BEGIN SETTINGS ----------------

const pathToBrowserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe"

const loadTimeout = 10000;

const renderScreen = false;


// Leave false to get JSON
const exportCSV = true;


// LEAVE null TO SORT BY DATE - ELSE SEARCH FOR TERM
const seachTerm = null;

// ---------------- END SETTINGS ----------------



let isDone = false

router.get("/checkscraperstatus", (req, res)=>{
    if(isDone){
        res.json({status: "done"})
        isDone = false
    }else{
        res.json({status: "loading"})
    }
})

router.get("/scrapegroup/:group/:regex", async(req, res)=>{
    let PAGE = ""
    let GROUP = ""
    let PAGE_TITLE = ""
    let filterRegEx
    if(req.params.group == undefined){
        res.sendStatus(400)
    }else{
        let tempPage = decodeURIComponent(req.params.group)
        if(/\/$/.test(tempPage)){
          tempPage = tempPage.slice(0,-1);
        }
        PAGE = tempPage + "/members"
        GROUP = tempPage
        filterRegEx = new RegExp(decodeURIComponent(req.params.regex), "gi")
    }
    const sleep = async (ms) => {
        return new Promise((res, rej) => {
          setTimeout(() => {
            res();
          }, ms)
        });
      }
      
      const ID = {
        login: '#email',
        pass: '#pass'
      };
      
      (async () => {
        const browser = await puppeteer.launch({
          headless: (renderScreen) ? false : "new",
          executablePath: pathToBrowserExecutable,
          args: ['--no-sandbox', '--disable-setuid-sandbox', "--disable-notifications"],
          'screen-resolution': '1920x1080',
          protocolTimeout: 0
        });
        const page = await browser.newPage();
        await page.setViewport({
          width: 1920,
          height: 1080
      })
        let login = async () => {
          // login
          await page.goto(PAGE, {
            waitUntil: 'networkidle2'
          });
          await page.waitForSelector(ID.login);
          res.sendStatus(202)
          await sleep(500);
          await page.type(ID.login, process.env.FB_USERNAME);
      
          await page.type(ID.pass,  process.env.FB_PASSWORD);
          await sleep(500);
      
          await page.click("#loginbutton")
      
          console.log("login done");
          await page.waitForNavigation();
          await page.waitForSelector("a[role='link']")
          if(seachTerm !== null){
            await page.type("input[placeholder='Find a member']", " ");
          } 
          await page.click('div[role="main"]');
          const downInterval = setInterval(down, 500)
          async function down(){
      
            await page.keyboard.down('End')
          }
       
      
           const checkScrollDone = ()=> new Promise(async (resolve, reject) => {
            
            
              await page.evaluate(async (GROUP, loadTimeout) => {
                let PAGe_TITLE = document.querySelector(`a[href='${GROUP}/']`).textContent
                console.log("BRO", PAGe_TITLE)

                return await new Promise((resolve, reject) => {
                let topAmt = 10
                
                const bodyElem = document.querySelector("body")
                setInterval(()=>{
                  console.log("here boi")
                  const bodyHeight = bodyElem.getBoundingClientRect().y
                  if(bodyHeight < topAmt){
                    topAmt = bodyHeight
                  }else{
                     resolve({PAGE_TITLE:PAGe_TITLE})
                  }
                }, loadTimeout)
      
              })
            }, GROUP, loadTimeout).then((data)=>{
                resolve({PAGE_TITLE: data.PAGE_TITLE})
            })
              
      
            })
          
        await checkScrollDone().then((data)=>{
            PAGE_TITLE = (data.PAGE_TITLE).replaceAll(" ", "_")
        })

          
          clearInterval(downInterval)
      
          const reviews = await page.evaluateHandle(() => {
            const reviewElems = document.querySelectorAll("div[role='listitem']");
          const reviewData = []
                  reviewElems.forEach((elem)=>{
                    const link = elem.querySelector("a[role='link'][tabindex='0']")
                    const infoElems = elem.querySelectorAll("span")
                    let info = ''
                    infoElems.forEach((elem)=>{
                      if(elem.textContent != ""){
                        info += `${elem.textContent} \n`
                      }
                    })
      
                    const personObj = {
                      profile: (link.href).replace(/\/groups\/\d{1,}\/user/gi, ""),
                      info: info
                    }
                      reviewData.push(personObj)
                  })
      
                  return reviewData
              })
              const reviewsJson = await reviews.jsonValue()
      
      
              const filteredReviews = reviewsJson.filter((data)=>{
                return (filterRegEx.test(data.info))
              })

              if(!existsSync("./outputs")){
                await fsPromise.mkdir("./outputs")
              }

              let exportData

              if(exportCSV){
                exportData = await converter.json2csv(filteredReviews);
                await fsPromise.writeFile(`./outputs/${PAGE_TITLE}_Group_Leads_output.csv`, exportData)
              }else{
                exportData = filteredReviews;
                await fsPromise.writeFile(`./outputs/${PAGE_TITLE}_Group_Leads_output.json`, JSON.stringify(exportData))
              }

        }
        
        await login();
        await browser.close()
        console.log("scraping complete")
        isDone = true
      })();
})


module.exports = router
