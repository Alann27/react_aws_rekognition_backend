import connection from "../database.js";
import { uploadImage } from "../services/s3.js";
import aws from "aws-sdk";
import axios from "axios";
import {promises as fs} from 'fs';
aws.config.region = "us-east-1";
aws.config.credentials = new aws.CognitoIdentityCredentials({
  IdentityPoolId: "us-east-1:c748c63f-6ab4-4c60-938b-1e2ef4d6639a",
});


export async function register(req, res) {
  try {
    const { file: image } = req;
    const { email, lastName, name, password } = req.body;

    if (!email || !lastName || !name || !password || !image) {
      return res.status(400).send({
        success: false,
        message:
          "You need to pass the email, name, last name, password and the image profile",
      });
    }

    const [userExist, fieldSelect] = await connection.execute(
      "SELECT * FROM users where email = ?",
      [email]
    );

    if (userExist.length >= 1) {
      return res.status(400).send({
        success: false,
        message: "Email already in use",
      });
    }

    const rekognition = new aws.Rekognition({});

    const arraybuffer = await fs.readFile(image.path);

    const sourceImage = arraybuffer;

    const params ={
      Image: {
        Bytes: sourceImage
      }
    }

    const result = await rekognition.detectFaces(params).promise();

    if (result.FaceDetails.length < 1 || result.FaceDetails[0].Confidence < 90) {
      return res.send({
        success: false,
        message: 'the image provided not have a person',
        result
      })
    }

    const imageUploadResult = await uploadImage(image);

    const imgUrl = imageUploadResult.Location;

    const insert = await connection.execute(
      "INSERT INTO users (name, lastName, email, password, imgUrl) values (?,?,?,?,?)",
      [name, lastName, email, password, imgUrl]
    );

    if (insert[0]?.affectedRows === 1) {
      const [rows, fields] = await connection.execute(
        "SELECT * FROM users where id = ?",
        [insert[0].insertId]
      );
      rows[0].password = undefined;
      return res.send({
        success: true,
        message: "User registered",
        data: {
          user: rows[0] || undefined,
        },
      });
    } else {
      return res.status(500).send({
        success: false,
        message: "Error",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "You need to pass the email and password",
      });
    }

    const [rows, fields] = await connection.execute(
      "SELECT * FROM users where email = ? and password = ?",
      [email, password]
    );

    if (rows.length >= 1) {
      rows[0].password = undefined;
      res.send({
        success: true,
        message: "Login successfully",
        data: {
          user: rows[0],
        },
      });
    } else {
      res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function verifyRekognition(req, res) {
  try {
    const { file: image } = req;

    let { imgUrl } = req.body;

    if (!imgUrl || !image) {
      return res.status(400).send({
        success: false,
        message: "You need to pass the user and the image",
      });
    }

    const url = imgUrl;

    const responseImage = await axios.get(url, { responseType: "arraybuffer" });

    const targetImage = responseImage.data.buffer;

    const arraybuffer = await fs.readFile(image.path);

    const sourceImage = arraybuffer;

    aws.config.region = "us-east-1";
    aws.config.credentials = new aws.CognitoIdentityCredentials({
      IdentityPoolId: "us-east-1:c748c63f-6ab4-4c60-938b-1e2ef4d6639a",
    });

    const params = {
      SourceImage: {
        Bytes: sourceImage,
      },
      TargetImage: {
        Bytes: targetImage,
      },
      SimilarityThreshold: 90,
    };
    const rekognition = new aws.Rekognition({});

    const result = await rekognition.compareFaces(params).promise();

    let theImageMatches = false;

    if (result?.FaceMatches?.length >= 1){
      theImageMatches = true;
    }

    res.send({
      success: true,
      message: 'Retrieving the result of matching the profile image with the user webcam image',
      data: {
        matches: theImageMatches
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
}