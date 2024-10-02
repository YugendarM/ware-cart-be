const express = require("express")
const route = express.Router()
const {signupUser, loginUser, logout, getUserDetails, updateUserAddress, addProductToWishlist, removeProductFromWishlist, getAllWishlistedProducts} = require("../controllers/userController")
const {authenticate} = require("../middlewares/authenticate")

const attachSocketIO = (io) => {
    route.post("/signup", signupUser)
    route.post("/login", loginUser)
    route.post("/logout", logout)
    
    route.get("/getUserDetails", authenticate, getUserDetails)
    route.get("/wishlist", authenticate, getAllWishlistedProducts)
    
    route.put("/updateUserAddress", authenticate, updateUserAddress)
    route.put("/addProductToWishlist/:productId", authenticate, (request, response) => addProductToWishlist(request, response, io))
    route.put("/removeProductFromWishlist/:productId", authenticate, (request, response) => removeProductFromWishlist(request, response, io))

    return route
}


module.exports =  attachSocketIO