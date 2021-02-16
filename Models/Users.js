const mongoose=require("mongoose")


const Schema=mongoose.Schema

const userSchema= new Schema({
    firstName:String,
    lastName:String,
    email:String,
    password:String,
    myFavourites:[]
  

})

const Users=mongoose.model("users",userSchema)

module.exports=Users