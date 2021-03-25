const axios = require("axios")
const mongoose = require("mongoose")
const cheerio = require("cheerio")

const path=require("path")
const carModels = require(path.resolve(__dirname+"/Models/carModels"))
const Years = require(path.resolve(__dirname+"/Models/Years"))
const Prices = require(path.resolve(__dirname+"/Models/Prices"))
const carArray = require(path.resolve(__dirname+"/Models/carArray"))
const Users = require(path.resolve(__dirname+"/Models/Users"))
const scrape3Models = require(path.resolve(__dirname+"/Models/scrape3Models"))
const scrape3Cars = require(path.resolve(__dirname+"/Models/scrape3Cars"))


require("dotenv").config()
const MONGO_URL = process.env.MONGO_URL

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })


async function getDefResults() {
    console.log(`started getDefResults() at ${new Date(Date.now()).toString()}`)

    async function processData() {
        let newArr = []
        return await axios.get("https://carros.tucarro.com.co/_PublishedToday_YES").then(res3 => {

            const $ = cheerio.load(res3.data)
            let numberCarros = $("main").find("div>div>aside>div").next().html()
            console.log(numberCarros)
            //let numCars = numberCarros.match(/\d+/)[0]
            numberCarros = numberCarros.replace(/\W+/g, "")
            numberCarros = numberCarros.match(/\d+/g)
            console.log(numberCarros)
            //console.log(numCars)

            let num = 97
            let arr = [49, 97]
            while (num < parseFloat(numberCarros[0])) {
                num += 48
                arr.push(num)
            }
            console.log(arr)
            return arr

        })
    }

    async function getScrapeData() {

        let arr = await processData()
        //arr = arr.slice(4,6)
        let scrapeData = []

        for (let z = 0; z < arr.length; z++) {

            try {
                await axios.get(`https://carros.tucarro.com.co/_Desde_${arr[z]}_PublishedToday_YES`).then(res3 => {
                    const $ = cheerio.load(res3.data)
                    let attempt = $("main").find("div>div>section").html()
                    //console.log("attempt is", attempt)
                    const $$ = cheerio.load(attempt)
                   
                    $$("li[class=ui-search-layout__item]","ol").each((index,element)=>{
                       // console.log(element)
                       
                       let obj={}

                       const info=($$(element).html())
                       const tx=($$(element).text())
                     
                       let link_index_1 = info.indexOf("https")
                       let link_index_2 = info.indexOf('type=item&amp;')
                       obj.link = info.slice(link_index_1, link_index_2)

                       let marca_index = info.indexOf("ui-search-item__title ui-search-item__group__element")
                       let marca_index_2 = info.indexOf("</h2>", marca_index)
                       let marca_slice = info.slice(marca_index, marca_index_2)
                        if (marca_slice && marca_slice.length !== 0) {
                            let start_index=marca_slice.indexOf('">')
                            marca_slice=marca_slice.slice(start_index+2)
                            obj.title = marca_slice
                        }

                        let image_index_1 = info.indexOf("https:",link_index_1+1)
                        let image_index_2 = info.indexOf('.jpg"',link_index_1+1)
                        let image_slice = info.slice(image_index_1, image_index_2+4)
                        obj.img = image_slice

                        let start_price_index=info.indexOf("price-tag-fraction")
                        let info_2=info.slice(start_price_index)
                        if(start_price_index && start_price_index !==-1){
                            let price_regex = /\d+.\d+.\d+/
                            let price_match = info_2.match(price_regex)
                            if (price_match && price_match.length !== 0) {
                                price_match = price_match[0].replace(/\W+/g, "", "g")
                                obj.price = parseInt(price_match)
                            }
                        }
                        

                        let year_index_1 = info.indexOf("ui-search-card-attributes__attribute")
                        let year_index_2 = info.indexOf("ui-search-card-attributes__attribute", year_index_1 + 1)
                        let year_slice = info.slice(year_index_1, year_index_2)
                        let year_regex = /\d+/g
                        let year_match = year_slice.match(year_regex)
                        if (year_match && year_match.length !== 0) {

                            obj.year = parseInt(year_match[0])
                        }

                        let location_index = info.indexOf("ui-search-item__group__element ui-search-item__location")
                        let location_index_2 = info.indexOf("span", location_index)
                        let location_slice = info.slice(location_index, location_index_2)
                        if (location_slice && location_slice.length !== 0) {
                            let start_index=location_slice.indexOf('">')
                            let last_index=location_slice.indexOf('</')
                            let ubicacion=location_slice.slice(start_index+2,last_index)

                          obj.ubicacion=ubicacion
                    }

                        let kilometraje_regex = /\d+.\d+\sKm/g
                        let kilometraje_match = info.match(kilometraje_regex)
                        if (kilometraje_match && kilometraje_match.length !== 0) {
                            kilometraje_match=kilometraje_match[0].replace(".", "")
                            kilometraje_match=kilometraje_match.match(/\d+/g)
                            kilometraje_match=parseInt(kilometraje_match[0])

                         obj.kilometraje = kilometraje_match
                        
                        }       
                        obj.date=new Date(Date.now()).toString()   
                             

                       scrapeData.push(obj)

                    } )
                   // console.log(scrapeData)
                    console.log("SIGUIENTE PAGINA")

                })

            } catch (err) {
                //console.log(err)
                console.log(`error at :${arr[z]}`, err)
            }

        }
       console.log(scrapeData)
       console.log("scrape data length is", scrapeData.length)
       return scrapeData
    }


    return await getScrapeData().then(result => {
         // console.log("result is " + result.length)
         async function saveCars() {
             let arr = []
             for (let i = 0; i < result.length; i++) {
                 let item = await scrape3Cars.create({
                     title: result[i].title,
                     year: result[i].year,
                     kilometraje: result[i].kilometraje,
                     ubicacion: result[i].ubicacion,
                     price: result[i].price,
                     link: result[i].link,
                     img: result[i].img,
                     date: result[i].date
                 })
                 arr.push(item)
             }
             return arr
         }
         saveCars().then(response => {
             console.log(`added ${response.length} cars to scrape3Cars`)
         })
 
     })

    //processData()
   // getScrapeData()

}

getDefResults()

