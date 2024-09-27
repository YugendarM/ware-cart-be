const express = require("express")
const { getAllProducts, getProductById, addProduct, getProductByWarehouse, deleteProduct, updateProduct } = require("../controllers/productController")

const route = express.Router()

route.get("/", getAllProducts)
route.get("/:productId", getProductById)
route.get("/warehouse/:warehouseId", getProductByWarehouse)

route.post("/add", addProduct)

route.delete("/delete/:productId", deleteProduct)

route.put("/update/:productId", updateProduct)

module.exports = route
