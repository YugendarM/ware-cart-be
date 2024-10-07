require("dotenv").config()
const express = require("express")
const path = require("path")
const app = express.Router()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const {handleResponse, captureOrder, createOrder, generateAccessToken } = require("../services/paypal")

const DOLLAR_VALUE =  83

function convertToDollar(cartAmount) {
  const value = (cartAmount / DOLLAR_VALUE)*100

  const roundedValue = Math.round(value * 100) / 100

  return roundedValue.toFixed(0)  
}

const formatRupees = (amount) => {
  return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0, 
  }).format(amount)  
}  

app.post("/api/orders", async (req, res) => {
    try {
      const { cart } = req.body  
      const { jsonResponse, httpStatusCode } = await createOrder(cart)  
      res.status(httpStatusCode).json(jsonResponse)  
    } catch (error) {
      console.error("Failed to create order:", error)  
      res.status(500).json({ error: "Failed to create order." })  
    }
  })  
  
  app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
      const { orderID } = req.params  
      const { jsonResponse, httpStatusCode } = await captureOrder(orderID)  
      res.status(httpStatusCode).json(jsonResponse)  
    } catch (error) {
      console.error("Failed to create order:", error)  
      res.status(500).json({ error: "Failed to capture order." })  
    }
  })  
  
  // serve index.html
  app.get("/", (req, res) => {
    res.sendFile(path.resolve("./client/checkout.html"))  
  })  


  app.post('/stripe/create-checkout-session', async (req, res) => {

    const {cartAmount} = req.body
    try{
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Total Payable',
                description: `Total Payable : ${formatRupees(cartAmount)} => $${convertToDollar(cartAmount)/100}`
              },
              unit_amount: convertToDollar(cartAmount),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:5173/orders',
        cancel_url: 'http://localhost:5173/cart',
      })  
      res.send({url: session.url})
    }
    catch(error){
      return res.send("error")
    }
  
    // res.redirect(303, session.url)  
  })  

module.exports = app