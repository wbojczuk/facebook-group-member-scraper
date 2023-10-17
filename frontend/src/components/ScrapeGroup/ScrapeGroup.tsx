import { useEffect, useRef, useState } from "react"
import "./scrapegroup.css"

export default function ScrapeGroup() {

    const scraperInputRef:any = useRef();
    const regexInputRef:any = useRef();
    const checkScraperStatusInterval:any = useRef()
    const isFetching:any = useRef();
    isFetching.current = false
    const [isScraping, setIsScraping] = useState(false)
    const [scraperStatusText, seScraperStatusText] = useState("Ready!")
    

    async function checkIsScraping(){
        if(!isFetching.current){
            isFetching.current = true
            const fetchData = await fetch(`${window.NODESERVER}/api/checkscraperstatus`)
            const jsonData = await fetchData.json()
            isFetching.current = false
            if(jsonData.status == "done"){
                clearInterval(checkScraperStatusInterval.current)
                setIsScraping(false)
                seScraperStatusText("Done!")
            }
        }
       
    }

    async function scrapeGroup(){
        if(!isScraping){
            const inputData = scraperInputRef.current.value;
            if(inputData != ""){
                setIsScraping(true)
                seScraperStatusText("Scraping...")
                localStorage.setItem("cachedRegex", regexInputRef.current.value)
                const scrapeRegex = (regexInputRef.current.value != "") ? regexInputRef.current.value : ".*"
                await fetch(`${window.NODESERVER}/api/scrapegroup/${encodeURIComponent(inputData)}/${encodeURIComponent(scrapeRegex)}`)
    
                checkScraperStatusInterval.current = setInterval(checkIsScraping, 1000)
            }else{
                alert("Enter Url!")
            }
            
            
        }else{
            alert("Already Busy")
        }
    }

    useEffect(()=>{
        if(localStorage.getItem("cachedRegex") != undefined){
            regexInputRef.current.value = localStorage.getItem("cachedRegex")
        }
    }, [])

  return (<>
    <div id="scraperWrapper">
        <input ref={scraperInputRef} placeholder="Enter group url" type="text" id="scraperInput" />
        <button id="scraperSubmit" onClick={scrapeGroup}>Scrape</button>
    </div>
    <h2 id="scraperStatus">{scraperStatusText}</h2>
    <div className="center">
        <label htmlFor="regexInput">Filter Regex:&nbsp;</label>
        <input ref={regexInputRef} id="regexInput" name="regexInput" type="text" placeholder={"(keyword|keyword)"} />
    </div>
    </>
  )
}
