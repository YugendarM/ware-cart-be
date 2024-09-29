const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const JWT_TOKEN = process.env.JWT_TOKEN

const signupUser = async(request, response) => {
    const userData = request.body
    try{
        const isUserExist = await userModel.findOne({email: userData.email})
        if(isUserExist){
            return response.status(409).send({ status: "failed", code: 409, message: "User already Exist"})
        }
        const hashedPassword = await bcrypt.hash(userData.password, 10)

            const newUser = new userModel({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: hashedPassword
            })

            const addedUser = await newUser.save()
            const AUTH_TOKEN = jwt.sign({id: addedUser._id}, JWT_TOKEN)
            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: true,
                maxAge: 2 * 60 * 60 * 1000 
            }
            response.cookie("SessionID", AUTH_TOKEN, options)
            return response.status(201).send({ status: "success", code: 201, message: "User registered successfully"})
    }
    catch(error){
        return response.status(500).send({message: error.message})
    }
}

const loginUser = async(request, response) => {
    const userCredentials = request.body
    try{
        const validUser = await userModel.findOne({email: userCredentials.email}).select("+password")
        if(!validUser){
            return response.status(404).send({message: "User not registered"})
        }
        if(await bcrypt.compare(userCredentials.password, validUser.password)){
            const AUTH_TOKEN = jwt.sign({id: validUser._id}, JWT_TOKEN)
            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: true,
                maxAge: 2 * 60 * 60 * 1000,
            }
            response.cookie("SessionID", AUTH_TOKEN, options)
            return response.status(200).send({ status: "success", code: 200, message: "Loggin successfull" })
        }
        else{
            return response.status(401).send({ status: "failed", code: 401, message: "Wrong Password" })
        }
    }
    catch(error){
        return response.status(500).send({message: error.message})
    }
}

const logout = async (request, response) => {
    const authHeader = request.headers['cookie'];
    if (!authHeader) {
        return response.status(204).send({ status: "failed", code: 204, message: "Header not found" }); 
    }

    const cookies = authHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
    }, {})

    const sessionID = cookies['SessionID']

    if (!sessionID) {
        return response.status(204).send({ status: "failed", code: 204, message: "Session not found" })
    }

    response.clearCookie('SessionID', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: true,
        path: '/'
    })

    response.setHeader('Clear-Site-Data', '"cookies"')
    return response.status(200).send({ status: "success", code: 200, message: "Logged out!" })
};


module.exports = {signupUser, loginUser, logout}