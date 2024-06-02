import { Request, Response } from "express"
import { AppDataSource } from "@/database/data-source"
import { Comment } from "@/database/entities/Comment"
import { ValidationError, validateOrReject } from "class-validator"
import { CreateCommentDto } from "../dtos/CommentDTO"
import { User } from "@/database/entities/User"
import { ResponseUtil } from "@/utils/Response"
import { CommentService } from "../services/CommentService"
import io from "@/index"
import { BlogPost } from "@/database/entities/BlogPost"

export class CommentController {
  static async create(req: Request, res: Response) {
    // @ts-ignore
    const user = req.user
    const cmtData = req.body
    const parentCommentId = Number(req.query.parent)
    const repo = AppDataSource.getRepository(Comment)
    if (parentCommentId) {
      const check = await repo.findOne({ where: { id: parentCommentId } })
      if (!check) return res.status(404).json({ message: "Parent comment not found" })
    }

    const dto = new CreateCommentDto()
    Object.assign(dto, cmtData)
    await validateOrReject(dto)
    const cmt = {
      ...cmtData,
      userId: user.id,
      parent: parentCommentId
    }
    
    await repo.query(`insert into comments (content, blogPostId, userId${parentCommentId ? ',parentComment' : ''}) values ('${cmt.content}',${cmt.blogPostId},${cmt.userId}${parentCommentId ? ',' + parentCommentId : ''})`);

    const newComment = await repo.createQueryBuilder("comment")
        .orderBy("comment.id", "DESC")
        .leftJoinAndSelect("comment.user", "user")
        .getOne()
    io.emit("getComment", {
      errorCode: 200,
      action: "add",
      message: "create comment success",
      data: newComment
    })
    return ResponseUtil.sendResponse(res, "Successfully created new comment", newComment)
  }

  static async get(req: Request, res: Response) {

    try {
      const data = req.body;
      // const cmtData = await CommentService.getComments(Number(postId))
      const blogPostId = data.blogPostId;
      const parentCommentId = data.parentCommentId
      let page = 1;
      let pageSize = 3;
      if (data.page) {
        page = data.page
      }
      if (data.pageSize) {
        pageSize = data.pageSize
      }
      // const result = await CommentService.getListComment(parentCommentId, blogPostId, page, pageSize);
      const listComment = await CommentService.getComments(blogPostId);
      return ResponseUtil.sendResponse(res, "Fetched comment successfully", listComment)
    } catch (error) {
      return ResponseUtil.sendResponse(res, "Fetched comment fail:", error)
    }

  }
  static async getById(req: Request, res: Response) {
    const { id } = req.params
    const cmt = await AppDataSource.getRepository(Comment).findOneByOrFail({
      id: Number(id),
    })

    return ResponseUtil.sendResponse<Comment>(res, "Fetch comment successfully", cmt)

  }

  static async update(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const commentId = parseInt(req.params.id);
      const content = req.body.content
      if (!commentId) {
        return ResponseUtil.sendError(res, "Missing param id comment", 404, "");
      }
      if (!content) {
        return ResponseUtil.sendError(res, "Missing input content", 404, "");
      }
      const repo = AppDataSource.getRepository(Comment);
      let comment = await repo
        .createQueryBuilder("comment")
        .where("comment.id = :id AND comment.userId = :userId", { id: commentId, userId: userId })
        .leftJoinAndSelect("comment.user", "user")
        .getOne()
      if (!comment) {
        return ResponseUtil.sendError(res, "Comment not found or User not permission", 401, "")
      }
      comment.content = content;
      repo.save(comment);

      //gui socket
      io.emit("getComment", {
        errorCode: 200,
        action: "edit",
        message: "update comment success",
        data: comment
      })
      return ResponseUtil.sendResponse(res, "Update comment success", comment);
    } catch (error: any) {
      console.error(error.message)
      return ResponseUtil.sendError(res, error.message, 500, "");
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const commentId = parseInt(req.params.id);

      const commentRepo = AppDataSource.getRepository(Comment);
      const comment = await commentRepo.createQueryBuilder("comment")
        .where("comment.id = :id AND comment.userId = :userId", { id: commentId, userId: userId })
        .getOne()
      if (!comment) {
        return ResponseUtil.sendError(res, "Comment not found or User not permission", 401, "")
      }
      await AppDataSource.createQueryBuilder()
      .delete()
      .from(Comment)
      .where("id = :id", { id: commentId })
      .execute()
      // const listComment = await CommentService.getListComment( comment.comment_parentComment, comment.comment_blogPostId, 1, 5);
      // const listComment = await CommentService.getComments(comment.comment_blogPostId);
      //gui socket
      io.emit("getComment", {
        errorCode: 200,
        action: "delete",
        message: "delete comment success",
        data: comment
      })
      return ResponseUtil.sendResponse(res, "Delete comment success", comment);
    } catch (error: any) {
      console.error(`Error:::${error.message}`)
      return ResponseUtil.sendError(res, error.message, 500, "");
    }
  }
}

export default CommentController
