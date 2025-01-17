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
exports.restoreRun = exports.restoreOnlyRun = exports.restoreImpl = void 0;
const cache = __importStar(require("@voplica/cache"));
const core = __importStar(require("@voplica/core"));
const constants_1 = require("./constants");
const stateProvider_1 = require("./stateProvider");
const utils = __importStar(require("./utils/actionUtils"));
function restoreImpl(stateProvider, earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!utils.isCacheFeatureAvailable()) {
                core.setOutput(constants_1.Outputs.CacheHit, "false");
                return;
            }
            // Validate inputs, this can cause task failure
            if (!utils.isValidEvent()) {
                utils.logWarning(`Event Validation Error: The event type ${process.env[constants_1.Events.Key]} is not supported because it's not tied to a branch or tag ref.`);
                return;
            }
            const primaryKey = core.getInput(constants_1.Inputs.Key, { required: true });
            stateProvider.setState(constants_1.State.CachePrimaryKey, primaryKey);
            const restoreKeys = utils.getInputAsArray(constants_1.Inputs.RestoreKeys);
            const cachePaths = utils.getInputAsArray(constants_1.Inputs.Path, {
                required: true
            });
            const enableCrossOsArchive = utils.getInputAsBool(constants_1.Inputs.EnableCrossOsArchive);
            const failOnCacheMiss = utils.getInputAsBool(constants_1.Inputs.FailOnCacheMiss);
            const lookupOnly = utils.getInputAsBool(constants_1.Inputs.LookupOnly);
            const cacheKey = yield cache.restoreCache(cachePaths, primaryKey, restoreKeys, { lookupOnly: lookupOnly }, enableCrossOsArchive);
            if (!cacheKey) {
                // `cache-hit` is intentionally not set to `false` here to preserve existing behavior
                // See https://github.com/actions/cache/issues/1466
                if (failOnCacheMiss) {
                    throw new Error(`Failed to restore cache entry. Exiting as fail-on-cache-miss is set. Input key: ${primaryKey}`);
                }
                core.info(`Cache not found for input keys: ${[
                    primaryKey,
                    ...restoreKeys
                ].join(", ")}`);
                return;
            }
            // Store the matched cache key in states
            stateProvider.setState(constants_1.State.CacheMatchedKey, cacheKey);
            const isExactKeyMatch = utils.isExactKeyMatch(core.getInput(constants_1.Inputs.Key, { required: true }), cacheKey);
            core.setOutput(constants_1.Outputs.CacheHit, isExactKeyMatch.toString());
            if (lookupOnly) {
                core.info(`Cache found and can be restored from key: ${cacheKey}`);
            }
            else {
                core.info(`Cache restored from key: ${cacheKey}`);
            }
            return cacheKey;
        }
        catch (error) {
            core.setFailed(error.message);
            if (earlyExit) {
                process.exit(1);
            }
        }
    });
}
exports.restoreImpl = restoreImpl;
function run(stateProvider, earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        yield restoreImpl(stateProvider, earlyExit);
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
function restoreOnlyRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        yield run(new stateProvider_1.NullStateProvider(), earlyExit);
    });
}
exports.restoreOnlyRun = restoreOnlyRun;
function restoreRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        yield run(new stateProvider_1.StateProvider(), earlyExit);
    });
}
exports.restoreRun = restoreRun;
