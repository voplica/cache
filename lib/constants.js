"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefKey = exports.Events = exports.State = exports.Outputs = exports.Inputs = void 0;
var Inputs;
(function (Inputs) {
    Inputs["Key"] = "key";
    Inputs["Path"] = "path";
    Inputs["RestoreKeys"] = "restore-keys";
    Inputs["UploadChunkSize"] = "upload-chunk-size";
    Inputs["EnableCrossOsArchive"] = "enableCrossOsArchive";
    Inputs["FailOnCacheMiss"] = "fail-on-cache-miss";
    Inputs["LookupOnly"] = "lookup-only";
    Inputs["FileSizeLimit"] = "file-size-limit"; // Input for file size limit, save action
})(Inputs = exports.Inputs || (exports.Inputs = {}));
var Outputs;
(function (Outputs) {
    Outputs["CacheHit"] = "cache-hit";
    Outputs["CachePrimaryKey"] = "cache-primary-key";
    Outputs["CacheMatchedKey"] = "cache-matched-key"; // Output from restore action
})(Outputs = exports.Outputs || (exports.Outputs = {}));
var State;
(function (State) {
    State["CachePrimaryKey"] = "CACHE_KEY";
    State["CacheMatchedKey"] = "CACHE_RESULT";
})(State = exports.State || (exports.State = {}));
var Events;
(function (Events) {
    Events["Key"] = "GITHUB_EVENT_NAME";
    Events["Push"] = "push";
    Events["PullRequest"] = "pull_request";
})(Events = exports.Events || (exports.Events = {}));
exports.RefKey = "GITHUB_REF";
