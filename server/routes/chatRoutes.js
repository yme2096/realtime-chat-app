const router =
  require("express")
    .Router();

const {
  getMyChats,
  getOrCreateDirectChat,
  createGroup,
  addGroupMember,
  deleteChat,
  leaveGroup,
} = require(
  "../controllers/chatController"
);

const {
  protect,
} = require(
  "../middleware/auth"
);

// ALL ROUTES REQUIRE LOGIN
router.use(protect);

// GET MY CHATS
router.get(
  "/",
  getMyChats
);

// DIRECT CHAT
router.post(
  "/direct",
  getOrCreateDirectChat
);

// CREATE GROUP
router.post(
  "/group",
  createGroup
);

// ADD MEMBER
router.put(
  "/:id/add",
  addGroupMember
);

// LEAVE GROUP
router.delete(
  "/:id/leave",
  leaveGroup
);

router.delete(
  "/:id",
  deleteChat
);

module.exports =
  router;