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
        return response.status(200).send(productData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getProductByWarehouse = async(request, response) => {
    
}

const addProduct = async(request, response) => {
    const userData = request.body
    try{
        const existingProduct = await productModel.findOne({productName: userData.productName})
        if(existingProduct){
            return response.status(401).send({message: "Product Already exist"})
        }
        const addedProduct = await productModel.create(userData)
        // const productExistInInventory = await inventoryModel.findOne({product: addedProduct._id})
        // if(productExistInInventory){

        // }
        
        // const newInventoryEntry = new inventoryModel({
        //     product: addedProduct._id,
        //     warehouse: userData.warehouseId,
        //     stockLevel: userData.stockLevel,
        //     stockThreshold: userData.stockThreshold
        // })

        // const addedProductInInventory = await newInventoryEntry.save()
        return response.status(201).send({message: "Product added successfully", addedProduct})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteProduct = async(request, response) => {
    const { productId } = request.params
    try{
        const deletedProduct = await productModel.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return response.status(404).json({ message: 'Product not found' });
        }
        response.status(200).json({ message: 'Product deleted successfully', deletedProduct });

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateProduct = async(request, response) => {
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
        return response.status(200).json({message: "Product updated Successfully", updatedProduct})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

module.exports = {addProduct, getAllProducts, getProductById, getProductByWarehouse, deleteProduct, updateProduct}