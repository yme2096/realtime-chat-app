const cloudinary =
  require("cloudinary")
    .v2;

const streamifier =
  require("streamifier");

cloudinary.config({

  cloud_name:
    process.env
      .CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env
      .CLOUDINARY_API_KEY,

  api_secret:
    process.env
      .CLOUDINARY_API_SECRET,

});

// UPLOAD
const uploadToCloudinary =
  (file) => {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const stream =
          cloudinary.uploader.upload_stream(

            {
              folder:
                "chat-app",
            },

            (
              error,
              result
            ) => {

              if (
                result
              ) {

                resolve({
                  url:
                    result.secure_url,

                  publicId:
                    result.public_id,

                  resourceType:
                    result.resource_type,
                });

              } else {

                reject(
                  error
                );

              }

            }

          );

        streamifier
          .createReadStream(
            file.buffer
          )
          .pipe(stream);

      }
    );

  };

// DELETE
const deleteFromCloudinary =
  async (
    publicId,
    resourceType =
      "image"
  ) => {

    return cloudinary.uploader.destroy(

      publicId,

      {
        resource_type:
          resourceType,
      }

    );

  };

module.exports = {

  uploadToCloudinary,

  deleteFromCloudinary,

};