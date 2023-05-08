import { Router } from "express";

import userView from "./user/api.user";

const router = Router();

router.use('/user', userView);

export default router;