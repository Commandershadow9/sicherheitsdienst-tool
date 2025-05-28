"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const router = (0, express_1.Router)();
router.get('/health', systemController_1.healthCheck);
router.get('/stats', systemController_1.getSystemStats);
exports.default = router;
