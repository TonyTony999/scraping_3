const axios = require("axios")
const mongoose = require("mongoose")
const cheerio = require("cheerio")

const path = require("path")
const carModels = require(path.resolve(__dirname + "/Models/carModels"))
const Years = require(path.resolve(__dirname + "/Models/Years"))
const Prices = require(path.resolve(__dirname + "/Models/Prices"))
const carArray = require(path.resolve(__dirname + "/Models/carArray"))
const Users = require(path.resolve(__dirname + "/Models/Users"))
const scrape3Models = require(path.resolve(__dirname + "/Models/scrape3Models"))
const scrape3Cars = require(path.resolve(__dirname + "/Models/scrape3Cars"))


require("dotenv").config()
const MONGO_URL = process.env.MONGO_URL

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })


async function getDefResults() {
    console.log(`started getdef at ${new Date(Date.now()).toString()}`)

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
        arr = arr.slice(4, 6)
        let scrapeData = []

        for (let z = 0; z < arr.length; z++) {

            try {
                await axios.get(`https://carros.tucarro.com.co/_Desde_${arr[z]}_PublishedToday_YES`).then(res3 => {
                    const $ = cheerio.load(res3.data)
                    let attempt = $("main").find("div>div>section").html()
                    //console.log("attempt is", attempt)
                    const $$ = cheerio.load(attempt)

                    $$("li[class=ui-search-layout__item]", "ol").each((index, element) => {
                        // console.log(element)

                        let obj = {}

                        const info = ($$(element).html())
                        const tx = ($$(element).text())

                        let link_index_1 = info.indexOf("https")
                        let link_index_2 = info.indexOf('type=item&amp;')
                        obj.link = info.slice(link_index_1, link_index_2)

                        let marca_index = info.indexOf("ui-search-item__title ui-search-item__group__element")
                        let marca_index_2 = info.indexOf("</h2>", marca_index)
                        let marca_slice = info.slice(marca_index, marca_index_2)
                        if (marca_slice && marca_slice.length !== 0) {
                            let start_index = marca_slice.indexOf('">')
                            marca_slice = marca_slice.slice(start_index + 2)
                            obj.title = marca_slice
                        }

                        let image_index_1 = info.indexOf("https:", link_index_1 + 1)
                        let image_index_2 = info.indexOf('.jpg"', link_index_1 + 1)
                        let image_slice = info.slice(image_index_1, image_index_2 + 4)
                        obj.img = image_slice

                        let start_price_index = info.indexOf("price-tag-fraction")
                        let info_2 = info.slice(start_price_index)
                        if (start_price_index && start_price_index !== -1) {
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
                            let start_index = location_slice.indexOf('">')
                            let last_index = location_slice.indexOf('</')
                            let ubicacion = location_slice.slice(start_index + 2, last_index)

                            obj.ubicacion = ubicacion
                        }

                        let kilometraje_regex = /\d+.\d+\sKm/g
                        let kilometraje_match = info.match(kilometraje_regex)
                        if (kilometraje_match && kilometraje_match.length !== 0) {
                            kilometraje_match = kilometraje_match[0].replace(".", "")
                            kilometraje_match = kilometraje_match.match(/\d+/g)
                            kilometraje_match = parseInt(kilometraje_match[0])

                            obj.kilometraje = kilometraje_match

                        }
                        obj.date = new Date(Date.now()).toString()


                        scrapeData.push(obj)

                    })
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
            console.log("response length is: ", response.length)
        })

    })

    //processData()
    // getScrapeData()

}

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
        //scrapeData=scrapeData.slice(0,5)
        //console.log(scrapeData.length)

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

                            let minPD, maxPD, aPD

                            let price = parseFloat(arr[i].price.replace(/\W+/g, ""))//convert price to number and remove points*/
                            let minPriceDif = minPrice - price
                            minPriceDif > 0 ? minPD = `- ${Math.floor((minPriceDif / minPrice) * 100)}%`
                                : minPD = `+ ${Math.floor((minPriceDif * -1 / minPrice) * 100)}%`
                            arr[i].minPriceDif = minPD

                            let maxPriceDif = Math.floor(maxPrice - price)
                            maxPriceDif > 0 ? maxPD = `- ${Math.floor((maxPriceDif / maxPrice) * 100)}%`
                                : maxPD = `+ ${Math.floor((maxPriceDif * -1 / maxPrice) * 100)}%`
                            arr[i].maxPriceDif = maxPD

                            let averagePriceDif = Math.floor(average - price)
                            averagePriceDif > 0 ? aPD = `- ${Math.floor((averagePriceDif / average) * 100)}%`
                                : aPD = `+ ${Math.floor((averagePriceDif * -1 / average) * 100)} %`
                            arr[i].averagePriceDif = aPD



                        }

                        versionMatch.push({
                            title: arr[i].title, marca: arr[i].marca, year: arr[i].year, price: arr[i].price, averagePrice: average, minPrice: minPrice, maxPrice: maxPrice,
                            ubicacion: arr[i].ubicacion, kilometraje: arr[i].kilometraje, link: arr[i].link, img: arr[i].img, date: arr[i].date, versiones: cell,
                            minPriceDif: arr[i].minPriceDif, maxPriceDif: arr[i].maxPriceDif, averagePriceDif: arr[i].averagePriceDif
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
                    minPriceDif: result[i].minPriceDif,
                    maxPriceDif: result[i].maxPriceDif,
                    averagePriceDif: result[i].averagePriceDif,
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
            console.log("response length for all cars is: ", response.length)
            //return res.send(response)
        })

    })
}

async function deleteScrape3(fecha) {
    let query
    arguments.length != 0 ? query = { date: { $regex: new RegExp(String.raw`${fecha}`) } } : query = {}

    let arr = await scrape3Cars.find(query)
    for (let i = 0; i < arr.length; i++) {
        await scrape3Cars.findByIdAndDelete(arr[i]._id)
    }
    console.log(`deleted ${arr.length} cars from scrape3cars`)
}

async function deleteScrape3Cars(fecha) {

    let query
    arguments.length != 0 ? query = { date: { $regex: new RegExp(String.raw`${fecha}`) } } : query = {}

    let arr = await scrape3Models.find(query)

    for (let i = 0; i < arr.length; i++) {
        await scrape3Models.findByIdAndDelete(arr[i]._id)
    }
    console.log("deleted all scrape3 results")
}

async function getCars(fecha) {
    let query
    arguments.length !== 0 ? query = { date: { $regex: new RegExp(String.raw`${fecha}`), $options: "i" } } : query = {}
    let arr = await scrape3Models.find(query)

    console.log("cars are: ", arr)



}

async function get_cars_2(fecha) {
    let arr = await scrape3Cars.find({ date: { $regex: new RegExp(String.raw`${fecha}`), $options: "i" } })
    console.log(arr)

}

/////////CREATE UPDATE DELETE ARRAY DOCUMENT in carArray COLLECTION WHERE ALL DOCUMETS WILL BE STORED

async function createArrayModel() {
    let item = await carArray.create({
        nombre: "nuevo",
        car_lista: []
    })
    console.log(item)
}

async function updateArray() {
    let item = await carArray.updateOne(
        { nombre: "nuevo" },
        { $push: { car_lista: { a: "1yy", b: "2yyy", c: "tuesday" } } }
    )
    console.log(item)
}

async function sliceArray() {
    let segment = await carArray.find({ nombre: "nuevo" }, {
        "car_lista": { $slice: [15, 20] }
    })
    console.log(segment[0].car_lista.length)
}

async function removeArrayElement(fecha) {
    let query;
    let removed
    if (arguments.length == 0) {
        removed = await carArray.updateOne({ nombre: "nuevo" }, { $pull: { "car_lista": {} } })
        console.log("removed all elements from array")
    }
    else {
        removed = await carArray.updateOne({ nombre: "nuevo" }, { $pull: { "car_lista": { "date": { $regex: new RegExp(String.raw`${fecha}`) } } } })
        console.log(`removed ${removed} of fecha ${fecha}`)
    }
}

async function deleteUserFavorites(id) {
    let removed = await Users.updateOne({ _id: id }, { $pull: { "myFavourites": {} } })
    return removed

}

async function addCarsToArray(fecha) {
    let query
    arguments.length !== 0 ? query = { date: { $regex: fecha, $options: "i" } } : query = {}
    let cars = await scrape3Models.find(query)
    async function saveCars() {
        if (cars && cars.length !== 0) {
            for (let i = 0; i < cars.length; i++) {
                let added = await carArray.updateOne(
                    { nombre: "nuevo" },
                    { $push: { car_lista: cars[i] } }
                )
            }
        }
    }
    saveCars().then(console.log(`added ${cars.length}cars`))

}

async function verifyCarArr() {
    let arr = await carArray.find({})
    if (arr && arr.length != 0) {
        console.log(arr[0].car_lista.length)
        /*arr[0].car_lista.forEach((element, index) => {
            console.log(element, index)
        })*/
    }
}

////RUN BOTH SCRAPING FUNCTIONS

async function getDefinitiveResults() {
    let currentDate = new Date(Date.now()).toString()
    currentDate = currentDate.slice(0, currentDate.search(/2021/))
    await getDefResults().then(res => {
        setTimeout(async x => {
            await allCars(currentDate).then(async t => { ////NOTE ADDED ASYNC T INSTEAD OF T AND AWAIT IN ADD CARS TO ARRAY 
                setTimeout(async xy => {
                    await addCarsToArray(currentDate)
                }, 80000)
            })
        }, 80000)
    })
}

async function populate_collections(collection_name, amount_of_cars) {
    let one_24_day = 86400000
    let two_week = one_24_day * 14;


    if (collection_name === "scrape3Cars") {
        let new_cars = []
        for (let i = 0; i < amount_of_cars; i++) {

            let time = (Date.now() - Math.ceil(two_week * Math.random()))
            let dte = new Date(time).toString()

            let item = await scrape3Cars.create({
                title: `random_${i}`,
                year: `19${i}`,
                kilometraje: `${Math.ceil(Math.random() * 1000)}`,
                ubicacion: "random_location",
                price: `${Math.ceil(Math.random() * 1000)}`,
                link: "random link",
                img: "random img",
                date: `${dte}`
            })
            new_cars.push(item)
        }
        console.log(`added ${new_cars.length} to scrape3cars`)

    }

    else if (collection_name === "scrape3Models") {
        let new_cars = []
        for (let i = 0; i < amount_of_cars; i++) {

            let time = (Date.now() - Math.ceil(two_week * Math.random()))
            let dte = new Date(time).toString()

            let item = await scrape3Models.create({
                title: `random_${i}`,
                marca: `random_marca${i}`,
                year: [`random_year_${i}`],
                price: `random_price${i}`,
                averagePrice: Math.ceil(Math.random() * i),
                minPrice: Math.ceil(Math.random() * i),
                maxPrice: Math.ceil(Math.random() * i),
                minPriceDif: `random_price${i}`,
                maxPriceDif: `random_price${i}`,
                averagePriceDif: `random_price${i}`,
                ubicacion: `random_location${i}`,
                kilometraje: [`random_kilometraje${i}`],
                link: `random_link${i}`,
                img: `random_img${i}`,
                versiones: [`random_versiones${i}`],
                date: `${dte}`
            })
            new_cars.push(item)
        }
        console.log(`added ${new_cars.length} to scrape3Models`)

    }

    else if (collection_name === "scrape3Array") {
        let added_cars = []
        let cars = await scrape3Models.find({ title: { $regex: new RegExp(String.raw`random`) } })
        if (cars && cars.length !== 0) {
            let arr_length_2 = await carArray.find({})
            if (arr_length_2 && arr_length_2.length !== 0) console.log("current arr length is", arr_length_2[0].car_lista.length);
            for (let i = 0; i < cars.length; i++) {
                added_cars.push(cars[i])
                let added = await carArray.updateOne(
                    { nombre: "nuevo" },
                    { $push: { car_lista: cars[i] } }
                )
            }
        }
        console.log(`added ${added_cars.length} to scrape3Array`)
        setTimeout(async () => {
            let arr_length = await carArray.find({})
            if (arr_length && arr_length.length !== 0) {
                console.log(arr_length[0].car_lista.length)
                console.log("new arr length is: ", arr_length[0].car_lista.length)
            }
        }, 10000)

    }

}

async function delete_populated(collection_name) {

    if (collection_name === "scrape3Cars") {
        let arr = await scrape3Cars.find({ title: { $regex: new RegExp(String.raw`random`) } })

        if (arr && arr.length !== 0) {
            let deleted_ids = []
            for (let i = 0; i < arr.length; i++) {
                deleted_ids.push(arr[i]._id)
                let deleted = await scrape3Cars.findByIdAndDelete(arr[i]._id)
            }
            console.log(`deleted ${deleted_ids.length} random cars from scrape 3 Cars`)
        }
        else {
            console.log("collection is empty")
        }

    }
    else if (collection_name === "scrape3Models") {
        let arr = await scrape3Models.find({ title: { $regex: new RegExp(String.raw`random`) } })
        if (arr && arr.length !== 0) {
            let deleted_ids = []
            for (let i = 0; i < arr.length; i++) {
                deleted_ids.push(arr[i]._id)
                let deleted = await scrape3Models.findByIdAndDelete(arr[i]._id)
            }
            console.log(`deleted ${deleted_ids.length} random cars from scrape3 Models`)
        }
        else {
            console.log("collection is empty")
        }

    }

    else if (collection_name === "scrape3Array") {
        let one_24_day = 86400000
        let two_week = one_24_day * 14;
        let one_week = one_24_day * 7

        let arr_length = await carArray.find({})
        if (arr_length && arr_length.length !== 0) {

            console.log("current arr length is: ", arr_length[0].car_lista.length)
            let removed = await carArray.updateOne({ nombre: "nuevo" }, { $pull: { "car_lista": { "title": { $regex: new RegExp(String.raw`random`) } } } })
            console.log(arr_length)
            console.log(arr_length[0].car_lista.length)
            console.log("deleted elements from scrape3 array")
        }
    }
}

async function delete_all_populated() {
    await delete_populated("scrape3Cars")
    await delete_populated("scrape3Models")
    await delete_populated("scrape3Array")
    return ("deleted all")

}

async function populate_all(amount_of_cars) {
    await populate_collections("scrape3Cars",amount_of_cars)
    await populate_collections("scrape3Models",amount_of_cars)
    setTimeout(async () => {
        await populate_collections("scrape3Array")
    }, 15000)
    return ("added all")
}

async function delete_all_collections() {

    await deleteScrape3Cars()
    await deleteScrape3()
    await removeArrayElement()
    return("deleted all collections")
}


//delete_all_populated().then(res=>console.log(res))
//populate_all(100).then(res=>console.log(res))
delete_all_collections().then(res=>console.log(res))

//removeArrayElement()

//addCarsToArray("Sat Dec 19 2020")
//verifyCarArr()
//processResults()

//getDefinitiveResults()//////////////FINALLY WORKING

//sliceArray()

/*deleteUserFavorites("60118b8a41d14b68d8f47ffc").then(async res=>
    console.log("removed", res))*/




//deleteScrape3Cars("Sat Dec 19 2020")
//console.log(`started script at ${new Date(Date.now()).toString()}`)
//getDefResults()
//allCars("Thu Mar 18 2021")

//getCars("Sat Dec 19 2020")
//deleteScrape3Cars()

//get_cars_2("Thu Mar 25 2021")
