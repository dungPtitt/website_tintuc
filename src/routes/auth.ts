import { AuthController } from "@/http/controllers/AuthController";
import { AuthMiddleware } from "@/http/middlewares/AuthMiddleware";
import { ErrorHandler } from "@http/middlewares/ErrorHandler";
import express from "express";

const router = express.Router();
router.post("/refresh-token", AuthController.refreshToken);
router.post("/register", ErrorHandler.catchErrors(AuthController.register));
router.post("/login", ErrorHandler.catchErrors(AuthController.login));

router.post("/logout",
    ErrorHandler.catchErrors(AuthMiddleware.authenticate),
    ErrorHandler.catchErrors(AuthController.logout)
);

export default router;
