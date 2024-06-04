const joi = require('@hapi/joi');

const validateUser = (data) => {
    try {
        const validateSchema = joi.object({
            firstName: joi.string().min(3).max(30).trim().required().messages({
                'string.empty': "First name field can't be left empty",
                'string.min': "Minimum of 3 characters for the first name field",
                'any.required': "Please first name is required"
            }),

            lastName: joi.string().min(3).max(30).trim().required().messages({
                'string.empty': "Last name field can't be left empty",
                'string.min': "Minimum of 3 characters for the last name field",
                'any.required': "Please last name is required"
            }),

            phoneNumber: joi.string().trim().regex(/^\+234\d{10}$/).required().messages({
                'string.empty': "Phone number field can't be left empty",
                'string.pattern.base': "Phone number must be in the format +2347034386460",
                'any.required': "Please provide a phone number"
            }),

            email: joi.string().max(40).trim().email({ tlds: { allow: false } }).required().messages({
                'string.empty': "Email field can't be left empty",
                'any.required': "Please Email is required"
            }),
            password: joi.string()
                .pattern(new RegExp("^(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$"))
                .required()
                .messages({
                    "any.required": "Password is required.",
                    "string.pattern.base":
                        "Password must contain at least 8 characters, one capital letter, and one special character (!@#$%^&*).",
                }),
            notificationPreference: joi.string().min(3).max(30).valid("email", "phone").trim().required().messages({
                'string.empty': "notification preference field can't be left empty",
                'string.min': "Minimum of 3 characters for the notification preference field",
                'any.required': "Please notification preference is required"
            }),
        });
        return validateSchema.validate(data);
    } catch (err) {
        return res.status(500).json({
            Error: "Error while validating user: " + err.message,
        })
    }
}


const validateUserLogin = (data) => {
    try {
        const validateSchema = joi.object({
            email: joi.string().max(40).trim().email({ tlds: { allow: false } }).required().messages({
                'string.empty': "Email field can't be left empty",
                'any.required': "Please Email is required"
            }),
            password: joi.string()
                .pattern(new RegExp("^(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$"))
                .required()
                .messages({
                    "any.required": "Password is required.",
                    "string.pattern.base":
                        "Password must contain at least 8 characters, one capital letter, and one special character (!@#$%^&*).",
                }),
        });

        return validateSchema.validate(data);
    } catch (err) {
        return res.status(500).json({
            Error: "Error while validating user: " + err.message,
        })
    }
}



module.exports = {
    validateUser,
    validateUserLogin,

}