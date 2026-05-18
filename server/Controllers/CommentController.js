const CommentModel = require("../Models/CommentModel");

const getComments = async (req, res) => {
  try {
    const { filmId } = req.params;

    const comments = await CommentModel.find({ filmId })
      .populate("userId", "userName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server" });
  }
};

const addComment = async (req, res) => {
  try {
    const { filmId } = req.params;
    const { content, rating, filmTitle } = req.body;
    const userId = req.user._id;
    const userName = req.user.username;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Nội dung bình luận không được để trống" });
    }

    const commentRating = rating && rating >= 1 && rating <= 5 ? rating : 0;

    const comment = await CommentModel.create({
      filmId,
      filmTitle: filmTitle || "",
      userId,
      userName: userName || "Người dùng",
      content: content.trim(),
      rating: commentRating,
    });

    const populated = await CommentModel.findById(comment._id).populate(
      "userId",
      "userName"
    );

    return res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    console.error("Add comment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Bình luận không tồn tại" });
    }

    if (
      comment.userId.toString() !== userId &&
      userRole !== "admin" &&
      userRole !== "Admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xóa bình luận này" });
    }

    await CommentModel.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json({ success: true, message: "Xóa bình luận thành công" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server" });
  }
};

const getAllComments = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const comments = await CommentModel.find()
      .populate("userId", "userName email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Get all comments error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment,
  getAllComments,
};
