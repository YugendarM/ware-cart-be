const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const inventoryModel = require("../models/inventoryModel")
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3") 
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner") 
const JWT_TOKEN = process.env.JWT_TOKEN

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_BUCKET_REGION
})

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
                httpOnly: false,
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
                httpOnly: false,
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
    const authHeader = request.headers['cookie']  
    if (!authHeader) {
        return response.status(204).send({ status: "failed", code: 204, message: "Header not found" })   
    }

    const cookies = authHeader.split('  ').reduce((acc, cookie) => {
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
}  

const getUserDetails = async(request, response) => {
    const userData = request.user  
    try{
        return response.status(200).send(userData)
    }
    catch(error){
        return response.status(500).send({message: error.message})
    }
}

const updateUserAddress = async(request, response, io) => {
    const userData = request.user
    const addressData = request.body
    
    try{
        const validUser = await userModel.findOne({_id: userData._id})
        if(!validUser){
            return response.status(404).json({status: "failure", code: 404, message: "User not found"})
        }
        const phoneNumberExist = await userModel.findOne({
            phoneNo: addressData.phoneNo,
            _id: { $ne: userData._id }
        })  

        if(phoneNumberExist){
            return response.status(409).json({status: "conflict", code: 409, message: "Phone number already registered"})
        }

        const updatedUser = await userModel.findOneAndUpdate(
            {_id: validUser._id},
            {
                $set: {
                    addressFirstLine: addressData.addressFirstLine,
                    addressSecondLine: addressData.addressSecondLine,
                    city: addressData.city,
                    state: addressData.state,
                    pincode: addressData.pincode,
                    phoneNo: addressData.phoneNo,
                }
            },
            {new : true}
        )
        io.emit("userUpdated", updatedUser)
        return response.status(200).json({status: "success", code: 200, message: "User updated successfully"})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const addProductToWishlist = async(request, response, io) => {
    const user = request.user
    const {productId} = request.params

    try{
        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({status:"Not found", code: 404, message: "Product not found"})
        } 
        const updatedUser = await userModel.findOneAndUpdate(
            {_id: user._id}, 
            { $addToSet: { wishlist: productId } },
            {new: true}
        )
        const updatedWishlist = await productModel.find({ _id: { $in: updatedUser.wishlist } })
        io.emit("wishlistUpdated", updatedWishlist)
        if(updatedUser){
            io.emit("productAddedToWishlist", updatedUser)
            return response.status(200).json({status: "success", code: 200, message: "Product added to wishlist"})
        }
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const removeProductFromWishlist = async(request, response, io) => {
    const user = request.user
    const {productId} = request.params

    try{
        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({status:"Not found", code: 404, message: "Product not found"})
        } 
        const updatedUser = await userModel.findOneAndUpdate(
            {_id: user._id}, 
            { $pull: { wishlist: productId } },
            {new: true}
        )

        const wishlistedProducts = await productModel.find({ _id: { $in: updatedUser.wishlist } })

        const productsWithImageUrls = await Promise.all(wishlistedProducts.map(async (product) => {
            const productWithUrls = product.toObject()  
            productWithUrls.imageUrls = []  

            if (productWithUrls.images && productWithUrls.images.length > 0) {
                const imageUrls = await Promise.all(productWithUrls.images.map(async (image) => {
                    const getObjectParams = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: image
                    }  
                    const command = new GetObjectCommand(getObjectParams)  
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })  
                    return url  
                }))  

                productWithUrls.imageUrls = imageUrls   
            }

            return productWithUrls
        }))
        
        io.emit("wishlistUpdated", productsWithImageUrls)
        if(updatedUser){
            return response.status(200).json({status: "success", code: 200, message: "Product removed from wishlist"})
        }
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const addProductToCart = async(request, response, io) => {
    const user = request.user
    const {productId} = request.params

    try{
        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({status:"Not found", code: 404, message: "Product not found"})
        } 
        const updatedUser = await userModel.findOneAndUpdate(
            {_id: user._id}, 
            { $addToSet: { cart: productId } },
            {new: true}
        )

        const updatedCart = await productModel.find({ _id: { $in: updatedUser.cart } })
        io.emit("cartUpdated", updatedCart)
        if(updatedUser){
            return response.status(200).json({status: "success", code: 200, message: "Product added to Cart"})
        }
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const removeProductFromCart = async(request, response, io) => {
    const user = request.user
    const {productId} = request.params

    try{
        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({status:"Not found", code: 404, message: "Product not found"})
        } 
        const updatedUser = await userModel.findOneAndUpdate(
            {_id: user._id}, 
            { $pull: { cart: productId } },
            {new: true}
        )

        const cartItems = await productModel.find({ _id: { $in: updatedUser.cart } })

        const cartItemsWithImageUrls = await Promise.all(cartItems.map(async (product) => {
            const productWithUrls = product.toObject()   
            productWithUrls.imageUrls = []  

            if (productWithUrls.images && productWithUrls.images.length > 0) {
                const imageUrls = await Promise.all(productWithUrls.images.map(async (image) => {
                    const getObjectParams = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: image
                    }  
                    const command = new GetObjectCommand(getObjectParams)  
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })  
                    return url  
                }))  

                productWithUrls.imageUrls = imageUrls  
            }

            return productWithUrls  
        }))

        io.emit("cartUpdated", cartItemsWithImageUrls)
        if(updatedUser){
            return response.status(200).json({status: "success", code: 200, message: "Product removed from cart"})
        }
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const getAllWishlistedProducts = async (request, response) => {
    const user = request.user  
    
    try {
        if (!user.wishlist || user.wishlist.length === 0) {
            return response.status(404).json({ 
                status: "not found", 
                code: 404, 
                message: "No products found in wishlist" 
            })  
        }

        const wishlistedProducts = await productModel.find({ _id: { $in: user.wishlist } })  
        const inventoryData = await inventoryModel.find().populate('warehouse');

        const productsWithImageUrls = await Promise.all(wishlistedProducts.map(async (product) => {
            const productWithUrls = product.toObject()  
            productWithUrls.imageUrls = []  
            productWithUrls.outOfStock = true; 
          productWithUrls.deliverable = true;
  
          const productInInventory = inventoryData.some(
            (inventory) =>
                 inventory?.product?.equals(product._id) && inventory.stockLevel > 0
          );
  
          if (productInInventory) {
            productWithUrls.outOfStock = false;
          }
  
          if (user && user.city) {
            const deliverableInventory = inventoryData.some(
              (inventory) =>
                inventory.product.equals(product._id) &&
                inventory.warehouse.location.city.toLowerCase() === user.city.toLowerCase() &&
                inventory.stockLevel > 0
            );
  
            if (!deliverableInventory) {
              productWithUrls.deliverable = false;
            }
          }

            if (productWithUrls.images && productWithUrls.images.length > 0) {
                const imageUrls = await Promise.all(productWithUrls.images.map(async (image) => {
                    const getObjectParams = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: image
                    }  
                    const command = new GetObjectCommand(getObjectParams)  
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })  
                    return url  
                }))  

                productWithUrls.imageUrls = imageUrls   
            }

            return productWithUrls
        }))  

        return response.status(200).json({
            status: "success",
            code: 200,
            data: productsWithImageUrls
        })  
    } catch (error) {
        return response.status(500).json({
            status: "failure",
            code: 500,
            message: error.message
        })  
    }
}  

const getAllCartItems = async (request, response) => {
    const user = request.user  

    try {
        if (!user.cart || user.cart.length === 0) {
            return response.status(404).json({ 
                status: "not found", 
                code: 404, 
                message: "No products found in Cart" 
            })  
        }

        const cartItems = await productModel.find({ _id: { $in: user.cart } })  

        const cartItemsWithImageUrls = await Promise.all(cartItems.map(async (product) => {
            const productWithUrls = product.toObject()   
            productWithUrls.imageUrls = []  

            if (productWithUrls.images && productWithUrls.images.length > 0) {
                const imageUrls = await Promise.all(productWithUrls.images.map(async (image) => {
                    const getObjectParams = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: image
                    }  
                    const command = new GetObjectCommand(getObjectParams)  
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })  
                    return url  
                }))  

                productWithUrls.imageUrls = imageUrls  
            }

            return productWithUrls  
        }))  

        return response.status(200).json({
            status: "success",
            code: 200,
            data: cartItemsWithImageUrls
        })  
    } catch (error) {
        return response.status(500).json({
            status: "failure",
            code: 500,
            message: error.message
        })  
    }
}  


module.exports = {signupUser, loginUser, logout, getUserDetails, updateUserAddress, addProductToWishlist, removeProductFromWishlist, getAllWishlistedProducts, addProductToCart, removeProductFromCart, getAllCartItems}