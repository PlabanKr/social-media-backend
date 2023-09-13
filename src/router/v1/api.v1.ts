import { Router } from "express";

import userView from "./user/api.user";
import postView from "./post/api.post";
import commentView from "./comment/api.comment";

const router = Router();

router.use('/user', userView);
router.use('/post', postView);
router.use('/comment', commentView);

export default router;