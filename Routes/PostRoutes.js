const express = require("express");
const mongoose = require("mongoose");
const {
  createPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  updatePost,
} = require("../Controllar/PostControllar");
const Router = express.Router();
const auth = require("../Middlewares/auth");
const upload = require("../Middlewares/multer");

Router.post("/posts", auth, upload.array("images", 5), createPost);
Router.delete("/posts/:postId", auth, deletePost);
Router.post("/posts/:postId/like", auth, likePost);
Router.post("/posts/:postId/unlike", auth, unlikePost);
Router.post("/posts/:postId/comment", auth, addComment);
Router.delete("/posts/:postId/comment/:commentId", auth, removeComment);
Router.put("/posts/:postId", auth, upload.array("images", 5), updatePost);

module.exports = Router;
