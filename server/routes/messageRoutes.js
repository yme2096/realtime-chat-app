const router =
  require("express")
    .Router();

const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  markAsRead,
  createCallMessage,
} = require(
  "../controllers/messageController"
);
const {
  protect,
} = require(
  "../middleware/auth"
);

const upload =
  require(
    "../config/multer"
  );

router.use(protect);

router.get(
  "/:chatId",
  getMessages
);

router.post(
  "/",
  upload.single("file"),
  sendMessage
);

router.put(
  "/:id",
  editMessage
);

router.delete(
  "/:id",
  deleteMessage
);

router.post(
  "/:id/react",
  reactToMessage
);

router.put(
  "/:chatId/read",
  markAsRead
);

router.post(
  "/call",
  protect,
  createCallMessage
);

module.exports =
  router;