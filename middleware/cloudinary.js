const  cloudinary= require("cloudinary").v2

require("dotenv").config()

cloudinary.config({ 
  cloud_name: process.env.cloud_name, 
  api_secret: process.env.api_secret,
  api_key: process.env.api_key, 
});


module.exports= cloudinary


