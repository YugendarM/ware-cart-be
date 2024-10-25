require("dotenv").config()
const productModel = require("../models/productModel")
const inventoryModel = require("../models/inventoryModel")
const warehouseModel = require("../models/warehouseModel")
const userModel = require("../models/userModel")
const crypto = require("crypto")

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3") 
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner") 
const { response } = require("express")

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_BUCKET_REGION
})



const getAllProducts = async (request, response) => {
    try {
        const productsData = await productModel.find() 

        const productsWithImageUrls = await Promise.all(productsData.map(async (product) => {
            const productWithUrls = product.toObject() 
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

        return response.status(200).send(productsWithImageUrls) 
    } catch (error) {
        return response.status(500).json({ message: error.message }) 
    }
} 



const getProductById = async(request, response) => {
    const {productId} = request.params
    try{
        const productData = await productModel.findOne({_id: productId})
        if(!productData){
            return response.status(404).json({message: "Product not found"})
        }

        const productObject = productData.toObject() 

        if (productData.images && productData.images.length > 0) {
            const imageUrls = await Promise.all(productData.images.map(async (image) => {
                const getObjectParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: image
                } 
                const command = new GetObjectCommand(getObjectParams) 
                
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 }) 
                return url 
            })) 

            productObject.imageUrls = imageUrls 
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
          ]) 
        return response.status(200).send({productData: productObject, availableIn: availableInWarehouse})
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
    const files = request.files
    try{
        const existingProduct = await productModel.findOne({productName: userData.productName})
        if(existingProduct){
            return response.status(409).send({message: "Product Already exist"})
        }

        const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex")


        const s3UploadPromises = files.map(async (file) => {
            const imageName = randomImageName()
            const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: imageName,  
              Body: file.buffer,  
              ContentType: file.mimetype,
            } 
      
            const command = new PutObjectCommand(params) 
            const s3Upload = await s3.send(command) 
            
            return {
              filename: imageName,
              s3Response: s3Upload,
            } 
          }) 
      
        const uploadResults = await Promise.all(s3UploadPromises) 

        const newProduct = new productModel({
            productName : userData.productName,
            productType : userData.productType,
            productDescription: userData.productDescription,
            price : userData.price,
            images : uploadResults.map((file) => {
                        return file.filename
                    })
        })
        const addedProduct = await newProduct.save()

        const productObject = addedProduct.toObject() 

        if (addedProduct.images && addedProduct.images.length > 0) {
            const imageUrls = await Promise.all(addedProduct.images.map(async (image) => {
                const getObjectParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: image
                } 
                const command = new GetObjectCommand(getObjectParams) 
                
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 }) 
                return url 
            })) 

            productObject.imageUrls = imageUrls 
        }


        io.emit("productAdded", productObject)
        return response.status(201).send({message: "Product added successfully", addedProduct})
    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const deleteProduct = async(request, response, io) => {
    const { productId } = request.params
    try{

        const validProduct = await productModel.findOne({_id: productId})
        if(!validProduct){
            return response.status(404).json({message: "Product not found"})
        }
        

        if (validProduct.images && validProduct.images.length > 0) {
            for (const image of validProduct.images) {
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: image, 
                };
                const command = new DeleteObjectCommand(params);
                try {
                    await s3.send(command); 
                } 
                catch (s3Error) {
                    return response.status(500).send({message: s3Error})
                }
            }
        }

        const deletedProduct = await productModel.findByIdAndDelete(productId) 
        if (!deletedProduct) {
            return response.status(404).json({ message: 'Product not deleted' }) 
        }

        io.emit("productDeleted", deletedProduct)
        return response.status(200).json({ message: 'Product deleted successfully', deletedProduct }) 

    }
    catch(error){
        return response.status(500).json({message: error.message})
    }
}

const updateProduct = async (request, response, io) => {
    const { productId } = request.params;
    const productData = request.body;
    const files = request.files; 
  
    try {
      const validProduct = await productModel.findOne({ _id: productId });
  
      if (!validProduct) {
        return response.status(404).json({ message: "Product not found" });
      }
  
      const existingImages = Array.isArray(productData.existingImages)
        ? productData.existingImages
        : validProduct.images || []; 
  
      const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");
  
      let updatedImages = [...existingImages]; 
  
      if (files && files.length > 0) {
        const s3UploadPromises = files.map(async (file) => {
          const imageName = randomImageName();
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
  
          const command = new PutObjectCommand(params);
          const s3Upload = await s3.send(command);
  
          return {
            filename: imageName,
            s3Response: s3Upload,
          };
        });
  
        const uploadResults = await Promise.all(s3UploadPromises);
  
        updatedImages = [
          ...existingImages,
          ...uploadResults.map((file) => file.filename),
        ];
      }
  
      const updatedProduct = await productModel.findOneAndUpdate(
        { _id: validProduct._id },
        {
          ...productData,
          ...(files && files.length > 0 ? { images: updatedImages } : {}),
        },
        { new: true }
      );
  
      const productObject = updatedProduct.toObject();
  
      if (updatedProduct.images && updatedProduct.images.length > 0) {
        const imageUrls = await Promise.all(
          updatedProduct.images.map(async (image) => {
            const getObjectParams = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: image,
            };
            const command = new GetObjectCommand(getObjectParams);
  
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            return url;
          })
        );
  
        productObject.imageUrls = imageUrls;
      }
  
      io.emit("productUpdated", productObject);
      return response
        .status(200)
        .json({ message: "Product updated successfully", updatedProduct });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  };

const getAllProductsForUsers = async (request, response) => {
    try {
      const user = request.user; 
  
      const productsData = await productModel.find();
  
      const inventoryData = await inventoryModel.find().populate('warehouse');
  
      const productsWithImageUrls = await Promise.all(
        productsData.map(async (product) => {
          const productWithUrls = product.toObject();
          productWithUrls.imageUrls = [];
          productWithUrls.outOfStock = true; 
          productWithUrls.deliverable = true; 
  
          const productInInventory = inventoryData.some(
            (inventory) =>
                 inventory?.product?.equals(product._id) && inventory.stockLevel > 0
          );
  
          if (productInInventory) {
            productWithUrls.outOfStock = false;
          }
  
          if (user && user.city) {
            const deliverableInventory = inventoryData.some(
              (inventory) =>
                inventory.product.equals(product._id) &&
                inventory.warehouse.location.city.toLowerCase() === user.city.toLowerCase() &&
                inventory.stockLevel > 0
            );
  
            if (!deliverableInventory) {
              productWithUrls.deliverable = false;
            }
          }
  

          if (product.images && product.images.length > 0) {
            const imageUrls = await Promise.all(
              product.images.map(async (image) => {
                const getObjectParams = {
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: image,
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                return url;
              })
            );
  
            productWithUrls.imageUrls = imageUrls;
          }
  
          return productWithUrls;
        })
      );
  
      return response.status(200).send({
        status: "success",
        code: 200,
        data: productsWithImageUrls,
      });
    } catch (error) {
      return response
        .status(500)
        .json({ status: "error", code: 500, message: error.message });
    }
  };

const getProductByIdForUsers = async (request, response) => {
    const { productId } = request.params;
  
    try {
      const productData = await productModel.findOne({ _id: productId });
  
      if (!productData) {
        return response.status(404).json({
          status: "failure",
          code: 404,
          message: "Product not found",
        });
      }
  
      const productObject = productData.toObject();
      productObject.imageUrls = [];
      productObject.outOfStock = true; 
      productObject.deliverable = true; 
  
      const inventoryData = await inventoryModel.find({
        product: productId,
      }).populate('warehouse');
  
      const productInInventory = inventoryData.some(
        (inventory) => inventory.stockLevel > 0
      );
  
      if (productInInventory) {
        productObject.outOfStock = false;
      }
  
      const user = request.user; 

      if (user && user.city) {
        const deliverableInventory = inventoryData.some(
          (inventory) =>
            inventory.warehouse.location.city.toLowerCase() === user.city.toLowerCase() &&
            inventory.stockLevel > 0
        );
  
        if (!deliverableInventory) {
          productObject.deliverable = false;
        }
      }
  
      if (productData.images && productData.images.length > 0) {
        const imageUrls = await Promise.all(
          productData.images.map(async (image) => {
            const getObjectParams = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: image,
            };
            const command = new GetObjectCommand(getObjectParams);
  
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            return url;
          })
        );
  
        productObject.imageUrls = imageUrls;
      }
  
      return response
        .status(200)
        .json({ status: "success", code: 200, data: productObject });
    } catch (error) {
      return response
        .status(500)
        .json({ status: "failure", code: 500, message: error.message });
    }
  };
  

const addReview = async(request, response, io) => {
    const { rating, comment} = request.body;
    const user = request.user

    try {
        const product = await productModel.findById(request.params.productId);
    
        if (!product) {
          return response.status(404).json({ message: 'Product not found' });
        }
    
        const alreadyReviewed = product.reviews.find((review) => review.user.toString() === user._id.toString());
    
        if (alreadyReviewed) {
          return response.status(400).json({ message: 'Product already reviewed' });
        }
    
        const review = {
          user,
          rating,
          comment
        };
    
        product.reviews.push(review);
    
        product.numberOfReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.numberOfReviews;
    
        await product.save();
        
        response.status(201).json(product);
      } catch (error) {
        response.status(500).json({ message: 'Server error' });
      }
}


module.exports = {addProduct, getAllProducts, getProductById, getProductByWarehouse, deleteProduct, updateProduct, getAllProductsForUsers, getProductByIdForUsers, addReview}