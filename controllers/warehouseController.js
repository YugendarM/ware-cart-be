const inventoryModel = require("../models/inventoryModel")
const warehouseModel = require("../models/warehouseModel")

const getAllWarehouse = async(request, response) => {
    try{
        const warehouseData = await warehouseModel.aggregate([
            {
              // Stage 1: Perform a lookup to join with inventory collection
              $lookup: {
                from: 'inventory', // The name of the inventory collection
                localField: '_id', // Field from the warehouse collection
                foreignField: 'warehouse', // Field from the inventory collection
                as: 'products', // Name for the array of joined products
              },
            },
            {
              // Stage 2: Add a new field isStock which counts the number of products
              $addFields: {
                inStock: {
                  $sum: { $map: {
                      input: '$products', // Array of products
                      as: 'product',
                      in: { $ifNull: ['$$product.stockLevel', 0] } // Get capacity, default to 0 if null
                    }
                  }
                },
              },
            },
            {
              // Stage 3: Project the fields you want in the response
              $project: {
                _id: 1, // Include the warehouse ID
                warehouseName: 1, // Include other fields you want from warehouse
                inStock: 1, // Include the calculated isStock
                capacity: 1,
                location: 1
              },
            },
          ]);
        return response.status(200).send(warehouseData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const getWarehouseById = async(request, response) => {
    const {warehouseId} = request.params
    try{
        const warehouseData = await warehouseModel.findOne({_id: warehouseId})
        if(!warehouseData){
            return response.status(404).json({message: "Warehouse not found"})
        }
        const availableProducts = await inventoryModel.aggregate([
            {
                $match: {
                    $expr: {
                      $eq: ["$warehouse", { $toObjectId: warehouseId }]
                    }
                  }
            },
            {
              $lookup: {
                from: "product",          
                localField: "product",        
                foreignField: "_id",            
                as: "productDetails"             
              }
            },
            {
              $unwind: "$productDetails"    
            }
          ]);
          // if (availableProducts.length === 0) {
          //   return response.status(404).json({ message: 'No products found for this warehouse' });
          // }
          const inStock = availableProducts.reduce((total, product) => {
              return total + (product.stockLevel || 0); // Sum stockLevel, defaulting to 0 if undefined
          }, 0);

        return response.status(200).send({warehouseData: warehouseData, availableProducts: availableProducts, inStock: inStock})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const addWarehouse = async(request, response, io) => {
    const userData = request.body
    try{
        const existingWarehouse = await warehouseModel.findOne({warehouseName: userData.warehouseName})
        if(existingWarehouse){
            return response.status(409).send({message: "Warehouse Already exist"})
        }
        const addedWarehouse = await warehouseModel.create(userData)
        io.emit("newWarehouse", addedWarehouse)
        return response.status(201).send({message: "Warehouse added successfully", addedWarehouse})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteWarehouse = async(request,response, io) => {
    const { warehouseId } = request.params
    try{
        const deletedWarehouse = await warehouseModel.findByIdAndDelete(warehouseId);
        if (!deletedWarehouse) {
            return response.status(404).json({ message: 'Warehouse not found' });
        }
        io.emit("warehouseDeleted", deletedWarehouse)
        return response.status(200).json({ message: 'Warehouse deleted successfully', deletedWarehouse });

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateWarehouse = async(request,response, io) => {
    const {warehouseId} = request.params
    const warehouseData = request.body
    try{
        const validWarehouse = await warehouseModel.findOne({_id: warehouseId})
        if(!validWarehouse){
            return response.status(404).json({message: "Warehouse Not found"})
        }
        const updatedWarehouse = await warehouseModel.findOneAndUpdate(
            {_id: validWarehouse}, 
            {...warehouseData}, 
            {new: true})

        io.emit("warehouseUpdated", updatedWarehouse)
        return response.status(200).json({message: "Warehouse updated Successfully", updatedWarehouse})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

module.exports = {getAllWarehouse, addWarehouse, getWarehouseById, deleteWarehouse, updateWarehouse}