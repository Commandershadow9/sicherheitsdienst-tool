"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const router = (0, express_1.Router)();
// GET /api/health - System Health Check
router.get('/health', systemController_1.healthCheck);
// GET /api/stats - System Statistics
router.get('/stats', systemController_1.getSystemStats);
exports.default = router;
