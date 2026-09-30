const { Router } = require("express");
const categoryController = require("../controllers/category.controller.js");

const router = Router();

router.get("/categories", categoryController.getCategories);
router.get("/categories/:id", categoryController.getCategory);
router.post("/categories", categoryController.createCategory);
router.put("/categories/:id", categoryController.updateCategory);
router.delete("/categories/:id", categoryController.deleteCategory);

module.exports = router;
