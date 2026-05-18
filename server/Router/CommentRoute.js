const express = require("express");
const router = express.Router();
const commentController = require("../Controllers/CommentController");
const authMiddleware = require("../Middleware/AuthMiddleware");

router.get("/", authMiddleware, commentController.getAllComments);
router.get("/:filmId", commentController.getComments);
router.post("/:filmId", authMiddleware, commentController.addComment);
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

module.exports = router;
