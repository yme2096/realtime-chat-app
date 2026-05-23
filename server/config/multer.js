const multer =
  require("multer");

const path =
  require("path");

const fs =
  require("fs");

// CREATE UPLOADS FOLDER
const uploadPath =
  path.join(
    __dirname,
    "../uploads"
  );

if (
  !fs.existsSync(
    uploadPath
  )
) {

  fs.mkdirSync(
    uploadPath,
    {
      recursive: true,
    }
  );

}

// STORAGE
const storage =
  multer.diskStorage({

    destination:
      (
        req,
        file,
        cb
      ) => {

        cb(
          null,
          uploadPath
        );

      },

    filename:
      (
        req,
        file,
        cb
      ) => {

        const unique =
          Date.now() +
          "-" +
          Math.round(
            Math.random() *
              1e9
          );

        cb(

          null,

          unique +
            path.extname(
              file.originalname
            )

        );

      },

  });

// FILE FILTER
const fileFilter =
  (
    req,
    file,
    cb
  ) => {

    // ALLOW
    const allowed =
      [

        // IMAGES
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",

        // AUDIO
        "audio/webm",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",

        // VIDEO
        "video/mp4",
        "video/webm",

        // FILES
        "application/pdf",
        "application/zip",

      ];

    if (
      allowed.includes(
        file.mimetype
      )
    ) {

      cb(
        null,
        true
      );

    } else {

      console.log(
        "Upload error:",
        file.mimetype
      );

      cb(
        new Error(
          "Invalid file type"
        ),
        false
      );

    }

  };

// MULTER
const upload =
  multer({

    storage,

    fileFilter,

    limits: {

      fileSize:
        50 *
        1024 *
        1024,

    },

  });

module.exports =
  upload;