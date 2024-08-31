import { User } from "../models/user.model.js";
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {sendVerificationEmail,sendWelcomeEmail,sendPasswordResetEmail,sendResetSuccessEmail} from "../mailtrap/emails.js"
export const signup = async (req, res) => {
  // res.send("signup route");
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }
    const userAleradyExists = await User.findOne({ email });
    if (userAleradyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    //for hashing the password so that the password is secure
    const hashedPassword = await bcryptjs.hash(password,10);
    //after that create a user
    const verificationToken=Math.floor(100000 + Math.random()*900000).toString();
    const user=new User({
      email,
      password:hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt:Date.now()+24*60*60*1000 //24hours
    });
    // save in database
    await user.save();
    // create a jwt token for verification
    generateTokenAndSetCookie(res,user._id);

    await sendVerificationEmail(user.email,verificationToken);
    
// send the response like some thing is creates
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
            ...user._doc,
            password: undefined,
      },
});
  } catch (error) {
      res.status(400).json({success:false,message:error.message});
  }
};
export const verifyEmail=async(req,res)=>{
const {code}=req.body; // to  get the code or otp (1 2 3 7 5 6)
try{
  const user =await User.findOne({
    verificationToken:code,
    verificationTokenExpiresAt:{$gt:Date.now()}
  })
  if(!user){
    return res.status(400).json({success:false,message:"Invalid or expired verification code"})
  }
  user.isVerified=true; // after verification 
  // make verification token undefined
  user.verificationToken=undefined;
  user.verificationTokenExpiresAt=undefined;
  // after that save the user in database
  await user.save();
  //after that send a welcome email
  await sendWelcomeEmail(user.email,user.name);
  res.status(200).json({
    success:true,
    message:"Email verified successfully",
    user:{
      ...user._doc,
      password:undefined
    },
  });
}catch(error){
console.log(`Not verified email`,error)
}
}
export const login = async (req, res) => {
  // res.send("login route");
  const {email,password}=req.body;// fetch the email and pasword fromt he body
  try{
    const user=await User.findOne({email});
    if(!user){ // if user not exist 
      return res.status(400).json({success:false,message:"Invalid credentials"});
    }
    // comapare the password and bcrypt
    const isPasswordValid=await bcryptjs.compare(password,user.password);
    if(!isPasswordValid){ // if password is not valid 
      return res.status(400).json({success:false,message:"Invalid credentials"});
    }
    // else set the cookie
    generateTokenAndSetCookie(res,user._id);
    //update the login date
    user.lastlogin=new Date();
    await user.save();
    // send response
    res.status(200).json({
      success:true,
      message:'Logged in successfully',
      user:{
        ...user._doc,
        password:undefined,
      },
    });
  }catch(error){
 console.log("error in login",error);
 res.status(400).json({success:false,message:error.message});
  }
};
export const logout = async (req, res) => {
  // res.send("logout route");
  res.clearCookie("token");
  res.status(200).json({success:true,message:"Logged out successfully"});
};

export const forgotPassword=async(req,res)=>{
const {email}=req.body;
try{
const user=await User.findOne({email});
// if user not exists
if(!user){
  return res.status(400).json({success:false,message:"User not found"});
}
//Generate reset token
const resetToken=crypto.randomBytes(20).toString("hex");
const resetTokenExpiresAt=Date.now()+1*60*60*1000;//1 hour

user.resetPasswordToken=resetToken;
user.resetPasswordExpiresAt=resetTokenExpiresAt;
await user.save();
// send email
await sendPasswordResetEmail(user.email,`${process.env.CLIENT_URL}/reset-password/${resetToken}`);
res.status(200).json({success:true,message:"Password reset link sent to your email"});
}catch(error){
console.log("Error in frogotPassword",error);
res.status(400).json({success:false,message:error.message});
}
}

export const resetPassword=async(req,res)=>{
  try{
    const {token}=req.params;
   
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		// update password
		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

  
export const checkAuth=async(req,res)=>{
  try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}
