const express = require("express")
const { getAllProducts, getProductById, addProduct, getProductByWarehouse, deleteProduct, updateProduct } = require("../controllers/productController")

const route = express.Router()

const attachSocketIO = (io) => {
    route.get("/", getAllProducts)
    route.get("/:productId", getProductById)
    route.get("/warehouse/:warehouseId", getProductByWarehouse)

    route.post("/add", (request, response) => addProduct(request, response, io))

    route.delete("/delete/:productId", (request, response) => deleteProduct(request, response, io))

    route.put("/update/:productId", (request, response) => updateProduct(request, response, io))

    return route
}

module.exports = attachSocketIO
