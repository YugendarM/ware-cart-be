const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")

const authenticate = async(request, response, next) => {
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
            const password = validUser?._doc?.password
            if(password){
                const {password, ...data} = validUser?._doc
                request.user = data
            }
            else{
                request.user = validUser
            }
            next()
        })
    }
    catch(error){
        return response.status(500).send({message: error.message})
    }
}

module.exports = {authenticate}