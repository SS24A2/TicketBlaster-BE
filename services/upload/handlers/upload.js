const generateFileName = require("../../../pkg/strings");
const fs = require("fs");

const MAX_FILESIZE = 10 * 1024 * 1024;  // 10mb  
const ALLOWED_FILETYPES = ["image/jpeg", "image/jpg", "image/png"];

const upload = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).send("No file was uploaded!");
    }

    if (!ALLOWED_FILETYPES.includes(req.files.image.mimetype)) {
      return res.status(400).send("File type not allowed!");
    }
    if (MAX_FILESIZE < req.files.image.size) {
      return res.status(400).send("File exceeds the maximal allowed file size!");
    }

    const uploadType = req.params.type
    const DirPath = `${__dirname}/../../${uploadType}s/uploads`;

    if (!fs.existsSync(DirPath)) {
      fs.mkdirSync(DirPath);
    }

    const uploadObjectId = req.params.id
    const newFileNameArray = req.files.image.name.split(".");
    const newFileNameUnique = `${uploadObjectId}_${generateFileName(10)}.${newFileNameArray[1]}`;
    const filePath = `${DirPath}/${newFileNameUnique}`;

    // deleting the previously uploaded image when a new image is uploaded (for the same user/event)
    const filesList = fs.readdirSync(DirPath)
    const previousFile = filesList.filter((item) => item.slice(0, 6) === uploadObjectId)[0]
    fs.rmSync(`${DirPath}/${previousFile}`)

    await req.files.image.mv(filePath);
    return res.status(200).send({ filename: newFileNameUnique });
  } catch (err) {
    console.log("upload err", err)
    return res.status(500).send("Internal Server Error!");
  }
};

module.exports = {
  upload,
};

/////TO DO
// the filesize should be specified also in the proxy service if it is larger than the default one
// slice (0,24) in case of Object Id!!!!
