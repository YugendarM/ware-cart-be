const express = require("express")
const route = express.Router()
const {signupUser, loginUser, logout, getUserDetails, updateUserAddress} = require("../controllers/userController")
const {authenticate} = require("../middlewares/authenticate")

route.post("/signup", signupUser)
route.post("/login", loginUser)
route.post("/logout", logout)

route.get("/getUserDetails", authenticate, getUserDetails)

route.put("/updateUserAddress", authenticate, updateUserAddress)

module.exports =  route