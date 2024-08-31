import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";

import { mailtrapClient, sender } from "./mailtrap.config.js";
export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email verification",
    });
    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification`, error);
    throw new Error(`Error sending verification email: ${error}`);
  }
};

//for sending welcome email
export const sendWelcomeEmail=async(email,name)=>{
  const recipient=[{email}];
  try{
const response=await mailtrapClient.send({
  from:sender,
  to:recipient,
  template_uuid:"535bede9-e9f0-4421-8719-87192f1bf2d1",
  template_variables:{
      company_info_name: "Auth-app",
      name: name,
  }
  
});
console.log("Welcome emailsent successfully",response);
  }catch(error){
console.log(`Error in verification of email`,error);
  }
}

export const sendPasswordResetEmail=async(email,resetURL)=>{
  const recipient=[{email}];

  try{
const response=await mailtrapClient.send({
  from:sender,
  to:recipient,
  subject:"Reset your password",
  html:PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}",resetURL),
  category:"Password Reset",
})
  }catch(error){
    console.error(`Error sending password reset email`,error);
    throw new Error(`Error sending password reset email:${error}`);

  }
}

export const sendResetSuccessEmail=async(email)=>{
  const recipient=[{email}];
  try{
const response=await mailtrapClient.send({
  from:sender,
  to:recipient,
  subject:"Password Reset Successfully",
  html:PASSWORD_RESET_SUCCESS_TEMPLATE,
  category:'Password Reset',
});
console.log("Password reset email sent successfully",response);
  }catch(error){
console.error("Error sending password reset success email",error);
throw new Error(`Error sending password reset success email: ${error}`);
  }
}