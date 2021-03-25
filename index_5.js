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


async function addCarsToArray() {
    console.log(`started addCarsToArray() at ${new Date(Date.now()).toString()}`)
    let currentDate=new Date(Date.now()).toString()
    currentDate=currentDate.slice(0,currentDate.search(/2021/))
    let query
    query = { date: { $regex: currentDate, $options: "i" } }
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
    saveCars().then(console.log(`added ${cars.length} cars to car array`))

}

addCarsToArray()