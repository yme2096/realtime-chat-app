const Message =
  require("../models/Message");

const Chat =
  require("../models/Chat");

// GET MESSAGES
const getMessages =
  async (
    req,
    res
  ) => {

    try {

      const messages =
        await Message.find({

          chat:
            req.params.chatId,

        })

        .populate(
          "sender",
          "username avatar"
        )

        .populate(
          "replyTo"
        )

        .sort({
          createdAt: 1,
        });

      res.json({
        messages,
      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Failed to load messages",

      });

    }

  };

// SEND MESSAGE
const sendMessage =
  async (
    req,
    res
  ) => {

    try {

      const {

        chatId,

        content,

        type,

      } = req.body;

      let media = null;

      // FILE
      if (
        req.file
      ) {

        media = {

          // IMPORTANT FIX
          url:
            `http://localhost:5000/uploads/${req.file.filename}`,

          mimeType:
            req.file.mimetype,

          size:
            req.file.size,

          name:
            req.file.originalname,

        };

        console.log(
          "MEDIA URL:",
          media.url
        );

      }

      const message =
        await Message.create({

          chat:
            chatId,

          sender:
            req.user._id,

          content:
            content || "",

          type:
            type || "text",

          media,

        });

      const fullMessage =
        await Message.findById(
          message._id
        )

        .populate(
          "sender",
          "username avatar"
        );

      // UPDATE CHAT
      await Chat.findByIdAndUpdate(

        chatId,

        {
          lastMessage:
            message._id,

          updatedAt:
            new Date(),
        }

      );

      // SOCKET
      const io =
        req.app.get("io");

      if (
        io
      ) {

        io.to(chatId).emit(
          "message:new",
          fullMessage
        );

      }

      res.status(201).json({

        message:
          fullMessage,

      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Failed to send message",

      });

    }

  };

// EDIT
const editMessage =
  async (
    req,
    res
  ) => {

    try {

      const message =
        await Message.findById(
          req.params.id
        );

      if (
        !message
      ) {

        return res
          .status(404)
          .json({
            message:
              "Message not found",
          });

      }

      if (

        String(
          message.sender
        ) !==

        String(
          req.user._id
        )

      ) {

        return res
          .status(403)
          .json({
            message:
              "Unauthorized",
          });

      }

      message.content =
        req.body.content;

      message.isEdited =
        true;

      await message.save();

      res.json({
        message,
      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Failed to edit message",

      });

    }

  };

// DELETE
const deleteMessage =
  async (
    req,
    res
  ) => {

    try {

      const message =
        await Message.findById(
          req.params.id
        );

      if (
        !message
      ) {

        return res
          .status(404)
          .json({
            message:
              "Message not found",
          });

      }

      message.isDeleted =
        true;

      await message.save();

      res.json({
        success: true,
      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Delete failed",

      });

    }

  };

// REACT
const reactToMessage =
  async (
    req,
    res
  ) => {

    try {

      const {
        emoji,
      } = req.body;

      const message =
        await Message.findById(
          req.params.id
        );

      if (
        !message
      ) {

        return res
          .status(404)
          .json({
            message:
              "Message not found",
          });

      }

      message.reactions.push({

        user:
          req.user._id,

        emoji,

      });

      await message.save();

      res.json({
        reactions:
          message.reactions,
      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Reaction failed",

      });

    }

  };

// READ
const markAsRead =
  async (
    req,
    res
  ) => {

    res.json({
      success: true,
    });

  };

// CALL
const createCallMessage =
  async (
    req,
    res
  ) => {

    try {

      const {

        chatId,

        callType,

      } = req.body;

      const message =
        await Message.create({

          chat:
            chatId,

          sender:
            req.user._id,

          type:
            "call",

          content:
            `${callType} Call`,

        });

      const populated =
        await Message.findById(
          message._id
        )

        .populate(
          "sender",
          "username avatar"
        );

      const io =
        req.app.get("io");

      if (
        io
      ) {

        io.to(chatId).emit(
          "message:new",
          populated
        );

      }

      res.json({
        message:
          populated,
      });

    } catch (
      err
    ) {

      console.error(
        err
      );

      res.status(500).json({

        message:
          "Call message failed",

      });

    }

  };

module.exports = {

  getMessages,

  sendMessage,

  editMessage,

  deleteMessage,

  reactToMessage,

  markAsRead,

  createCallMessage,

};