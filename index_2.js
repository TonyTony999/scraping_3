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


async function deleteAfter7days() {
    console.log(`started delete after 7 days at ${new Date(Date.now()).toString()}`)
    let one_24_day = 86400000
    let one_week = one_24_day * 7;
    let three_days=one_24_day *3;
    let current_Date = Date.now()

    let car_arr = await carArray.find({})
    let scrape3_cars = await scrape3Cars.find({})
    let scrape3_models = await scrape3Models.find({})

    if (scrape3_cars && scrape3_cars.length !== 0) {
        let deleted_ids = []
        for (let j = 0; j < scrape3_cars.length; j++) {
            let time_difference = current_Date - new Date(scrape3_cars[j].date).getTime()
            if (time_difference > one_week) {
                deleted_ids.push({id:scrape3_cars[j].title, dte:scrape3_cars[j].date})
                let removed_item = await scrape3Cars.findByIdAndDelete(scrape3_cars[j]._id)

            }
        }
        console.log(`deleted ${deleted_ids.length} cars from scrape_3 cars`)
        if (scrape3_models && scrape3_models.length !== 0) {
            let deleted_ids_2 = []
            for (let z = 0; z < scrape3_models.length; z++) {
                let time_difference = current_Date - new Date(scrape3_models[z].date).getTime()
                if (time_difference > one_week) {
                    deleted_ids_2.push({id:scrape3_models[z]._id, dte:scrape3_models[z].date})
                    let removed_item = await scrape3Models.findByIdAndDelete(scrape3_models[z]._id)
                }
            }
            console.log(`deleted ${deleted_ids_2.length} cars from scrape_3 models`)

            if(car_arr[0].car_lista && car_arr[0].car_lista.length!==0){
                let deleted_ids_3 = []
               for(let i=0;i<car_arr[0].car_lista.length;i++){
                   let time_difference=current_Date - new Date(car_arr[0].car_lista[i].date).getTime()
                  if(time_difference>one_week){
                      deleted_ids_3.push(car_arr[0].car_lista[i]._id)
                     let removed=await carArray.updateOne({nombre:"nuevo"},{$pull:{"car_lista":{"_id":car_arr[0].car_lista[i]._id}}})
                    
                  }
               }
               console.log(`deleted ${deleted_ids_3.length} cars from car_arr`)
               
           }
        }
    }


    console.log("finished deleting all collections")

}




deleteAfter7days()

//console.log(path.resolve(__dirname+"/Models/CarModels"))