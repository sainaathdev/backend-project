import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import pkg from 'jsonwebtoken';
const { Jwt } = pkg;



 export const verifyJWT = asyncHandler(async(req,_, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "Unauthorized Request")
        }
    
        const decodedTokenInfo = Jwt.verifyJWT(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Acess Token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Acess Token")
    }
 })