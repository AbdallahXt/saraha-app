import Joi from 'joi';

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

const googleSchema = Joi.object({
  token: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  otp: Joi.string().length(6).required()
});

const verifyAccountSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required()
});

function validate(schema) {
  return (req, res, next) => {
    console.log('🔍 Validation - Request received');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Raw request body:', req.body);
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Validation schema:', schema.describe());
    
    if (!req.body) {
      console.log('❌ Request body is empty');
      return res.status(400).json({ success: false, message: 'Request body is required' });
    }
    
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      console.log('❌ Validation errors:', error.details);
      const messages = error.details.map(detail => ({
        message: detail.message.replace(/"/g, ''),
        path: detail.path
      }));
      console.log('❌ Formatted error messages:', messages);
      return res.status(400).json({ 
        success: false, 
        message: messages[0].message,
        errors: messages
      });
    }
    
    console.log('✅ Validation successful');
    req.validatedData = value;
    next();
  };
}

export const register = validate(registerSchema);
export const login = validate(loginSchema);
export const google = validate(googleSchema);
export const forgotPassword = validate(forgotPasswordSchema);
export const resetPassword = validate(resetPasswordSchema);
export const changePassword = validate(changePasswordSchema);
export const verifyAccount = validate(verifyAccountSchema);
export const resendOtp = validate(resendOtpSchema);
