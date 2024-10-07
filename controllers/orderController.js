const { response } = require("express")
const orderModel = require("../models/orderModel")

const PLATFORM_FEE = 10
const DELIVERY_CHARGE = 0

const getPriceDetails = async(request, response) => {
    const orderItems = request.orderItems

    try {
        let totalPrice = 0  
        let totalDiscount = 0  
    
        orderItems.forEach((item) => {
            totalPrice += item.totalPrice || 0  
            totalDiscount += item.discountPrice || 0 
        }) 
    
        const priceDetails = {
            totalPrice: totalPrice,  
            totalDiscount: totalDiscount,
            platformFee: PLATFORM_FEE,
            totalPayable: totalPrice - totalDiscount + PLATFORM_FEE + DELIVERY_CHARGE ,
            totalSavings: totalDiscount 
        } 
        
        return response.status(200).json({ status: "success", code: 200, priceDetails: priceDetails, orderItems: orderItems  }) 
    }
    catch(error){
        return response.status(500).send({status: "failure", code: 500, message: error.message})
    }
}

const getAllOrder = async (request, response) => {
    try {
        const orderData = await orderModel.find().populate('products.product').populate('user');
        if(!orderData){
            return response.status(404).json({status: "not found", code: 404, message: "Order not found"})
        }
        return response.status(200).json({ status: "success", code: 200, data: orderData });
    } catch (error) {
        return response.status(500).send({status: "failure", code: 500, message: error.message});
    }
};

const getOrderById = async(request, response) => {
    const {orderId} = request.params
    try {
        const orderData = await orderModel.findOne({_id : orderId}).populate('products.product').populate('user');
        return response.status(200).json({ status: "success", code: 200, data: orderData });
    } catch (error) {
        return response.status(500).send({status: "failure", code: 500, message: error.message});
    }
}


const addOrder = async(request, response, io) => {
    const user = request.user
    const orderData = request.body
    try{        
        const newOrder = new orderModel({
            user: user._id,
            products: orderData.products,
            totalAmount: orderData.totalAmount,
            discountedAmount: orderData.discountedAmount,
            payableAmount: orderData.payableAmount,
            platformFee: orderData.platformFee,
            paymentInfo: orderData.paymentInfo,
            shippingInfo: {
                firstName: user.firstName,
                addressFirstLine: user.addressFirstLine,
                addressSecondLine: user.addressSecondLine,
                city: user.city,
                country: user.country,
                pincode: user.pincode,
                country: user.country,
                phoneNo: user.phoneNo,
            }
        })

        const addedOrder = await newOrder.save()
        io.emit("orderAdded", addedOrder)
        return response.status(201).send({status: "success", code: 201, message: "Order added successfully"})
    }
    catch(error){
        return response.status(500).send({status: "failure", code: 500, message: error.message})
    }
}

const editOrder = async(request, response, io) => {
    const orderData = request.body
    try{
        
    }
    catch(error){
        return response.status(500).send({status: "failure", code: 500, message: error.message})
    }
}

module.exports = {getPriceDetails, addOrder, editOrder, getAllOrder, getOrderById}