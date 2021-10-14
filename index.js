import express  from "express";
import morgan from "morgan";
import { port } from "./config.js";
import userRouter from './routes/user.js';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/User', userRouter);

app.listen(port, () => console.log(`Listen on port: ${port}`));