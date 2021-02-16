const mongoose=require("mongoose")


const Schema=mongoose.Schema

const carModelSchema= new Schema({
    marca:String,
    modelos:[]

})

const carModels=mongoose.model("car-models",carModelSchema)

module.exports=carModels