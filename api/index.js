const express = require("express")
require('dotenv').config({ path: '.env.local' });
const app = express()
const PORT = process.env.PORT || 3000
const cors = require("cors")
const whitelist = ["http://localhost:3000", "http://localhost:5173"]
const corsSettings = {
    origin: (origin, cb)=>{
        if(whitelist.includes(origin) || !origin){
            cb(null, true)
        }else{
            cb(new Error("CORS NOT SUPPORTED"))
        }
    }
}

app.use(cors(corsSettings))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use("/api", require("./api/api"))
app.use(express.static("public"))

app.get("^/$|(index|home)", (req, res)=>{
    res.sendFile("index.html");
})


app.listen(PORT)