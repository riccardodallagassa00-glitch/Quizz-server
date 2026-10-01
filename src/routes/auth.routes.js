const { Router } = require("express");
const authController = require("../controllers/auth.controller.js");
const rateLimiter = require("../middlewares/rateLimiter.js");
const router = Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", rateLimiter(5, 60000), authController.login);

module.exports = router;
