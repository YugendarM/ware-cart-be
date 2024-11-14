const orderModel = require("../models/orderModel") 
const productModel = require("../models/productModel") 
const userActivityModel = require("../models/userActivityModel") 
const userModel = require("../models/userModel") 
const moment = require("moment")
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3") 
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const s3 = new S3Client({
  credentials: {
      accessKeyId: process.env.AWS_APPLICATION_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: process.env.AWS_BUCKET_REGION
})

const trackUserActivity = async (req, res) => {
    const { action, productId, additionalInfo } = req.body 
  
    const user = req.user || null 
    
    const activity = new userActivityModel({
      userId : user?._id || null,
      action,
      productId,
      additionalInfo,
    }) 
    
    try {
      const addedActivity = await activity.save() 
      res.status(200).send("Activity tracked") 
    } catch (error) {
      res.status(500).send("Error tracking activity") 
    }
  } 
  

const getAnalytics = async (req, res) => {
  try {
    const views = await userActivityModel.aggregate([
      { $match: { action: "page_view" } },
      { $group: { _id: "$productId", views: { $sum: 1 } } },
    ]) 

    const addToCarts = await userActivityModel.aggregate([
      { $match: { action: "add_to_cart" } },
      { $group: { _id: "$productId", adds: { $sum: 1 } } },
    ]) 

    const purchases = await userActivityModel.aggregate([
      { $match: { action: "purchase" } },
      { $group: { _id: "$productId", purchases: { $sum: 1 } } },
    ]) 

    const wishlists = await userActivityModel.aggregate([
      { $match: { action: "wishlist" } },
      { $group: { _id: "$productId", wishlists: { $sum: 1 } } },
    ]) 

    res.json({ views, addToCarts, purchases, wishlists }) 
  } catch (error) {
    res.status(500).send("Error fetching analytics") 
  }
} 

const getAverageProductViews = async (request, response) => {
    try {
      const totalViews = await userActivityModel.aggregate([
        { $match: { action: 'page_view' } },
        { $group: { _id: null, totalViews: { $sum: 1 } } }
      ]) 
  
      const uniqueProducts = await userActivityModel.distinct('productId', { action: 'page_view' }) 
  
      if (uniqueProducts.length === 0) {
        return response.status(200).json({ averageViews: 0 }) 
      }
  
      const averageViews = (totalViews[0].totalViews / uniqueProducts.length).toFixed(0) 
  
      return response.status(200).json({ averageViews }) 
    } 
    catch (error) {
      return response.status(500).send({message: error.message}) 
    }
  } 

const getBestSellingProducts = async (req, res) => {
    try {
      const now = new Date() 
  
      const startOfToday = new Date(now.setHours(0, 0, 0, 0)) 
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1) 
      const startOfYear = new Date(now.getFullYear(), 0, 1) 
  
      const getBestSellingProduct = async (startDate) => {
        return await userActivityModel.aggregate([
          {
            $match: {
              action: 'purchase',
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$productId',
              totalSales: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'product', 
              localField: '_id', 
              foreignField: '_id', 
              as: 'productDetails' 
            }
          },
          {
            $unwind: {
              path: '$productDetails',
              preserveNullAndEmptyArrays: true 
            }
          },
          { $sort: { totalSales: -1 } },
          { $limit: 1 },
        ]) 
      } 
  
      const bestSellingToday = await getBestSellingProduct(startOfToday) 
      const bestSellingMonth = await getBestSellingProduct(startOfMonth) 
      const bestSellingYear = await getBestSellingProduct(startOfYear) 
  
      res.status(200).json({
        bestSellingToday: bestSellingToday.length ? bestSellingToday[0] : 'No sales today',
        bestSellingMonth: bestSellingMonth.length ? bestSellingMonth[0] : 'No sales this month',
        bestSellingYear: bestSellingYear.length ? bestSellingYear[0] : 'No sales this year'
      }) 
    } catch (error) {
      console.error('Error fetching best-selling products:', error) 
      res.status(500).send('Error fetching best-selling products') 
    }
  } 


  const getMostLikedProduct = async (req, res) => {
    try {
        const mostLiked = await userActivityModel.aggregate([
            { $match: { action: "wishlist" } },
            { $group: { _id: "$productId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 } 
        ]) 

        if (mostLiked.length === 0) {
            return res.status(404).json({ message: "No wishlisted products found." }) 
        }

        const mostLikedProductId = mostLiked[0]._id 
        const productDetails = await productModel.findById(mostLikedProductId).exec() 

        if (!productDetails) {
            return res.status(404).json({ message: "Product not found." }) 
        }

        const result = {
            productId: mostLikedProductId,
            wishlistCount: mostLiked[0].count,
            productDetails: productDetails,
        } 

        res.status(200).json(result) 
    } catch (error) {
        console.error("Error fetching most liked product:", error) 
        res.status(500).json({ message: "Error fetching most liked product." }) 
    }
}


const getUserAndProductCount = async (req, res) => {
    try {
        const userCount = await userModel.countDocuments() 

        const productCount = await productModel.countDocuments() 

        res.status(200).json({
            numberOfUsers: userCount,
            numberOfProducts: productCount
        }) 
    } catch (error) {
        console.error("Error fetching counts:", error) 
        res.status(500).json({ message: "Error fetching counts." }) 
    }
}

const getCategoryPurchaseCounts = async (req, res) => {
    try {
      const allCategories = await productModel.distinct('productType') 
  
      const purchaseCounts = await userActivityModel.aggregate([
        { $match: { action: 'purchase' } }, 
        {
          $lookup: {
            from: 'product',               
            localField: 'productId',        
            foreignField: '_id',             
            as: 'productDetails'          
          }
        },
        { $unwind: '$productDetails' },      
        { $group: { 
            _id: '$productDetails.productType',
            purchaseCount: { $sum: 1 }       
          } 
        }
      ]) 
  
      const categoryPurchaseMap = allCategories.map(category => {
        const matchingCategory = purchaseCounts.find(p => p._id === category) 
        return {
          _id: category,
          purchaseCount: matchingCategory ? matchingCategory.purchaseCount : 0
        } 
      }) 
  
      res.status(200).json(categoryPurchaseMap) 
    } catch (error) {
      res.status(500).send('Error fetching category purchase counts') 
    }
  } 

  const getMonthlyProductActivity = async (req, res) => {
    try {
      const endDate = new Date()  
      const startDate = moment(endDate).subtract(6, 'months').startOf('month').toDate() 
  
      const months = [] 
      for (let i = 0;   i < 6;   i++) {
        const monthDate = moment().subtract(i, 'months') 
        months.push({ 
          month: monthDate.month() + 1, 
          year: monthDate.year()
        }) 
      }
  
      const monthlyActivity = await userActivityModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate } 
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },   
              month: { $month: "$createdAt" }  
            },
            purchases: {
              $sum: { $cond: [{ $eq: ["$action", "purchase"] }, 1, 0] }
            },
            wishlists: {
              $sum: { $cond: [{ $eq: ["$action", "wishlist"] }, 1, 0] }
            },
            addToCarts: {
              $sum: { $cond: [{ $eq: ["$action", "add_to_cart"] }, 1, 0] }
            }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 } 
        }
      ]) 
  
      const activityMap = {} 
      monthlyActivity.forEach(item => {
        const year = item._id.year 
        const month = item._id.month 
        activityMap[`${year}-${month < 10 ? `0${month}` : month}`] = {
          purchases: item.purchases,
          wishlists: item.wishlists,
          addToCarts: item.addToCarts,
        } 
      }) 
  
      const formattedData = months.map(({ month, year }) => {
        const key = `${year}-${month < 10 ? `0${month}` : month}` 
        return {
          month,
          year,
          purchases: activityMap[key]?.purchases || 0,
          wishlists: activityMap[key]?.wishlists || 0,
          addToCarts: activityMap[key]?.addToCarts || 0,
        } 
      }) 
  
      res.status(200).json(formattedData) 
    } catch (error) {
      console.error('Error fetching monthly product activity:', error) 
      res.status(500).send('Error fetching monthly product activity') 
    }
  } 

const getTopPerformingProducts = async (req, res) => {
  try {
    const topProducts = await userActivityModel.aggregate([
      {
        $match: {
          action: { $in: ['purchase', 'add_to_cart', 'wishlist'] }
        }
      },
      {
        $group: {
          _id: "$productId",
          interactions: { $sum: 1 }
        }
      },
      {
        $sort: { interactions: -1 }
      },
      {
        $limit: 5
      }
    ]) 

    const productIds = topProducts.map(p => p._id) 

    const products = await productModel.find({ _id: { $in: productIds } })
      .select("productName productDescription price images") 

    const productsWithInteractions = topProducts.map(topProduct => {
      const product = products.find(p => p._id.equals(topProduct._id)) 
      if (product) {
        return {
          ...product.toObject(),  
          interactions: topProduct.interactions,  
        } 
      }
    }).filter(Boolean) 

    const productsWithImageUrls = await Promise.all(productsWithInteractions.map(async (product) => {
      const productWithUrls = { ...product }  
      productWithUrls.imageUrls = [] 

      if (product.images && product.images.length > 0) {
        const imageUrls = await Promise.all(product.images.map(async (image) => {
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

    res.status(200).json(productsWithImageUrls) 
  } catch (error) {
    res.status(500).send("Error fetching top performing products") 
  }
} 



  const getTopRegionsByProductPopularity = async (req, res) => {
    try {
      const topRegions = await userActivityModel.aggregate([
        {
          $match: { action: 'purchase' }, 
        },
        {
          $lookup: {
            from: 'user', 
            localField: 'userId', 
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true, 
          },
        },
        {
          $group: {
            _id: { 
              region: { $ifNull: ['$userDetails.city', 'Unknown'] } 
            },
            totalInteractions: { $sum: 1 },
          },
        },
        {
          $sort: { totalInteractions: -1 },
        },
        {
          $limit: 6, 
        },
      ]) 
  
      res.status(200).json({ success: true, data: topRegions }) 
    } catch (error) {
      console.error('Error fetching top regions:', error) 
      res.status(500).json({ success: false, message: 'Error fetching top regions' }) 
    }
  } 
  

module.exports = { trackUserActivity, getAnalytics, getAverageProductViews, getBestSellingProducts, getMostLikedProduct, getUserAndProductCount, getCategoryPurchaseCounts, getMonthlyProductActivity, getTopPerformingProducts, getTopRegionsByProductPopularity } 
