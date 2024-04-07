 import dotenv from "dotenv"
// import 'dotenv/config'
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=> {
        console.log(`server is running at port: ${process.env.PORT}`)
    })
})
.catch((err)=> {
    console.log("MongoDB connection failed !!!", err)
})



/* 1st appraoch--------------------------------------------------
import express from "express"
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=> {
            console.log("ERR: ", error)
            throw error
        })

        app.listen(process.env.PORT, ()=> {
            console.log(`the app is listening on PORT: ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw error
    }
})()*/