const { response } = require("express")
const orderModel = require("../models/orderModel")
const inventoryModel = require("../models/inventoryModel")
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3") 
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner") 

const PLATFORM_FEE = 10
const DELIVERY_CHARGE = 0

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_APPLICATION_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_BUCKET_REGION
})

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
        const orderData = await orderModel.find().populate('products.product').populate('user')  
        if(!orderData){
            return response.status(404).json({status: "not found", code: 404, message: "Order not found"})
        }
        return response.status(200).json({ status: "success", code: 200, data: orderData })  
    } catch (error) {
        return response.status(500).send({status: "failure", code: 500, message: error.message})  
    }
}  

const getOrderById = async(request, response) => {
    const {orderId} = request.params
    try {
        const orderData = await orderModel.findOne({_id : orderId}).populate('products.product').populate('user')  
        return response.status(200).json({ status: "success", code: 200, data: orderData })  
    } catch (error) {
        return response.status(500).send({status: "failure", code: 500, message: error.message})  
    }
}

const getOrderByUserId = async (request, response) => {
    try {
        const user = request.user  

        const orders = await orderModel.aggregate([
            { 
                $match: { user: user._id } 
            },
            {
                $unwind: "$products"
            },
            {
                $lookup: {
                    from: 'product',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    totalAmount: { $first: "$totalAmount" },
                    discountedAmount: { $first: "$discountedAmount" },
                    platformFee: { $first: "$platformFee" },
                    payableAmount: { $first: "$payableAmount" },
                    paymentInfo: { $first: "$paymentInfo" },
                    shippingInfo: { $first: "$shippingInfo" },
                    orderStatus: { $first: "$orderStatus" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    products: {
                        $push: {
                            productDetails: "$productDetails",
                            quantity: "$products.quantity",
                            price: "$products.price"
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ])  

        if (orders.length === 0) {
            return response.status(404).json({ message: 'No orders found for this user' })  
        }

        const ordersWithImageUrls = await Promise.all(orders.map(async (order) => {
            const productsWithImages = await Promise.all(order.products.map(async (product) => {
                const productWithUrls = product.productDetails  
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

                return {
                    ...product,  
                    productDetails: productWithUrls 
                }  
            }))  

            return {
                ...order,
                products: productsWithImages
            }  
        }))  

        return response.status(200).json(ordersWithImageUrls)  
    } catch (error) {
        console.error('Error fetching orders:', error)  
        return response.status(500).json({ message: 'Server error', error })  
    }
}  



const addOrder = async (request, response, io) => {
    const user = request.user;
    const orderData = request.body;

    try {
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
                phoneNo: user.phoneNo,
            },
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        const addedOrder = await newOrder.save();

        for (const product of orderData.products) {

            const inventories = await inventoryModel.find({ product: product.product }).populate('warehouse');

            const matchingInventory = inventories.find(inventory => {

                return inventory.warehouse.location.city.toLowerCase() === user.city.toLowerCase(); 
            });

            if (matchingInventory) {
                matchingInventory.reservedStock += product.quantity; 
                await matchingInventory.save();
            } else {
                return response.status(500).send({status: "failure", code: 500, message: "Cannot place order for user's location"})
            }
        }

        io.emit("orderAdded", addedOrder);
        return response.status(201).send({ status: "success", code: 201, message: "Order added successfully" });
    } catch (error) {
        console.error("Error in adding order:", error);
        return response.status(500).send({ status: "failure", code: 500, message: error.message });
    }
};


const editOrder = async(request, response, io) => {
    const orderData = request.body
    try{
        
    }
    catch(error){
        return response.status(500).send({status: "failure", code: 500, message: error.message})
    }
}

module.exports = {getPriceDetails, addOrder, editOrder, getAllOrder, getOrderById, getOrderByUserId}