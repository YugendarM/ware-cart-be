require("dotenv").config()

// const fetch = require("node-fetch")
// import fetch from "node-fetch"
// const fetch = require('node-fetch') 


const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env 
const base = "https://api-m.sandbox.paypal.com" 

const DOLLAR_VALUE =  83

const generateAccessToken = async () => {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS") 
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64") 
    const fetch = (await import('node-fetch')).default
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }) 

    const data = await response.json() 
    return data.access_token 
  } catch (error) {
    console.error("Failed to generate Access Token:", error) 
  }
} 

function convertToDollar(cartAmount) {
  const value = (cartAmount / DOLLAR_VALUE)*100

  const roundedValue = Math.round(value * 100) / 100

  return (roundedValue/100).toFixed(2)
}


const createOrder = async (cartAmount) => {

  const accessToken = await generateAccessToken() 
  const url = `${base}/v2/checkout/orders`
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: convertToDollar(cartAmount),
        },
      },
    ],
  } 


  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  }) 

  return handleResponse(response) 
} 



const captureOrder = async (orderID) => {

  const accessToken = await generateAccessToken() 
  const url = `${base}/v2/checkout/orders/${orderID}/capture` 

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  }) 

  return handleResponse(response) 
} 




async function handleResponse(response) {
  try {
    const jsonResponse = await response.json() 
    return {
      jsonResponse,
      httpStatusCode: response.status,
    } 
  } catch (err) {
    const errorMessage = await response.text() 
    throw new Error(errorMessage) 
  }
}

module.exports = {handleResponse, captureOrder, createOrder, generateAccessToken}