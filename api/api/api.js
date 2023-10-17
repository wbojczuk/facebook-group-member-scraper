const puppeteer = require('puppeteer');
const fsPromise = require("fs/promises")
const express = require("express")
const router = express.Router()

// BEGIN SETTINGS

const filterRegEx = /(cleaning|pressure|soft|washing)/gi
const pathToBrowserExecutable = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"

// END SETTINGS



let isDone = false

router.get("/checkscraperstatus", (req, res)=>{
    if(isDone){
        res.json({status: "done"})
        isDone = false
    }else{
        res.json({status: "loading"})
    }
})

router.get("/scrapegroup/:group", async(req, res)=>{
    let PAGE = ""
    let GROUP = ""
    let PAGE_TITLE = ""
    if(req.params.group == undefined){
        res.sendStatus(400)
    }else{
        PAGE = decodeURIComponent(req.params.group) + "/members"
        GROUP = decodeURIComponent(req.params.group)
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
          headless: false,
          executablePath: pathToBrowserExecutable,
          args: ['--no-sandbox', '--disable-setuid-sandbox', "--disable-notifications"],
          'screen-resolution': '1600x900',
          protocolTimeout: 0
        });
        const page = await browser.newPage();
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
          const bodyElem =  await page.waitForSelector("body")
          await page.waitForSelector("a[role='link']")
      
          const downInterval = setInterval(down, 500)
          async function down(){
      
            await page.keyboard.down('End')
          }
       
      
           const checkScrollDone = ()=> new Promise(async (resolve, reject) => {
            
            
              await page.evaluate(async (GROUP) => {
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
                }, 2000)
      
              })
            }, GROUP).then((data)=>{
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
      
              await fsPromise.writeFile(`./outputs/${PAGE_TITLE}_Group_Leads_output.txt`, JSON.stringify(filteredReviews))
      
              
      
      
        }
        
        await login();
        await browser.close()
        isDone = true
      })();
})


module.exports = router