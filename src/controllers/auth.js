import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import jwt from "jsonwebtoken";
import User from "../models/user";

const signupSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "any.required": "Trường Name là bắt buộc",
    "string.empty": "Trường Name không được để trống",
    "string.min": "Trường Name phải có ít nhất {#limit} ký tự",
    "string.max": "Trường Name không được vượt quá {#limit} ký tự",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Trường Email là bắt buộc",
    "string.empty": "Trường Email không được để trống",
    "string.email": "Trường Email phải là email hợp lệ",
  }),
  password: Joi.string().min(6).max(30).required().messages({
    "any.required": "Trường Password là bắt buộc",
    "string.empty": "Trường Password không được để trống",
    "string.min": "Trường Password phải có ít nhất {#limit} ký tự",
    "string.max": "Trường Password không được vượt quá {#limit} ký tự",
  }),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.required": "Trường Confirm Password là bắt buộc",
    "any.only": "Trường Confirm Password và Password phải giống nhau",
  }),
  role: Joi.string().valid("admin", "member").messages({
    "any.only": "Trường Role không hợp lệ",
  }),
});

export const signup = async (req, res) => {
  const { email, password, name, confirmPassword } = req.body;
  const { error } = signupSchema.validate(req.body, { abortEarly: false });
  console.log(error);
  if (error) {
    const messages = error.details.map((item) => item.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      messages,
    });
  }

  const existUser = await User.findOne({ email });
  if (existUser) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      messages: ["Email đã tồn tại"],
    });
  }

  const hashedPassword = await bcryptjs.hash(password, 12);
  const role = (await User.countDocuments({})) === 0 ? "admin" : "member";

  const user = await User.create({
    ...req.body,
    password: hashedPassword,
    role,
  });

  return res.status(StatusCodes.CREATED).json({
    user,
  });
};
export const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      messages: ["Email không tồn tại"],
    });
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      messages: ["Mật khẩku không chính xác"],
    });
  }
  const token = jwt.sign({ userId: user._id }, "123456", {
    expiresIn: "7d",
  });
  return res.status(StatusCodes.OK).json({
    user,
    token,
  });
};
// Hãy viết chot ôi hàm logout ở đây
export const logout = async (req, res) => {
  return res.status(StatusCodes.OK).json({
    messages: ["Đăng xuất thành công"],
  });
};
