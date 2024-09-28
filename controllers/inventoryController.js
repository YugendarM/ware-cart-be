const inventoryModel = require("../models/inventoryModel")

const getAllInventory = async(request, response) => {
    try{
        const inventoryData = await inventoryModel.find()
        return response.status(200).send(inventoryData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getInventoryById = async(request, response) => {
    const {inventoryId} = request.params
    try{
        const inventoryData = await inventoryModel.findOne({_id: inventoryId})
        if(!inventoryData){
            return response.status(404).json({message: "Inventory not found"})
        }
        return response.status(200).send(inventoryData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const addProductToInventory = async(request, response) => {
    const userData = request.body
    try{
        const productExistInInventory = await inventoryModel.findOne({product: userData.productId, warehouse: userData.warehouseId})
        if(productExistInInventory !== null){
            return response.status(409).json({message: "Product Already exist in the warehouse"})
        }
        
        const newInventoryEntry = new inventoryModel({
            product: userData.productId,
            warehouse: userData.warehouseId,
            stockLevel: userData.stockLevel,
            stockThreshold: userData.stockThreshold
        })

        const addedProductInInventory = await newInventoryEntry.save()
        return response.status(201).json({message: "Product added to the warehouse", addedProductInInventory})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateInventory = async(request, response) => {
    const {inventoryId} = request.params
    const inventoryData = request.body
    try{
        const existingInventory = await inventoryModel.findOne({_id: inventoryId})
        if(!existingInventory){
            return response.status(404).json({message: "Inventory not found"})
        }
        const updatedInventory = await inventoryModel.findOneAndUpdate(
            {_id : existingInventory._id},
            {...inventoryData},
            {new : true}
        )
        return response.status(200).json({message: "Inventory updated successfully", updatedInventory})
    } 
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteInventory  = async(request, response) => {
    const { inventoryId } = request.params
    try{
        const deletedInventory = await inventoryModel.findByIdAndDelete(inventoryId);
        if (!deletedInventory) {
            return response.status(404).json({ message: 'Inventory not found' });
        }
        response.status(200).json({ message: 'Inventory deleted successfully', deletedInventory });

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

module.exports = {getAllInventory, updateInventory, addProductToInventory, getInventoryById, deleteInventory}