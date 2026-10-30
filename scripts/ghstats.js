#!/usr/bin/env node
"use strict";
// Fetch and aggregate GitHub PR stats for a full year, write a snapshot JSON.
// Runs on a schedule (e.g., hourly via GitHub Actions) and commits the output
// to a release asset ghstats.json so the Worker and /ghstats page can use it.
//
// Fetches:
// 1. All merged PRs by the user in the last 365 days via GraphQL (paged, windowed by month)
// 2. User profile (createdAt, followers, publicRepos)
// 3. Contribution calendar
// 4. Recent merges with titles (REST search, for the feed)
// 5. Recent public events
//
// No TypeScript runtime deps; run directly with `node --input-type=module` or
// Node 20.6+ with a .mts extension.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ghstats_ts_1 = require("../shared/ghstats.ts");
var GITHUB_API = "https://api.github.com";
var GITHUB_GRAPHQL = "https://api.github.com/graphql";
var token = process.env.GITHUB_TOKEN;
if (!token)
    throw new Error("GITHUB_TOKEN not set");
var headers = {
    Authorization: "Bearer ".concat(token),
    "User-Agent": "ghstats-aggregator",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
};
function gql(query_1) {
    return __awaiter(this, arguments, void 0, function (query, variables) {
        var res, text, body;
        if (variables === void 0) { variables = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(GITHUB_GRAPHQL, {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({ query: query, variables: variables }),
                    })];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("GraphQL error ".concat(res.status, ": ").concat(text.slice(0, 200)));
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    body = (_a.sent());
                    if (body.errors)
                        throw new Error("GraphQL errors: ".concat(JSON.stringify(body.errors).slice(0, 200)));
                    return [2 /*return*/, body.data];
            }
        });
    });
}
function rest(path) {
    return __awaiter(this, void 0, void 0, function () {
        var res, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(GITHUB_API).concat(path), { headers: headers })];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("REST error ".concat(res.status, " ").concat(path, ": ").concat(text.slice(0, 200)));
                case 3: return [4 /*yield*/, res.json()];
                case 4: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
/** Fetch all merged PRs authored by hanthor in the last 365 days, via GraphQL. */
function fetchMergedPrs(now) {
    return __awaiter(this, void 0, void 0, function () {
        var since, out, seen, month, end, start, endStr, startStr, query, cursor, pageNum, hasMore, variables, result, nodes, _i, nodes_1, pr, unique, _a, out_1, pr;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    since = new Date(now.getTime() - 365 * 86400000).toISOString().slice(0, 10);
                    out = [];
                    seen = new Set();
                    month = 0;
                    _d.label = 1;
                case 1:
                    if (!(month < 13)) return [3 /*break*/, 5];
                    end = new Date(now.getTime() - month * 30 * 86400000);
                    start = new Date(end.getTime() - 30 * 86400000);
                    endStr = end.toISOString().slice(0, 10);
                    startStr = start.toISOString().slice(0, 10);
                    query = "".concat(ghstats_ts_1.MERGED_PR_QUERY, " merged:").concat(startStr, "..").concat(endStr);
                    cursor = null;
                    pageNum = 0;
                    hasMore = true;
                    _d.label = 2;
                case 2:
                    if (!(hasMore && pageNum < 20)) return [3 /*break*/, 4];
                    pageNum++;
                    variables = { q: query, first: 100, after: cursor };
                    return [4 /*yield*/, gql("query($q:String!,$first:Int!,$after:String){search(type:ISSUE,query:$q,first:$first,after:$after){issueCount pageInfo{hasNextPage endCursor} nodes{... on PullRequest{number title url createdAt mergedAt additions deletions changedFiles mergedBy{login} repository{nameWithOwner}}}}}", variables)];
                case 3:
                    result = _d.sent();
                    nodes = ((_b = result.search.nodes) !== null && _b !== void 0 ? _b : []);
                    for (_i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                        pr = nodes_1[_i];
                        if (!seen.has(pr.number)) {
                            out.push(pr);
                            seen.add(pr.number);
                        }
                    }
                    hasMore = result.search.pageInfo.hasNextPage;
                    cursor = (_c = result.search.pageInfo.endCursor) !== null && _c !== void 0 ? _c : null;
                    if (result.rateLimit.remaining < 200) {
                        console.warn("Rate limit low: ".concat(result.rateLimit.remaining));
                        return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 2];
                case 4:
                    month++;
                    return [3 /*break*/, 1];
                case 5:
                    unique = {};
                    for (_a = 0, out_1 = out; _a < out_1.length; _a++) {
                        pr = out_1[_a];
                        unique[pr.number] = pr;
                    }
                    return [2 /*return*/, Object.values(unique).sort(function (a, b) { return b.number - a.number; })];
            }
        });
    });
}
/** Fetch the user's profile and contribution calendar. */
function fetchProfile(now) {
    return __awaiter(this, void 0, void 0, function () {
        var result, user, cc, calendar, firstWeek;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, gql("query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){createdAt followers{totalCount} repositories(first:1){totalCount} contributionsCollection(from:$from,to:$to){totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions totalIssueContributions contributionCalendar{totalContributions weeks{firstDay contributionDays{contributionCount date}}}}}}", {
                        login: ghstats_ts_1.GH_LOGIN,
                        from: new Date(now.getTime() - 364 * 86400000).toISOString().slice(0, 10) + "T00:00:00Z",
                        to: now.toISOString(),
                    })];
                case 1:
                    result = _a.sent();
                    user = result.user;
                    cc = user.contributionsCollection.contributionCalendar;
                    calendar = { start: "", counts: cc.weeks.flatMap(function (w) { return w.contributionDays.map(function (d) { return d.contributionCount; }); }) };
                    // Find the start date of the first week.
                    // Get the start date from the first week.
                    if (cc.weeks && cc.weeks.length > 0) {
                        firstWeek = cc.weeks[0];
                        if (firstWeek === null || firstWeek === void 0 ? void 0 : firstWeek.firstDay)
                            calendar.start = firstWeek.firstDay;
                    }
                    return [2 /*return*/, {
                            login: user.login,
                            createdAt: user.createdAt,
                            followers: user.followers.totalCount,
                            publicRepos: user.repositories.totalCount,
                            calendar: calendar.counts.length > 0 ? calendar : null,
                            totals: {
                                commits: user.contributionsCollection.totalCommitContributions,
                                prs: user.contributionsCollection.totalPullRequestContributions,
                                reviews: user.contributionsCollection.totalPullRequestReviewContributions,
                                issues: user.contributionsCollection.totalIssueContributions,
                            },
                        }];
            }
        });
    });
}
/** Fetch recent merged PRs with titles from REST search for the feed. */
function fetchRecentMerges(since) {
    return __awaiter(this, void 0, void 0, function () {
        var query, result, out, _i, _a, item, m;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    query = "".concat(ghstats_ts_1.MERGED_PR_QUERY, " merged:>=").concat(since.toISOString().slice(0, 10));
                    return [4 /*yield*/, rest("/search/issues?q=".concat(encodeURIComponent(query), "&per_page=").concat(ghstats_ts_1.RECENT_LIMIT, "&sort=updated&order=desc"))];
                case 1:
                    result = _c.sent();
                    out = [];
                    for (_i = 0, _a = (_b = result.items) !== null && _b !== void 0 ? _b : []; _i < _a.length; _i++) {
                        item = _a[_i];
                        m = (0, ghstats_ts_1.mergeFromSearchItem)(item);
                        if (m)
                            out.push(m);
                        if (out.length >= ghstats_ts_1.RECENT_LIMIT)
                            break;
                    }
                    return [2 /*return*/, out];
            }
        });
    });
}
/** Fetch recent public events for the activity feed. */
function fetchRecentEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rest("/users/".concat(ghstats_ts_1.GH_LOGIN, "/events/public?per_page=100"))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, (0, ghstats_ts_1.normalizeEvents)(result)];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var now, _a, prs, profile, recent, events, repos, prRows, _i, prs_1, pr, repo, repoIdx, createdAt, mergedAt, mergedByHanthor, snapshot, json;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    now = new Date();
                    console.log("Fetching GitHub stats for ".concat(ghstats_ts_1.GH_LOGIN, " at ").concat(now.toISOString()));
                    return [4 /*yield*/, Promise.all([
                            fetchMergedPrs(now),
                            fetchProfile(now),
                            fetchRecentMerges(new Date(now.getTime() - 7 * 86400000)), // last 7 days
                            fetchRecentEvents(),
                        ])];
                case 1:
                    _a = _c.sent(), prs = _a[0], profile = _a[1], recent = _a[2], events = _a[3];
                    console.log("Fetched ".concat(prs.length, " merged PRs, ").concat(recent.length, " recent with titles, ").concat(events.length, " events"));
                    repos = new Map();
                    prRows = [];
                    for (_i = 0, prs_1 = prs; _i < prs_1.length; _i++) {
                        pr = prs_1[_i];
                        repo = pr.repository.nameWithOwner;
                        if (!repos.has(repo)) {
                            repos.set(repo, repos.size);
                        }
                        repoIdx = repos.get(repo);
                        createdAt = Math.floor(Date.parse(pr.createdAt) / 1000);
                        mergedAt = Math.floor(Date.parse(pr.mergedAt) / 1000);
                        mergedByHanthor = ((_b = pr.mergedBy) === null || _b === void 0 ? void 0 : _b.login) === ghstats_ts_1.GH_LOGIN ? 1 : 0;
                        prRows.push([repoIdx, pr.number, createdAt, mergedAt, pr.additions, pr.deletions, pr.changedFiles, mergedByHanthor]);
                    }
                    snapshot = {
                        v: 1,
                        login: ghstats_ts_1.GH_LOGIN,
                        generatedAt: now.toISOString(),
                        fullAt: now.toISOString(),
                        profile: { createdAt: profile.createdAt, followers: profile.followers, publicRepos: profile.publicRepos },
                        calendar: profile.calendar ? { start: profile.calendar.start || "", counts: profile.calendar.counts } : null,
                        totals: profile.totals,
                        repos: Array.from(repos.keys()),
                        prs: prRows,
                        recent: recent,
                        events: events,
                    };
                    json = JSON.stringify(snapshot, null, 2);
                    console.log("\nSnapshot size: ".concat(json.length, " bytes"));
                    console.log("PRs: ".concat(prRows.length, ", Repos: ").concat(repos.size, ", Recent: ").concat(recent.length, ", Events: ").concat(events.length));
                    // Write to stdout so the GitHub Action can capture it.
                    console.log("===== SNAPSHOT JSON START =====");
                    console.log(json);
                    console.log("===== SNAPSHOT JSON END =====");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
