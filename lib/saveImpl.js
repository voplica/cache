"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRun = exports.saveOnlyRun = exports.saveImpl = void 0;
const cache = __importStar(require("@voplica/cache"));
const core = __importStar(require("@voplica/core"));
const constants_1 = require("./constants");
const stateProvider_1 = require("./stateProvider");
const utils = __importStar(require("./utils/actionUtils"));
// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on("uncaughtException", e => utils.logWarning(e.message));
function saveImpl(stateProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheId = -1;
        try {
            if (!utils.isCacheFeatureAvailable()) {
                return;
            }
            if (!utils.isValidEvent()) {
                utils.logWarning(`Event Validation Error: The event type ${process.env[constants_1.Events.Key]} is not supported because it's not tied to a branch or tag ref.`);
                return;
            }
            let maxFileSizeLimit = utils.getInputAsInt(constants_1.Inputs.FileSizeLimit);
            utils.logInfo(`Setting file size limit to ${maxFileSizeLimit} .`);
            if (maxFileSizeLimit != null) {
                cache.setFileSizeLimit(maxFileSizeLimit);
            }
            // If restore has stored a primary key in state, reuse that
            // Else re-evaluate from inputs
            const primaryKey = stateProvider.getState(constants_1.State.CachePrimaryKey) ||
                core.getInput(constants_1.Inputs.Key);
            if (!primaryKey) {
                utils.logWarning(`Key is not specified.`);
                return;
            }
            // If matched restore key is same as primary key, then do not save cache
            // NO-OP in case of SaveOnly action
            const restoredKey = stateProvider.getCacheState();
            if (utils.isExactKeyMatch(primaryKey, restoredKey)) {
                core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`);
                return;
            }
            const cachePaths = utils.getInputAsArray(constants_1.Inputs.Path, {
                required: true
            });
            const enableCrossOsArchive = utils.getInputAsBool(constants_1.Inputs.EnableCrossOsArchive);
            cacheId = yield cache.saveCache(cachePaths, primaryKey, { uploadChunkSize: utils.getInputAsInt(constants_1.Inputs.UploadChunkSize) }, enableCrossOsArchive);
            if (cacheId != -1) {
                core.info(`Cache saved with key: ${primaryKey}`);
            }
        }
        catch (error) {
            utils.logWarning(error.message);
        }
        return cacheId;
    });
}
exports.saveImpl = saveImpl;
function saveOnlyRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cacheId = yield saveImpl(new stateProvider_1.NullStateProvider());
            if (cacheId === -1) {
                core.warning(`Cache save failed.`);
            }
        }
        catch (err) {
            console.error(err);
            if (earlyExit) {
                process.exit(1);
            }
        }
        // node will stay alive if any promises are not resolved,
        // which is a possibility if HTTP requests are dangling
        // due to retries or timeouts. We know that if we got here
        // that all promises that we care about have successfully
        // resolved, so simply exit with success.
        if (earlyExit) {
            process.exit(0);
        }
    });
}
exports.saveOnlyRun = saveOnlyRun;
function saveRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield saveImpl(new stateProvider_1.StateProvider());
        }
        catch (err) {
            console.error(err);
            if (earlyExit) {
                process.exit(1);
            }
        }
        // node will stay alive if any promises are not resolved,
        // which is a possibility if HTTP requests are dangling
        // due to retries or timeouts. We know that if we got here
        // that all promises that we care about have successfully
        // resolved, so simply exit with success.
        if (earlyExit) {
            process.exit(0);
        }
    });
}
exports.saveRun = saveRun;
