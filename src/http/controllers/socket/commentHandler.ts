import { AppDataSource } from "@/database/data-source";
import { Comment } from "@/database/entities/Comment";
import { User } from "@/database/entities/User";
import { CreateCommentDto } from "@/http/dtos/CommentDTO";
import { CommentService } from "@/http/services/CommentService";
import { validateOrReject } from "class-validator";

function commentHandler(io, socket) {

  //----them moi comment
  const createComment = async(data) => {
    //lay ra id cua user
    const userId = socket.user.id;
    data.userId = userId;
    const comment = await CommentService.createComment(data)

    return socket.emit("createComment", {
      errorCode: 200,
      message: "create comment success",
      data: comment
    })
  }

  //----- lay ra danh sach comment phan trang hoac lay theo id

  const getComment = async(data)=> {
    const blogPostId = data.postId;
    const parentCommentId = data.parentCommentId;
    let page = 1;
    let pageSize = 3;
    if(data.page) {
      page = data.page
    }
    if(data.pageSize) {
      pageSize = data.pageSize
    }
    const res = await CommentService.getListComment(parentCommentId, blogPostId, page, pageSize);
    return socket.emit("getComment",{
      errorCode: 200,
      message: "get comment success",
      data: res
    })
  }


  //-----cap nhat comment
  const updateComment = async(data)=> {
    const userId = socket.user.id;
    console.log(`id: ${data.id}, userId: ${userId}`)
    const comment = await AppDataSource.getRepository(Comment)
    .createQueryBuilder("comment")
    .where("comment.id = :id AND comment.userId = :userId", { id: data.id, userId: userId })
    .getOne()
    console.log("comment", comment)

    // const commentUpdated = await AppDataSource.createQueryBuilder()
    // .update(Comment)
    // .set({content: data.content})
    // .where("id = :id", {id: data.id})
    // .execute()
    // if(commentUpdated.affected==0) {
    //   return socket.emit("updateComment", {
    //     errorCode: 400,
    //     message: "comment not found!",
    //   })
    // }
    return socket.emit("updateComment", {
      errorCode: 200,
      message: "update comment success",
      data: "commentUpdated"
    })
  }

  //-----xoa comment
  const deleteComment = async(data)=> {
    const commentDeleted = await AppDataSource
    .createQueryBuilder()
    .delete()
    .from(Comment)
    .where("id = :id", { id: data.id })
    .execute()
    if(commentDeleted.affected==0) {
      return socket.emit("deleteComment", {
        errorCode: 400,
        message: "comment not found!",
      })
    }
    return socket.emit("deleteComment", {
      errorCode: 200,
      message: "delete comment success",
    })
  }
  socket.on("comment:create", createComment)
  socket.on("comment:update", updateComment)
  socket.on("comment:delete", deleteComment)
  socket.on("comment:get", getComment)
}

export default commentHandler;