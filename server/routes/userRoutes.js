const router =
  require("express")
    .Router();

const {
  searchUsers,
  getUserById,
  updateProfile,
} = require(
  "../controllers/userController"
);

const {
  protect,
} = require(
  "../middleware/auth"
);

const upload =
  require("../config/multer");

// PROTECTED ROUTES
router.use(protect);

// SEARCH USERS
router.get(
  "/search",
  searchUsers
);

// GET USER
router.get(
  "/:id",
  getUserById
);

// UPDATE PROFILE
router.put(
  "/profile",
  upload.single("avatar"),
  updateProfile
);

module.exports =
  router;