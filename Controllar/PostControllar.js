const User = require("../Model/userSchema");
const Post = require("../Model/PostSchema");
const Comment = require("../Model/commentSchema");
const mongoose = require("mongoose");
const isEmptyOrSpaces = (str) => !str || str.trim() === "";
//create a new post
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, media } = req.body;
    if (!content) {
      return res.status(400).json({
        status: "failed",
        message: "Content is required.",
      });
    }

    if (isEmptyOrSpaces(content)) {
      return res.status(400).json({
        status: "failed",
        message: "content is required and cannot be empty or just spaces.",
      });
    }

    // Process media if provided
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map((file) => file.path);
    }

    // Create a new post
    const newPost = new Post({
      user: userId,
      content,
      media: mediaUrls,
    });

    await newPost.save();
    return res.status(201).json({
      status: "success",
      message: "Post created successfully.",
      data: newPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating the post.",
      error: error.message,
    });
  }
};

// delete the post
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post id" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found.",
      });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to delete this post.",
      });
    }

    await Post.findByIdAndDelete(postId);
    // await User.updateMany(
    //   { _id: { $in: post.likes } },
    //   { $pull: { likes: postId } }
    // );
    return res.status(200).json({
      status: "success",
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting the post.",
      error: error.message,
    });
  }
};

//like a post
exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post id" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found.",
      });
    }
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        status: "failed",
        message: "You have already liked this post.",
      });
    }
    post.likes.push(userId);
    await post.save();

    return res.status(200).json({
      status: "success",
      message: "Post liked successfully.",
      data: post,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while liking the post.",
      error: error.message,
    });
  }
};

//unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post id" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found.",
      });
    }
    if (!post.likes.includes(userId)) {
      return res.status(400).json({
        status: "failed",
        message: "You have not liked this post.",
      });
    }
    post.likes = post.likes.filter((id) => id.toString() !== userId);
    await post.save();
    return res.status(200).json({
      status: "success",
      message: "Post unliked successfully.",
      data: post,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while unliking the post.",
      error: error.message,
    });
  }
};

//add comments to the post
exports.addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post id" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Content is required for a comment.",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found.",
      });
    }
    const newComment = new Comment({
      user: userId,
      content,
      post: postId,
    });
    await newComment.save();
    post.comments.push(newComment._id);
    await post.save();

    return res.status(200).json({
      status: "success",
      message: "Comment added successfully.",
      data: newComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding the comment.",
      error: error.message,
    });
  }
};

//remove the comment
exports.removeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post id" });
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid comment id" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "failed",
        message: "Comment not found.",
      });
    }
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "You can only remove your own comments.",
      });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found.",
      });
    }
    post.comments = post.comments.filter((id) => id.toString() !== commentId);
    await post.save();

    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json({
      status: "success",
      message: "Comment removed successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while removing the comment.",
      error: error.message,
    });
  }
};

//update post
exports.updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        status: "failed",
        message: "Content is required.",
      });
    }

    if (isEmptyOrSpaces(content)) {
      return res.status(400).json({
        status: "failed",
        message: "content is required and cannot be empty or just spaces.",
      });
    }
    const media = req.files ? req.files.map((file) => file.path) : [];

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid post ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found",
      });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to update this post",
      });
    }

    // Update the post fields
    post.content = content || post.content;
    post.media = media.length > 0 ? media : post.media;

    await post.save();

    return res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating the post",
      error: error.message,
    });
  }
};
