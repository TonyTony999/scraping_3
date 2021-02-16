const mongoose = require("mongoose")


const Schema = mongoose.Schema

const scrape3CarsSchema = new Schema({
title: String,
year: [],
kilometraje: [],
ubicacion: String,
price : String,
link: String,
img: String,
date: String
})

const scrape3Cars = mongoose.model("scrape-3-Cars", scrape3CarsSchema)

module.exports = scrape3Cars