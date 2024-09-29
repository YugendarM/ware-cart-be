const pricingRuleModel = require("../models/pricingRuleModel")

const getAllPricingRule = async(request, response) => {
    try{
        const pricingRuleData = await pricingRuleModel.find()
        return response.status(200).json({status: "success", code: 200, data: pricingRuleData})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const addPricingRule = async(request, response, io) => {
    const pricingRuleData = request.body
    try{
        const existingPricingRule = await pricingRuleModel.findOne({name: pricingRuleData.name})
        if(existingPricingRule){
            return response.status(409).json({status: "conflict", code: 409, message: "Pricing Rule already Exist"})
        }
        const addedPricingRule = await pricingRuleModel.create(pricingRuleData)
        io.emit("pricingRuleAdded", addedPricingRule)
        return response.status(201).json({status:"success", code: 201, message: "Pricing Rule added successfully"})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const updatePricingRule = async(request, response, io) => {
    const {pricingRuleId} = request.params
    const pricingRuleData = request.body

    try{
        const validPricingRule = await pricingRuleModel.findOne({_id: pricingRuleId})
        if(!validPricingRule){
            return response.status(404).json({status: "Not found", code: 404, message: "Pricing Rule Not found"})
        }
        const updatedPricingRule = await pricingRuleModel.findOneAndUpdate(
            {_id: validPricingRule._id},
            pricingRuleData,
            {new: true}
        )
        io.emit("pricingRuleUpdated", updatedPricingRule)
        return response.status(200).json({status: "success", code: 200, message: "Pricing Rule updated successfully"})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

const deletePricingRule = async(request, response, io) => {
    const {pricingRuleId} = request.params
    try{
        const validPricingRule = await pricingRuleModel.findOne({_id: pricingRuleId})
        if(!validPricingRule){
            return response.status(404).json({status: "Not found", code: 404, message: "Pricing Rule Not found"})
        }
        const deletedPricingRule = await pricingRuleModel.findOneAndDelete({_id: validPricingRule._id})
        io.emit("pricingRuleDeleted", deletedPricingRule)
        return response.status(200).json({status: "success", code: 200, message: "Pricing Rule deleted successfully"})
    }
    catch(error){
        return response.status(500).json({status: "failure", code: 500, message: error.message})
    }
}

module.exports = {getAllPricingRule, addPricingRule, updatePricingRule, deletePricingRule}