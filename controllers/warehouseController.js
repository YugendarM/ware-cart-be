const warehouseModel = require("../models/warehouseModel")

const getAllWarehouse = async(request, response) => {
    try{
        const warehouseData = await warehouseModel.find()
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
        return response.status(200).send(warehouseData)
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const addWarehouse = async(request, response) => {
    const userData = request.body
    try{
        const isWarehouseExist = await warehouseModel.findOne({warehouseName: userData.warehouseName})
        if(isWarehouseExist){
            return response.status(401).send({message: "Warehouse Already exist"})
        }
        const addedWarehouse = await warehouseModel.create(userData)
        return response.status(201).send({message: "Warehouse added successfully", addedWarehouse})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteWarehouse = async(request,response) => {
    const { warehouseId } = request.params
    try{
        const deletedWarehouse = await warehouseModel.findByIdAndDelete(warehouseId);
        if (!deletedWarehouse) {
            return response.status(404).json({ message: 'Warehouse not found' });
        }
        response.status(200).json({ message: 'Warehouse deleted successfully', deletedWarehouse });

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateWarehouse = async(request,response) => {
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
        return response.status(200).json({message: "Warehouse updated Successfully", updatedWarehouse})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

module.exports = {getAllWarehouse, addWarehouse, getWarehouseById, deleteWarehouse, updateWarehouse}