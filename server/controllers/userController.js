const User =
  require("../models/User");

const {
  uploadToCloudinary,
} = require(
  "../services/uploadService"
);

// SEARCH USERS
const searchUsers =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        req.query.query;

      if (!query) {

        return res.json({
          users: [],
        });

      }

      const users =
        await User.find({

          _id: {
            $ne:
              req.user._id,
          },

          $or: [

            {
              username: {
                $regex:
                  query,
                $options:
                  "i",
              },
            },

            {
              email: {
                $regex:
                  query,
                $options:
                  "i",
              },
            },

          ],

        })
        .select(
          "username email avatar"
        )
        .limit(20);

      res.json({
        users,
      });

    } catch (err) {

      next(err);

    }

  };

// GET USER BY ID
const getUserById =
  async (
    req,
    res,
    next
  ) => {

    try {

      const user =
        await User.findById(
          req.params.id
        ).select(
          "-password"
        );

      if (!user) {

        return res
          .status(404)
          .json({
            message:
              "User not found",
          });

      }

      res.json({
        user,
      });

    } catch (err) {

      next(err);

    }

  };

// UPDATE PROFILE
const updateProfile =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        username,
        bio,
      } = req.body;

      const updates = {};

      // USERNAME
      if (username) {

        updates.username =
          username;

      }

      // BIO
      if (
        bio !== undefined
      ) {

        updates.bio =
          bio;

      }

      // AVATAR
      if (req.file) {

        const media =
          await uploadToCloudinary(
            req.file,
            "chatapp/avatars"
          );

        updates.avatar =
          media.url;

      }

      const user =
        await User.findByIdAndUpdate(

          req.user._id,

          updates,

         {
  returnDocument:
    "after",
}

        );

      res.json({
        user,
      });

    } catch (err) {

      next(err);

    }

  };

module.exports = {

  searchUsers,

  getUserById,

  updateProfile,

};