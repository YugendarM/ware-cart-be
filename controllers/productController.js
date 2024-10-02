const productModel = require("../models/productModel")
const inventoryModel = require("../models/inventoryModel")

const getAllProducts = async(request, response) => {
    try{
        const productsData = await productModel.find()
        return response.status(200).send(productsData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getProductById = async(request, response) => {
    const {productId} = request.params
    try{
        const productData = await productModel.findOne({_id: productId})
        if(!productData){
            return response.status(404).json({message: "Product not found"})
        }
        const availableInWarehouse = await inventoryModel.aggregate([
            {
                $match: {
                    $expr: {
                      $eq: ["$product", { $toObjectId: productId }]
                    }
                  }
            },
            {
              $lookup: {
                from: "warehouse",          
                localField: "warehouse",        
                foreignField: "_id",            
                as: "warehouseDetails"             
              }
            },
            {
              $unwind: "$warehouseDetails"    
            }
          ]);
        return response.status(200).send({productData: productData, availableIn: availableInWarehouse})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getProductByWarehouse = async(request, response) => {
    const {warehouseId} = request.params
    try{
        const productData = await inventoryModel.find({warehouse: warehouseId})
        if(productData.length === 0){
            return response.status(404).json({message:"No data found for the provided Warehouse"})
        }
        return response.status(200).send(productData)
    } 
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const addProduct = async(request, response, io) => {
    const userData = request.body
    try{
        const existingProduct = await productModel.findOne({productName: userData.productName})
        if(existingProduct){
            return response.status(409).send({message: "Product Already exist"})
        }
        const addedProduct = await productModel.create(userData)

        io.emit("productAdded", addedProduct)
        return response.status(201).send({message: "Product added successfully", addedProduct})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteProduct = async(request, response, io) => {
    const { productId } = request.params
    try{
        const deletedProduct = await productModel.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return response.status(404).json({ message: 'Product not found' });
        }
        io.emit("productDeleted", deletedProduct)
        return response.status(200).json({ message: 'Product deleted successfully', deletedProduct });

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateProduct = async(request, response, io) => {
    const {productId} = request.params
    const productData = request.body
    try{
        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({message: "Product Not found"})
        }
        const updatedProduct = await productModel.findOneAndUpdate(
            {_id: validProduct}, 
            {...productData}, 
            {new: true})

        io.emit("productUpdated", updatedProduct)
        return response.status(200).json({message: "Product updated Successfully", updatedProduct})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getAllProductsForUsers = async(request, response) => {
    try{
        const productsData = await productModel.find()
        return response.status(200).json({status: "success", code: 200, data: productsData})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
} 

const getProductByIdForUsers = async(request, response) => {
    const {productId} = request.params
    try{
        const productData = await productModel.findOne({_id: productId})
        if(!productData){
            return response.status(404).json({status: "failure", code: 404, message: "Product not found"})
        }
        return response.status(200).json({status: "success", code:200, data: productData})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}
module.exports = {addProduct, getAllProducts, getProductById, getProductByWarehouse, deleteProduct, updateProduct, getAllProductsForUsers, getProductByIdForUsers}