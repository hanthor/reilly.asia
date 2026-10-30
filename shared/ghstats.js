"use strict";
// Data contract for /ghstats. Three producers, one consumer:
//   scripts/ghstats.ts (GitHub Action, every 15 min) → the snapshot, uploaded
//     as the `ghstats.json` asset of the `ghstats-data` release
//   worker /ghstats/api/snapshot → that asset, passed through and cached
//   worker /ghstats/api/live     → PRs merged since the snapshot, plus recent
//     public events, from GitHub's anonymous REST API
// The /ghstats page merges the two and aggregates in the visitor's time zone.
// Keep this file dependency-free and free of TS-only runtime syntax: the
// Action runs scripts/ghstats.ts directly with Node's type stripping.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_LIMIT = exports.RECENT_LIMIT = exports.MERGED_PR_QUERY = exports.SNAPSHOT_URL = exports.SNAPSHOT_ASSET = exports.SNAPSHOT_RELEASE_TAG = exports.GH_LOGIN = void 0;
exports.clampSince = clampSince;
exports.mergeFromSearchItem = mergeFromSearchItem;
exports.normalizeEvent = normalizeEvent;
exports.normalizeEvents = normalizeEvents;
exports.parseSnapshot = parseSnapshot;
exports.GH_LOGIN = "hanthor";
exports.SNAPSHOT_RELEASE_TAG = "ghstats-data";
exports.SNAPSHOT_ASSET = "ghstats.json";
exports.SNAPSHOT_URL = "https://github.com/hanthor/reilly.asia/releases/download/".concat(exports.SNAPSHOT_RELEASE_TAG, "/").concat(exports.SNAPSHOT_ASSET);
/** Only public PRs: the snapshot and the live overlay both filter on this. */
exports.MERGED_PR_QUERY = "author:".concat(exports.GH_LOGIN, " is:pr is:merged is:public");
exports.RECENT_LIMIT = 30;
exports.EVENT_LIMIT = 40;
/** Clamp a client-supplied ?since= to a 5-minute boundary within the last 3 days. */
function clampSince(raw, now) {
    var floor = now.getTime() - 3 * 86400000;
    var t = raw ? Date.parse(raw) : NaN;
    var ms = Number.isFinite(t) ? Math.min(Math.max(t, floor), now.getTime()) : floor;
    return new Date(Math.floor(ms / 300000) * 300000);
}
function str(v) {
    return typeof v === "string" && v.length > 0 ? v : null;
}
function obj(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}
/** A REST /search/issues item → RecentMerge, or null when it is not a merged PR. */
function mergeFromSearchItem(raw) {
    var _a;
    var item = obj(raw);
    var pr = obj(item === null || item === void 0 ? void 0 : item.pull_request);
    var mergedAt = str(pr === null || pr === void 0 ? void 0 : pr.merged_at);
    var repoUrl = str(item === null || item === void 0 ? void 0 : item.repository_url);
    var url = str(item === null || item === void 0 ? void 0 : item.html_url);
    var createdAt = str(item === null || item === void 0 ? void 0 : item.created_at);
    if (!item || !mergedAt || !repoUrl || !url || !createdAt || typeof item.number !== "number")
        return null;
    var repo = repoUrl.replace(/^https:\/\/api\.github\.com\/repos\//, "");
    return { repo: repo, number: item.number, title: (_a = str(item.title)) !== null && _a !== void 0 ? _a : "#".concat(item.number), url: url, createdAt: createdAt, mergedAt: mergedAt };
}
/** A public event from /users/:login/events/public → GhEvent, or null for noise (labels, stars of own repos…). */
function normalizeEvent(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    var e = obj(raw);
    var repo = str((_a = obj(e === null || e === void 0 ? void 0 : e.repo)) === null || _a === void 0 ? void 0 : _a.name);
    var at = str(e === null || e === void 0 ? void 0 : e.created_at);
    var id = str(e === null || e === void 0 ? void 0 : e.id);
    var p = obj(e === null || e === void 0 ? void 0 : e.payload);
    if (!e || !repo || !at || !id || !p)
        return null;
    var repoUrl = "https://github.com/".concat(repo);
    var issue = obj(p.issue);
    var action = str(p.action);
    switch (e.type) {
        case "PullRequestEvent": {
            if (action !== "opened" && action !== "merged" && action !== "closed" && action !== "reopened")
                return null;
            var n = typeof p.number === "number" ? p.number : null;
            var pr = obj(p.pull_request);
            return {
                id: id,
                verb: action === "opened" ? "opened PR" : action === "reopened" ? "reopened PR" : action === "merged" ? "merged" : "closed PR",
                repo: repo,
                subject: (_b = str(pr === null || pr === void 0 ? void 0 : pr.title)) !== null && _b !== void 0 ? _b : (n ? "#".concat(n) : null),
                url: (_c = str(pr === null || pr === void 0 ? void 0 : pr.html_url)) !== null && _c !== void 0 ? _c : (n ? "".concat(repoUrl, "/pull/").concat(n) : repoUrl),
                at: at,
            };
        }
        case "IssueCommentEvent":
            return { id: id, verb: "commented on", repo: repo, subject: str(issue === null || issue === void 0 ? void 0 : issue.title), url: (_f = (_e = str((_d = obj(p.comment)) === null || _d === void 0 ? void 0 : _d.html_url)) !== null && _e !== void 0 ? _e : str(issue === null || issue === void 0 ? void 0 : issue.html_url)) !== null && _f !== void 0 ? _f : repoUrl, at: at };
        case "IssuesEvent":
            if (action !== "opened" && action !== "closed" && action !== "reopened")
                return null;
            return { id: id, verb: "".concat(action, " issue"), repo: repo, subject: str(issue === null || issue === void 0 ? void 0 : issue.title), url: (_g = str(issue === null || issue === void 0 ? void 0 : issue.html_url)) !== null && _g !== void 0 ? _g : repoUrl, at: at };
        case "PullRequestReviewEvent": {
            var pr = obj(p.pull_request);
            return { id: id, verb: "reviewed", repo: repo, subject: str(pr === null || pr === void 0 ? void 0 : pr.title), url: (_k = (_j = str((_h = obj(p.review)) === null || _h === void 0 ? void 0 : _h.html_url)) !== null && _j !== void 0 ? _j : str(pr === null || pr === void 0 ? void 0 : pr.html_url)) !== null && _k !== void 0 ? _k : repoUrl, at: at };
        }
        case "PushEvent": {
            var ref = (_m = (_l = str(p.ref)) === null || _l === void 0 ? void 0 : _l.replace(/^refs\/heads\//, "")) !== null && _m !== void 0 ? _m : null;
            return { id: id, verb: "pushed to", repo: repo, subject: ref, url: repoUrl, at: at };
        }
        case "CreateEvent":
            if (p.ref_type === "repository")
                return { id: id, verb: "created repo", repo: repo, subject: null, url: repoUrl, at: at };
            if (p.ref_type === "tag")
                return { id: id, verb: "tagged", repo: repo, subject: str(p.ref), url: repoUrl, at: at };
            return null;
        case "ReleaseEvent": {
            var rel = obj(p.release);
            return { id: id, verb: "released", repo: repo, subject: (_o = str(rel === null || rel === void 0 ? void 0 : rel.tag_name)) !== null && _o !== void 0 ? _o : str(rel === null || rel === void 0 ? void 0 : rel.name), url: (_p = str(rel === null || rel === void 0 ? void 0 : rel.html_url)) !== null && _p !== void 0 ? _p : repoUrl, at: at };
        }
        case "ForkEvent":
            return { id: id, verb: "forked", repo: repo, subject: null, url: repoUrl, at: at };
        case "WatchEvent":
            return { id: id, verb: "starred", repo: repo, subject: null, url: repoUrl, at: at };
        default:
            return null;
    }
}
function normalizeEvents(raw) {
    if (!Array.isArray(raw))
        return [];
    var out = [];
    for (var _i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
        var r = raw_1[_i];
        var e = normalizeEvent(r);
        if (e)
            out.push(e);
        if (out.length >= exports.EVENT_LIMIT)
            break;
    }
    return out;
}
/** Shape check for a snapshot fetched by the browser; null when unusable. */
function parseSnapshot(raw) {
    var s = obj(raw);
    if (!s || s.v !== 1 || !Array.isArray(s.repos) || !Array.isArray(s.prs) || typeof s.generatedAt !== "string")
        return null;
    return s;
}
