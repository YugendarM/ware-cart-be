const express = require("express")
const { getAllProducts, getProductById, addProduct, getProductByWarehouse, deleteProduct, updateProduct, getAllProductsForUsers, getProductByIdForUsers } = require("../controllers/productController")
const {adminAuth} = require("../middlewares/adminAuth")

const route = express.Router()

const attachSocketIO = (io) => {
    route.get("/", adminAuth, getAllProducts)
    route.get("/users", getAllProductsForUsers)
    route.get("/users/:productId", getProductByIdForUsers)
    route.get("/:productId", adminAuth, getProductById)
    route.get("/warehouse/:warehouseId", adminAuth, getProductByWarehouse)

    route.post("/add", adminAuth, (request, response) => addProduct(request, response, io))

    route.delete("/delete/:productId", adminAuth, (request, response) => deleteProduct(request, response, io))

    route.put("/update/:productId", adminAuth, (request, response) => updateProduct(request, response, io))

    return route
}

module.exports = attachSocketIO
