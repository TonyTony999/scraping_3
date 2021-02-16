const mongoose = require("mongoose")


const Schema = mongoose.Schema

const scrape3Schema = new Schema({
    title: String,
    marca: String,
    year: [],
    price: String,
    averagePrice: Number,
    minPrice: Number,
    maxPrice: Number,
    minPriceDif:String,
    maxPriceDif:String,
    averagePriceDif:String,
    ubicacion:String,
    kilometraje: [],
    link : String,
    img : String,
    date : String,
    versiones:[]
})

const scrape3Models = mongoose.model("scrape-3", scrape3Schema)

module.exports = scrape3Models