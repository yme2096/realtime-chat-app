const mongoose =
  require("mongoose");

const chatSchema =
  new mongoose.Schema(

    {

      isGroup: {
        type: Boolean,
        default: false,
      },

      chatName: {
        type: String,
        trim: true,
      },

      groupAvatar: {
        type: String,
      },

      users: [

        {
          type:
            mongoose.Schema
              .Types
              .ObjectId,

          ref: "User",
        },

      ],

      admins: [

        {
          type:
            mongoose.Schema
              .Types
              .ObjectId,

          ref: "User",
        },

      ],

      lastMessage: {

        type:
          mongoose.Schema
            .Types
            .ObjectId,

        ref: "Message",
      },

    },

    {
      timestamps: true,
    }

  );

module.exports =
  mongoose.model(
    "Chat",
    chatSchema
  );