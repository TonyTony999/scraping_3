const mongoose=require("mongoose")


const Schema=mongoose.Schema

const yearsSchema= new Schema({
    //arr:Schema.Types.Mixed
    marca:String,
    modelo:String,
    anos:Array
   

})

const Years=mongoose.model("years",yearsSchema)

module.exports=Years