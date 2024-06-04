const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateUser, validateUserLogin, } = require('../helpers/validator');
const { sendEmail } = require('../email');
const { generateDynamicEmail } = require('../emailHTML');
const { resetFunc } = require('../forgotPassword');
const resetHTML = require('../resetHTML');
require('dotenv').config();
const cloudinary = require('../middleware/cloudinary')
const fs = require("fs");
const path = require("path");


//function to capitalize the first letter
const capitalizeFirstLetter = (str) => {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
};



//Function to register a new user
exports.signUp = async (req, res) => {
    try {
        const { error } = validateUser(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            })
        } else {
            const { firstName, lastName, phoneNumber, email, password , notificationPreference} = req.body;

            
            const emailExists = await userModel.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(200).json({
                    message: 'Email already exists',
                })
            }

      // Check if phone number already exists
      const phoneExists = await userModel.findOne({ phoneNumber });
      if (phoneExists) {
          return res.status(400).json({
              message: 'Phone number already exists',
          });
      }
    
            const salt = bcrypt.genSaltSync(12)
            const hashpassword = bcrypt.hashSync(password, salt);
            
            const user = await new userModel({
                firstName: capitalizeFirstLetter(firstName).trim(),
                lastName: capitalizeFirstLetter(lastName).trim(),
                phoneNumber: phoneNumber,
                email: email.toLowerCase(),
                password: hashpassword,
                notificationPreference: notificationPreference
            });
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                })
            }

            const fullName = firstName + " " + lastName

            const token = jwt.sign({
                firstName,
                lastName,
                email,
            }, process.env.secret, { expiresIn: "240s" });
            user.token = token;
            const subject = 'Email Verification'

            const link = `${req.protocol}://${req.get('host')}/api/v1/verify/${user.id}`
            const html = generateDynamicEmail(fullName, link)
            sendEmail({
                email: user.email,
                html,
                subject
            })


            await user.save()
            return res.status(200).json({
                message: 'User profile created successfully',
                data: {
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    token: user.token,
                    notificationPreference: user.notificationPreference
                },
            })

        }
     } catch (error) {
                return res.status(500).json({
                    message: "Internal Server Error: " + error.message,
                });
            }
        }


//Function to verify a new user with a link
exports.verify = async (req, res) => {
    try {
        const userId = req.params.userId;
        const token = req.params.token;
        const user = await userModel.findById(userId);
        if(!user){
            return res.status(404).json({
                message: "user not found",
            })
        }
    
        // Verify the token
      jwt.verify(user.token, process.env.secret);
      // Update the user if verification is successful
      const updatedUser = await userModel.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
  
      if (updatedUser.isVerified === true) {
        res.status(200).send(`
        <div style="text-align: center; padding: 50px; background-color: #f0f8f0;">
            <h3 style="color: #008000;">You have been successfully verified.</h3>
            <p style="color: #008000;">Kindly visit the login page.</p>
            <p style="color: #008000;">You will be redirected in 5 seconds.</p>
            <script>
                setTimeout(() => { window.location.href = 'https://user-track360.vercel.app/#/loginasBusiness'; }, 5000);
            </script>
        </div>
    `);
};
} catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Handle token expiration
      const userId = req.params.userId;
      const updatedUser = await userModel.findById(userId);
      if(!updatedUser){
          return res.status(404).json({
              message: "user not found",
          })
      }

      const newtoken = jwt.sign({ 
          email: updatedUser.email,
          firstName: updatedUser.firstName, 
          lastName: updatedUser.lastName,
         }, process.env.secret, {expiresIn: "240s"});
      updatedUser.token = newtoken;
      updatedUser.save();

      const link = `${req.protocol}://${req.get('host')}/api/v1/verify/${userId}`;
      sendEmail({
        email: updatedUser.businessEmail,
        html: generateDynamicEmail(updatedUser.firstName, link),
        subject: "RE-VERIFY YOUR ACCOUNT"
      });
      return res.status(401).send("<h1>This link is expired. Kindly check your email for another email to verify.</h1>");
    } else {
      return res.status(500).json({
        message: "Internal Server Error: " + error.message,
      });
    }
  }

};





//Function to login a verified user
exports.logIn = async (req, res) => {
    try {
        const { error } = validateUserLogin(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            }) 
        } else {
            const { email, password } = req.body;
            const checkEmail = await userModel.findOne({ email: email.toLowerCase() });
            if (!checkEmail) {
                return res.status(404).json({
                    message: 'User not registered'
                });
            }
            const checkPassword = bcrypt.compareSync(password, checkEmail.password);
            if (!checkPassword) {
                return res.status(404).json({
                    message: "Password is incorrect"
                })
            }
            const token = jwt.sign({
                userId: checkEmail._id,
                email: checkEmail.email,
            }, process.env.secret, { expiresIn: "1h" });

            if (checkEmail.isVerified === true) {
                res.status(200).json({
                    message: "Welcome " + checkEmail.firstName + " " + checkEmail.lastName,
                    token: token
                })
                checkEmail.token = token;
                await checkEmail.save();
            } else {
                res.status(400).json({
                    message: "Sorry user not verified yet."
                })
            }
        }

     } catch (error) {
                return res.status(500).json({
                    message: "Internal Server Error: " + error.message,
                });
            }
        }

//Function for the user incase password is forgotten
exports.forgotPassword = async (req, res) => { 
    try {
        const checkUser = await userModel.findOne({ email: req.body.email });
        if (!checkUser) {
            return res.status(404).json({
                message: 'Email does not exist'
            });
        }
        else {
            const subject = 'Kindly reset your password'
            const link = `${req.protocol}://${req.get('host')}/api/v1/reset/${checkUser.id}`
            const html = resetFunc(checkUser.firstName, link)
            sendEmail({
                email: checkUser.email,
                html,
                subject
            })
            return res.status(200).json({
                message: "Kindly check your email to reset your password",
            })
        }
     } catch (error) {
                return res.status(500).json({
                    message: "Internal Server Error: " + error.message,
                });
            }
        }


//Funtion to send the reset Password page to the server
exports.resetPasswordPage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const resetPage = resetHTML(userId);

        // Send the HTML page as a response to the user
        res.send(resetPage);
     } catch (error) {
                return res.status(500).json({
                    message: "Internal Server Error: " + error.message,
                });
            }
        }



//Function to reset the user password
exports.resetPassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const password = req.body.password;

        if (!password) {
            return res.status(400).json({
                message: "Password cannot be empty",
            });
        }

        
   // Initialize passwordHistory if it doesn't exist
   if (!Array.isArray(user.passwordHistory)) {
    user.passwordHistory = [];
}


        const salt = bcrypt.genSaltSync(12);
        const hashPassword = bcrypt.hashSync(password, salt);

            // Check if the new hashed password is in the password history
            const isPreviousPassword = user.passwordHistory.includes(hashPassword);
            if (isPreviousPassword) {

                return res.status(400).json({
                    message: "You can't use your previous passwords",
                });
            }

            // Add the new hashed password to the password history
            user.passwordHistory.push(hashPassword);
            await user.save();

            // Update user's password and save changes
            user.password = hashPassword;

        const reset = await userModel.findByIdAndUpdate(userId, { password: hashPassword }, { new: true });
        return res.status(200).json({
            message: "Password reset successfully",
        });
     } catch (error) {
                return res.status(500).json({
                    message: "Internal Server Error: " + error.message,
                });
            }
        }




//sign out function
exports.signOut = async (req, res) => {
    try {
        //get the user's id from the request user payload
        const { userId } = req.user

        const hasAuthorization = req.headers.authorization
        if (!hasAuthorization) {
            return res.status(401).json({
                message: 'Invalid authorization',
            })
        }

        const token = hasAuthorization.split(' ')[1]
        const user = await studentModel.findById(userId)

        //check if theuser is not exisiting
        if (!hasAuthorization) {
            return res.status(401).json({
                message: "User not found",
            })
        }

        //Blacklist the token
        user.blacklist.push(token)
        await user.save()

        //return a respponse
        res.status(200).json({
            message: "User logged out successfully"
        })


    } catch (error) {
        res.status(404).json({
            message: error.message
        })
    }
}



//function to update a  user
exports.updateUserProfile = async (req , res ) => {
    try {
        const userId = req.params.userId
        const user = await userModel.findById(userId)
        if (!user ) {
            return res.status(404).json({
                message: "user not found in our database"
            });
        }

        const data = {
            firstName: capitalizeFirstLetter(req.body.firstName) || user.firstName,
            lastName: capitalizeFirstLetter(req.body.lastName) || user.lastName,
            phoneNumber: req.body.phoneNumber || user.phoneNumber, 
        };
        

        const updatedUser =  await userModel.findByIdAndUpdate(userId, data, {new: true});
        if (!updatedUser) {
            return res.status(400).json({
                message: "Unable to update user data"
            });
        }
        
        //  // Capitalize the data before sending in the response
        //  updatedUser.firstName = capitalizeFirstLetter(updatedUser.firstName);
        //  updatedUser.lastName = capitalizeFirstLetter(updatedUser.lastName);

         
         // Save the updated user data
         await updatedUser.save();

        return res.status(200).json({
            message: "user data updated successfully",
            data: {
                userId: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phoneNumber: updatedUser.phoneNumber,

            }
        });
    
        
    }catch (error) {
        return res.status(500).json({ 
         message: 'Internal Server Error: ' + error.message });
    }
    
  };

  

