const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")

const authenticateOptional = async (req, res, next) => {
  try {
    console.log("authenticateOptional");
    const authHeader = req.headers['cookie'];
    
    // If the cookie header exists
    if (authHeader) {
      const token = authHeader.split('=')[1];
      
      // Promisify jwt.verify to use async/await pattern
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_TOKEN, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      const id = decoded.id;
      const validUser = await userModel.findOne({ _id: id });

      console.log("validUser:");
      console.log(validUser);

      if (validUser) {
        console.log("Authenticated user found");
        const { password, ...userData } = validUser._doc;
        req.params.userId = userData._id; // Set userId to params
      }
    }
  } catch (error) {
    console.log("Optional authentication error: ", error.message);
  }

  next(); // Call next only after the authentication is processed
};
  
  module.exports = { authenticateOptional };
  