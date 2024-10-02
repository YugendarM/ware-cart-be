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

module.exports = {getPriceDetails}