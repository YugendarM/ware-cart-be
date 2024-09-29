const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")

const adminAuth = async(request, response, next) => {
    try{
        const authHeader = request.headers['cookie']
        if(!authHeader){
            return response.status(401).send({status: "failure", code: 401, message: "Token not found"})
        }

        const token = authHeader.split("=")[1]

        jwt.verify(token, process.env.JWT_TOKEN, async(error, data) => {
            if(error){
                return response.status(401).send({status: "failure", code: 401, message: "Session Expired"})
            }
            const id = data.id
            const validUser = await userModel.findOne({_id: id})


            if(validUser.role !== "admin"){
                return response.status(403).json({status: "unathorized", code: 403, message: "Authorization failed. Admin privileges required."})
            }
            
            next()
        })
    }
    catch(error){
        return response.status(500).send({message: error.message})
    }
}

module.exports = {adminAuth}