const mongoose=require("mongoose")


const Schema=mongoose.Schema

const pricesSchema= new Schema({
    marca:String,
    modelo:String,
    anos:String,
    precio:Array

})

const Prices=mongoose.model("prices",pricesSchema)

module.exports=Prices

