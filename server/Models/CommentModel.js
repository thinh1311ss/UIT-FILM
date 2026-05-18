const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    filmId: {
      type: String,
      required: true,
    },
    filmTitle: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const CommentModel = mongoose.model("Comment", commentSchema);

module.exports = CommentModel;
