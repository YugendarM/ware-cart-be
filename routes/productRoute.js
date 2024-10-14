const express = require("express")
const { getAllProducts, getProductById, addProduct, getProductByWarehouse, deleteProduct, updateProduct, getAllProductsForUsers, getProductByIdForUsers, addReview } = require("../controllers/productController")
const {adminAuth} = require("../middlewares/adminAuth")
const {authenticate} = require("../middlewares/authenticate")
const multer = require("multer")


const route = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const attachSocketIO = (io) => {
    route.get("/", adminAuth, getAllProducts)
    route.get("/users", getAllProductsForUsers)
    route.get("/users/:productId", getProductByIdForUsers)
    route.get("/:productId", adminAuth, getProductById)
    route.get("/warehouse/:warehouseId", adminAuth, getProductByWarehouse)

    route.post("/add", adminAuth, upload.array('images', 12), (request, response) => addProduct(request, response, io))
    route.post("/review/:productId", authenticate, (request, response) => addReview(request, response, io))

    route.delete("/delete/:productId", adminAuth, (request, response) => deleteProduct(request, response, io))

    route.put("/update/:productId", adminAuth, upload.array('images', 12), (request, response) => updateProduct(request, response, io))

    return route
}

module.exports = attachSocketIO
