const mongoose=require("mongoose")


const Schema=mongoose.Schema

const carArraySchema= new Schema({
    nombre:String,
    car_lista:[]
})

const carArray=mongoose.model("car-array",carArraySchema)

module.exports=carArray