const Chat =
  require("../models/Chat");

// GET ALL CHATS
const getMyChats =
  async (
    req,
    res,
    next
  ) => {

    try {

      const chats =
        await Chat.find({

          users: {
            $in: [
              req.user._id,
            ],
          },

        })

          .populate(
            "users",
            "username avatar email isOnline lastSeen"
          )

          .populate(
            "admins",
            "username avatar"
          )

          .populate({
            path:
              "lastMessage",

            populate: {
              path:
                "sender",

              select:
                "username avatar",
            },
          })

          .sort({
            updatedAt:
              -1,
          });

      res.json({
        chats,
      });

    } catch (err) {

      next(err);

    }

  };

// GET OR CREATE DIRECT CHAT
const getOrCreateDirectChat =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        userId,
      } = req.body;

      let chat =
        await Chat.findOne({

          isGroup: false,

          users: {
            $all: [
              req.user._id,
              userId,
            ],

            $size: 2,
          },

        })

          .populate(
            "users",
            "username avatar email isOnline lastSeen"
          )

          .populate(
            "admins",
            "username avatar"
          );

      // CREATE NEW CHAT
      if (!chat) {

        chat =
          await Chat.create({

            isGroup:
              false,

            users: [
              req.user._id,
              userId,
            ],

          });

        chat =
          await Chat.findById(
            chat._id
          )

            .populate(
              "users",
              "username avatar email isOnline lastSeen"
            )

            .populate(
              "admins",
              "username avatar"
            );

      }

      res.json({
        chat,
      });

    } catch (err) {

      next(err);

    }

  };

// CREATE GROUP CHAT
const createGroup =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        chatName,
        users,
      } = req.body;

      if (
        !chatName ||
        !users ||
        users.length < 1
      ) {

        return res
          .status(400)
          .json({

            message:
              "Select at least 1 user",

          });

      }

      // ADD CURRENT USER
      const allUsers = [

        ...users,

        req.user._id,

      ];

      // REMOVE DUPLICATES
      const uniqueUsers =
        [
          ...new Set(
            allUsers.map(
              (id) =>
                String(id)
            )
          ),
        ];

      const group =
        await Chat.create({

          isGroup: true,

          chatName,

          users:
            uniqueUsers,

          admins: [
            req.user._id,
          ],

        });

      const fullGroup =
        await Chat.findById(
          group._id
        )

          .populate(
            "users",
            "username avatar email"
          )

          .populate(
            "admins",
            "username avatar"
          );

      res.status(201).json({

        chat:
          fullGroup,

      });

    } catch (err) {

      next(err);

    }

  };

// ADD MEMBER
const addGroupMember =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        userId,
      } = req.body;

      const chat =
        await Chat.findById(
          req.params.id
        );

      if (
        !chat ||
        !chat.isGroup
      ) {

        return res
          .status(404)
          .json({

            message:
              "Group not found",

          });

      }

      // ADMIN CHECK
      const isAdmin =
        chat.admins.some(
          (adminId) =>

            String(
              adminId
            ) ===

            String(
              req.user._id
            )
        );

      if (!isAdmin) {

        return res
          .status(403)
          .json({

            message:
              "Only admins can add users",

          });

      }

      // ALREADY EXISTS
      if (
        !chat.users.includes(
          userId
        )
      ) {

        chat.users.push(
          userId
        );

        await chat.save();

      }

      const updatedChat =
        await Chat.findById(
          chat._id
        )

          .populate(
            "users",
            "username avatar"
          )

          .populate(
            "admins",
            "username avatar"
          );

      res.json({
        chat:
          updatedChat,
      });

    } catch (err) {

      next(err);

    }

  };

// LEAVE GROUP
const leaveGroup =
  async (
    req,
    res,
    next
  ) => {

    try {

      const chat =
        await Chat.findById(
          req.params.id
        );

      if (
        !chat ||
        !chat.isGroup
      ) {

        return res
          .status(404)
          .json({

            message:
              "Group not found",

          });

      }

      // REMOVE USER
      chat.users =
        chat.users.filter(
          (u) =>

            String(u) !==
            String(
              req.user._id
            )
        );

      // REMOVE ADMIN
      chat.admins =
        chat.admins.filter(
          (a) =>

            String(a) !==
            String(
              req.user._id
            )
        );

      // NEW ADMIN
      if (
        chat.admins
          .length === 0 &&

        chat.users.length >
          0
      ) {

        chat.admins.push(
          chat.users[0]
        );

      }

      await chat.save();

      res.json({

        message:
          "Left group",

      });

    } catch (err) {

      next(err);

    }

  };
  // DELETE CHAT
const deleteChat =
  async (
    req,
    res,
    next
  ) => {

    try {

      const chat =
        await Chat.findById(
          req.params.id
        );

      if (!chat) {

        return res
          .status(404)
          .json({
            message:
              "Chat not found",
          });

      }

      // REMOVE CHAT
      await Chat.findByIdAndDelete(
        req.params.id
      );

      // REMOVE MESSAGES
      const Message =
        require(
          "../models/Message"
        );

      await Message.deleteMany({

        chat:
          req.params.id,

      });

      res.json({

        success: true,

      });

    } catch (err) {

      next(err);

    }

  };

module.exports = {

  getMyChats,

  deleteChat,

  getOrCreateDirectChat,

  createGroup,

  addGroupMember,

  leaveGroup,

};