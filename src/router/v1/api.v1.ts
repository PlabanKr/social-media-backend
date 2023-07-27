import { Router } from "express";

import userView from "./user/api.user";
import postView from "./post/api.post";

const router = Router();

router.use('/user', userView);
router.use('/post', postView);

export default router;