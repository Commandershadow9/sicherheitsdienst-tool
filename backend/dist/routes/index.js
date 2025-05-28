"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftRoutes = exports.userRoutes = exports.systemRoutes = void 0;
var systemRoutes_1 = require("./systemRoutes");
Object.defineProperty(exports, "systemRoutes", { enumerable: true, get: function () { return __importDefault(systemRoutes_1).default; } });
var userRoutes_1 = require("./userRoutes");
Object.defineProperty(exports, "userRoutes", { enumerable: true, get: function () { return __importDefault(userRoutes_1).default; } });
var shiftRoutes_1 = require("./shiftRoutes");
Object.defineProperty(exports, "shiftRoutes", { enumerable: true, get: function () { return __importDefault(shiftRoutes_1).default; } });
