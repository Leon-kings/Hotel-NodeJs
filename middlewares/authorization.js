const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const Authorization = async (req, res, next) => {
    let token;
    try{
        if( req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
            token = req.headers.authorization.split(' ')[1];
        } else {
            token = req.headers.authorization;
        }
        if(!token){
            return res.status(401).json({ message: 'you are not logged in. please login to continue'})
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if(!user){
            return res.status(401).json({ 
                status: "failed",
                message: "Token has expired. login again"
            })
        }
        req.user = user;
        next();
    }catch(err){
        return res.status(400).json({
            status: "failed",
            message: err.message
        });
    }
}

module.exports = Authorization