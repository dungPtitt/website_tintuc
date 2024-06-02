import { NextFunction, Request, Response } from "express"
import bcrypt from "bcryptjs"
import { AppDataSource } from "@/database/data-source"
import { User } from "@/database/entities/User"
import { AuthenticatedRequest } from "@/interface/common"
import { ValidationError, validateOrReject } from "class-validator"
import { CreateUserDto, RegisterDTO } from "../dtos/UserDTO"
import { tr } from "@faker-js/faker"
import { ResponseUtil } from "@/utils/Response"
import { Paginator } from "@/database/Paginator"

export class UserController {
  // Phương thức tạo người dùng mới
  static async create(req: Request, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User)
      const userData = req.body
      // Tạo một thể hiện của DTO CreateUserDto từ dữ liệu nhận được từ req.body
      const createUserDto = new CreateUserDto()
      createUserDto.username = userData.username
      createUserDto.email = userData.email
      createUserDto.password = userData.password

      // Validate DTO
      await validateOrReject(createUserDto)
      // Kiểm tra xem người dùng đã tồn tại chưa
      const existingUser = await userRepository.findOne({ where: { email: createUserDto.email } })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Tạo một đối tượng User mới
      const newUser = userRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: createUserDto.password,
      })

      // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
      const salt = await bcrypt.genSalt(10)
      newUser.password = await bcrypt.hash(createUserDto.password, salt)

      // Lưu người dùng mới vào cơ sở dữ liệu
      await userRepository.save(newUser)

      res.status(201).json({ message: "User created successfully" })
    } catch (error: any) {
      console.error(error.message)
      res.status(500).json({ message: "Server Error" })
    }
  }

  static async getAllUser(req: AuthenticatedRequest, res: Response) {
    try {
      const getUsers = await AppDataSource.getRepository(User)
      const queryBuilder = getUsers.createQueryBuilder('users');

      const { records, paginationInfo } = await Paginator.paginate(queryBuilder, req);

      ResponseUtil.sendResponse(res, "Fetched blog successfully",records, paginationInfo)
    } catch (error: any) {
      console.error(error.message)
      res.status(500).json({ message: "Server Error" })
    }
  }

  // Phương thức lấy thông tin người dùng
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params // Lấy ID của người dùng từ thông tin được đính kèm trong request
      const userRepository = AppDataSource.getRepository(User)
      const user = await userRepository.findOne({ where: { id: id } })

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      res.json(user)
    } catch (error: any) {
      console.error(error.message)
      res.status(500).json({ message: "Server Error" })
    }
  }
  // Phương thức cập nhật thông tin người dùng
  static async update(req: Request, res: Response) {
    const userRepository = AppDataSource.getRepository(User)
    const userData = req.body

    await validateOrReject(userData)

    const { id } = req.params
    const user = await userRepository.findOne({ where: { id: Number(id) } })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    userRepository.merge(user, userData)
    await userRepository.save(user)

    res.status(200).json({ message: "User updated successfully", data: user })
  }
  // Phương thức xóa người dùng
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params // Lấy ID của người dùng từ thông tin được đính kèm trong request
      const userRepository = AppDataSource.getRepository(User)
      const user = await userRepository.findOne({ where: { id: Number(id) } })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }
      await userRepository.remove(user)
      res.status(200).json({ message: "User deleted successfully", data: user })
    } catch (error: any) {
      console.error(error.message)
      res.status(500).json({ message: "Server Error" })
    }
  }
}
