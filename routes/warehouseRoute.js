const express = require("express")
const { getAllWarehouse, addWarehouse, getWarehouseById, deleteWarehouse, updateWarehouse } = require("../controllers/warehouseController")

const route = express.Router()



const attachSocketIO = (io) => {
    route.post('/add', (request, response) => addWarehouse(request, response, io));

    route.get("/", getAllWarehouse)
    route.get("/:warehouseId", getWarehouseById)

    route.delete("/delete/:warehouseId", (request, response) => deleteWarehouse(request, response, io))

    route.put("/update/:warehouseId", (request, response) => updateWarehouse(request, response, io))

    return route
};


module.exports = attachSocketIO