const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// HASH PASSWORD BEFORE SAVE
userSchema.pre("save", async function () {

  // ONLY HASH IF PASSWORD MODIFIED
  if (!this.isModified("password")) {

    return;

  }

  // HASH PASSWORD
  this.password = await bcrypt.hash(
    this.password,
    10
  );

});

// COMPARE PASSWORD
userSchema.methods.comparePassword =
  async function (candidatePassword) {

    return await bcrypt.compare(
      candidatePassword,
      this.password
    );

  };

// REMOVE PASSWORD FROM RESPONSE
userSchema.methods.toJSON =
  function () {

    const obj = this.toObject();

    delete obj.password;

    return obj;

  };

// SEARCH INDEX
userSchema.index({
  username: "text",
  email: "text",
});

module.exports =
  mongoose.model(
    "User",
    userSchema
  );