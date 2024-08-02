// const mongoose = require("mongoose");
// const PostSchema = mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   likes: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   ],
//   comments: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Comments",
//     },
//   ],
// });
// exports.module = mongoose.model("Post", PostSchema);

const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  media: [
    {
      type: String,
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Middleware to delete associated comments when a post is deleted
PostSchema.pre("remove", async function (next) {
  const postId = this._id;
  await mongoose.model("Comment").deleteMany({ post: postId });
  next();
});

module.exports = mongoose.model("Post", PostSchema);
