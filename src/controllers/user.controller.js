//import { emit } from "nodemon";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccandRefTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refToken = user.generateRefreshToken()

        user.refToken = refToken 
        await user.save({validateBeforeSave: false})

        return {accessToken, refToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating Access and Refresh Tokens")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend
    const {fullName, email,username,password} = req.body
    console.log(email)

    // if(fullName === ""){
    //     throw new ApiError(400, "fullName is required")
    //  }

    
    if(
        [fullName, email,username,password].some((field) => 
            field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    
    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existingUser){
        throw new ApiError(409, "User already Exists")
    }

    const avatarlocalPath = req.files?.avatar[0]?.path;
    const coverImgLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarlocalPath){
        throw new ApiError(400, "avatar required")
    }

    const avatar = await uploadOnCloudinary(avatarlocalPath)
    const coverImage = await uploadOnCloudinary(coverImgLocalPath)

    if(!avatar){
        throw new ApiError(400, "avatar required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered Succesfully")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    //req body --> data 

    const {email, username, password } = req.body

    if(!username || !email){
        throw new ApiError(400, "Username and Email Required!!")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")   //if user not registered
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Inavlid User Credentials")   
    }

    const {accessToken, refToken} = await generateAccandRefTokens(user._id)

    //send cookies -->

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {     //sending cookies
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refToken". refToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refToken

            },
            "User Logged in Sucessfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=> {

    await User.findByIdAndUpdate(
        req.user._id,
        {
           $set: {
            refreshToken: undefined
           }
        },
        {
            new: true
        }
    )
    const options = {     //sending cookies
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User Logged Out"))
})

export {registerUser, loginUser, logoutUser}