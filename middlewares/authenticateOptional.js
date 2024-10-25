const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");  // Use a cookie parser if not using cookie-parser middleware

const authenticateOptional = async (req, res, next) => {
  
  try {
    const authHeader = req.headers['cookie'];

    if (authHeader) {
      // Use the cookie parser to handle multiple cookies properly
      const cookies = cookie.parse(authHeader);
      const token = cookies.SessionID;  // Assuming 'SessionID' is the name of the token cookie

      if (token) {
        const decoded = await jwt.verify(token, process.env.JWT_TOKEN);
        
        const id = decoded.id;
        const validUser = await userModel.findOne({ _id: id });
        
        if (validUser) {
          const { password, ...userData } = validUser._doc;
          req.user = userData;  // Attach the user to the request object
        }
      }
    }
  } catch (error) {
    console.log("Optional authentication error: ", error.message);
  }

  next();  // Continue to the next middleware or route handler
};

module.exports = { authenticateOptional };
