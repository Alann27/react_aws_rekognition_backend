import { Router } from "express";
import { login, register, verifyRekognition } from "../controllers/user.js";
import multer from "multer";
const upload = multer({ dest: 'uploads/' })

const router = Router();

router.post('/Register', upload.single('image'), register);
router.post('/Login', login);
router.post('/VerifyFaces', upload.single('image'), verifyRekognition);

export default router;