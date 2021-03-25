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


async function allCars(fech) {


    let carModels1 = await carModels.find({})
    let definitiveCars = []

    function getModelArray(marca1) {

        let modelMatches = []
        let sortedArr = []

        let marcaModels = carModels1.filter(element => {
            return element.marca === marca1
        })
        if (modelMatches.length === 0) {
            marcaModels[0].modelos.forEach((element, index) => {
                let regex = /\w+/gi
                let regexMatch = element.match(regex)
                if (regexMatch && regexMatch.length !== 0) {
                    if (index === marcaModels[0].modelos.length - 1) {
                        modelMatches.push(regexMatch[0])
                    }
                    else if (index < marcaModels[0].modelos.length - 1
                        && marcaModels[0].modelos[index].match(regex)[0] !== marcaModels[0].modelos[index + 1].match(regex)[0]) {
                        modelMatches.push(regexMatch[0])
                    }

                }
            })
            sortedArr = modelMatches.sort(function (a, b) {
                return b.length - a.length
            })
            return sortedArr

        }

    }
    async function addToArray(marca1, modelo1, ano1, ubicacion1, prix1, link) {
        let regex1 = new RegExp(String.raw`${modelo1}`)
        let versionPrice = await Prices.find({ marca: marca1, modelo: { $regex: regex1, $options: "i" }, anos: ano1 })
        let newObj = Object.assign({}, { marca: marca1, modelo: modelo1, ano: ano1, ubicacion: ubicacion1, precio: prix1, link: link })
        //console.log(versionPrice)
        if (versionPrice && versionPrice.length !== 0) {
            if (newObj && newObj._doc) {
                let price = []
                versionPrice.forEach(element => {
                    element.precio.forEach(element2 => {
                        element2.modelo = element.modelo
                        element2.ano = element.anos
                        // console.log(element2)
                        price.push(element2)
                    })
                })
                newObj._doc.precioComercial = price
                return newObj._doc
            }
            else {
                let price = []
                versionPrice.forEach(element => {
                    element.precio.forEach(element2 => {
                        element2.modelo = element.modelo
                        element2.ano = element.anos
                        // console.log(element2)
                        price.push(element2)
                    })
                })
                newObj.precioComercial = price
                return newObj
            }

        }

        return newObj._doc
        //return newObj
    }

    async function getResults3(fech) {

        let newArr = []
        let query
        arguments.length != 0 ? query = { date: { $regex: new RegExp(String.raw`${fech}`) } } : query = {};

        let scrapeData = await scrape3Cars.find(query)

        for (let i = 0; i < scrapeData.length; i++) {
            for (let j = 0; j < carModels1.length; j++) {
                if (scrapeData[i].title.toLowerCase().match(new RegExp(String.raw`${carModels1[j].marca}`, "i"))) {

                    let link = scrapeData[i].link
                    let price = scrapeData[i].price
                    let ubicacion = scrapeData[i].ubicacion
                    let year = scrapeData[i].year
                    let marca = carModels1[j].marca
                    let title = scrapeData[i].title
                    let date = scrapeData[i].date
                    let img = scrapeData[i].img
                    let kilometraje = scrapeData[i].kilometraje

                    let modeloArray = await getModelArray(marca)
                    let modelMatchArr = []

                    if (modeloArray) {
                        modeloArray.forEach(element => {
                            let modeloRegex = new RegExp(String.raw`${element}`, "i")
                            let modeloMatch = title.match(modeloRegex)
                            if (modeloMatch) {
                                modelMatchArr.push(element)
                            }
                        })
                    }
                    if (modelMatchArr && modelMatchArr.length !== 0) {
                        function maxLength(arr2) {
                            let max = arr2[0]
                            for (let z1 = 0; z1 < arr2.length; z1++) {
                                if (arr2[z1].length > max.length) {
                                    max = arr2[z1]
                                }
                            }
                            return max
                        }
                        let modelo = maxLength(modelMatchArr)
                        let versions = await addToArray(marca, modelo, year, ubicacion, price, link)
                        newArr.push({ title, marca, year, price, ubicacion, link, img, date, kilometraje, versions })
                    }
                }
            }
        }


        return newArr
    }

    async function getVersions() {
        let arr = await getResults3(fech)
        let versionMatch = []
        for (let i = 0; i < arr.length; i++) {

            try {

                let splitTitle = arr[i].title.split(" ")
                let newArr = []

                splitTitle.forEach(element => { ////REMOVE ALL SPACES
                    let regex = /\w+/gi
                    if (typeof element === "string") {
                        let match = element.match(regex)
                        if (match) {
                            newArr.push(element)
                        }
                    }
                })

                splitTitle = newArr

                if (arr[i].versions) {

                    if (arr[i].versions.precioComercial && arr[i].versions.precioComercial.length !== 0 && splitTitle.length != 0) {

                        let cell = []
                        let averagePrice = []
                        let average
                        let minPrice
                        let maxPrice
                        for (let j = 0; j < arr[i].versions.precioComercial.length; j++) {
                            let regexMatches = []
                            for (let z = 0; z < splitTitle.length; z++) {
                                let regex = new RegExp(String.raw`${splitTitle[z]}`, "i")
                                let titleMatch = arr[i].versions.precioComercial[j].version.match(regex)
                                if (titleMatch) {
                                    regexMatches.push(titleMatch[0])
                                }
                            }
                            cell.push({
                                modelo: arr[i].versions.precioComercial[j].modelo, version: arr[i].versions.precioComercial[j].version,
                                precio: arr[i].versions.precioComercial[j].precio, ano: arr[i].versions.precioComercial[j].ano,
                                matches: regexMatches
                            })

                        }
                        if (cell.length !== 0) {
                            cell.forEach(element => {
                                let regex = /\W+/g
                                let price = element.precio.replace(regex, "")
                                averagePrice.push(parseFloat(price))
                            })

                            minPrice = averagePrice[0]
                            maxPrice = averagePrice[0]

                            averagePrice.forEach(element => {
                                if (element < minPrice && element < maxPrice) {
                                    minPrice = element

                                }
                                else if (element > maxPrice && element > minPrice) {
                                    maxPrice = element
                                }

                            })

                            let sum = averagePrice.reduce((prevV, acum) => {
                                return acum += prevV
                            })
                            average = sum / cell.length
                            
                            let minPD,maxPD,aPD

                            let price = parseFloat(arr[i].price.replace(/\W+/g, ""))//convert price to number and remove points*/
                            let minPriceDif = minPrice - price
                            minPriceDif > 0 ? minPD = `- ${Math.floor((minPriceDif / minPrice) * 100)}%`
                                : minPD = `+ ${Math.floor((minPriceDif * -1 / minPrice) * 100)}%`
                            arr[i].minPriceDif = minPD

                            let maxPriceDif = Math.floor(maxPrice - price)
                            maxPriceDif > 0 ? maxPD = `- ${Math.floor((maxPriceDif / maxPrice) * 100)}%`
                                : maxPD = `+ ${Math.floor((maxPriceDif * -1 /maxPrice) * 100)}%`
                            arr[i].maxPriceDif = maxPD

                            let averagePriceDif = Math.floor(average - price)
                            averagePriceDif > 0 ? aPD = `- ${Math.floor((averagePriceDif / average) * 100)}%`
                                : aPD = `+ ${Math.floor((averagePriceDif * -1 / average) * 100)} %`
                            arr[i].averagePriceDif = aPD



                        }

                        versionMatch.push({
                            title: arr[i].title, marca: arr[i].marca, year: arr[i].year, price: arr[i].price, averagePrice: average, minPrice: minPrice, maxPrice: maxPrice,
                            ubicacion: arr[i].ubicacion, kilometraje: arr[i].kilometraje, link: arr[i].link, img: arr[i].img, date: arr[i].date, versiones: cell,
                            minPriceDif:arr[i].minPriceDif,maxPriceDif:arr[i].maxPriceDif,averagePriceDif:arr[i].averagePriceDif
                        })
                    }
                }

            } catch (error) {
                console.log(error)
            }

        }
        return versionMatch
        // return arr
    }
    async function sortVersions() {
        let arr = await getVersions()
        let newArr = [...arr]
        if (arr && arr.length !== 0) {
            for (let i = 0; i < arr.length; i++) {
                let sorted = arr[i].versiones.sort(function (a, b) {
                    return b.matches.length - a.matches.length
                })
                newArr[i].versiones = sorted
            }
        }
        return newArr
    }
    return await sortVersions().then(result => {

        async function saveCars() {
            let arr = []
            for (let i = 0; i < result.length; i++) {
                let item = await scrape3Models.create({
                    title: result[i].title,
                    marca: result[i].marca,
                    year: result[i].year,
                    price: result[i].price,
                    averagePrice: result[i].averagePrice,
                    minPrice: result[i].minPrice,
                    maxPrice: result[i].maxPrice,
                    minPriceDif:result[i].minPriceDif,
                    maxPriceDif:result[i].maxPriceDif,
                    averagePriceDif:result[i].averagePriceDif,
                    ubicacion: result[i].ubicacion,
                    kilometraje: result[i].kilometraje,
                    link: result[i].link,
                    img: result[i].img,
                    date: result[i].date,
                    versiones: result[i].versiones,
                })
                arr.push(item)
            }
            return arr
        }
        saveCars().then(response => {
            console.log(`${response.length} cars were added to scrape3Models`)
        })

    })
}

async function trigger_all_cars(){
    console.log(`started all cars at ${new Date(Date.now()).toString()}`)
   let currentDate=new Date(Date.now()).toString()
   currentDate=currentDate.slice(0,currentDate.search(/2021/))
   await allCars(currentDate) 
    
}

trigger_all_cars()

