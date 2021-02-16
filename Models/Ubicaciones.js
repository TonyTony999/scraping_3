const mongoose = require("mongoose")


const Schema = mongoose.Schema


const ubicacionesSchema=new Schema({
    ubicaciones:[]
})

const ubicacionesModel=mongoose.model("ubicaciones",ubicacionesSchema )

module.exports=ubicacionesModel
