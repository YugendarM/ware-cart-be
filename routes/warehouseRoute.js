const express = require("express")
const { getAllWarehouse, addWarehouse, getWarehouseById, deleteWarehouse, updateWarehouse } = require("../controllers/warehouseController")
const {adminAuth} = require("../middlewares/adminAuth")

const route = express.Router()



const attachSocketIO = (io) => {
    route.post('/add', (request, response) => addWarehouse(request, response, io));

    route.get("/", adminAuth, getAllWarehouse)
    route.get("/:warehouseId", adminAuth, getWarehouseById)

    route.delete("/delete/:warehouseId", adminAuth, (request, response) => deleteWarehouse(request, response, io))

    route.put("/update/:warehouseId", adminAuth, (request, response) => updateWarehouse(request, response, io))

    return route
};


module.exports = attachSocketIO