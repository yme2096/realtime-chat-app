const router = require("express").Router();
const { getNotifications, markAllRead, markOneRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getNotifications);
router.put("/read", markAllRead);
router.put("/:id/read", markOneRead);

module.exports = router;
