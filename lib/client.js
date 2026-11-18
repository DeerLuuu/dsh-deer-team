window.__ModuleLoader__.load({
	id: "deers-dsh-agent-team",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/client/icons.js
		/** Plugin-owned icons avoid depending on the host's generated design-export names. */
		const stroke = {
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		};
		function IconBranchOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "3",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "4",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "13",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("path", { d: "M4 4.5v7M4 9h3a5 5 0 0 0 5-3.5" })
				]
			});
		}
		function IconChevronDownOutline14() {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				"aria-hidden": "true",
				...stroke,
				children: (0, react_jsx_runtime.jsx)("path", { d: "m3 5 4 4 4-4" })
			});
		}
		function IconPanelLeftOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [(0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "2.5",
					width: "12",
					height: "11",
					rx: "2"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M6 2.5v11" })]
			});
		}
		function IconStopFill16() {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("rect", {
					x: "4",
					y: "4",
					width: "8",
					height: "8",
					rx: "1",
					fill: "currentColor"
				})
			});
		}
		function IconWarningOutline16() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				...stroke,
				children: [(0, react_jsx_runtime.jsx)("path", { d: "m7 2-5.5 10a1 1 0 0 0 1 1.5h11a1 1 0 0 0 1-1.5L9 2a1.1 1.1 0 0 0-2 0Z" }), (0, react_jsx_runtime.jsx)("path", { d: "M8 6v3m0 2v.1" })]
			});
		}
		//#endregion
		//#region lib/client/session-navigation.js
		/** Version-tolerant navigation into durable AgentTeams member transcripts. */
		/** Newer sessions retain view ownership instead of publishing list.current. */
		function currentSessionId(state) {
			if ("current" in state) return state.current;
			return Object.values(state.byId).find((row) => (row.retainedBy?.mainView ?? 0) > 0)?.id;
		}
		/**
		* Open one member's persisted transcript.
		*
		* Harness rc.8 intentionally removed cold subagents from the ordinary session
		* list, so they must be opened with the exact parent/child/mode address.
		* `uiWorkspace.openSession` (0.2.1) is the owned navigation action and is
		* preferred whenever the composition supplies it; `ISessions.open` /
		* `openSubagent` / `refreshSubagents` are gone there ("navigation belongs to
		* view owners"), so those branches only serve older hosts. New layouts also
		* select the Conversation panel and cancel catalog refreshes superseded by
		* navigation.
		*/
		async function openAgentTeamMember(sessions, parentSessionId, childSessionId, layout, workspace) {
			const navigation = layout?.beginNavigation?.();
			if (workspace !== void 0) {
				if (navigation?.aborted) return "cancelled";
				workspace.openSession({
					parentSessionId,
					childSessionId,
					mode: "continuable"
				});
				layout?.selectPanel?.(null);
				return "subagent";
			}
			if (sessions.openSubagent === void 0 || sessions.refreshSubagents === void 0) {
				if (sessions.open === void 0) throw new Error("Harness does not expose session navigation");
				sessions.open(childSessionId);
				layout?.selectPanel?.(null);
				return "session";
			}
			await sessions.refreshSubagents(parentSessionId);
			if (navigation?.aborted) return "cancelled";
			const retained = sessions.subagentAddress?.(childSessionId);
			sessions.openSubagent(retained?.parentSessionId === parentSessionId ? retained : {
				parentSessionId,
				childSessionId,
				mode: "continuable"
			});
			layout?.selectPanel?.(null);
			return "subagent";
		}
		//#endregion
		//#region \0dsh-css:C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\src\client\BlackboardPanel.module.css.mjs
		const css$4 = "._8PX6_q_board{border-top:1px solid var(--dsw-alias-border-l2);margin:10px 0 2px;padding-top:8px}._8PX6_q_toggle{width:100%;color:var(--dsw-alias-label-primary);font:inherit;font-size:calc(13px + var(--deers-font-boost,0px));cursor:pointer;text-align:left;background:0 0;border:none;justify-content:space-between;align-items:center;gap:8px;padding:4px 2px;display:flex}._8PX6_q_toggle:hover{color:var(--dsw-alias-state-business-primary)}._8PX6_q_chevron{color:var(--dsw-alias-label-secondary);font-size:11px}._8PX6_q_panel{flex-direction:column;gap:8px;padding:8px 0 4px;display:flex}._8PX6_q_toolbar{justify-content:space-between;align-items:baseline;gap:8px;display:flex}._8PX6_q_hint{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));margin:0;line-height:1.5}._8PX6_q_linkButton{color:var(--dsw-alias-state-business-primary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border:none;padding:0}._8PX6_q_linkButton:disabled{opacity:.5;cursor:default}._8PX6_q_error{color:var(--dsw-alias-state-error-primary,#f87171);font-size:calc(11px + var(--deers-font-boost,0px));align-items:center;gap:6px;margin:0;display:flex}._8PX6_q_list{flex-direction:column;gap:6px;max-height:320px;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}._8PX6_q_entry{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 97%, transparent);border-radius:8px;padding:8px 10px}._8PX6_q_entryHead{flex-wrap:wrap;align-items:baseline;gap:6px;margin-bottom:4px;display:flex}._8PX6_q_author{font-weight:600;font-size:calc(11px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary)}._8PX6_q_kind,._8PX6_q_pinned{font-size:calc(10px + var(--deers-font-boost,0px));background:var(--dsw-alias-bg-layer-2,#7f7f7f29);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:0 6px}._8PX6_q_pinned{color:var(--dsw-alias-state-business-primary)}._8PX6_q_time{color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));margin-left:auto}._8PX6_q_content{white-space:pre-wrap;overflow-wrap:anywhere;font-size:calc(12px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary);margin:0;line-height:1.55}._8PX6_q_votes{gap:6px;margin-top:6px;display:flex}._8PX6_q_voteButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border-radius:999px;padding:1px 8px}._8PX6_q_voteButton:hover:not(:disabled),._8PX6_q_voteButton[data-active]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}._8PX6_q_voteButton:disabled{opacity:.5;cursor:default}._8PX6_q_composer{flex-direction:column;gap:6px;display:flex}._8PX6_q_textarea{box-sizing:border-box;resize:vertical;border:1px solid var(--dsw-alias-border-l2);width:100%;color:inherit;font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));background:0 0;border-radius:8px;padding:8px 10px}._8PX6_q_textarea:focus{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._8PX6_q_composerRow{justify-content:space-between;align-items:center;gap:8px;display:flex}._8PX6_q_kindLabel{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));align-items:center;gap:6px;display:inline-flex}._8PX6_q_select{font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);background:0 0;border-radius:6px;padding:2px 6px}._8PX6_q_post{font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));cursor:pointer;color:var(--dsw-alias-label-on-primary,#fff);background:var(--dsw-alias-state-business-primary);border:none;border-radius:8px;padding:5px 14px}._8PX6_q_post:disabled{opacity:.5;cursor:default}._8PX6_q_toolbarActions{flex:none;gap:10px;display:inline-flex}._8PX6_q_cleanupInfo{color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));margin:0;line-height:1.45}._8PX6_q_notice{color:var(--dsw-alias-state-success-primary,#16a34a);font-size:calc(11px + var(--deers-font-boost,0px));margin:0}._8PX6_q_filters{flex-wrap:wrap;align-items:center;gap:6px;display:flex}._8PX6_q_search{border:1px solid var(--dsw-alias-border-l2);min-width:120px;color:inherit;font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));background:0 0;border-radius:6px;flex:150px;padding:5px 8px}._8PX6_q_search:focus{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._8PX6_q_filters ._8PX6_q_select{flex:none}._8PX6_q_kindChips{flex-wrap:wrap;gap:4px;display:flex}._8PX6_q_chip{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(10px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border-radius:999px;padding:2px 9px}._8PX6_q_chip:hover{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb, var(--dsw-alias-label-tertiary) 40%, var(--dsw-alias-border-l2))}._8PX6_q_chip[data-active]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);color:var(--dsw-alias-state-business-primary)}._8PX6_q_chip[data-kind=proposal][data-active]{border-color:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 55%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 12%, transparent);color:var(--dsw-alias-state-warning-primary,#b45309)}._8PX6_q_chip[data-kind=decision][data-active]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary,#16a34a) 50%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-success-primary,#16a34a) 10%, transparent);color:var(--dsw-alias-state-success-primary,#15803d)}._8PX6_q_group{flex-direction:column;gap:4px;display:flex}._8PX6_q_groupTitle{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));align-items:center;gap:8px;margin:6px 0 2px;font-weight:650;display:flex}._8PX6_q_groupTitle span{background:color-mix(in srgb, var(--dsw-alias-bg-layer-2,transparent) 55%, transparent);color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));border-radius:999px;padding:0 7px;font-weight:500}._8PX6_q_select option,._8PX6_q_select optgroup{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}";
		const tagId$4 = "deers-dsh-agent-team/BlackboardPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deers-dsh-agent-team";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var BlackboardPanel_module_css_default = {
			"author": "_8PX6_q_author",
			"board": "_8PX6_q_board",
			"chevron": "_8PX6_q_chevron",
			"chip": "_8PX6_q_chip",
			"cleanupInfo": "_8PX6_q_cleanupInfo",
			"composer": "_8PX6_q_composer",
			"composerRow": "_8PX6_q_composerRow",
			"content": "_8PX6_q_content",
			"entry": "_8PX6_q_entry",
			"entryHead": "_8PX6_q_entryHead",
			"error": "_8PX6_q_error",
			"filters": "_8PX6_q_filters",
			"group": "_8PX6_q_group",
			"groupTitle": "_8PX6_q_groupTitle",
			"hint": "_8PX6_q_hint",
			"kind": "_8PX6_q_kind",
			"kindChips": "_8PX6_q_kindChips",
			"kindLabel": "_8PX6_q_kindLabel",
			"linkButton": "_8PX6_q_linkButton",
			"list": "_8PX6_q_list",
			"notice": "_8PX6_q_notice",
			"panel": "_8PX6_q_panel",
			"pinned": "_8PX6_q_pinned",
			"post": "_8PX6_q_post",
			"search": "_8PX6_q_search",
			"select": "_8PX6_q_select",
			"textarea": "_8PX6_q_textarea",
			"time": "_8PX6_q_time",
			"toggle": "_8PX6_q_toggle",
			"toolbar": "_8PX6_q_toolbar",
			"toolbarActions": "_8PX6_q_toolbarActions",
			"voteButton": "_8PX6_q_voteButton",
			"votes": "_8PX6_q_votes"
		};
		//#endregion
		//#region lib/client/BlackboardPanel.js
		/**
		* Shared blackboard panel: the human side of the team's brainstorming feed.
		*
		* Reads `GET /plugins/deers-dsh-agent-team/blackboard` and writes through the
		* same route (post / vote / cleanup). The human acts as the captain, matching
		* the captain-authored messages the model tools already attribute to `captain`.
		* @module deers-dsh-agent-team/client/BlackboardPanel
		*/
		const ENDPOINT$1 = "/plugins/deers-dsh-agent-team/blackboard";
		const KINDS = [
			"note",
			"idea",
			"proposal",
			"decision"
		];
		const KIND_KEY = {
			note: "board.kind.note",
			idea: "board.kind.idea",
			proposal: "board.kind.proposal",
			decision: "board.kind.decision"
		};
		function kindOf(value) {
			return KINDS.includes(value) ? value : "note";
		}
		function votesOf(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
			const votes = {};
			for (const [voter, vote] of Object.entries(value)) if (vote === "up" || vote === "down") votes[voter] = vote;
			return votes;
		}
		function entryOf(raw) {
			if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
			const record = raw;
			const id = typeof record["id"] === "string" ? record["id"] : "";
			const content = typeof record["content"] === "string" ? record["content"] : "";
			if (id === "" || content === "") return void 0;
			return {
				id,
				author: typeof record["author"] === "string" ? record["author"] : "",
				kind: kindOf(record["kind"]),
				content,
				createdAt: typeof record["createdAt"] === "number" ? record["createdAt"] : 0,
				pinned: record["pinned"] === true,
				votes: votesOf(record["votes"])
			};
		}
		function cleanupOf(raw) {
			if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
			const record = raw;
			return {
				enabled: record["enabled"] === true,
				retentionDays: typeof record["retentionDays"] === "number" ? record["retentionDays"] : 30,
				keepLatest: typeof record["keepLatest"] === "number" ? record["keepLatest"] : 10,
				keepPinned: record["keepPinned"] !== false,
				keepDecisions: record["keepDecisions"] !== false
			};
		}
		function tallyOf(votes) {
			let up = 0;
			let down = 0;
			for (const vote of Object.values(votes)) if (vote === "up") up += 1;
			else down += 1;
			return {
				up,
				down
			};
		}
		function timeOf(createdAt) {
			if (!Number.isFinite(createdAt) || createdAt <= 0) return "";
			try {
				return new Date(createdAt).toLocaleString();
			} catch {
				return "";
			}
		}
		/** One team's blackboard, collapsed until the human opens it. */
		function BlackboardPanel({ teamId, captainSessionId, t, readOnly = false }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [entries, setEntries] = (0, react.useState)([]);
			const [cleanup, setCleanup] = (0, react.useState)();
			const [lastCleanupAt, setLastCleanupAt] = (0, react.useState)();
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)("");
			const [kind, setKind] = (0, react.useState)("note");
			const [posting, setPosting] = (0, react.useState)(false);
			const [authorFilter, setAuthorFilter] = (0, react.useState)("all");
			const [kindFilter, setKindFilter] = (0, react.useState)("all");
			const [query, setQuery] = (0, react.useState)("");
			const [groupBy, setGroupBy] = (0, react.useState)("none");
			const [cleaning, setCleaning] = (0, react.useState)(false);
			const refresh = (0, react.useCallback)(async () => {
				setLoading(true);
				try {
					const response = await fetch(`${ENDPOINT$1}?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`, { cache: "no-store" });
					if (!response.ok) {
						let message = `HTTP ${response.status}`;
						try {
							const body = await response.json();
							if (typeof body.error === "string" && body.error !== "") message = body.error;
						} catch {}
						throw new Error(message);
					}
					const body = await response.json();
					const next = Array.isArray(body.entries) ? body.entries.map(entryOf).filter((entry) => entry !== void 0) : [];
					setEntries(next);
					setCleanup(cleanupOf(body.cleanup));
					setLastCleanupAt(typeof body.lastCleanupAt === "number" ? body.lastCleanupAt : void 0);
					setError("");
				} catch (failure) {
					setError(t("board.error", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setLoading(false);
				}
			}, [
				captainSessionId,
				t,
				teamId
			]);
			(0, react.useEffect)(() => {
				if (open) refresh();
			}, [open, refresh]);
			const send = (0, react.useCallback)(async (payload) => {
				const response = await fetch(ENDPOINT$1, {
					method: "POST",
					cache: "no-store",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionId: captainSessionId,
						teamId,
						...payload
					})
				});
				if (!response.ok) {
					let message = `HTTP ${response.status}`;
					try {
						const body = await response.json();
						if (typeof body.error === "string" && body.error !== "") message = body.error;
					} catch {}
					throw new Error(message);
				}
				return await response.json().catch(() => ({}));
			}, [captainSessionId, teamId]);
			const post = (0, react.useCallback)(async () => {
				if (posting || draft.trim() === "") return;
				setPosting(true);
				setNotice("");
				try {
					await send({
						action: "post",
						content: draft,
						kind
					});
					setDraft("");
					await refresh();
				} catch (failure) {
					setError(t("board.postFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setPosting(false);
				}
			}, [
				draft,
				kind,
				posting,
				refresh,
				send,
				t
			]);
			const vote = (0, react.useCallback)(async (entryId, value) => {
				try {
					await send({
						action: "vote",
						entryId,
						vote: value
					});
					await refresh();
				} catch (failure) {
					setError(t("board.voteFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				}
			}, [
				refresh,
				send,
				t
			]);
			const cleanupNow = (0, react.useCallback)(async () => {
				if (cleaning) return;
				setCleaning(true);
				setNotice("");
				try {
					const result = await send({ action: "cleanup" });
					const removed = typeof result["removed"] === "number" ? result["removed"] : 0;
					setNotice(t("board.cleanupDone", { removed }));
					await refresh();
				} catch (failure) {
					setError(t("board.cleanupFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setCleaning(false);
				}
			}, [
				cleaning,
				refresh,
				send,
				t
			]);
			const authors = (0, react.useMemo)(() => {
				return [...new Set(entries.map((entry) => entry.author))].sort((left, right) => left === "captain" ? -1 : right === "captain" ? 1 : left.localeCompare(right));
			}, [entries]);
			const kindCounts = (0, react.useMemo)(() => {
				const counts = {
					note: 0,
					idea: 0,
					proposal: 0,
					decision: 0
				};
				for (const entry of entries) counts[entry.kind] += 1;
				return counts;
			}, [entries]);
			const filtered = (0, react.useMemo)(() => {
				const needle = query.trim().toLowerCase();
				return entries.filter((entry) => (authorFilter === "all" || entry.author === authorFilter) && (kindFilter === "all" || entry.kind === kindFilter) && (needle === "" || entry.content.toLowerCase().includes(needle) || entry.author.toLowerCase().includes(needle)));
			}, [
				authorFilter,
				entries,
				kindFilter,
				query
			]);
			const groups = (0, react.useMemo)(() => {
				if (groupBy === "kind") return KINDS.filter((item) => filtered.some((entry) => entry.kind === item)).map((item) => ({
					key: item,
					label: t(KIND_KEY[item]),
					items: filtered.filter((entry) => entry.kind === item)
				}));
				if (groupBy === "author") return authors.filter((author) => filtered.some((entry) => entry.author === author)).map((author) => ({
					key: author,
					label: author === "captain" ? t("board.author.captain") : author,
					items: filtered.filter((entry) => entry.author === author)
				}));
				return filtered.length === 0 ? [] : [{
					key: "all",
					label: "",
					items: filtered
				}];
			}, [
				authors,
				filtered,
				groupBy,
				t
			]);
			const renderEntry = (entry) => {
				const tally = tallyOf(entry.votes);
				const mine = entry.votes["captain"];
				return (0, react_jsx_runtime.jsxs)("li", {
					className: BlackboardPanel_module_css_default.entry,
					"data-kind": entry.kind,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.entryHead,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: BlackboardPanel_module_css_default.author,
									children: entry.author === "captain" ? t("board.author.captain") : entry.author
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: BlackboardPanel_module_css_default.kind,
									children: t(KIND_KEY[entry.kind])
								}),
								entry.pinned && (0, react_jsx_runtime.jsx)("span", {
									className: BlackboardPanel_module_css_default.pinned,
									children: t("board.pinned")
								}),
								(0, react_jsx_runtime.jsx)("time", {
									className: BlackboardPanel_module_css_default.time,
									children: timeOf(entry.createdAt)
								})
							]
						}),
						(0, react_jsx_runtime.jsx)("p", {
							className: BlackboardPanel_module_css_default.content,
							children: entry.content
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.votes,
							children: [(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BlackboardPanel_module_css_default.voteButton,
								"data-active": mine === "up" || void 0,
								"aria-label": t("board.up"),
								title: t("board.up"),
								disabled: readOnly,
								onClick: () => {
									vote(entry.id, mine === "up" ? "clear" : "up");
								},
								children: ["▲ ", tally.up]
							}), (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BlackboardPanel_module_css_default.voteButton,
								"data-active": mine === "down" || void 0,
								"aria-label": t("board.down"),
								title: t("board.down"),
								disabled: readOnly,
								onClick: () => {
									vote(entry.id, mine === "down" ? "clear" : "down");
								},
								children: ["▼ ", tally.down]
							})]
						})
					]
				}, entry.id);
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: BlackboardPanel_module_css_default.board,
				"data-blackboard": true,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: BlackboardPanel_module_css_default.toggle,
					onClick: () => setOpen((current) => !current),
					"aria-expanded": open,
					"data-board-toggle": true,
					children: [(0, react_jsx_runtime.jsx)("span", { children: t("board.toggle", { count: entries.length }) }), (0, react_jsx_runtime.jsx)("span", {
						className: BlackboardPanel_module_css_default.chevron,
						"aria-hidden": true,
						children: open ? "▾" : "▸"
					})]
				}), open && (0, react_jsx_runtime.jsxs)("div", {
					className: BlackboardPanel_module_css_default.panel,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.toolbar,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: BlackboardPanel_module_css_default.hint,
								children: t("board.captainHint")
							}), (0, react_jsx_runtime.jsxs)("span", {
								className: BlackboardPanel_module_css_default.toolbarActions,
								children: [!readOnly && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: BlackboardPanel_module_css_default.linkButton,
									onClick: () => {
										cleanupNow();
									},
									disabled: cleaning || loading,
									children: cleaning ? t("board.cleaning") : t("board.cleanupNow")
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: BlackboardPanel_module_css_default.linkButton,
									onClick: () => {
										refresh();
									},
									disabled: loading,
									children: t("board.refresh")
								})]
							})]
						}),
						cleanup !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
							className: BlackboardPanel_module_css_default.cleanupInfo,
							children: [t("board.cleanupPolicy", {
								days: cleanup.retentionDays,
								latest: cleanup.keepLatest,
								disabled: cleanup.enabled ? "" : t("board.cleanupDisabledSuffix")
							}), lastCleanupAt === void 0 ? "" : ` · ${t("board.lastCleanup", { time: timeOf(lastCleanupAt) })}`]
						}),
						error !== "" && (0, react_jsx_runtime.jsxs)("p", {
							role: "alert",
							className: BlackboardPanel_module_css_default.error,
							children: [(0, react_jsx_runtime.jsx)(IconWarningOutline16, {}), error]
						}),
						notice !== "" && (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							className: BlackboardPanel_module_css_default.notice,
							children: notice
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.filters,
							children: [
								(0, react_jsx_runtime.jsx)("input", {
									className: BlackboardPanel_module_css_default.search,
									value: query,
									placeholder: t("board.filter.searchPlaceholder"),
									"aria-label": t("board.filter.searchAria"),
									onChange: (event) => setQuery(event.target.value)
								}),
								(0, react_jsx_runtime.jsxs)("select", {
									className: BlackboardPanel_module_css_default.select,
									value: authorFilter,
									"aria-label": t("board.filter.authorAria"),
									onChange: (event) => setAuthorFilter(event.target.value),
									children: [(0, react_jsx_runtime.jsx)("option", {
										value: "all",
										children: t("board.filter.allAuthors")
									}), authors.map((author) => (0, react_jsx_runtime.jsx)("option", {
										value: author,
										children: author === "captain" ? t("board.author.captain") : author
									}, author))]
								}),
								(0, react_jsx_runtime.jsxs)("select", {
									className: BlackboardPanel_module_css_default.select,
									value: groupBy,
									"aria-label": t("board.filter.groupAria"),
									onChange: (event) => setGroupBy(event.target.value),
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "none",
											children: t("board.group.none")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "kind",
											children: t("board.group.kind")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "author",
											children: t("board.group.author")
										})
									]
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.kindChips,
							role: "group",
							"aria-label": t("board.filter.kindAria"),
							children: [(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BlackboardPanel_module_css_default.chip,
								"data-active": kindFilter === "all" || void 0,
								onClick: () => setKindFilter("all"),
								children: [
									t("board.filter.allKinds"),
									" ",
									entries.length
								]
							}), KINDS.map((item) => (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BlackboardPanel_module_css_default.chip,
								"data-kind": item,
								"data-active": kindFilter === item || void 0,
								onClick: () => setKindFilter(item),
								children: [
									t(KIND_KEY[item]),
									" ",
									kindCounts[item]
								]
							}, item))]
						}),
						loading && entries.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: BlackboardPanel_module_css_default.hint,
							children: t("board.loading")
						}),
						!loading && entries.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: BlackboardPanel_module_css_default.hint,
							children: t("board.empty")
						}),
						!loading && entries.length > 0 && filtered.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: BlackboardPanel_module_css_default.hint,
							children: t("board.filter.empty")
						}),
						groups.map((group) => (0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.group,
							children: [group.label !== "" && (0, react_jsx_runtime.jsxs)("h4", {
								className: BlackboardPanel_module_css_default.groupTitle,
								children: [group.label, (0, react_jsx_runtime.jsx)("span", { children: group.items.length })]
							}), (0, react_jsx_runtime.jsx)("ul", {
								className: BlackboardPanel_module_css_default.list,
								children: group.items.map(renderEntry)
							})]
						}, group.key)),
						readOnly ? (0, react_jsx_runtime.jsx)("p", {
							className: BlackboardPanel_module_css_default.hint,
							children: t("board.readOnly")
						}) : (0, react_jsx_runtime.jsxs)("div", {
							className: BlackboardPanel_module_css_default.composer,
							children: [(0, react_jsx_runtime.jsx)("textarea", {
								className: BlackboardPanel_module_css_default.textarea,
								value: draft,
								rows: 3,
								placeholder: t("board.placeholder"),
								onChange: (event) => setDraft(event.target.value)
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: BlackboardPanel_module_css_default.composerRow,
								children: [(0, react_jsx_runtime.jsxs)("label", {
									className: BlackboardPanel_module_css_default.kindLabel,
									children: [t("board.kind"), (0, react_jsx_runtime.jsx)("select", {
										className: BlackboardPanel_module_css_default.select,
										value: kind,
										onChange: (event) => setKind(kindOf(event.target.value)),
										children: KINDS.map((item) => (0, react_jsx_runtime.jsx)("option", {
											value: item,
											children: t(KIND_KEY[item])
										}, item))
									})]
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: BlackboardPanel_module_css_default.post,
									disabled: posting || draft.trim() === "",
									onClick: () => {
										post();
									},
									children: posting ? t("board.posting") : t("board.post")
								})]
							})]
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/client/poll-window-state.js
		/**
		* Shared state for the dedicated poll floating window.
		*
		* The team section's vote button opens the window; the floater registered in
		* `shell.overlay` subscribes here. Module-scoped because the client plugin has
		* exactly one instance per page.
		* @module deers-dsh-agent-team/client/poll-window-state
		*/
		let target = null;
		const listeners = /* @__PURE__ */ new Set();
		function emit() {
			for (const listener of [...listeners]) listener();
		}
		/** Open (or retarget) the poll window. */
		function openPollWindow(next) {
			target = next;
			emit();
		}
		/** Close the poll window. */
		function closePollWindow() {
			if (target === null) return;
			target = null;
			emit();
		}
		/** Current target; `useSyncExternalStore` snapshot. */
		function getPollWindow() {
			return target;
		}
		/** Subscribe to open/close/retarget. */
		function subscribePollWindow(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
		/** Compact `provider/model` route, or just the model when the provider is absent. */
		function memberRouteLabel(member) {
			if (member === void 0) return "";
			const provider = member.provider?.trim() ?? "";
			const model = member.model?.trim() ?? "";
			if (provider !== "" && model !== "") return `${provider}/${model}`;
			return model;
		}
		/**
		* Compact route shown on a running task. Prefer the task's own snapshot
		* field; fall back to the assignee member when older hosts omit it.
		*/
		function taskModelLabel(task, members) {
			const direct = task.model?.trim() ?? "";
			if (direct !== "") return direct;
			return memberRouteLabel(members.find((candidate) => candidate.name === task.assignee));
		}
		/** Short model id for tight DAG/chip surfaces (`openai/gpt-5.6-sol` → `gpt-5.6-sol`). */
		function compactModelLabel(route) {
			const trimmed = route.trim();
			if (trimmed === "") return "";
			const slash = trimmed.lastIndexOf("/");
			return slash === -1 ? trimmed : trimmed.slice(slash + 1);
		}
		/**
		* Latest terminal-task `updatedAt` owned by one member.
		* @param memberName - member whose owned tasks are scanned.
		* @param tasks - team tasks carrying durable `updatedAt` stamps.
		* @returns the newest terminal stamp, or undefined when the member owns none.
		*/
		function memberFinishedAt(memberName, tasks) {
			let latest;
			for (const task of tasks) {
				if (task.assignee !== memberName) continue;
				if (task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled") continue;
				const stamp = task.updatedAt;
				if (typeof stamp !== "number" || !Number.isFinite(stamp)) continue;
				if (latest === void 0 || stamp > latest) latest = stamp;
			}
			return latest;
		}
		/** Whether a member still has live work (running activity or an open task). */
		function memberIsRunning(member, tasks) {
			if (member.activity === "working" || member.status === "working") return true;
			return tasks.some((task) => task.assignee === member.name && (task.status === "pending" || task.status === "claimed" || task.status === "in_progress"));
		}
		/**
		* Order the delegation member list for issue #192.
		*
		* Running members keep their incoming relative order and come first; finished
		* members follow sorted by finish time, newest first. Members without a
		* derivable finish time keep their incoming relative order after the stamped
		* ones, so an older host that omits stamps never reorders them randomly.
		* @param members - delegation roster in snapshot order.
		* @param tasks - team tasks carrying durable `updatedAt` stamps.
		* @returns the members in display order.
		*/
		function orderDelegationMembers(members, tasks) {
			const running = [];
			const finishedStamped = [];
			const finishedUnstamped = [];
			members.forEach((member, index) => {
				if (memberIsRunning(member, tasks)) {
					running.push({
						member,
						index
					});
					return;
				}
				const finishedAt = memberFinishedAt(member.name, tasks);
				if (finishedAt === void 0) finishedUnstamped.push({
					member,
					index
				});
				else finishedStamped.push({
					member,
					index,
					finishedAt
				});
			});
			finishedStamped.sort((left, right) => right.finishedAt - left.finishedAt || left.index - right.index);
			return [
				...running,
				...finishedStamped,
				...finishedUnstamped
			].map((entry) => entry.member);
		}
		/** Whether the captain chat should keep showing the in-progress banner. */
		function teamIsActive(team) {
			if (team.halted === true || team.phase === "staged") return false;
			if (team.members.some((member) => member.activity === "working" || member.status === "working")) return true;
			if (team.tasks.some((task) => task.status === "pending" || task.status === "claimed" || task.status === "in_progress")) return true;
			return team.members.length > 0 && team.tasks.length === 0;
		}
		/** Use a fill-width grid when the task graph has no real dependency edges. */
		function usesParallelTaskGrid(tasks) {
			if (tasks.length === 0) return false;
			const taskIds = new Set(tasks.map((task) => task.id));
			return tasks.every((task) => task.dependencies.every((dependency) => !taskIds.has(dependency)));
		}
		/**
		* Whether an expanded activity panel still belongs to the current session.
		*
		* The panel is mounted in the root-scoped shell overlay, so React does not
		* remount it when the conversation route changes. Ownership keeps an expanded
		* panel from leaking onto the new-session screen (or another conversation)
		* while its local open state is being reset.
		*/
		function activityPanelExpandedForSession(open, owner, current) {
			return open && owner !== void 0 && owner === current;
		}
		/**
		* Auto-expand only for live teams that appear after the current session's
		* initial restore pass. Replayed cards, archived teams, and live teams restored
		* while reopening a conversation must remain behind the collapsed badge.
		*/
		function activityPanelShouldAutoExpand({ alreadyAutoOpened, pageSettled, restoreComplete, previousLiveTeamIds, currentLiveTeamIds }) {
			return !alreadyAutoOpened && pageSettled && restoreComplete && currentLiveTeamIds.some((teamId) => !previousLiveTeamIds.has(teamId));
		}
		/**
		* Resolve the task whose dependency chain should be highlighted.
		*
		* A pinned task is an explicit user choice. Keyboard focus takes precedence
		* over delayed pointer intent so an older hover timer cannot steal the active
		* chain from someone navigating the task map with the keyboard.
		*/
		function dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId) {
			return pinnedTaskId ?? keyboardTaskId ?? hoverTaskId;
		}
		/** Group tasks by their precomputed dependency depth. */
		function taskStages(tasks) {
			const byDepth = /* @__PURE__ */ new Map();
			for (const task of tasks) {
				const depth = Number.isFinite(task.depth) ? Math.max(0, Math.floor(task.depth)) : 0;
				const stage = byDepth.get(depth) ?? [];
				stage.push(task);
				byDepth.set(depth, stage);
			}
			return [...byDepth.entries()].sort(([left], [right]) => left - right).map(([depth, stageTasks]) => ({
				depth,
				tasks: stageTasks.slice().sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }))
			}));
		}
		/**
		* Lay tasks out as the reference panel's compact left-to-right DAG.
		*
		* Columns are dependency-depth stages. Rows are stable task-id order within
		* each stage. Edges use cubic curves so fan-in remains readable without
		* turning every task into a large card.
		*/
		function compactDagLayout(tasks, dimensions) {
			const nodeWidth = dimensions?.nodeWidth ?? 92;
			const nodeHeight = dimensions?.nodeHeight ?? 30;
			const columnGap = dimensions?.columnGap ?? 26;
			const rowGap = dimensions?.rowGap ?? 8;
			const stages = taskStages(tasks);
			const positions = /* @__PURE__ */ new Map();
			const nodes = [];
			for (const [column, stage] of stages.entries()) for (const [row, task] of stage.tasks.entries()) {
				const x = column * (nodeWidth + columnGap);
				const y = row * (nodeHeight + rowGap);
				positions.set(task.id, {
					x,
					y
				});
				nodes.push({
					task,
					x,
					y
				});
			}
			const edges = [];
			for (const task of tasks) {
				const target = positions.get(task.id);
				if (target === void 0) continue;
				for (const dependency of task.dependencies) {
					const source = positions.get(dependency);
					if (source === void 0) continue;
					const x1 = source.x + nodeWidth;
					const y1 = source.y + nodeHeight / 2;
					const x2 = target.x;
					const y2 = target.y + nodeHeight / 2;
					edges.push({
						from: dependency,
						to: task.id,
						path: `M${x1} ${y1}C${x1 + 14} ${y1},${x2 - 14} ${y2},${x2} ${y2}`
					});
				}
			}
			const rows = Math.max(1, ...stages.map((stage) => stage.tasks.length));
			return {
				width: stages.length === 0 ? 0 : stages.length * nodeWidth + (stages.length - 1) * columnGap,
				height: stages.length === 0 ? 0 : rows * nodeHeight + (rows - 1) * rowGap,
				nodes,
				edges
			};
		}
		/**
		* Return the complete upstream/downstream chain around one task.
		*
		* Traversal uses both dependency directions and remains cycle-safe, so the UI
		* can highlight every handoff related to the focused task even if malformed
		* durable data contains a cycle.
		*/
		function relatedTaskIds(taskId, tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			if (!byId.has(taskId)) return /* @__PURE__ */ new Set();
			const dependents = /* @__PURE__ */ new Map();
			for (const task of tasks) for (const dependency of task.dependencies) {
				const targets = dependents.get(dependency) ?? [];
				targets.push(task.id);
				dependents.set(dependency, targets);
			}
			const related = /* @__PURE__ */ new Set();
			const upstreamSeen = /* @__PURE__ */ new Set();
			const downstreamSeen = /* @__PURE__ */ new Set();
			const visitUpstream = (id) => {
				if (upstreamSeen.has(id)) return;
				upstreamSeen.add(id);
				related.add(id);
				for (const dependency of byId.get(id)?.dependencies ?? []) visitUpstream(dependency);
			};
			const visitDownstream = (id) => {
				if (downstreamSeen.has(id)) return;
				downstreamSeen.add(id);
				related.add(id);
				for (const dependent of dependents.get(id) ?? []) visitDownstream(dependent);
			};
			visitUpstream(taskId);
			visitDownstream(taskId);
			return related;
		}
		//#endregion
		//#region lib/client/activity-monitor.js
		/** Shared, demand-driven state for the AgentTeams browser monitor. */
		const targets = /* @__PURE__ */ new Map();
		const targetListeners = /* @__PURE__ */ new Set();
		const snapshotListeners = /* @__PURE__ */ new Set();
		let targetSnapshot = [];
		let activitySnapshots = {
			teams: [],
			archivedTeams: []
		};
		function targetKey(sessionId, teamId) {
			return `${sessionId}\u0000${teamId}`;
		}
		function publishTargets() {
			targetSnapshot = [...targets.values()].filter((target) => target.active).map(({ key, sessionId, teamId }) => ({
				key,
				sessionId,
				teamId
			}));
			for (const listener of targetListeners) listener();
		}
		/** Subscribe to the active monitor-target list (React external-store shape). */
		function subscribeActivityMonitorTargets(listener) {
			targetListeners.add(listener);
			return () => {
				targetListeners.delete(listener);
			};
		}
		/** Read the stable active-target snapshot. */
		function getActivityMonitorTargetsSnapshot() {
			return targetSnapshot;
		}
		/**
		* Register one successful AgentTeams card as a monitoring demand.
		*
		* The returned cleanup is reference-counted so multiple cards and React
		* StrictMode remounts cannot stop another card's monitor.
		*/
		function monitorAgentTeam(sessionId, teamId) {
			const owner = sessionId.trim();
			const id = teamId.trim();
			if (owner === "" || id === "") return () => {};
			const key = targetKey(owner, id);
			const existing = targets.get(key);
			if (existing === void 0) {
				targets.set(key, {
					key,
					sessionId: owner,
					teamId: id,
					refs: 1,
					active: true
				});
				publishTargets();
			} else {
				existing.refs += 1;
				if (!existing.active) {
					existing.active = true;
					publishTargets();
				}
			}
			let released = false;
			return () => {
				if (released) return;
				released = true;
				const current = targets.get(key);
				if (current === void 0) return;
				current.refs -= 1;
				if (current.refs <= 0) {
					targets.delete(key);
					if (current.active) publishTargets();
				}
			};
		}
		/** Stop polling targets whose final archived snapshot has been captured. */
		function settleActivityMonitorTargets(keys) {
			let changed = false;
			for (const key of keys) {
				const target = targets.get(key);
				if (target?.active !== true) continue;
				target.active = false;
				changed = true;
			}
			if (changed) publishTargets();
		}
		/** Subscribe to the shared live/archive snapshot. */
		function subscribeActivitySnapshots(listener) {
			snapshotListeners.add(listener);
			return () => {
				snapshotListeners.delete(listener);
			};
		}
		/** Read the stable shared live/archive snapshot. */
		function getActivitySnapshotsSnapshot() {
			return activitySnapshots;
		}
		/** Publish one or both successful state-route responses. */
		function updateActivitySnapshots(update) {
			const next = {
				teams: update.teams ?? activitySnapshots.teams,
				archivedTeams: update.archivedTeams ?? activitySnapshots.archivedTeams
			};
			if (next.teams === activitySnapshots.teams && next.archivedTeams === activitySnapshots.archivedTeams) return;
			activitySnapshots = next;
			for (const listener of snapshotListeners) listener();
		}
		/** Poll cadence for the live host snapshot route. */
		const ACTIVITY_POLL_MS = 1e3;
		/**
		* Low-frequency probe cadence while a cardless discovery session still owns
		* no team. The probe keeps the panel able to pick up a team created later in
		* that session (e.g. a run_code-wrapped deers_team_create) without turning
		* every ordinary session into a one-second filesystem scan.
		*/
		const ACTIVITY_PROBE_MS = 5e3;
		/** Host route serving live and archived team snapshots. */
		const ACTIVITY_STATE_URL = "/plugins/deers-dsh-agent-team/state";
		const ACTIVITY_HALT_URL = "/plugins/deers-dsh-agent-team/halt";
		/**
		* Start the single polling loop for the current session's requested targets.
		*
		* With neither targets nor a discovery session this is deliberately inert.
		* Explicit card targets poll at the live cadence from the start. A discovery
		* session performs an immediate live+archive restore pass, then — while it
		* still owns no team — probes on a low-frequency cadence, so a team created
		* later in that session (e.g. a run_code-wrapped deers_team_create) is
		* discovered without a manual reload, without turning every ordinary session
		* into a one-second filesystem scan. The moment a team for the discovery
		* session appears, the controller upgrades to the live one-second cadence for
		* the rest of its lifetime. The caller — the session view, which stops the
		* controller when the session is no longer current — bounds the lifetime, and
		* archive state is refreshed when a target or a previously discovered live
		* team disappears.
		*/
		function startActivityPolling(monitorTargets, runtime = {}) {
			const discoverySessionId = runtime.discoverySessionId?.trim();
			if (monitorTargets.length === 0 && (discoverySessionId === void 0 || discoverySessionId === "")) return {
				firstTick: Promise.resolve(),
				stop: () => {}
			};
			const fetchState = runtime.fetchState ?? ((url, init) => fetch(url, init));
			const schedule = runtime.schedule ?? ((callback, intervalMs) => setInterval(callback, intervalMs));
			const cancel = runtime.cancel ?? ((timer) => {
				clearInterval(timer);
			});
			const publishSnapshots = runtime.publishSnapshots ?? updateActivitySnapshots;
			const settleTargets = runtime.settleTargets ?? settleActivityMonitorTargets;
			let cancelled = false;
			let inFlight = false;
			let hot = monitorTargets.length > 0;
			let discoveryComplete = false;
			let discoveredLiveKeys = /* @__PURE__ */ new Set();
			let controller;
			let timer;
			const intervalMs = () => hot ? ACTIVITY_POLL_MS : ACTIVITY_PROBE_MS;
			const reschedule = () => {
				cancel(timer);
				timer = schedule(() => {
					tick();
				}, intervalMs());
			};
			const tick = async () => {
				if (inFlight || cancelled) return;
				inFlight = true;
				controller = new AbortController();
				try {
					const liveResponse = await fetchState(ACTIVITY_STATE_URL, {
						cache: "no-store",
						signal: controller.signal
					});
					if (!liveResponse.ok) throw new Error("Activity unavailable");
					const body = await liveResponse.json();
					if (cancelled) return;
					if (!Array.isArray(body.teams)) throw new Error("Invalid activity response");
					runtime.onStatus?.("ready");
					const liveTeams = body.teams;
					publishSnapshots({ teams: liveTeams });
					const previousDiscoveredKeys = discoveredLiveKeys;
					discoveredLiveKeys = new Set(discoverySessionId === void 0 || discoverySessionId === "" ? [] : liveTeams.filter((team) => team.captainSessionId === discoverySessionId).map((team) => team.teamId));
					if (!hot && discoveredLiveKeys.size > 0) {
						hot = true;
						reschedule();
					}
					const discoveredTeamArchived = [...previousDiscoveredKeys].some((teamId) => !discoveredLiveKeys.has(teamId));
					const missing = monitorTargets.filter((target) => !liveTeams.some((team) => team.captainSessionId === target.sessionId && team.teamId === target.teamId));
					const needsDiscoveryArchive = discoverySessionId !== void 0 && discoverySessionId !== "" && !discoveryComplete;
					if (missing.length === 0 && !needsDiscoveryArchive && !discoveredTeamArchived) return;
					const archivedResponse = await fetchState(`${ACTIVITY_STATE_URL}?archived=1`, {
						cache: "no-store",
						signal: controller.signal
					});
					if (!archivedResponse.ok) throw new Error("Archive unavailable");
					const archivedBody = await archivedResponse.json();
					if (cancelled) return;
					if (!Array.isArray(archivedBody.teams)) throw new Error("Invalid archive response");
					publishSnapshots({ archivedTeams: archivedBody.teams });
					discoveryComplete = true;
					settleTargets(new Set(missing.map((target) => target.key)));
				} catch (error) {
					if (error?.name === "AbortError") return;
					if (!cancelled) runtime.onStatus?.("error");
				} finally {
					inFlight = false;
				}
			};
			const firstTick = tick();
			if (timer === void 0) timer = schedule(() => {
				tick();
			}, intervalMs());
			return {
				firstTick,
				stop: () => {
					if (cancelled) return;
					cancelled = true;
					controller?.abort();
					cancel(timer);
				}
			};
		}
		//#endregion
		//#region lib/client/artwork.js
		/**
		* Shared deer / panda / cat artwork lookup for the activity panel and the
		* conversation card. The captain is the deer; builder roles use the panda;
		* research, design and review roles use the cat.
		* @module deers-dsh-agent-team/client/artwork
		*/
		/** Artwork route prefix served by the plugin host half. */
		const ART_BASE = "/plugins/deers-dsh-agent-team/assets/";
		/** Every character's three shipped variants. */
		const CHARACTER_ART = {
			deer: {
				full: `${ART_BASE}deer-full.webp`,
				paper: `${ART_BASE}deer-paper.webp`,
				sticker: `${ART_BASE}deer-sticker.png`
			},
			panda: {
				full: `${ART_BASE}panda-full.webp`,
				paper: `${ART_BASE}panda-paper.webp`,
				sticker: `${ART_BASE}panda-sticker.png`
			},
			cat: {
				full: `${ART_BASE}cat-full.webp`,
				paper: `${ART_BASE}cat-paper.png`,
				sticker: `${ART_BASE}cat-sticker.png`
			}
		};
		/**
		* Role keyword → character. Review/research/design come first so compound
		* titles such as "QA Engineer" or "Design Researcher" do not fall into the
		* builder bucket; builders use the panda, everything else the deer.
		*/
		const ROLE_CHARACTER = [
			[/qa\b|test|verif|quality|secur|audit|risk|review|docs|writer|product|spec|resear|investig|explor|study|design|\bui\b|\bux\b|front|theme|accessib|测试|质量|验证|安全|审计|审查|风险|文档|撰写|文案|写作|规范|研究|调查|探索|调研|设计|前端|主题|无障碍/, "cat"],
			[/coordinat|operator|release|deploy|\bops\b|lead|captain|协调|运营|发布|部署|运维|队长/, "deer"],
			[/engineer|dev\b|server|backend|\bapi\b|runtime|data|analys|metric|performance|\bbuild\b|\bci\b|ship|watcher|contract|工程|后端|服务|接口|开发|代码|编程|数据|分析|指标|性能|构建/, "panda"]
		];
		/** The captain always uses the deer. */
		const LEAD_ART = CHARACTER_ART.deer.paper;
		const LEAD_STICKER = CHARACTER_ART.deer.sticker;
		CHARACTER_ART.deer.full;
		/**
		* Character for one member identity (name + role), defaulting to the deer.
		* @param name - the member's display name.
		* @param role - the member's role text.
		* @returns one of the three shipped characters.
		*/
		function memberCharacter(name, role) {
			const identity = `${name} ${role}`.toLowerCase();
			for (const [pattern, character] of ROLE_CHARACTER) if (pattern.test(identity)) return character;
			return "deer";
		}
		/**
		* Paper-cutout artwork for a member card or roster row.
		* @param name - the member's display name.
		* @param role - the member's role text.
		*/
		function memberArtUrl(name, role) {
			return CHARACTER_ART[memberCharacter(name, role)].paper;
		}
		/**
		* Compact sticker artwork for avatars inside the conversation card or chat.
		* @param name - the member's display name.
		* @param role - the member's role text.
		*/
		function memberStickerUrl(name, role) {
			return CHARACTER_ART[memberCharacter(name, role)].sticker;
		}
		//#endregion
		//#region \0dsh-css:C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\src\client\AgentTeamsCard.module.css.mjs
		const css$3 = ".ycw-Xq_root{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:10px;flex-direction:column;gap:8px;width:100%;min-width:0;padding:10px 12px;display:flex}.ycw-Xq_head{align-items:center;gap:8px;min-width:0;display:flex}.ycw-Xq_leadAvatar{object-fit:contain;filter:drop-shadow(0 1px 1px #122d4833);background:0 0;border:0;border-radius:0;flex:none;width:30px;height:30px}.ycw-Xq_teamName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:0 auto;font-size:13px;font-weight:600;line-height:20px;overflow:hidden}.ycw-Xq_memberCount{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;margin-left:auto;font-size:11px;line-height:16px}.ycw-Xq_panelButton{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;flex:none;padding:2px 8px;font-size:10.5px;font-weight:600;line-height:16px;transition:border-color .12s,color .12s}.ycw-Xq_panelButton:hover{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}.ycw-Xq_panelButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.ycw-Xq_members{flex-wrap:wrap;gap:6px;min-width:0;display:flex}.ycw-Xq_member{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);max-width:160px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:5px;padding:3px 8px 3px 3px;font-size:11px;font-weight:500;line-height:16px;transition:border-color .12s,background-color .12s;display:inline-flex}.ycw-Xq_member:hover{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-button-ghost-active-fill)}.ycw-Xq_member:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.ycw-Xq_memberArt{object-fit:contain;filter:drop-shadow(0 1px 1px #122d482e);background:0 0;border:0;border-radius:0;width:24px;height:24px}.ycw-Xq_memberInitial{background:var(--dsw-alias-state-business-primary);width:20px;height:20px;color:var(--dsw-alias-label-primary-inverted);border-radius:50%;justify-content:center;align-items:center;font-size:10px;font-weight:600;line-height:20px;display:inline-flex}.ycw-Xq_memberName{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.ycw-Xq_chatEntry{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border-radius:7px;align-items:center;gap:5px;padding:3px 8px;font-size:12px;display:inline-flex}.ycw-Xq_chatEntry img{object-fit:contain;width:22px;height:22px}.ycw-Xq_chatEntry:hover{background:var(--dsw-alias-bg-module-platform)}.ycw-Xq_chatEntry:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.ycw-Xq_turnCards{gap:8px;margin-block:10px;display:grid}@media (width<=600px){.ycw-Xq_head{flex-wrap:wrap}}";
		const tagId$3 = "deers-dsh-agent-team/AgentTeamsCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deers-dsh-agent-team";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var AgentTeamsCard_module_css_default = {
			"chatEntry": "ycw-Xq_chatEntry",
			"head": "ycw-Xq_head",
			"leadAvatar": "ycw-Xq_leadAvatar",
			"member": "ycw-Xq_member",
			"memberArt": "ycw-Xq_memberArt",
			"memberCount": "ycw-Xq_memberCount",
			"memberInitial": "ycw-Xq_memberInitial",
			"memberName": "ycw-Xq_memberName",
			"members": "ycw-Xq_members",
			"panelButton": "ycw-Xq_panelButton",
			"root": "ycw-Xq_root",
			"teamName": "ycw-Xq_teamName",
			"turnCards": "ycw-Xq_turnCards"
		};
		//#endregion
		//#region lib/client/AgentTeamsCard.js
		/**
		* AgentTeams conversation card: the lightweight in-conversation summary for
		* one team — the captain's deer avatar and name, the member roster as
		* clickable deer avatars (opening the member's subagent transcript), and
		* an "activity panel" button that re-activates the top-right floater.
		*
		* The floater and this card share the `deers-agent-team:open-panel` window event
		* so the card can summon the panel even after it was closed (or when an old
		* session is re-opened for review).
		* @module deers-dsh-agent-team/client/card
		*/
		/** Window event name the floater listens for to open itself. */
		const OPEN_PANEL_EVENT = "deers-agent-team:open-panel";
		/** Open the matching team view, carrying this team's summary
		* so the panel can show it even when the team no longer exists on disk
		* (historical session review). */
		function openActivityPanel(data) {
			window.dispatchEvent(new CustomEvent(OPEN_PANEL_EVENT, { detail: {
				teamId: data.teamId,
				captainSessionId: data.captainSessionId,
				teamName: data.teamName,
				members: data.members
			} }));
		}
		/** Render one durable team as a compact conversation card. */
		const noWorkspace = () => void 0;
		const noSubscription = () => () => {};
		function AgentTeamsCard({ node, openMember, sessionId, t, workspaceBridge }) {
			const native = (0, react.useSyncExternalStore)(workspaceBridge?.subscribe ?? noSubscription, workspaceBridge?.getSnapshot ?? noWorkspace);
			const location = node.location;
			if (native && (location.kind === "turn" || location.kind === "step") && location.turn.status === "closed") return null;
			return (0, react_jsx_runtime.jsx)(AgentTeamsSummary, {
				data: node.data,
				openMember,
				sessionId,
				t
			});
		}
		function AgentTeamsSummary({ data, openMember, sessionId, t }) {
			const owner = data.captainSessionId || sessionId;
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			(0, react.useEffect)(() => {
				return monitorAgentTeam(owner, data.teamId);
			}, [data.teamId, owner]);
			const snapshot = teams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner)) ?? archivedTeams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner));
			const resolved = (0, react.useMemo)(() => ({
				...data,
				captainSessionId: snapshot?.captainSessionId ?? owner,
				teamName: snapshot?.name ?? data.teamName,
				members: snapshot?.members.map((member) => ({
					id: member.id,
					name: member.name,
					role: member.role
				})) ?? data.members
			}), [
				data,
				owner,
				snapshot
			]);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: AgentTeamsCard_module_css_default.root,
				"data-deers-agent-team-card": true,
				"data-team-id": resolved.teamId,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: AgentTeamsCard_module_css_default.head,
					children: [
						(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.leadAvatar,
							src: LEAD_STICKER,
							alt: "",
							"aria-hidden": true
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.teamName,
							title: resolved.teamName,
							children: resolved.teamName
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberCount,
							children: t("card.memberCount", { count: resolved.members.length })
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: AgentTeamsCard_module_css_default.panelButton,
							onClick: () => {
								openActivityPanel(resolved);
							},
							"aria-label": t("workspace.focus"),
							title: t("workspace.focus"),
							children: t("workspace.focus")
						})
					]
				}), resolved.members.length > 0 && (0, react_jsx_runtime.jsx)("div", {
					className: AgentTeamsCard_module_css_default.members,
					children: resolved.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: AgentTeamsCard_module_css_default.member,
						onClick: () => {
							if (member.id !== "") openMember(owner, member.id);
						},
						title: member.role === "" ? member.name : `${member.name} · ${member.role}`,
						children: [(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.memberArt,
							src: memberStickerUrl(member.name, member.role),
							alt: "",
							"aria-hidden": true
						}), (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberName,
							children: member.name
						})]
					}, member.id || member.name))
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\src\client\ActivityPanel.module.css.mjs
		const css$2 = "html{--deers-agent-team-panel-shift:420px}html[data-deers-agent-team-panel-open] [data-phase=active]{box-sizing:border-box;padding-right:var(--deers-agent-team-panel-shift)}._6h_V4q_badge{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 92%, transparent);backdrop-filter:blur(16px);height:34px;box-shadow:0 8px 28px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 29%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(20px + var(--deers-font-boost,0px));cursor:pointer;border-radius:999px;align-items:center;gap:7px;padding:0 12px;transition:border-color .15s,transform .12s;display:inline-flex;position:absolute;top:64px;right:18px}._6h_V4q_badge:hover{border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}._6h_V4q_badge:active{transform:translateY(0)scale(.98)}._6h_V4q_badge:focus-visible,._6h_V4q_iconButton:focus-visible,._6h_V4q_memberRow:focus-visible,._6h_V4q_membersToggle:focus-visible,._6h_V4q_sectionToggleTitle:focus-visible,._6h_V4q_dagNode:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}._6h_V4q_badgeDot,._6h_V4q_panelDot{background:var(--dsw-alias-label-tertiary);border-radius:50%;width:7px;height:7px}._6h_V4q_badgeDot[data-busy=true],._6h_V4q_panelDot[data-busy=true]{background:var(--dsw-alias-state-business-primary);animation:1.25s ease-in-out infinite _6h_V4q_agentTeamsPulse}._6h_V4q_badgeCount,._6h_V4q_memberCount,._6h_V4q_teamStats,._6h_V4q_stageLabel,._6h_V4q_taskId{font-variant-numeric:tabular-nums}._6h_V4q_panel{--deers-font-boost:2px;box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l3) 58%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 95%, transparent);backdrop-filter:blur(20px)saturate(1.08);box-shadow:0 12px 32px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 25%, transparent), 0 32px 72px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 33%, transparent);will-change:transform;border-radius:16px;flex-direction:column;animation:.16s ease-out _6h_V4q_agentTeamsPanelIn;display:flex;position:absolute;top:0;left:0;overflow:hidden}._6h_V4q_panel[data-dragging],._6h_V4q_panel[data-resizing]{user-select:none;box-shadow:0 16px 38px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 29%, transparent), 0 36px 78px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 38%, transparent)}@keyframes _6h_V4q_agentTeamsPanelIn{0%{opacity:0}to{opacity:1}}@keyframes _6h_V4q_agentTeamsPulse{0%,to{opacity:.42}50%{opacity:1}}._6h_V4q_panelHead{border-bottom:1px solid var(--dsw-alias-border-l2);cursor:grab;touch-action:none;flex:none;justify-content:space-between;align-items:center;min-height:44px;padding:0 14px 0 16px;display:flex}._6h_V4q_panelHead:active,._6h_V4q_panel[data-dragging] ._6h_V4q_panelHead{cursor:grabbing}._6h_V4q_panel[data-compact] ._6h_V4q_panelHead{cursor:default;touch-action:auto}._6h_V4q_panelTitle{color:var(--dsw-alias-label-primary);font-size:calc(14px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(20px + var(--deers-font-boost,0px));align-items:center;gap:8px;display:inline-flex}._6h_V4q_panelControls{flex:none;align-items:center;gap:2px;display:inline-flex}._6h_V4q_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:7px;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,transform .12s;display:inline-flex}._6h_V4q_iconButton:hover{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}._6h_V4q_iconButton:active{transform:scale(.94)}._6h_V4q_iconButton[data-control=dock][data-mode=docked] svg{transform:scaleX(-1)}._6h_V4q_resizeHandle{z-index:5;touch-action:none;pointer-events:auto;position:absolute}._6h_V4q_resizeHandle[data-resize-edge=left]{cursor:ew-resize;width:14px;top:44px;bottom:14px;left:0}._6h_V4q_resizeHandle[data-resize-edge=left]:after{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 42%, transparent);content:\"\";opacity:.45;border-radius:999px;width:3px;height:48px;transition:background-color .12s,opacity .12s;position:absolute;top:50%;left:4px;transform:translateY(-50%)}._6h_V4q_resizeHandle[data-resize-edge=bottom]{cursor:ns-resize;height:14px;bottom:0;left:20px;right:20px}._6h_V4q_resizeHandle[data-resize-edge=bottom]:after{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 42%, transparent);content:\"\";opacity:.45;border-radius:999px;width:48px;height:3px;transition:background-color .12s,opacity .12s;position:absolute;bottom:4px;left:50%;transform:translate(-50%)}._6h_V4q_resizeHandle[data-resize-edge=corner]{cursor:nwse-resize;width:28px;height:28px;bottom:0;right:0}._6h_V4q_resizeHandle[data-resize-edge=corner]:after{border-right:2px solid var(--dsw-alias-label-tertiary);border-bottom:2px solid var(--dsw-alias-label-tertiary);content:\"\";opacity:.58;width:10px;height:10px;transition:border-color .12s,opacity .12s;position:absolute;bottom:6px;right:6px}._6h_V4q_resizeHandle:hover:after,._6h_V4q_panel[data-resizing] ._6h_V4q_resizeHandle:after{background-color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);opacity:.95}._6h_V4q_teams{overscroll-behavior:contain;scrollbar-color:color-mix(in srgb, var(--dsw-alias-label-tertiary) 28%, transparent) transparent;scrollbar-width:thin;flex-direction:column;min-height:0;display:flex;overflow-y:auto}._6h_V4q_teams::-webkit-scrollbar{width:6px}._6h_V4q_teams::-webkit-scrollbar-track{background:0 0}._6h_V4q_teams::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 28%, transparent);background-clip:padding-box;border:2px solid #0000;border-radius:999px}._6h_V4q_teams:hover::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 44%, transparent);background-clip:padding-box}._6h_V4q_team{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:12px;padding:12px 14px 16px;display:flex;container:_6h_V4q_agent-team/inline-size}._6h_V4q_team:last-child{border-bottom:0}._6h_V4q_teamHead{align-items:center;gap:10px;min-width:0;display:flex}._6h_V4q_teamName{min-width:0;color:var(--dsw-alias-label-primary);font-size:calc(13px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(18px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;flex:1;overflow:hidden}._6h_V4q_teamStats{color:var(--dsw-alias-label-tertiary);font-size:calc(10.5px + var(--deers-font-boost,0px));line-height:calc(16px + var(--deers-font-boost,0px));white-space:nowrap;flex:none;gap:8px;display:inline-flex}._6h_V4q_teamStopButton{border:1px solid var(--dsw-alias-border-l2);width:26px;height:26px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:7px;flex:none;place-items:center;padding:0;transition:border-color .15s,background .15s,color .15s;display:grid}._6h_V4q_teamPollButton{border:1px solid var(--dsw-alias-border-l2);height:26px;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));background:0 0;border-radius:7px;flex:none;align-items:center;gap:5px;padding:0 9px;transition:border-color .15s,background .15s,color .15s;display:inline-flex}._6h_V4q_teamPollButton:hover{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 42%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, transparent);color:var(--dsw-alias-state-business-primary)}._6h_V4q_teamPollButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}._6h_V4q_teamStopButton:hover{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);color:var(--dsw-alias-state-error-primary)}._6h_V4q_teamStopButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}._6h_V4q_stopModalActions{justify-content:flex-end;gap:8px;display:flex}._6h_V4q_stopModalActions button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:6px 13px;font-weight:600;display:inline-flex}._6h_V4q_stopModalActions button[data-danger]{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_stopModalActions button:disabled{cursor:wait;opacity:.58}._6h_V4q_stopModalError{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);color:var(--dsw-alias-state-error-primary);font-size:calc(12px + var(--deers-font-boost,0px));line-height:calc(18px + var(--deers-font-boost,0px));border-radius:8px;align-items:flex-start;gap:7px;margin:0;padding:9px 10px;display:flex}._6h_V4q_stopModalError svg{flex:none;margin-top:1px}._6h_V4q_sectionHead{justify-content:space-between;align-items:center;gap:8px;min-width:0;display:flex}._6h_V4q_sectionTitle{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(16px + var(--deers-font-boost,0px));align-items:center;gap:6px;display:inline-flex}._6h_V4q_sectionHint{color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_delegationSection{min-width:0}._6h_V4q_captainNode{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-layer-1));border-radius:10px;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:56px;padding:6px 10px;display:grid}._6h_V4q_captainAvatar,._6h_V4q_memberAvatar{flex:none;justify-content:center;align-items:center;display:inline-flex;position:relative}._6h_V4q_captainAvatar{width:46px;height:46px}._6h_V4q_leadAvatar,._6h_V4q_memberArt{object-fit:contain;filter:drop-shadow(0 1px 1px #122d4833);background:0 0;border:0;border-radius:0}._6h_V4q_leadAvatar{width:44px;height:44px}._6h_V4q_memberArt{width:40px;height:40px}._6h_V4q_captainInfo,._6h_V4q_memberInfo{flex-direction:column;min-width:0;display:flex}._6h_V4q_captainInfo{gap:2px}._6h_V4q_captainLine,._6h_V4q_memberLine{align-items:center;gap:6px;min-width:0;display:flex}._6h_V4q_captainName,._6h_V4q_memberName{color:var(--dsw-alias-label-primary);font-size:calc(12.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(18px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_captainRole,._6h_V4q_memberRole{color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_captainSummary,._6h_V4q_memberStatusLine{color:var(--dsw-alias-label-secondary);font-size:calc(10.5px + var(--deers-font-boost,0px));line-height:calc(15px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_taskDetailModel{color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_memberModel{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-width:0;max-width:132px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(9px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(15px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;border-radius:999px;flex:0 auto;align-items:center;padding:0 6px;display:inline-flex;overflow:hidden}._6h_V4q_captainState,._6h_V4q_memberState{color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));font-weight:500;line-height:calc(15px + var(--deers-font-boost,0px));white-space:nowrap;flex:none;align-items:center;gap:5px;display:inline-flex}._6h_V4q_captainState[data-busy=true],._6h_V4q_memberState[data-activity=working]{color:var(--dsw-alias-state-business-primary)}._6h_V4q_workGlyph rect{opacity:.5}._6h_V4q_workGlyph[data-active=true] rect{animation:1.1s ease-in-out infinite _6h_V4q_agentTeamsDot}@keyframes _6h_V4q_agentTeamsDot{0%,to{opacity:.25}50%{opacity:1}}._6h_V4q_progressOverview{flex-direction:column;gap:7px;display:flex}._6h_V4q_progressTitle{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(16px + var(--deers-font-boost,0px))}._6h_V4q_progressSegmentRows{gap:3px;display:grid}._6h_V4q_progressSegments{gap:3px;display:flex}._6h_V4q_progressSegments>span,._6h_V4q_progressEmpty{background:var(--dsw-alias-border-l3);border-radius:2px;flex:1;height:5px}._6h_V4q_progressEmpty{width:100%;display:block}._6h_V4q_progressSegments>span[data-state=running]{background:var(--dsw-alias-state-business-primary)}._6h_V4q_progressSegments>span[data-state=blocked]{background:var(--dsw-alias-state-warn-primary)}._6h_V4q_progressSegments>span[data-state=completed]{background:var(--dsw-alias-state-success-primary)}._6h_V4q_progressSegments>span[data-state=failed]{background:var(--dsw-alias-state-error-primary)}._6h_V4q_progressSegments>span[data-state=cancelled]{opacity:.55}._6h_V4q_progressLegend{color:var(--dsw-alias-label-tertiary);font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));gap:10px;display:flex}._6h_V4q_progressLegend>span[data-state=running]{color:var(--dsw-alias-state-business-primary)}._6h_V4q_progressLegend>span[data-state=blocked]{color:var(--dsw-alias-state-warn-primary)}._6h_V4q_progressLegend>span[data-state=completed]{color:var(--dsw-alias-state-success-primary)}._6h_V4q_progressSummary{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-layer-1));min-width:0;color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(15px + var(--deers-font-boost,0px));border-radius:8px;align-items:center;gap:6px;padding:5px 8px;display:flex}._6h_V4q_progressSummary[data-state=warning]{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-layer-1))}._6h_V4q_progressSummary[data-state=completed]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, var(--dsw-alias-bg-layer-1))}._6h_V4q_progressSummary[data-state=discarded]{background:var(--dsw-alias-button-ghost-active-fill)}._6h_V4q_progressSummary>span:last-child{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_progressSummaryDot{background:var(--dsw-alias-state-business-primary);border-radius:50%;flex:none;width:5px;height:5px}._6h_V4q_progressSummary[data-state=warning] ._6h_V4q_progressSummaryDot{background:var(--dsw-alias-state-warn-primary)}._6h_V4q_progressSummary[data-state=completed] ._6h_V4q_progressSummaryDot{background:var(--dsw-alias-state-success-primary)}._6h_V4q_progressSummary[data-state=discarded] ._6h_V4q_progressSummaryDot{background:var(--dsw-alias-label-tertiary)}._6h_V4q_membersToggle{background:var(--dsw-alias-bg-module-platform);width:100%;color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(10.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(15px + var(--deers-font-boost,0px));cursor:pointer;border:0;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;display:flex}._6h_V4q_membersToggle:hover{background:var(--dsw-alias-button-ghost-active-fill)}._6h_V4q_membersToggle>span{align-items:center;gap:5px;display:inline-flex}._6h_V4q_membersToggle>span:last-child{color:var(--dsw-alias-state-business-primary)}._6h_V4q_chevron{flex:none;transition:transform .14s}._6h_V4q_chevron[data-open=true]{transform:rotate(90deg)}._6h_V4q_delegationTree{flex-direction:column;gap:2px;margin-left:18px;padding:9px 0 0 20px;display:flex;position:relative}._6h_V4q_delegationTree:before{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));content:\"\";width:1px;position:absolute;top:0;bottom:22px;left:0}._6h_V4q_memberBlock{flex-direction:column;min-width:0;padding:3px 0 7px;display:flex;position:relative}._6h_V4q_memberBranch{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));width:20px;height:1px;display:block;position:absolute;top:27px;right:100%}._6h_V4q_memberBranch:before{background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:5px;height:5px;position:absolute;top:-2px;right:-1px}._6h_V4q_memberRow{box-sizing:border-box;width:100%;min-width:0;min-height:48px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px;transition:background-color .12s,transform .12s;display:grid}._6h_V4q_memberRow:hover,._6h_V4q_memberRow[data-activity=working]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1))}._6h_V4q_memberRow:active{transform:scale(.995)}._6h_V4q_memberAvatar{width:42px;height:42px}._6h_V4q_memberAvatar[data-unread=true]:after{box-sizing:border-box;border:1px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:6px;height:6px;animation:1.8s ease-in-out infinite _6h_V4q_agentTeamsUnreadPulse;position:absolute;top:0;right:-1px}@keyframes _6h_V4q_agentTeamsUnreadPulse{0%,to{opacity:.78;transform:scale(.92)}50%{opacity:1;transform:scale(1.16)}}._6h_V4q_memberInitial{background:var(--dsw-alias-state-business-primary);width:34px;height:34px;color:var(--dsw-alias-label-primary-inverted);font-size:calc(14px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(20px + var(--deers-font-boost,0px));border-radius:50%;justify-content:center;align-items:center;display:inline-flex}._6h_V4q_stateArt{box-sizing:border-box;object-fit:contain;width:22px;height:22px;filter:drop-shadow(0 0 1px var(--dsw-alias-bg-layer-1)) drop-shadow(0 1px 1px #122d483d);background:0 0;border:0;border-radius:0;position:absolute;bottom:-3px;right:-5px}._6h_V4q_stateArt[data-activity=working]{animation:2.4s ease-in-out infinite _6h_V4q_agentTeamsFloat}._6h_V4q_stateArt[data-activity=idle]{animation:4.2s ease-in-out infinite _6h_V4q_agentTeamsBreathe}._6h_V4q_stateArt[data-activity=unknown]{animation:2.8s ease-in-out infinite _6h_V4q_agentTeamsThink}@keyframes _6h_V4q_agentTeamsFloat{0%,to{transform:translateY(0)rotate(-4deg)}50%{transform:translateY(-2px)rotate(4deg)}}@keyframes _6h_V4q_agentTeamsBreathe{0%,to{opacity:.82;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}@keyframes _6h_V4q_agentTeamsThink{0%,to{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}._6h_V4q_memberState{margin-left:auto}._6h_V4q_memberCount{color:var(--dsw-alias-label-tertiary);font-size:calc(10.5px + var(--deers-font-boost,0px));line-height:calc(16px + var(--deers-font-boost,0px))}._6h_V4q_assignmentLine{align-items:center;gap:7px;min-width:0;padding:0 6px 0 60px;display:flex}._6h_V4q_assignmentLabel{color:var(--dsw-alias-label-tertiary);font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));flex:none}._6h_V4q_assignmentTasks{flex-wrap:wrap;flex:1;gap:4px;min-width:0;display:flex}._6h_V4q_assignmentChip{background:var(--dsw-alias-button-ghost-active-fill);max-width:100%;min-height:16px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(9px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;border-radius:4px;align-items:center;padding:0 5px;display:inline-flex;overflow:hidden}._6h_V4q_assignmentChip[data-state=running]{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_assignmentChip[data-state=completed]{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_assignmentChip[data-state=blocked]{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_assignmentChip[data-state=failed]{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_assignmentChip[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}._6h_V4q_unreadPill{color:var(--dsw-alias-state-business-primary);font-size:calc(9.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(14px + var(--deers-font-boost,0px));white-space:nowrap;flex:none}._6h_V4q_taskEmpty{color:var(--dsw-alias-label-tertiary);font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px))}._6h_V4q_dependencySection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:7px;min-width:0;padding-top:10px;display:flex}._6h_V4q_sectionToggleTitle{color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(16px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;padding:0;display:inline-flex}._6h_V4q_dagViewport{scrollbar-width:thin;min-width:0;padding:2px 0 4px;overflow-x:auto}._6h_V4q_dagCanvas{min-width:100%;position:relative}._6h_V4q_dagCanvas[data-layout=parallel]{flex-wrap:wrap;gap:8px;display:flex}._6h_V4q_dagCanvas[data-layout=parallel] ._6h_V4q_dagNode{flex:92px;min-width:92px;position:relative}._6h_V4q_dagEdges{pointer-events:none;position:absolute;inset:0;overflow:visible}._6h_V4q_dagEdges path{fill:none;stroke:var(--dsw-alias-border-l3);stroke-width:1px;transition:opacity .14s,stroke .14s,stroke-width .14s}._6h_V4q_dagEdges path[data-active=true]{stroke:var(--dsw-alias-state-business-primary);stroke-width:1.6px}._6h_V4q_dagEdges path[data-dimmed=true]{opacity:.24}._6h_V4q_dagNode{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;border-radius:6px;flex-direction:column;justify-content:center;gap:1px;padding:0 6px;transition:border-color .14s,background-color .14s,opacity .14s;display:flex;position:absolute}._6h_V4q_dagNode:hover,._6h_V4q_dagNode[data-focused=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1))}._6h_V4q_dagNode[data-dimmed=true]{opacity:.3}._6h_V4q_dagNode[data-state=running][data-dimmed=true]{opacity:.58}._6h_V4q_dagNode[data-state=completed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 48%, var(--dsw-alias-border-l2))}._6h_V4q_dagNode[data-state=blocked]{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 52%, var(--dsw-alias-border-l2))}._6h_V4q_dagNode[data-state=failed]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 56%, var(--dsw-alias-border-l2))}._6h_V4q_dagNodeHead{color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(9.5px + var(--deers-font-boost,0px));align-items:center;gap:4px;font-weight:700;display:flex}._6h_V4q_dagNodeDot{background:var(--dsw-alias-border-l3);border-radius:1.5px;flex:none;width:5px;height:5px}._6h_V4q_dagNode[data-state=running] ._6h_V4q_dagNodeDot{background:var(--dsw-alias-state-business-primary)}._6h_V4q_dagNode[data-state=running] ._6h_V4q_dagNodeHead{padding-right:12px}._6h_V4q_dagRunningState{width:9px;height:9px;color:var(--dsw-alias-state-business-primary);pointer-events:none;justify-content:center;align-items:center;display:inline-flex;position:absolute;top:4px;right:5px}._6h_V4q_dagRunningState ._6h_V4q_workGlyph{width:9px;height:9px}._6h_V4q_dagNode[data-state=blocked] ._6h_V4q_dagNodeDot{background:var(--dsw-alias-state-warn-primary)}._6h_V4q_dagNode[data-state=completed] ._6h_V4q_dagNodeDot{background:var(--dsw-alias-state-success-primary)}._6h_V4q_dagNode[data-state=failed] ._6h_V4q_dagNodeDot{background:var(--dsw-alias-state-error-primary)}._6h_V4q_dagNodeLabel{color:var(--dsw-alias-label-tertiary);font-size:calc(8.5px + var(--deers-font-boost,0px));line-height:calc(11px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_taskDetail{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:9px;flex-direction:column;gap:3px;min-width:0;padding:7px 9px;display:flex}._6h_V4q_taskDetailHead{align-items:center;gap:6px;min-width:0;display:flex}._6h_V4q_taskDetailId{color:var(--dsw-alias-state-business-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(10px + var(--deers-font-boost,0px));flex:none;font-weight:700}._6h_V4q_taskDetailSubject{min-width:0;color:var(--dsw-alias-label-primary);font-size:calc(11px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(16px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_taskDetailBadge{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-secondary);font-size:calc(8.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(14px + var(--deers-font-boost,0px));border-radius:4px;flex:none;padding:0 5px}._6h_V4q_taskDetailBadge[data-state=running]{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_taskDetailBadge[data-state=blocked]{background:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_taskDetailBadge[data-state=completed]{background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_taskDetailBadge[data-state=failed]{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-inverted)}._6h_V4q_taskDetailLine,._6h_V4q_taskDetailMeta{color:var(--dsw-alias-label-secondary);font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px))}._6h_V4q_taskDetailMeta{color:var(--dsw-alias-label-tertiary)}._6h_V4q_emptyHint{color:var(--dsw-alias-label-tertiary);font-size:calc(11px + var(--deers-font-boost,0px));line-height:calc(16px + var(--deers-font-boost,0px));padding:10px 12px}._6h_V4q_planEditor{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 94%, var(--dsw-alias-state-business-primary));box-shadow:inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);border-radius:10px;flex-direction:column;gap:12px;margin:0 10px 12px;padding:12px;display:flex}._6h_V4q_planHeader>span{justify-content:space-between;align-items:center;gap:8px;display:flex}._6h_V4q_planHeader>span>span{flex-direction:column;gap:2px;min-width:0;display:flex}._6h_V4q_planHeader strong{color:var(--dsw-alias-label-primary);font-size:calc(12px + var(--deers-font-boost,0px))}._6h_V4q_planHeader small{color:var(--dsw-alias-label-secondary);font-size:calc(9px + var(--deers-font-boost,0px));font-weight:500;line-height:calc(13px + var(--deers-font-boost,0px))}._6h_V4q_planHeader em{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-inverted);font-size:calc(9px + var(--deers-font-boost,0px));font-style:normal;line-height:calc(16px + var(--deers-font-boost,0px));border-radius:999px;flex:none;padding:1px 7px}._6h_V4q_planHeader p{color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));line-height:calc(15px + var(--deers-font-boost,0px));margin:5px 0 0}._6h_V4q_planFlow{grid-template-columns:repeat(3,minmax(0,1fr));margin:0;padding:0;list-style:none;display:grid}._6h_V4q_planFlow li{min-width:0;color:var(--dsw-alias-label-tertiary);font-size:calc(9px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(14px + var(--deers-font-boost,0px));align-items:center;gap:5px;display:flex;position:relative}._6h_V4q_planFlow li:not(:last-child):after{background:var(--dsw-alias-border-l2);content:\"\";flex:1;min-width:8px;height:1px;margin-right:5px}._6h_V4q_planFlow li>span{border:1px solid var(--dsw-alias-border-l2);width:18px;height:18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(9px + var(--deers-font-boost,0px));border-radius:50%;flex:none;place-items:center;display:grid}._6h_V4q_planFlow li[data-active]{color:var(--dsw-alias-state-business-primary)}._6h_V4q_planFlow li[data-active]>span{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)}._6h_V4q_planSection{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:8px;overflow:hidden}._6h_V4q_planSectionToggle,._6h_V4q_planCardHeader{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:0}._6h_V4q_planSectionToggle{justify-content:space-between;align-items:center;gap:8px;min-height:42px;padding:7px 9px;display:flex}._6h_V4q_planSectionToggle:hover,._6h_V4q_planCardHeader:hover{background:color-mix(in srgb, var(--dsw-alias-button-ghost-active-fill) 46%, transparent)}._6h_V4q_planSectionToggle>span{align-items:baseline;gap:7px;min-width:0;display:flex}._6h_V4q_planSectionToggle strong{font-size:calc(10.5px + var(--deers-font-boost,0px))}._6h_V4q_planSectionToggle small{color:var(--dsw-alias-label-tertiary);font-size:calc(9px + var(--deers-font-boost,0px))}._6h_V4q_planList{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:0;display:flex}._6h_V4q_planEmpty{color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));text-align:center;margin:0;padding:12px}._6h_V4q_planCard{background:0 0;border:0;border-radius:0;min-width:0;margin:0;padding:0;display:block;position:relative}._6h_V4q_planCard+._6h_V4q_planCard{border-top:1px solid var(--dsw-alias-border-l2)}._6h_V4q_planCard[data-open=true]{background:color-mix(in srgb, var(--dsw-alias-bg-base) 62%, transparent)}._6h_V4q_planCardHeader{grid-template-columns:minmax(80px,.9fr) minmax(72px,1.15fr) auto 12px;align-items:center;gap:7px;min-height:40px;padding:6px 9px;display:grid}._6h_V4q_planCardIdentity{flex-direction:column;gap:1px;min-width:0;display:flex}._6h_V4q_planCardIdentity strong,._6h_V4q_planTaskSummary{color:var(--dsw-alias-label-primary);font-size:calc(10px + var(--deers-font-boost,0px));font-weight:650;line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_planCardIdentity>span,._6h_V4q_planCardMeta{color:var(--dsw-alias-label-tertiary);font-size:calc(8.5px + var(--deers-font-boost,0px));line-height:calc(12px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_planTaskId{background:var(--dsw-alias-button-ghost-active-fill);width:max-content;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:calc(8.5px + var(--deers-font-boost,0px));font-weight:700;line-height:calc(14px + var(--deers-font-boost,0px));border-radius:4px;padding:1px 5px}._6h_V4q_planDirty{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent);color:var(--dsw-alias-state-warn-primary);font-size:calc(8px + var(--deers-font-boost,0px));font-style:normal;font-weight:650;line-height:calc(14px + var(--deers-font-boost,0px));border-radius:999px;justify-self:end;padding:1px 5px}._6h_V4q_planChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .18s cubic-bezier(.2,.7,.2,1)}._6h_V4q_planChevron[data-open=true]{transform:rotate(90deg)}._6h_V4q_planCardBody{flex-direction:column;gap:8px;padding:0 9px 9px;display:flex}._6h_V4q_planCardBody fieldset{border:0;flex-direction:column;gap:7px;min-width:0;margin:0;padding:0;display:flex}._6h_V4q_planCardBody label,._6h_V4q_planNewTask label{min-width:0;color:var(--dsw-alias-label-tertiary);font-size:calc(9px + var(--deers-font-boost,0px));flex-direction:column;flex:1;gap:4px;display:flex}._6h_V4q_planCardBody label small{color:var(--dsw-alias-label-tertiary);font-size:calc(8px + var(--deers-font-boost,0px));line-height:calc(11px + var(--deers-font-boost,0px))}._6h_V4q_planCard input,._6h_V4q_planCard textarea,._6h_V4q_planCard select,._6h_V4q_planNewTask input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;font-size:calc(10.5px + var(--deers-font-boost,0px));line-height:calc(16px + var(--deers-font-boost,0px));border-radius:6px;outline:none;transition:border-color .16s,box-shadow .16s}._6h_V4q_planCard input,._6h_V4q_planCard select,._6h_V4q_planNewTask input{min-height:32px;padding:6px 8px}._6h_V4q_planCard textarea{resize:vertical;min-height:58px;padding:7px 8px}._6h_V4q_planCard input:focus-visible,._6h_V4q_planCard textarea:focus-visible,._6h_V4q_planCard select:focus-visible,._6h_V4q_planNewTask input:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}._6h_V4q_planGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;display:grid}._6h_V4q_planModelPicker{grid-template-columns:minmax(0,1fr);gap:5px;display:grid}._6h_V4q_planModelMenu{width:100%;display:flex}._6h_V4q_planModelTrigger{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:100%;min-height:38px;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;border-radius:7px;justify-content:space-between;align-items:center;gap:8px;padding:7px 9px;transition:border-color .16s,background-color .16s,transform .12s;display:flex}._6h_V4q_planModelTrigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover)}._6h_V4q_planModelTrigger:active:not(:disabled){transform:translateY(1px)}._6h_V4q_planModelTrigger:focus-visible{border-color:var(--dsw-alias-state-business-primary);outline:2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);outline-offset:1px}._6h_V4q_planModelTrigger:disabled{cursor:wait;opacity:.64}._6h_V4q_planModelTriggerCopy{align-items:baseline;gap:6px;min-width:0;display:flex}._6h_V4q_planModelTriggerCopy strong,._6h_V4q_planModelTriggerCopy span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_planModelTriggerCopy strong{color:var(--dsw-alias-label-primary);font-size:calc(10px + var(--deers-font-boost,0px));font-weight:650;line-height:calc(15px + var(--deers-font-boost,0px))}._6h_V4q_planModelTriggerCopy span{color:var(--dsw-alias-label-tertiary);font-size:calc(9px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px))}._6h_V4q_planModelMenuRow{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;min-width:0;display:grid}._6h_V4q_planModelMenuRow>span:first-child{color:var(--dsw-alias-label-primary)}._6h_V4q_planModelMenuRow strong{color:var(--dsw-alias-label-tertiary);text-align:right;text-overflow:ellipsis;white-space:nowrap;font-weight:450;overflow:hidden}._6h_V4q_planModelMenuBack{align-items:center;gap:7px;display:inline-flex}._6h_V4q_planModelMenuBack svg{transform:rotate(180deg)}._6h_V4q_planModelEffortRow{flex-direction:column;align-items:flex-start;min-width:0;display:flex}._6h_V4q_planModelEffortRow small{width:100%;color:var(--dsw-alias-label-tertiary);font-size:calc(10px + var(--deers-font-boost,0px));line-height:calc(14px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_planModelHint{color:var(--dsw-alias-label-tertiary);font-size:calc(8.5px + var(--deers-font-boost,0px));line-height:calc(12px + var(--deers-font-boost,0px));text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6h_V4q_planModelNotice{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);color:var(--dsw-alias-label-secondary);font-size:calc(8.5px + var(--deers-font-boost,0px));line-height:calc(12px + var(--deers-font-boost,0px));border-radius:6px;grid-column:1/-1;justify-content:space-between;align-items:center;gap:8px;padding:6px 7px;display:flex}._6h_V4q_planModelNotice button{color:var(--dsw-alias-state-business-primary);cursor:pointer;font:inherit;background:0 0;border:0;flex:none;padding:2px 6px;font-weight:650}._6h_V4q_planActions,._6h_V4q_planApproveRow,._6h_V4q_planNewTask,._6h_V4q_planConfirm,._6h_V4q_planApproveActions,._6h_V4q_planSecondaryActions{align-items:center;gap:7px;display:flex}._6h_V4q_planReviewActions{grid-template-columns:minmax(0,1fr);gap:6px;width:100%;display:grid}._6h_V4q_planSecondaryActions{grid-template-columns:minmax(0,1fr) auto;display:grid}._6h_V4q_planActions{justify-content:flex-end}._6h_V4q_planActions button,._6h_V4q_planNewTask button,._6h_V4q_planApproveRow button,._6h_V4q_planConfirm button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);min-height:30px;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:calc(9.5px + var(--deers-font-boost,0px));border-radius:6px;flex:none;padding:5px 10px;font-weight:600;transition:background .16s,border-color .16s,transform .16s}._6h_V4q_planActions button:hover:not(:disabled),._6h_V4q_planNewTask button:hover:not(:disabled),._6h_V4q_planApproveRow button:hover:not(:disabled),._6h_V4q_planConfirm button:hover:not(:disabled){border-color:var(--dsw-alias-label-tertiary)}._6h_V4q_planActions button:active:not(:disabled),._6h_V4q_planNewTask button:active:not(:disabled),._6h_V4q_planApproveRow button:active:not(:disabled),._6h_V4q_planConfirm button:active:not(:disabled){transform:scale(.98)}._6h_V4q_planActions button[data-danger],._6h_V4q_planConfirm button[data-danger]{color:var(--dsw-alias-state-error-primary)}._6h_V4q_planFeedback{min-width:0;color:var(--dsw-alias-label-secondary);font-size:calc(9px + var(--deers-font-boost,0px));line-height:calc(13px + var(--deers-font-boost,0px));flex:1;align-items:center;gap:5px;animation:.18s ease-out _6h_V4q_plan-feedback-in;display:inline-flex}._6h_V4q_planFeedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}._6h_V4q_planFeedback[data-tone=error]{color:var(--dsw-alias-state-error-primary)}._6h_V4q_planFeedback>span{border:1px solid;border-radius:50%;flex:none;place-items:center;width:15px;height:15px;display:grid}._6h_V4q_planFeedback svg{width:11px;height:11px}@keyframes _6h_V4q_plan-feedback-in{0%{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}._6h_V4q_planConfirm{border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);border-radius:7px;flex-wrap:wrap;justify-content:flex-end;padding:7px}._6h_V4q_planConfirm>span{min-width:140px;color:var(--dsw-alias-label-secondary);font-size:calc(9px + var(--deers-font-boost,0px));line-height:calc(13px + var(--deers-font-boost,0px));flex:1}._6h_V4q_planNewTask{align-items:flex-end}._6h_V4q_planNewTask label{gap:4px}._6h_V4q_planNewTask label>span{line-height:calc(13px + var(--deers-font-boost,0px))}._6h_V4q_planApproveRow{z-index:1;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 94%, transparent);min-height:50px;box-shadow:0 -5px 16px color-mix(in srgb, var(--dsw-alias-bg-base) 35%, transparent);backdrop-filter:blur(8px);border-radius:8px;flex-direction:column;justify-content:flex-end;align-items:stretch;margin:0 -4px -4px;padding:8px;position:sticky;bottom:0}._6h_V4q_planApproveRow[data-armed=true]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, var(--dsw-alias-border-l2))}._6h_V4q_planApproveRow[data-discard=true]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l2))}._6h_V4q_planApproveCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}._6h_V4q_planApproveCopy strong{color:var(--dsw-alias-label-primary);font-size:calc(9.5px + var(--deers-font-boost,0px));line-height:calc(13px + var(--deers-font-boost,0px))}._6h_V4q_planApproveCopy small{color:var(--dsw-alias-label-tertiary);font-size:calc(8.5px + var(--deers-font-boost,0px));line-height:calc(12px + var(--deers-font-boost,0px))}._6h_V4q_planApproveRow button{background:var(--dsw-alias-state-business-primary);min-height:32px;color:var(--dsw-alias-label-primary-inverted);padding-inline:13px}._6h_V4q_planReviewActions>button[data-plan-approve]{width:100%}._6h_V4q_planApproveActions>button:first-child{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}._6h_V4q_planSecondaryActions>button,._6h_V4q_planApproveActions>button[data-danger]{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}._6h_V4q_planSecondaryActions>button[data-danger],._6h_V4q_planApproveActions>button[data-danger]{color:var(--dsw-alias-state-error-primary)}._6h_V4q_planSectionToggle:focus-visible,._6h_V4q_planCardHeader:focus-visible,._6h_V4q_planActions button:focus-visible,._6h_V4q_planNewTask button:focus-visible,._6h_V4q_planApproveRow button:focus-visible,._6h_V4q_planConfirm button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}._6h_V4q_planActions button:disabled,._6h_V4q_planNewTask button:disabled,._6h_V4q_planApproveRow button:disabled{cursor:default;opacity:.55}._6h_V4q_historicPill{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-tertiary);font-size:calc(9.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(15px + var(--deers-font-boost,0px));border-radius:4px;flex:none;margin-left:auto;padding:1px 7px}._6h_V4q_members{flex-direction:column;gap:3px;display:flex}._6h_V4q_archiveLabel{color:var(--dsw-alias-label-tertiary);font-size:calc(9.5px + var(--deers-font-boost,0px));font-weight:600;line-height:calc(14px + var(--deers-font-boost,0px));padding:5px 14px 0;display:block}@media (prefers-reduced-motion:reduce){._6h_V4q_panel,._6h_V4q_badge,._6h_V4q_badgeDot,._6h_V4q_panelDot,._6h_V4q_workGlyph rect,._6h_V4q_stateArt,._6h_V4q_memberAvatar[data-unread=true]:after,._6h_V4q_planChevron,._6h_V4q_planFeedback,._6h_V4q_planActions button,._6h_V4q_planNewTask button,._6h_V4q_planApproveRow button,._6h_V4q_planConfirm button,._6h_V4q_planCard input,._6h_V4q_planCard textarea,._6h_V4q_planCard select,._6h_V4q_planNewTask input{transition:none;animation:none}}@media (width<=960px){html[data-deers-agent-team-panel-open] [data-phase=active]{padding-right:0}}@media (width<=640px){._6h_V4q_badge{top:56px;right:10px}._6h_V4q_teamStats span[data-stat=messages]{display:none}._6h_V4q_captainNode{grid-template-columns:48px minmax(0,1fr)}._6h_V4q_captainState{display:none}._6h_V4q_delegationTree{margin-left:12px;padding-left:15px}._6h_V4q_memberBranch{width:15px}._6h_V4q_assignmentLine{padding-left:53px}._6h_V4q_planFlow li{font-size:calc(8px + var(--deers-font-boost,0px));gap:4px}._6h_V4q_planFlow li:not(:last-child):after{margin-right:3px}._6h_V4q_planCardHeader{grid-template-columns:auto minmax(0,1fr) auto}._6h_V4q_planCardHeader ._6h_V4q_planCardMeta{display:none}._6h_V4q_planGrid,._6h_V4q_planModelPicker{grid-template-columns:minmax(0,1fr)}._6h_V4q_planNewTask,._6h_V4q_planApproveRow{flex-direction:column;align-items:stretch}._6h_V4q_planNewTask button,._6h_V4q_planApproveRow>button,._6h_V4q_planApproveActions,._6h_V4q_planReviewActions{width:100%}._6h_V4q_planApproveActions button,._6h_V4q_planReviewActions button,._6h_V4q_planSecondaryActions button{flex:1}}@container _6h_V4q_agent-team (width<=360px){._6h_V4q_planEditor{margin-inline:0;padding-inline:10px}._6h_V4q_planHeader>span{align-items:flex-start}._6h_V4q_planFlow li{font-size:calc(7.5px + var(--deers-font-boost,0px));gap:3px}._6h_V4q_planFlow li:not(:last-child):after{min-width:4px;margin-right:2px}._6h_V4q_planSecondaryActions,._6h_V4q_planApproveActions{grid-template-columns:minmax(0,1fr);width:100%;display:grid}._6h_V4q_planSecondaryActions button,._6h_V4q_planApproveActions button{width:100%}}._6h_V4q_dagOwner{text-overflow:ellipsis;max-width:64px;font-size:calc(9px + var(--deers-font-boost,0px));margin-left:auto;font-weight:400;overflow:hidden}._6h_V4q_workspaceSplit{display:none}._6h_V4q_team[data-workspace-team]{background:0 0;border:0;padding:0;container:none}._6h_V4q_team[data-workspace-team] ._6h_V4q_teamHead{flex-wrap:wrap;gap:8px;padding-bottom:18px}._6h_V4q_team[data-workspace-team] ._6h_V4q_teamName{font-size:calc(15px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_teamStats{flex-wrap:wrap}._6h_V4q_team[data-workspace-team] ._6h_V4q_delegationSection,._6h_V4q_team[data-workspace-team] ._6h_V4q_dependencySection{min-width:0}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagNodeLabel{white-space:normal;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.4;display:-webkit-box;overflow:hidden}._6h_V4q_team[data-workspace-team] ._6h_V4q_sectionHead{flex-wrap:wrap;gap:6px}._6h_V4q_team[data-workspace-team] ._6h_V4q_sectionHint{white-space:normal}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberLine{flex-wrap:wrap}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberStatusLine,._6h_V4q_team[data-workspace-team] ._6h_V4q_taskDetailSubject{white-space:normal}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagViewport{padding-bottom:12px}@container (width>=1000px){._6h_V4q_team[data-workspace-team]{grid-template-columns:minmax(260px, var(--workspace-split,38.5%)) 12px minmax(0, 1fr);align-items:start;column-gap:0;display:grid}._6h_V4q_team[data-workspace-team]>._6h_V4q_teamHead,._6h_V4q_team[data-workspace-team]>:not(._6h_V4q_teamHead):not(._6h_V4q_delegationSection):not(._6h_V4q_dependencySection):not(._6h_V4q_workspaceSplit){grid-column:1/-1}._6h_V4q_team[data-workspace-team] ._6h_V4q_dependencySection{border-top:0;border-left:0;margin:0;padding:0 0 0 10px}._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit{cursor:col-resize;touch-action:none;background:0 0;border:0;justify-content:center;align-items:stretch;width:100%;padding:0;display:flex}._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit:before{content:\"\";background:var(--dsw-alias-border-l2);border-radius:1px;width:2px;transition:background .15s,width .15s}._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit:hover:before,._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit:focus-visible:before,._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit[data-dragging]:before{background:var(--dsw-alias-state-business-primary);width:3px}._6h_V4q_team[data-workspace-team] ._6h_V4q_workspaceSplit:focus-visible{outline:none}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainNode{padding-top:0}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagCanvas[data-layout=parallel]{grid-template-columns:repeat(2,minmax(0,1fr))}}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagNode{border-radius:9px;padding:10px 11px}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagNodeHead{font-size:calc(10px + var(--deers-font-boost,0px));margin-bottom:7px}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagNodeLabel{font-size:calc(12px + var(--deers-font-boost,0px));letter-spacing:0}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagOwner{font-size:calc(10px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_taskDetail{margin-top:14px;padding:14px}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainName{font-size:calc(14px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainRole{font-size:calc(11px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainSummary{font-size:calc(12px + var(--deers-font-boost,0px));line-height:1.6}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainState{font-size:calc(11px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberName{font-size:calc(13px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberRole,._6h_V4q_team[data-workspace-team] ._6h_V4q_memberState,._6h_V4q_team[data-workspace-team] ._6h_V4q_memberCount{font-size:calc(11px + var(--deers-font-boost,0px))}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberStatusLine{font-size:calc(12px + var(--deers-font-boost,0px));line-height:1.6}._6h_V4q_team[data-workspace-team] ._6h_V4q_taskDetailSubject{font-size:calc(13px + var(--deers-font-boost,0px));line-height:1.6}._6h_V4q_team[data-workspace-team] ._6h_V4q_taskDetailLine,._6h_V4q_team[data-workspace-team] ._6h_V4q_taskDetailMeta{font-size:calc(12px + var(--deers-font-boost,0px));line-height:1.6}._6h_V4q_team[data-workspace-team] ._6h_V4q_captainNode{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-alias-border-l2)}._6h_V4q_team[data-workspace-team] ._6h_V4q_planEditor{border-color:var(--dsw-alias-border-l2);background:0 0;margin:0 0 24px;padding:16px}@container (width>=1000px){._6h_V4q_team[data-workspace-team]:has(>[data-staging-editor]){grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:32px}._6h_V4q_team[data-workspace-team]:has(>[data-staging-editor]) ._6h_V4q_workspaceSplit{display:none}._6h_V4q_team[data-workspace-team]>[data-staging-editor]{grid-row:2/4;grid-column:1!important}._6h_V4q_team[data-workspace-team]:has(>[data-staging-editor])>._6h_V4q_delegationSection{grid-area:2/2}._6h_V4q_team[data-workspace-team]:has(>[data-staging-editor])>._6h_V4q_dependencySection{border-left:0;grid-area:3/2;padding:24px 0 0}}._6h_V4q_team[data-workspace-team] ._6h_V4q_memberBlock[data-selected-member] ._6h_V4q_memberRow{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:3px}._6h_V4q_team[data-workspace-team] ._6h_V4q_dagOwner{white-space:nowrap;max-width:105px}._6h_V4q_team[data-workspace-team] ._6h_V4q_planApproveRow{position:static}._6h_V4q_taskFilterRow{flex-wrap:wrap;gap:4px;display:inline-flex}._6h_V4q_taskFilterChip{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));background:0 0;border-radius:999px;padding:2px 9px}._6h_V4q_taskFilterChip[aria-pressed=true]{background:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary)}._6h_V4q_dagNode[data-filter-out]{opacity:.22}._6h_V4q_memberBlock[data-filter-out]{opacity:.3}._6h_V4q_dagZoomWrap{min-width:0;position:relative}._6h_V4q_dagViewport[data-canvas=zoom]{cursor:grab;touch-action:none;user-select:none;height:min(62vh,520px);overflow:hidden}._6h_V4q_dagViewport[data-canvas=zoom]:active{cursor:grabbing}._6h_V4q_dagZoomControls{z-index:3;gap:4px;display:inline-flex;position:absolute;top:8px;right:10px}._6h_V4q_dagZoomControls button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font-size:calc(11px + var(--deers-font-boost,0px));border-radius:7px;padding:3px 8px}._6h_V4q_dagMinimap{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);z-index:3;opacity:.92;border-radius:8px;width:168px;height:104px;position:absolute;bottom:10px;right:10px;overflow:hidden}._6h_V4q_dagMinimapCanvas{cursor:pointer;position:absolute;inset:0}._6h_V4q_dagMinimapNode{background:var(--dsw-alias-border-l3);border-radius:2px;position:absolute}._6h_V4q_dagMinimapNode[data-state=running]{background:var(--dsw-alias-state-business-primary)}._6h_V4q_dagMinimapNode[data-state=blocked]{background:var(--dsw-alias-state-warn-primary)}._6h_V4q_dagMinimapNode[data-state=failed]{background:var(--dsw-alias-state-error-primary)}._6h_V4q_dagMinimapNode[data-state=cancelled]{background:var(--dsw-alias-border-l2)}._6h_V4q_dagMinimapNode[data-state=completed]{background:var(--dsw-alias-state-success-primary)}._6h_V4q_dagMinimapView{border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary);opacity:.35;pointer-events:none;border-radius:2px;position:absolute}._6h_V4q_taskActions{flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;display:inline-flex}._6h_V4q_taskActions button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font-size:calc(11px + var(--deers-font-boost,0px));border-radius:7px;padding:4px 10px}._6h_V4q_taskActions button[data-danger]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}._6h_V4q_taskActionSelect{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font-size:calc(11px + var(--deers-font-boost,0px));border-radius:7px;max-width:200px;padding:4px 6px}._6h_V4q_taskActionError{color:var(--dsw-alias-state-error-primary);font-size:calc(11px + var(--deers-font-boost,0px));overflow-wrap:anywhere}._6h_V4q_taskDetailAttempt{border:1px solid var(--dsw-alias-border-l2);font-size:calc(10px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px}._6h_V4q_taskHistoryBlock{border-top:1px solid var(--dsw-alias-border-l2);margin-top:10px;padding-top:8px;display:block}._6h_V4q_taskHistoryToggle{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));background:0 0;border:0;align-items:center;gap:6px;padding:2px 0;display:inline-flex}._6h_V4q_taskHistoryLoading{color:var(--dsw-alias-label-tertiary);font-size:calc(11px + var(--deers-font-boost,0px));padding:4px 0;display:block}._6h_V4q_taskHistoryBody{gap:6px;margin-top:6px;display:grid}._6h_V4q_taskHistoryGroup{gap:3px;display:grid}._6h_V4q_taskHistoryGroupTitle{font-size:calc(10px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.06em}._6h_V4q_taskHistoryRow{font-size:calc(11px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;-webkit-line-clamp:3;-webkit-box-orient:vertical;line-height:1.55;display:-webkit-box;overflow:hidden}._6h_V4q_memberMailButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));background:0 0;border-radius:7px;flex:none;margin-left:auto;padding:2px 7px}._6h_V4q_memberMailButton:hover{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}._6h_V4q_mailList{gap:8px;max-height:46vh;padding:4px 2px;display:grid;overflow:auto}._6h_V4q_mailMessage{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;gap:3px;padding:8px 10px;display:grid}._6h_V4q_mailMessage[data-from=captain]{background:var(--dsw-alias-bg-module-platform)}._6h_V4q_mailMeta{font-size:calc(10px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-tertiary)}._6h_V4q_mailBody{font-size:calc(12px + var(--deers-font-boost,0px));overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.6}._6h_V4q_mailStatus{color:var(--dsw-alias-label-tertiary);font-size:calc(12px + var(--deers-font-boost,0px))}._6h_V4q_mailCompose{gap:6px;margin-top:12px;display:grid}._6h_V4q_mailInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));resize:vertical;border-radius:8px;padding:8px 10px}._6h_V4q_timelineSection{border-top:1px solid var(--dsw-alias-border-l2);margin-top:18px;padding-top:10px}._6h_V4q_timelineLoading{color:var(--dsw-alias-label-tertiary);font-size:calc(12px + var(--deers-font-boost,0px));padding:6px 0;display:block}._6h_V4q_timelineRows{gap:4px;display:grid}._6h_V4q_timelineRow{font-size:calc(12px + var(--deers-font-boost,0px));align-items:baseline;gap:10px;display:flex}._6h_V4q_timelineTime{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none}._6h_V4q_timelineText{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}._6h_V4q_timelineRow[data-kind=message] ._6h_V4q_timelineText{color:var(--dsw-alias-label-primary)}._6h_V4q_team{gap:10px}._6h_V4q_teamHead{border:1px solid var(--dsw-alias-border-l2);background:linear-gradient(120deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent), transparent 58%), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 96%, transparent);border-radius:14px;flex-wrap:wrap;padding:10px 12px}._6h_V4q_phasePill{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 28%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 9%, transparent);color:var(--dsw-alias-state-business-primary);font-size:calc(10px + var(--deers-font-boost,0px));border-radius:999px;flex:none;padding:1px 8px;line-height:18px}._6h_V4q_phasePill[data-phase=staged]{border-color:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 38%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 10%, transparent);color:var(--dsw-alias-state-warning-primary,#b45309)}._6h_V4q_phasePill[data-halted]{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);background:0 0}._6h_V4q_progressOverview{border:1px solid var(--dsw-alias-border-l2);background:linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, transparent), transparent 62%), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 98%, transparent);border-radius:14px;padding:12px 14px}._6h_V4q_progressOverview[data-tone=warning]{border-color:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 34%, var(--dsw-alias-border-l2))}._6h_V4q_summaryHead{align-items:center;gap:10px;min-width:0;display:flex}._6h_V4q_summaryFraction{color:var(--dsw-alias-label-secondary);font-size:calc(12px + var(--deers-font-boost,0px));font-variant-numeric:tabular-nums;margin-left:auto}._6h_V4q_deliveryRingWrap{flex:none;place-items:center;width:48px;height:48px;display:inline-grid;position:relative}._6h_V4q_deliveryRing{width:48px;height:48px;position:absolute;inset:0;transform:rotate(-90deg)}._6h_V4q_deliveryRingTrack{fill:none;stroke:var(--dsw-alias-border-l2);stroke-width:3.5px}._6h_V4q_deliveryRingValue{fill:none;stroke:var(--dsw-alias-state-business-primary);stroke-width:3.5px;stroke-linecap:round;transition:stroke-dasharray .24s}._6h_V4q_deliveryRingLabel{color:var(--dsw-alias-label-primary);font-size:calc(10px + var(--deers-font-boost,0px));font-variant-numeric:tabular-nums;font-weight:650;position:relative}._6h_V4q_summaryStats{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:9px;display:grid}._6h_V4q_summaryStats>span{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2,transparent) 42%, transparent);color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));border-radius:10px;flex-direction:column;gap:1px;padding:7px 9px;line-height:1.35;display:flex}._6h_V4q_summaryStats b{color:var(--dsw-alias-label-primary);font-size:calc(17px + var(--deers-font-boost,0px));font-variant-numeric:tabular-nums;font-weight:700}._6h_V4q_summaryStats>span[data-state=running] b{color:var(--dsw-alias-state-business-primary)}._6h_V4q_summaryStats>span[data-state=open] b{color:var(--dsw-alias-label-primary)}._6h_V4q_summaryStats>span[data-state=blocked] b{color:var(--dsw-alias-state-warning-primary,#d97706)}._6h_V4q_summaryStats>span[data-state=completed] b{color:var(--dsw-alias-state-success-primary,#16a34a)}._6h_V4q_deerMembersCard{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 98%, transparent);border-radius:14px;flex-direction:column;gap:4px;padding:10px 12px;display:flex}._6h_V4q_deerMembersCard ._6h_V4q_membersToggle{margin:0;padding-bottom:4px}._6h_V4q_deerMembersCard ._6h_V4q_delegationTree{padding-top:2px}._6h_V4q_memberActivityDot{box-sizing:content-box;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-label-tertiary);border-radius:50%;width:8px;height:8px;position:absolute;bottom:1px;right:1px}._6h_V4q_memberActivityDot[data-activity=working]{background:var(--dsw-alias-state-business-primary);animation:1.25s ease-in-out infinite _6h_V4q_agentTeamsPulse}._6h_V4q_dependencySection{border:1px solid var(--dsw-alias-border-l2);background:radial-gradient(1px 1px at 22% 28%, color-mix(in srgb, var(--dsw-alias-label-tertiary) 55%, transparent) 45%, transparent 55%), radial-gradient(1px 1px at 72% 18%, color-mix(in srgb, var(--dsw-alias-label-tertiary) 42%, transparent) 45%, transparent 55%), radial-gradient(1px 1px at 48% 72%, color-mix(in srgb, var(--dsw-alias-label-tertiary) 48%, transparent) 45%, transparent 55%), radial-gradient(1px 1px at 88% 62%, color-mix(in srgb, var(--dsw-alias-label-tertiary) 38%, transparent) 45%, transparent 55%), linear-gradient(160deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent), transparent 58%), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 98%, transparent);background-size:150px 150px,190px 190px,230px 230px,280px 280px,auto,auto;border-radius:14px;padding:12px}._6h_V4q_dependencySection ._6h_V4q_sectionHead{z-index:1;position:relative}._6h_V4q_dependencySection ._6h_V4q_dagNode{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 86%, transparent);box-shadow:0 10px 24px color-mix(in srgb, var(--dsw-alias-bg-mask-3,#000) 16%, transparent);border-radius:12px}._6h_V4q_captainNode{border-radius:12px}@media (width<=560px){._6h_V4q_summaryStats{grid-template-columns:repeat(2,minmax(0,1fr))}}._6h_V4q_starMapCount{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));border-radius:999px;flex:none;margin-left:auto;padding:1px 8px;line-height:18px}._6h_V4q_deerMembersCard ._6h_V4q_captainNode{margin-bottom:6px}._6h_V4q_deerMembersCard ._6h_V4q_membersToggle{border-bottom:1px solid var(--dsw-alias-border-l2)}._6h_V4q_teamHead ._6h_V4q_teamStats{margin-left:auto}._6h_V4q_taskActionSelect option,._6h_V4q_taskActionSelect optgroup,._6h_V4q_planCard select option,._6h_V4q_planCard select optgroup{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}";
		const tagId$2 = "deers-dsh-agent-team/ActivityPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deers-dsh-agent-team";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ActivityPanel_module_css_default = {
			"agent-team": "_6h_V4q_agent-team",
			"agentTeamsBreathe": "_6h_V4q_agentTeamsBreathe",
			"agentTeamsDot": "_6h_V4q_agentTeamsDot",
			"agentTeamsFloat": "_6h_V4q_agentTeamsFloat",
			"agentTeamsPanelIn": "_6h_V4q_agentTeamsPanelIn",
			"agentTeamsPulse": "_6h_V4q_agentTeamsPulse",
			"agentTeamsThink": "_6h_V4q_agentTeamsThink",
			"agentTeamsUnreadPulse": "_6h_V4q_agentTeamsUnreadPulse",
			"archiveLabel": "_6h_V4q_archiveLabel",
			"assignmentChip": "_6h_V4q_assignmentChip",
			"assignmentLabel": "_6h_V4q_assignmentLabel",
			"assignmentLine": "_6h_V4q_assignmentLine",
			"assignmentTasks": "_6h_V4q_assignmentTasks",
			"badge": "_6h_V4q_badge",
			"badgeCount": "_6h_V4q_badgeCount",
			"badgeDot": "_6h_V4q_badgeDot",
			"captainAvatar": "_6h_V4q_captainAvatar",
			"captainInfo": "_6h_V4q_captainInfo",
			"captainLine": "_6h_V4q_captainLine",
			"captainName": "_6h_V4q_captainName",
			"captainNode": "_6h_V4q_captainNode",
			"captainRole": "_6h_V4q_captainRole",
			"captainState": "_6h_V4q_captainState",
			"captainSummary": "_6h_V4q_captainSummary",
			"chevron": "_6h_V4q_chevron",
			"dagCanvas": "_6h_V4q_dagCanvas",
			"dagEdges": "_6h_V4q_dagEdges",
			"dagMinimap": "_6h_V4q_dagMinimap",
			"dagMinimapCanvas": "_6h_V4q_dagMinimapCanvas",
			"dagMinimapNode": "_6h_V4q_dagMinimapNode",
			"dagMinimapView": "_6h_V4q_dagMinimapView",
			"dagNode": "_6h_V4q_dagNode",
			"dagNodeDot": "_6h_V4q_dagNodeDot",
			"dagNodeHead": "_6h_V4q_dagNodeHead",
			"dagNodeLabel": "_6h_V4q_dagNodeLabel",
			"dagOwner": "_6h_V4q_dagOwner",
			"dagRunningState": "_6h_V4q_dagRunningState",
			"dagViewport": "_6h_V4q_dagViewport",
			"dagZoomControls": "_6h_V4q_dagZoomControls",
			"dagZoomWrap": "_6h_V4q_dagZoomWrap",
			"deerMembersCard": "_6h_V4q_deerMembersCard",
			"delegationSection": "_6h_V4q_delegationSection",
			"delegationTree": "_6h_V4q_delegationTree",
			"deliveryRing": "_6h_V4q_deliveryRing",
			"deliveryRingLabel": "_6h_V4q_deliveryRingLabel",
			"deliveryRingTrack": "_6h_V4q_deliveryRingTrack",
			"deliveryRingValue": "_6h_V4q_deliveryRingValue",
			"deliveryRingWrap": "_6h_V4q_deliveryRingWrap",
			"dependencySection": "_6h_V4q_dependencySection",
			"emptyHint": "_6h_V4q_emptyHint",
			"historicPill": "_6h_V4q_historicPill",
			"iconButton": "_6h_V4q_iconButton",
			"leadAvatar": "_6h_V4q_leadAvatar",
			"mailBody": "_6h_V4q_mailBody",
			"mailCompose": "_6h_V4q_mailCompose",
			"mailInput": "_6h_V4q_mailInput",
			"mailList": "_6h_V4q_mailList",
			"mailMessage": "_6h_V4q_mailMessage",
			"mailMeta": "_6h_V4q_mailMeta",
			"mailStatus": "_6h_V4q_mailStatus",
			"memberActivityDot": "_6h_V4q_memberActivityDot",
			"memberArt": "_6h_V4q_memberArt",
			"memberAvatar": "_6h_V4q_memberAvatar",
			"memberBlock": "_6h_V4q_memberBlock",
			"memberBranch": "_6h_V4q_memberBranch",
			"memberCount": "_6h_V4q_memberCount",
			"memberInfo": "_6h_V4q_memberInfo",
			"memberInitial": "_6h_V4q_memberInitial",
			"memberLine": "_6h_V4q_memberLine",
			"memberMailButton": "_6h_V4q_memberMailButton",
			"memberModel": "_6h_V4q_memberModel",
			"memberName": "_6h_V4q_memberName",
			"memberRole": "_6h_V4q_memberRole",
			"memberRow": "_6h_V4q_memberRow",
			"memberState": "_6h_V4q_memberState",
			"memberStatusLine": "_6h_V4q_memberStatusLine",
			"members": "_6h_V4q_members",
			"membersToggle": "_6h_V4q_membersToggle",
			"panel": "_6h_V4q_panel",
			"panelControls": "_6h_V4q_panelControls",
			"panelDot": "_6h_V4q_panelDot",
			"panelHead": "_6h_V4q_panelHead",
			"panelTitle": "_6h_V4q_panelTitle",
			"phasePill": "_6h_V4q_phasePill",
			"plan-feedback-in": "_6h_V4q_plan-feedback-in",
			"planActions": "_6h_V4q_planActions",
			"planApproveActions": "_6h_V4q_planApproveActions",
			"planApproveCopy": "_6h_V4q_planApproveCopy",
			"planApproveRow": "_6h_V4q_planApproveRow",
			"planCard": "_6h_V4q_planCard",
			"planCardBody": "_6h_V4q_planCardBody",
			"planCardHeader": "_6h_V4q_planCardHeader",
			"planCardIdentity": "_6h_V4q_planCardIdentity",
			"planCardMeta": "_6h_V4q_planCardMeta",
			"planChevron": "_6h_V4q_planChevron",
			"planConfirm": "_6h_V4q_planConfirm",
			"planDirty": "_6h_V4q_planDirty",
			"planEditor": "_6h_V4q_planEditor",
			"planEmpty": "_6h_V4q_planEmpty",
			"planFeedback": "_6h_V4q_planFeedback",
			"planFlow": "_6h_V4q_planFlow",
			"planGrid": "_6h_V4q_planGrid",
			"planHeader": "_6h_V4q_planHeader",
			"planList": "_6h_V4q_planList",
			"planModelEffortRow": "_6h_V4q_planModelEffortRow",
			"planModelHint": "_6h_V4q_planModelHint",
			"planModelMenu": "_6h_V4q_planModelMenu",
			"planModelMenuBack": "_6h_V4q_planModelMenuBack",
			"planModelMenuRow": "_6h_V4q_planModelMenuRow",
			"planModelNotice": "_6h_V4q_planModelNotice",
			"planModelPicker": "_6h_V4q_planModelPicker",
			"planModelTrigger": "_6h_V4q_planModelTrigger",
			"planModelTriggerCopy": "_6h_V4q_planModelTriggerCopy",
			"planNewTask": "_6h_V4q_planNewTask",
			"planReviewActions": "_6h_V4q_planReviewActions",
			"planSecondaryActions": "_6h_V4q_planSecondaryActions",
			"planSection": "_6h_V4q_planSection",
			"planSectionToggle": "_6h_V4q_planSectionToggle",
			"planTaskId": "_6h_V4q_planTaskId",
			"planTaskSummary": "_6h_V4q_planTaskSummary",
			"progressEmpty": "_6h_V4q_progressEmpty",
			"progressLegend": "_6h_V4q_progressLegend",
			"progressOverview": "_6h_V4q_progressOverview",
			"progressSegmentRows": "_6h_V4q_progressSegmentRows",
			"progressSegments": "_6h_V4q_progressSegments",
			"progressSummary": "_6h_V4q_progressSummary",
			"progressSummaryDot": "_6h_V4q_progressSummaryDot",
			"progressTitle": "_6h_V4q_progressTitle",
			"resizeHandle": "_6h_V4q_resizeHandle",
			"sectionHead": "_6h_V4q_sectionHead",
			"sectionHint": "_6h_V4q_sectionHint",
			"sectionTitle": "_6h_V4q_sectionTitle",
			"sectionToggleTitle": "_6h_V4q_sectionToggleTitle",
			"stageLabel": "_6h_V4q_stageLabel",
			"starMapCount": "_6h_V4q_starMapCount",
			"stateArt": "_6h_V4q_stateArt",
			"stopModalActions": "_6h_V4q_stopModalActions",
			"stopModalError": "_6h_V4q_stopModalError",
			"summaryFraction": "_6h_V4q_summaryFraction",
			"summaryHead": "_6h_V4q_summaryHead",
			"summaryStats": "_6h_V4q_summaryStats",
			"taskActionError": "_6h_V4q_taskActionError",
			"taskActionSelect": "_6h_V4q_taskActionSelect",
			"taskActions": "_6h_V4q_taskActions",
			"taskDetail": "_6h_V4q_taskDetail",
			"taskDetailAttempt": "_6h_V4q_taskDetailAttempt",
			"taskDetailBadge": "_6h_V4q_taskDetailBadge",
			"taskDetailHead": "_6h_V4q_taskDetailHead",
			"taskDetailId": "_6h_V4q_taskDetailId",
			"taskDetailLine": "_6h_V4q_taskDetailLine",
			"taskDetailMeta": "_6h_V4q_taskDetailMeta",
			"taskDetailModel": "_6h_V4q_taskDetailModel",
			"taskDetailSubject": "_6h_V4q_taskDetailSubject",
			"taskEmpty": "_6h_V4q_taskEmpty",
			"taskFilterChip": "_6h_V4q_taskFilterChip",
			"taskFilterRow": "_6h_V4q_taskFilterRow",
			"taskHistoryBlock": "_6h_V4q_taskHistoryBlock",
			"taskHistoryBody": "_6h_V4q_taskHistoryBody",
			"taskHistoryGroup": "_6h_V4q_taskHistoryGroup",
			"taskHistoryGroupTitle": "_6h_V4q_taskHistoryGroupTitle",
			"taskHistoryLoading": "_6h_V4q_taskHistoryLoading",
			"taskHistoryRow": "_6h_V4q_taskHistoryRow",
			"taskHistoryToggle": "_6h_V4q_taskHistoryToggle",
			"taskId": "_6h_V4q_taskId",
			"team": "_6h_V4q_team",
			"teamHead": "_6h_V4q_teamHead",
			"teamName": "_6h_V4q_teamName",
			"teamPollButton": "_6h_V4q_teamPollButton",
			"teamStats": "_6h_V4q_teamStats",
			"teamStopButton": "_6h_V4q_teamStopButton",
			"teams": "_6h_V4q_teams",
			"timelineLoading": "_6h_V4q_timelineLoading",
			"timelineRow": "_6h_V4q_timelineRow",
			"timelineRows": "_6h_V4q_timelineRows",
			"timelineSection": "_6h_V4q_timelineSection",
			"timelineText": "_6h_V4q_timelineText",
			"timelineTime": "_6h_V4q_timelineTime",
			"unreadPill": "_6h_V4q_unreadPill",
			"workGlyph": "_6h_V4q_workGlyph",
			"workspaceSplit": "_6h_V4q_workspaceSplit"
		};
		//#endregion
		//#region lib/client/StagingPlanEditor.js
		/**
		* Editable pre-run roster and DAG review for staged AgentTeams plans.
		*
		* This leaf owns only transient form/disclosure state. Durable truth remains
		* on the host and returns through the ordinary activity polling snapshot.
		* @module deers-dsh-agent-team/client/staging-plan
		*/
		const PLAN_URL = "/plugins/deers-dsh-agent-team/plan";
		function useDismissSuccess(feedback, setFeedback) {
			(0, react.useEffect)(() => {
				if (feedback?.tone !== "success") return;
				const timeout = window.setTimeout(() => {
					setFeedback(void 0);
				}, 3500);
				return () => {
					window.clearTimeout(timeout);
				};
			}, [feedback, setFeedback]);
		}
		async function mutatePlan(payload) {
			const response = await fetch(PLAN_URL, {
				method: "POST",
				cache: "no-store",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			if (response.ok) return;
			let message = `HTTP ${response.status}`;
			try {
				const body = await response.json();
				if (typeof body.error === "string" && body.error.trim() !== "") message = body.error;
			} catch {}
			throw new Error(message);
		}
		function errorMessage(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function DisclosureChevron({ open }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.planChevron,
				"data-open": open,
				width: "12",
				height: "12",
				viewBox: "0 0 12 12",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				"aria-hidden": true,
				children: (0, react_jsx_runtime.jsx)("path", { d: "M4 2.5 7.5 6 4 9.5" })
			});
		}
		function Feedback({ value }) {
			if (value === void 0) return null;
			return (0, react_jsx_runtime.jsxs)("span", {
				className: ActivityPanel_module_css_default.planFeedback,
				"data-tone": value.tone,
				role: value.tone === "error" ? "alert" : "status",
				"aria-live": value.tone === "error" ? "assertive" : "polite",
				children: [(0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					children: value.tone === "success" ? (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						children: (0, react_jsx_runtime.jsx)("path", { d: "m2.5 6.2 2.2 2.2 4.8-5" })
					}) : (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						children: (0, react_jsx_runtime.jsx)("path", { d: "M6 2.3v4.1M6 8.8v.1" })
					})
				}), value.message]
			});
		}
		function routeKey(provider, model) {
			return JSON.stringify([provider, model]);
		}
		const MODEL_MENU_OPEN_MODELS = "open:models";
		const MODEL_MENU_OPEN_EFFORT = "open:effort";
		const MODEL_MENU_BACK = "navigate:back";
		const MODEL_MENU_RETRY = "action:retry";
		const MODEL_MENU_DEFAULT_EFFORT = "effort:default";
		function modelMenuId(provider, model) {
			return `model:${routeKey(provider, model)}`;
		}
		function effortMenuId(effort) {
			return `effort:${effort}`;
		}
		/**
		* Thin staged-plan adapter over the official model directory. It deliberately
		* reads only catalog metadata: choosing a member route must not change the
		* captain session's composer model.
		*/
		function StagedModelPicker({ directory, provider, model, reasoningEffort, busy, onChange, t }) {
			const state = (0, react.useSyncExternalStore)(directory.store.subscribe, directory.store.getSnapshot);
			const [open, setOpen] = (0, react.useState)(false);
			const [pane, setPane] = (0, react.useState)("root");
			const catalogRoutes = state.groups.flatMap((group) => group.models.map((candidate) => ({
				key: routeKey(group.id, candidate.id),
				provider: group.id,
				providerName: group.name,
				model: candidate
			})));
			const selectedKey = routeKey(provider, model);
			const selected = catalogRoutes.find((candidate) => candidate.key === selectedKey);
			const efforts = selected?.model.reasoning?.efforts ?? [];
			const currentMissing = provider !== "" && model !== "" && selected === void 0;
			const defaultEffort = selected?.model.reasoning?.defaultEffort;
			const effectiveEffort = reasoningEffort === "" || reasoningEffort === "default" ? defaultEffort : reasoningEffort;
			const selectedEffort = efforts.find((effort) => effort.id === effectiveEffort);
			const modelLabel = selected?.model.name ?? (model === "" ? t("plan.model.choose") : model);
			const effortLabel = selectedEffort?.name ?? (effectiveEffort === void 0 ? t("plan.model.providerDefault") : effectiveEffort);
			const unavailable = state.status === "error" || state.failures.length > 0;
			const close = () => {
				setOpen(false);
				setPane("root");
			};
			const rootItems = [{
				id: MODEL_MENU_OPEN_MODELS,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuRow,
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("plan.member.model") }),
						(0, react_jsx_runtime.jsx)("strong", { children: modelLabel }),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false })
					]
				}),
				disabled: state.status === "loading" && catalogRoutes.length === 0
			}, {
				id: MODEL_MENU_OPEN_EFFORT,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuRow,
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("plan.member.reasoning") }),
						(0, react_jsx_runtime.jsx)("strong", { children: effortLabel }),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false })
					]
				}),
				disabled: selected?.model.reasoning === void 0
			}];
			const modelItems = [{
				id: MODEL_MENU_BACK,
				label: (0, react_jsx_runtime.jsxs)("span", {
					className: ActivityPanel_module_css_default.planModelMenuBack,
					children: [(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false }), t("plan.model.back")]
				})
			}, {
				type: "separator",
				id: "models:separator"
			}];
			if (catalogRoutes.length === 0) modelItems.push({
				id: "models:empty",
				label: state.status === "loading" ? t("plan.model.loading") : t("plan.model.empty"),
				disabled: true
			});
			else for (const group of state.groups) {
				modelItems.push({
					type: "label",
					id: `provider:${group.id}`,
					text: group.name
				});
				for (const candidate of group.models) modelItems.push({
					id: modelMenuId(group.id, candidate.id),
					label: candidate.name
				});
			}
			const effortItems = [
				{
					id: MODEL_MENU_BACK,
					label: (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelMenuBack,
						children: [(0, react_jsx_runtime.jsx)(DisclosureChevron, { open: false }), t("plan.model.back")]
					})
				},
				{
					type: "separator",
					id: "effort:separator"
				},
				{
					id: MODEL_MENU_DEFAULT_EFFORT,
					label: defaultEffort === void 0 ? t("plan.model.providerDefault") : t("plan.model.modelDefault", { effort: efforts.find((effort) => effort.id === defaultEffort)?.name ?? defaultEffort })
				},
				...efforts.map((effort) => ({
					id: effortMenuId(effort.id),
					label: (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelEffortRow,
						children: [(0, react_jsx_runtime.jsx)("span", { children: effort.name }), effort.description !== void 0 && (0, react_jsx_runtime.jsx)("small", { children: effort.description })]
					})
				}))
			];
			const items = pane === "models" ? modelItems : pane === "effort" ? effortItems : rootItems;
			const selectedId = pane === "models" ? modelMenuId(provider, model) : pane === "effort" ? reasoningEffort === "" || reasoningEffort === "default" ? MODEL_MENU_DEFAULT_EFFORT : effortMenuId(reasoningEffort) : void 0;
			const choose = (id) => {
				if (id === MODEL_MENU_OPEN_MODELS) {
					setPane("models");
					return;
				}
				if (id === MODEL_MENU_OPEN_EFFORT) {
					setPane("effort");
					return;
				}
				if (id === MODEL_MENU_BACK) {
					setPane("root");
					return;
				}
				if (id === MODEL_MENU_RETRY) {
					directory.load().catch(() => void 0);
					return;
				}
				const nextModel = catalogRoutes.find((candidate) => modelMenuId(candidate.provider, candidate.model.id) === id);
				if (nextModel !== void 0) {
					close();
					if (nextModel.provider === provider && nextModel.model.id === model) return;
					onChange({
						provider: nextModel.provider,
						model: nextModel.model.id,
						reasoningEffort: "default"
					});
					return;
				}
				if (id === MODEL_MENU_DEFAULT_EFFORT) {
					close();
					if (effectiveEffort === defaultEffort) return;
					onChange({
						provider,
						model,
						reasoningEffort: "default"
					});
					return;
				}
				const nextEffort = efforts.find((effort) => effortMenuId(effort.id) === id);
				if (nextEffort === void 0) return;
				close();
				if (nextEffort.id === reasoningEffort) return;
				onChange({
					provider,
					model,
					reasoningEffort: nextEffort.id
				});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ActivityPanel_module_css_default.planModelPicker,
				"data-model-directory-status": state.status,
				children: [
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open,
						portal: true,
						align: "end",
						compact: true,
						className: ActivityPanel_module_css_default.planModelMenu,
						items,
						footer: unavailable ? [{
							id: MODEL_MENU_RETRY,
							label: t("plan.model.retry")
						}] : void 0,
						selectedId,
						onSelect: choose,
						onClose: close,
						anchor: (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planModelTrigger,
							"data-plan-model-trigger": true,
							"aria-label": t("plan.model.triggerAria", {
								model: modelLabel,
								effort: effortLabel
							}),
							"aria-haspopup": "menu",
							"aria-expanded": open,
							disabled: busy,
							onClick: () => {
								if (open) close();
								else {
									setPane("root");
									setOpen(true);
									directory.load().catch(() => void 0);
								}
							},
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planModelTriggerCopy,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: state.status === "loading" && catalogRoutes.length === 0 ? t("plan.model.loading") : modelLabel }), (0, react_jsx_runtime.jsx)("span", { children: effortLabel })]
							}), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open })]
						})
					}),
					(0, react_jsx_runtime.jsx)("small", {
						className: ActivityPanel_module_css_default.planModelHint,
						children: currentMissing ? t("plan.model.currentUnavailable", {
							provider,
							model
						}) : selected?.model.description ?? t("plan.model.route", {
							provider,
							model
						})
					}),
					unavailable && (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planModelNotice,
						role: state.status === "error" ? "alert" : "status",
						children: [(0, react_jsx_runtime.jsx)("span", { children: state.error ?? t("plan.model.partialFailure", { count: state.failures.length }) }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy || state.status === "loading",
							onClick: () => {
								directory.load().catch(() => void 0);
							},
							children: t("plan.model.retry")
						})]
					})
				]
			});
		}
		function StagedMemberEditor({ team, member, modelDirectory, onPendingChange, t }) {
			const bodyId = (0, react.useId)();
			const [open, setOpen] = (0, react.useState)(false);
			const [role, setRole] = (0, react.useState)(member.role);
			const [provider, setProvider] = (0, react.useState)(member.provider ?? "");
			const [model, setModel] = (0, react.useState)(member.model ?? "");
			const [reasoningEffort, setReasoningEffort] = (0, react.useState)(member.reasoningEffort ?? "");
			const [executionPrompt, setExecutionPrompt] = (0, react.useState)(member.executionPrompt ?? "");
			const remoteSignature = JSON.stringify([
				member.role,
				member.provider ?? "",
				member.model ?? "",
				member.reasoningEffort ?? "",
				member.executionPrompt ?? ""
			]);
			const [savedSignature, setSavedSignature] = (0, react.useState)(remoteSignature);
			const [busy, setBusy] = (0, react.useState)(false);
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const dirty = JSON.stringify([
				role,
				provider,
				model,
				reasoningEffort,
				executionPrompt
			]) !== savedSignature;
			(0, react.useEffect)(() => {
				onPendingChange(`member:${member.name}`, dirty || busy);
				return () => {
					onPendingChange(`member:${member.name}`, false);
				};
			}, [
				busy,
				dirty,
				member.name,
				onPendingChange
			]);
			(0, react.useEffect)(() => {
				setRole(member.role);
				setProvider(member.provider ?? "");
				setModel(member.model ?? "");
				setReasoningEffort(member.reasoningEffort ?? "");
				setExecutionPrompt(member.executionPrompt ?? "");
				setSavedSignature(remoteSignature);
			}, [
				member.role,
				member.provider,
				member.model,
				member.reasoningEffort,
				member.executionPrompt,
				remoteSignature
			]);
			const markEdited = () => {
				setFeedback(void 0);
			};
			const persist = async (selection = {
				provider,
				model,
				reasoningEffort
			}) => {
				const nextSignature = JSON.stringify([
					role,
					selection.provider,
					selection.model,
					selection.reasoningEffort,
					executionPrompt
				]);
				setProvider(selection.provider);
				setModel(selection.model);
				setReasoningEffort(selection.reasoningEffort);
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "update_member",
						memberName: member.name,
						role,
						provider: selection.provider,
						model: selection.model,
						reasoningEffort: selection.reasoningEffort,
						executionPrompt
					});
					setSavedSignature(nextSignature);
					setFeedback({
						tone: "success",
						message: t("plan.saved")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const save = async (event) => {
				event.preventDefault();
				await persist();
			};
			const route = `${provider}/${model}`.replace(/^\//u, "");
			return (0, react_jsx_runtime.jsxs)("article", {
				className: ActivityPanel_module_css_default.planCard,
				"data-plan-member": member.name,
				"data-open": open,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ActivityPanel_module_css_default.planCardHeader,
					"aria-expanded": open,
					"aria-controls": bodyId,
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planCardIdentity,
							children: [(0, react_jsx_runtime.jsx)("strong", { children: member.name }), (0, react_jsx_runtime.jsx)("span", { children: role || t("plan.member.roleFallback") })]
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planCardMeta,
							title: route,
							children: route
						}),
						dirty && (0, react_jsx_runtime.jsx)("em", {
							className: ActivityPanel_module_css_default.planDirty,
							children: t("plan.unsaved")
						}),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open })
					]
				}), open && (0, react_jsx_runtime.jsxs)("form", {
					id: bodyId,
					className: ActivityPanel_module_css_default.planCardBody,
					onSubmit: (event) => {
						save(event);
					},
					children: [(0, react_jsx_runtime.jsxs)("fieldset", {
						disabled: busy,
						children: [
							(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.member.role"), (0, react_jsx_runtime.jsx)("input", {
								name: "role",
								value: role,
								onChange: (event) => {
									setRole(event.currentTarget.value);
									markEdited();
								}
							})] }),
							(0, react_jsx_runtime.jsx)(StagedModelPicker, {
								directory: modelDirectory,
								provider,
								model,
								reasoningEffort,
								busy,
								onChange: (selection) => {
									persist(selection);
								},
								t
							}),
							(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.member.prompt"), (0, react_jsx_runtime.jsx)("textarea", {
								name: "executionPrompt",
								value: executionPrompt,
								onChange: (event) => {
									setExecutionPrompt(event.currentTarget.value);
									markEdited();
								},
								rows: 3
							})] })
						]
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.planActions,
						children: [(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }), (0, react_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || !dirty || provider.trim() === "" || model.trim() === "",
							children: busy ? t("plan.saving") : t("plan.save")
						})]
					})]
				})]
			});
		}
		function StagedTaskEditor({ team, task, onPendingChange, t }) {
			const bodyId = (0, react.useId)();
			const taskDependencies = task.dependencies.join(", ");
			const [open, setOpen] = (0, react.useState)(false);
			const [subject, setSubject] = (0, react.useState)(task.subject);
			const [description, setDescription] = (0, react.useState)(task.description ?? "");
			const [assignee, setAssignee] = (0, react.useState)(task.assignee);
			const [dependencies, setDependencies] = (0, react.useState)(taskDependencies);
			const remoteSignature = JSON.stringify([
				task.subject,
				task.description ?? "",
				task.assignee,
				taskDependencies
			]);
			const [savedSignature, setSavedSignature] = (0, react.useState)(remoteSignature);
			const [busy, setBusy] = (0, react.useState)(false);
			const [confirmingRemove, setConfirmingRemove] = (0, react.useState)(false);
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const signature = JSON.stringify([
				subject,
				description,
				assignee,
				dependencies
			]);
			const dirty = signature !== savedSignature;
			(0, react.useEffect)(() => {
				onPendingChange(`task:${task.id}`, dirty || busy);
				return () => {
					onPendingChange(`task:${task.id}`, false);
				};
			}, [
				busy,
				dirty,
				onPendingChange,
				task.id
			]);
			(0, react.useEffect)(() => {
				setSubject(task.subject);
				setDescription(task.description ?? "");
				setAssignee(task.assignee);
				setDependencies(taskDependencies);
				setSavedSignature(remoteSignature);
			}, [
				task.subject,
				task.description,
				task.assignee,
				taskDependencies,
				remoteSignature
			]);
			const markEdited = () => {
				setFeedback(void 0);
				setConfirmingRemove(false);
			};
			const save = async (event) => {
				event.preventDefault();
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "update_task",
						taskId: task.id,
						subject,
						description,
						assignee,
						dependencies: dependencies.split(",").map((item) => item.trim()).filter(Boolean)
					});
					setSavedSignature(signature);
					setFeedback({
						tone: "success",
						message: t("plan.saved")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const remove = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "remove_task",
						taskId: task.id
					});
					setFeedback({
						tone: "success",
						message: t("plan.removed")
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const dependencySummary = task.dependencies.length === 0 ? t("plan.dependencies.none") : t("plan.dependencies.count", { count: task.dependencies.length });
			return (0, react_jsx_runtime.jsxs)("article", {
				className: ActivityPanel_module_css_default.planCard,
				"data-plan-task": task.id,
				"data-open": open,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ActivityPanel_module_css_default.planCardHeader,
					"aria-expanded": open,
					"aria-controls": bodyId,
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planTaskId,
							children: task.id
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.planTaskSummary,
							title: subject,
							children: subject
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planCardMeta,
							children: [
								assignee || t("plan.task.unassigned"),
								" · ",
								dependencySummary
							]
						}),
						dirty && (0, react_jsx_runtime.jsx)("em", {
							className: ActivityPanel_module_css_default.planDirty,
							children: t("plan.unsaved")
						}),
						(0, react_jsx_runtime.jsx)(DisclosureChevron, { open })
					]
				}), open && (0, react_jsx_runtime.jsxs)("form", {
					id: bodyId,
					className: ActivityPanel_module_css_default.planCardBody,
					onSubmit: (event) => {
						save(event);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("fieldset", {
							disabled: busy,
							children: [
								(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.subject"), (0, react_jsx_runtime.jsx)("input", {
									name: "subject",
									required: true,
									value: subject,
									onChange: (event) => {
										setSubject(event.currentTarget.value);
										markEdited();
									}
								})] }),
								(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.description"), (0, react_jsx_runtime.jsx)("textarea", {
									name: "description",
									value: description,
									onChange: (event) => {
										setDescription(event.currentTarget.value);
										markEdited();
									},
									rows: 3
								})] }),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.planGrid,
									children: [(0, react_jsx_runtime.jsxs)("label", { children: [t("plan.task.assignee"), (0, react_jsx_runtime.jsxs)("select", {
										name: "assignee",
										value: assignee,
										onChange: (event) => {
											setAssignee(event.currentTarget.value);
											markEdited();
										},
										children: [(0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t("plan.task.unassigned")
										}), team.members.map((member) => (0, react_jsx_runtime.jsx)("option", {
											value: member.name,
											children: member.name
										}, member.name))]
									})] }), (0, react_jsx_runtime.jsxs)("label", { children: [
										t("plan.task.dependencies"),
										(0, react_jsx_runtime.jsx)("input", {
											name: "dependencies",
											value: dependencies,
											onChange: (event) => {
												setDependencies(event.currentTarget.value);
												markEdited();
											}
										}),
										(0, react_jsx_runtime.jsx)("small", { children: t("plan.task.dependenciesHint") })
									] })]
								})
							]
						}),
						confirmingRemove && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planConfirm,
							role: "alert",
							children: [
								(0, react_jsx_runtime.jsx)("span", { children: t("plan.removeWarning", { task: task.id }) }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setConfirmingRemove(false);
									},
									children: t("plan.cancel")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-danger": true,
									"data-confirming": true,
									onClick: () => {
										remove();
									},
									children: t("plan.removeConfirm")
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.planActions,
							children: [
								(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-danger": true,
									onClick: () => {
										setConfirmingRemove(true);
										setFeedback(void 0);
									},
									disabled: busy || confirmingRemove,
									children: t("plan.remove")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: busy || !dirty || subject.trim() === "",
									children: busy ? t("plan.saving") : t("plan.save")
								})
							]
						})
					]
				})]
			});
		}
		function StagingPlanEditor({ team, modelDirectory, onContinuePlanning, onDiscarded, t }) {
			const membersId = (0, react.useId)();
			const tasksId = (0, react.useId)();
			const [membersOpen, setMembersOpen] = (0, react.useState)(true);
			const [tasksOpen, setTasksOpen] = (0, react.useState)(true);
			const [newTask, setNewTask] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [discardArmed, setDiscardArmed] = (0, react.useState)(false);
			const [pendingEditors, setPendingEditors] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [feedback, setFeedback] = (0, react.useState)();
			useDismissSuccess(feedback, setFeedback);
			const dependencyLinks = team.tasks.reduce((total, task) => total + task.dependencies.length, 0);
			const runnable = team.members.length > 0 && team.tasks.length > 0;
			const hasPendingEdits = pendingEditors.size > 0 || newTask.trim() !== "";
			const waitingForFeedback = team.planReviewState === "awaiting_feedback";
			(0, react.useEffect)(() => {
				modelDirectory.load().catch(() => void 0);
			}, [modelDirectory]);
			const onPendingChange = (0, react.useCallback)((key, pending) => {
				setPendingEditors((current) => {
					if (pending === current.has(key)) return current;
					const next = new Set(current);
					if (pending) next.add(key);
					else next.delete(key);
					return next;
				});
			}, []);
			const addTask = async (event) => {
				event.preventDefault();
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "add_task",
						subject: newTask,
						dependencies: []
					});
					setNewTask("");
					setFeedback({
						tone: "success",
						message: t("plan.taskAdded")
					});
					setTasksOpen(true);
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
				} finally {
					setBusy(false);
				}
			};
			const approve = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "approve"
					});
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const continueInChat = async () => {
				if (waitingForFeedback) {
					onContinuePlanning();
					return;
				}
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "continue"
					});
					onContinuePlanning();
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
				}
			};
			const discard = async () => {
				setBusy(true);
				setFeedback(void 0);
				try {
					await mutatePlan({
						sessionId: team.captainSessionId,
						teamId: team.teamId,
						action: "discard"
					});
					onDiscarded();
				} catch (error) {
					setFeedback({
						tone: "error",
						message: t("plan.failed", { message: errorMessage(error) })
					});
					setBusy(false);
					setDiscardArmed(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.planEditor,
				"data-staging-editor": true,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.planHeader,
						children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.readySummary", {
							members: team.members.length,
							tasks: team.tasks.length,
							links: dependencyLinks
						}) })] }), (0, react_jsx_runtime.jsx)("em", { children: t("plan.badge") })] }), (0, react_jsx_runtime.jsx)("p", { children: t("plan.description") })]
					}),
					(0, react_jsx_runtime.jsxs)("ol", {
						className: ActivityPanel_module_css_default.planFlow,
						"aria-label": t("plan.flow.aria"),
						children: [
							(0, react_jsx_runtime.jsxs)("li", {
								"data-active": true,
								children: [(0, react_jsx_runtime.jsx)("span", { children: "1" }), t("plan.flow.review")]
							}),
							(0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsx)("span", { children: "2" }), t("plan.flow.spawn")] }),
							(0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsx)("span", { children: "3" }), t("plan.flow.run")] })
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.planSection,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planSectionToggle,
							"aria-expanded": membersOpen,
							"aria-controls": membersId,
							onClick: () => {
								setMembersOpen((current) => !current);
							},
							children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.members.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.members.count", { count: team.members.length }) })] }), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open: membersOpen })]
						}), membersOpen && (0, react_jsx_runtime.jsx)("div", {
							id: membersId,
							className: ActivityPanel_module_css_default.planList,
							children: team.members.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: ActivityPanel_module_css_default.planEmpty,
								children: t("plan.members.empty")
							}) : team.members.map((member) => (0, react_jsx_runtime.jsx)(StagedMemberEditor, {
								team,
								member,
								modelDirectory,
								onPendingChange,
								t
							}, member.name))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.planSection,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.planSectionToggle,
							"aria-expanded": tasksOpen,
							"aria-controls": tasksId,
							onClick: () => {
								setTasksOpen((current) => !current);
							},
							children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("plan.tasks.title") }), (0, react_jsx_runtime.jsx)("small", { children: t("plan.tasks.count", {
								count: team.tasks.length,
								links: dependencyLinks
							}) })] }), (0, react_jsx_runtime.jsx)(DisclosureChevron, { open: tasksOpen })]
						}), tasksOpen && (0, react_jsx_runtime.jsx)("div", {
							id: tasksId,
							className: ActivityPanel_module_css_default.planList,
							children: team.tasks.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: ActivityPanel_module_css_default.planEmpty,
								children: t("plan.tasks.empty")
							}) : team.tasks.map((task) => (0, react_jsx_runtime.jsx)(StagedTaskEditor, {
								team,
								task,
								onPendingChange,
								t
							}, task.id))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("form", {
						className: ActivityPanel_module_css_default.planNewTask,
						onSubmit: (event) => {
							addTask(event);
						},
						children: [(0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("plan.newTaskLabel") }), (0, react_jsx_runtime.jsx)("input", {
							name: "newTask",
							value: newTask,
							onChange: (event) => {
								setNewTask(event.currentTarget.value);
								setFeedback(void 0);
							},
							placeholder: t("plan.newTask"),
							disabled: busy
						})] }), (0, react_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || newTask.trim() === "",
							children: busy ? t("plan.adding") : t("plan.addTask")
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.planApproveRow,
						"data-armed": discardArmed || void 0,
						"data-discard": discardArmed || void 0,
						"data-review-state": waitingForFeedback ? "awaiting-feedback" : "awaiting-review",
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planApproveCopy,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: discardArmed ? t("plan.discardConfirmTitle") : waitingForFeedback ? t("plan.feedbackTitle") : t("plan.approveTitle") }), (0, react_jsx_runtime.jsx)("small", { children: discardArmed ? t("plan.discardWarning") : waitingForFeedback ? t("plan.feedbackHint") : hasPendingEdits ? t("plan.pendingEdits") : t("plan.approveHint", {
									members: team.members.length,
									tasks: team.tasks.length
								}) })]
							}),
							(0, react_jsx_runtime.jsx)(Feedback, { value: feedback }),
							discardArmed ? (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planApproveActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy,
									onClick: () => {
										setDiscardArmed(false);
									},
									children: t("plan.cancel")
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-plan-discard": true,
									"data-danger": true,
									"data-confirming": true,
									disabled: busy,
									onClick: () => {
										discard();
									},
									children: busy ? t("plan.discarding") : t("plan.discardConfirm")
								})]
							}) : (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.planReviewActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-plan-approve": true,
									disabled: busy || !runnable || hasPendingEdits,
									onClick: () => {
										approve();
									},
									children: t("plan.approve")
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.planSecondaryActions,
									children: [(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-plan-continue": true,
										disabled: busy,
										onClick: () => {
											continueInChat();
										},
										children: t(waitingForFeedback ? "plan.returnToChat" : "plan.continue")
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-plan-discard": true,
										"data-danger": true,
										disabled: busy,
										onClick: () => {
											setDiscardArmed(true);
											setFeedback(void 0);
										},
										children: t("plan.discard")
									})]
								})]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/client/panel-geometry.js
		/** Pure persisted geometry rules for the AgentTeams shell-overlay panel. */
		const PANEL_LAYOUT_STORAGE_KEY = "deers-dsh-agent-team:activity-panel:v1";
		const DEFAULT_PANEL_LAYOUT = Object.freeze({
			mode: "docked",
			x: 0,
			y: 64,
			width: 388,
			height: 640,
			heightMode: "auto"
		});
		function clamp(value, minimum, maximum) {
			return Math.min(Math.max(value, minimum), maximum);
		}
		function finite(value) {
			return typeof value === "number" && Number.isFinite(value);
		}
		/** Decode one versioned localStorage value, rejecting partial/corrupt state. */
		function parsePanelLayout(value) {
			if (value === null) return DEFAULT_PANEL_LAYOUT;
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null) return DEFAULT_PANEL_LAYOUT;
				const record = parsed;
				if (record.mode !== "docked" && record.mode !== "floating" || !finite(record.x) || !finite(record.y) || !finite(record.width) || !finite(record.height)) return DEFAULT_PANEL_LAYOUT;
				return {
					mode: record.mode,
					x: record.x,
					y: record.y,
					width: record.width,
					height: record.height,
					heightMode: record.mode === "floating" && record.heightMode === "manual" ? "manual" : "auto"
				};
			} catch {
				return DEFAULT_PANEL_LAYOUT;
			}
		}
		/** Whether the panel should become a simple inset overlay with no gestures. */
		function compactPanelForBounds(bounds) {
			return bounds.width <= 960;
		}
		/** Docked and compact panels always fit content; floating panels may be user-sized. */
		function panelUsesAutoHeight(layout, bounds) {
			return compactPanelForBounds(bounds) || layout.mode === "docked" || layout.heightMode === "auto";
		}
		/** CSS max-height ceiling that keeps an auto-height panel inside its shell. */
		function panelMaximumHeight(layout, bounds) {
			const bottomInset = compactPanelForBounds(bounds) || layout.mode === "floating" ? 12 : 48;
			return Math.max(1, bounds.height - layout.y - bottomInset);
		}
		/** Resolve persisted state into a visible rectangle inside the current shell. */
		function resolvePanelGeometry(layout, bounds) {
			const boundsWidth = Math.max(1, bounds.width);
			const boundsHeight = Math.max(1, bounds.height);
			if (compactPanelForBounds(bounds)) return {
				...layout,
				x: 12,
				y: 12,
				width: Math.max(1, boundsWidth - 24),
				height: Math.max(1, boundsHeight - 24)
			};
			const maximumWidth = Math.max(1, Math.min(640, boundsWidth - 24));
			const minimumWidth = Math.min(320, maximumWidth);
			const width = clamp(layout.width, minimumWidth, maximumWidth);
			const maximumHeight = Math.max(1, boundsHeight - 24);
			const minimumHeight = Math.min(360, maximumHeight);
			if (layout.mode === "docked") {
				const y = clamp(64, 12, Math.max(12, boundsHeight - minimumHeight - 12));
				const availableHeight = Math.max(1, boundsHeight - y - 48);
				const height = clamp(availableHeight, Math.min(minimumHeight, availableHeight), maximumHeight);
				const anchorRight = clamp(bounds.anchorRight, 0, boundsWidth);
				const maximumX = Math.max(12, boundsWidth - width - 12);
				return {
					mode: "docked",
					x: clamp(anchorRight - 18 - width, 12, maximumX),
					y,
					width,
					height,
					heightMode: layout.heightMode
				};
			}
			const height = clamp(layout.height, minimumHeight, maximumHeight);
			return {
				mode: "floating",
				x: clamp(layout.x, 12, Math.max(12, boundsWidth - width - 12)),
				y: clamp(layout.y, 12, Math.max(12, boundsHeight - height - 12)),
				width,
				height,
				heightMode: layout.heightMode
			};
		}
		/** Undock without a visual jump by adopting the panel's resolved rectangle. */
		function floatPanelLayout(geometry, bounds) {
			return resolvePanelGeometry({
				...geometry,
				mode: "floating"
			}, bounds);
		}
		/** Return to the right dock, preserving width and restoring content-fit height. */
		function dockPanelLayout(layout, bounds) {
			return resolvePanelGeometry({
				...layout,
				mode: "docked",
				heightMode: "auto"
			}, bounds);
		}
		/** Translate a floating panel and clamp it back into the visible shell. */
		function movePanelLayout(start, dx, dy, bounds) {
			return resolvePanelGeometry({
				...start,
				mode: "floating",
				x: start.x + dx,
				y: start.y + dy
			}, bounds);
		}
		/** Resize while keeping the edge opposite the active handle stationary. */
		function resizePanelLayout(start, edge, dx, dy, bounds) {
			if (start.mode === "docked") {
				if (edge !== "left") return resolvePanelGeometry(start, bounds);
				return resolvePanelGeometry({
					...start,
					width: start.width - dx
				}, bounds);
			}
			const resolved = resolvePanelGeometry(start, bounds);
			const minimumWidth = Math.min(320, resolved.x + resolved.width - 12);
			const minimumHeight = Math.min(360, bounds.height - resolved.y - 12);
			if (edge === "left") {
				const right = resolved.x + resolved.width;
				const maximumWidth = Math.max(1, Math.min(640, right - 12));
				const width = clamp(resolved.width - dx, Math.min(minimumWidth, maximumWidth), maximumWidth);
				return {
					...resolved,
					x: right - width,
					width
				};
			}
			const maximumHeight = Math.max(1, bounds.height - resolved.y - 12);
			const height = clamp(resolved.height + dy, Math.min(minimumHeight, maximumHeight), maximumHeight);
			if (edge === "bottom") return {
				...resolved,
				height,
				heightMode: "manual"
			};
			const maximumWidth = Math.max(1, Math.min(640, bounds.width - resolved.x - 12));
			const width = clamp(resolved.width + dx, Math.min(minimumWidth, maximumWidth), maximumWidth);
			return {
				...resolved,
				width,
				height,
				heightMode: "manual"
			};
		}
		//#endregion
		//#region lib/client/ActivityPanel.js
		/**
		* AgentTeams activity panel: the top-right floater monitoring every team.
		*
		* Modeled on the Claude Code desktop SessionActivityPanel: a shell-overlay
		* panel that docks at the conversation's top-right edge by default, can be
		* dragged into a floating window, resized, and folded into an activity badge.
		* On wide viewports the docked panel makes the conversation column yield
		* space; narrow viewports keep a simple inset overlay. It
		* polls the host `/plugins/deers-dsh-agent-team/state` route for
		* server-side snapshots (durable files + live subagent activity), with a
		* collapsed badge that auto-expands once when activity appears. Archived
		* teams stay available for the owning conversation after live work ends.
		*
		* The floater mounts in ui-layout's additive `shell.overlay`; it is not a
		* conversation node — the in-conversation panel was removed in favor of this
		* always-available monitor.
		* @module deers-dsh-agent-team/client/activity
		*/
		/** Grace before the panel collapses once no team remains. */
		const AUTOCLOSE_GRACE_MS = 2e3;
		/**
		* Page-settle window after mount: activity restored on page load only shows
		* the collapsed badge, so the panel never yanks the conversation column
		* right after load. New activity after this window auto-expands as usual.
		*/
		const AUTO_OPEN_SETTLE_MS = 4e3;
		/** Root marker shared with the panel CSS while the shell overlay is expanded. */
		const PANEL_OPEN_ATTRIBUTE = "data-deers-agent-team-panel-open";
		/** Shared width concession consumed by the conversation root CSS. */
		const PANEL_SHIFT_PROPERTY = "--deers-agent-team-panel-shift";
		const PANEL_CONVERSATION_GAP = 14;
		const MOVE_THRESHOLD = 4;
		const CAPTAIN_ASSIGNEE = "captain";
		function initialPanelLayout() {
			if (typeof window === "undefined") return DEFAULT_PANEL_LAYOUT;
			return parsePanelLayout(window.localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY));
		}
		function initialPanelBounds() {
			if (typeof window === "undefined") return {
				width: 1440,
				height: 900,
				anchorRight: 1440
			};
			return {
				width: window.innerWidth,
				height: window.innerHeight,
				anchorRight: window.innerWidth
			};
		}
		/** Badge text follows the raw task status (finer than the 4 visual states):
		* claimed/pending/failed/cancelled keep their own labels and colors. */
		const TASK_STATUS_LABEL = {
			pending: "task.status.pending",
			claimed: "task.status.claimed",
			in_progress: "task.status.inProgress",
			completed: "task.status.completed",
			failed: "task.status.failed",
			cancelled: "task.status.cancelled"
		};
		function taskStatusLabel(status, t) {
			const key = TASK_STATUS_LABEL[status];
			return key === void 0 ? status : t(key);
		}
		function formatTaskIds(ids, t) {
			return ids.join(t("format.listSeparator"));
		}
		function taskTitle(task, model) {
			const extras = [
				task.kind,
				task.round === void 0 ? void 0 : `r${task.round}`,
				task.verdict,
				model === "" ? void 0 : model
			].filter((item) => item !== void 0);
			return extras.length === 0 ? `${task.id} · ${task.subject}` : `${task.id} · ${task.subject} · ${extras.join(" · ")}`;
		}
		/** Badge/bar coloring key: visual state, widened for terminal statuses. */
		function taskTone(state, status) {
			if (status === "failed") return "failed";
			if (status === "cancelled") return "cancelled";
			return state;
		}
		function Chevron({ open }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.chevron,
				"data-open": open,
				width: "9",
				height: "9",
				viewBox: "0 0 10 10",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				"aria-hidden": true,
				children: (0, react_jsx_runtime.jsx)("path", { d: "M3.5 2l3 3-3 3" })
			});
		}
		function WorkGlyph({ active }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: ActivityPanel_module_css_default.workGlyph,
				"data-active": active,
				width: "11",
				height: "11",
				viewBox: "0 0 11 11",
				fill: "currentColor",
				"aria-hidden": true,
				children: [
					[0, 0],
					[4.2, 0],
					[8.4, 0],
					[0, 4.2],
					[4.2, 4.2],
					[8.4, 4.2]
				].map(([x, y], index) => (0, react_jsx_runtime.jsx)("rect", {
					x,
					y,
					width: "2.6",
					height: "2.6",
					rx: ".6",
					style: { animationDelay: `${index * .15}s` }
				}, `${x}:${y}`))
			});
		}
		/** Collapsed badge: an always-visible corner pill while any team exists. */
		function CollapsedBadge({ count, busy, onClick, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.badge,
				"data-deers-agent-team-collapsed": true,
				"data-busy": busy,
				onClick,
				"aria-label": t("activity.badgeAria", { count }),
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeDot,
					"data-busy": busy,
					"aria-hidden": true
				}), (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeCount,
					children: count
				})]
			});
		}
		function memberStateLabel(member, tasks, historic, t) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return t("member.state.working");
			if (owned.some((task) => task.status === "failed")) return t("member.state.failed");
			if (owned.some((task) => task.state === "blocked")) return t("member.state.waiting");
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return t("member.state.delivered");
			if (member.status === "removed") return t(historic ? "member.state.left" : "member.state.removed");
			if (owned.length > 0) return t("member.state.pending");
			return t("member.state.unassigned");
		}
		function memberStatusText(member, tasks, t) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			const current = owned.find((task) => task.id === member.currentTask);
			const blocked = owned.find((task) => task.state === "blocked");
			if (member.activity === "working" && current !== void 0) {
				const model = taskModelLabel(current, [member]);
				return model === "" ? t("member.status.executing", { taskId: current.id }) : t("member.status.executingModel", {
					taskId: current.id,
					model
				});
			}
			if (member.activity === "working") return t("member.status.working");
			if (blocked !== void 0) {
				const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== "completed");
				if (dependency !== void 0) return t("member.status.waitingOn", {
					taskId: dependency.id,
					assignee: dependency.assignee || t("task.assignee.unclaimed")
				});
				return t("member.status.waitingPrerequisite");
			}
			if (member.total === 0) return t("member.status.waitingAssignment");
			if (member.done === member.total) return t("member.status.delivered");
			if (owned.some((task) => task.status === "failed")) return t("task.detail.failed");
			if (owned.length > 0 && owned.every((task) => task.status === "completed" || task.status === "cancelled")) return t("member.status.settled");
			return t(member.activity === "idle" ? "member.status.idle" : "member.status.unknown");
		}
		function compactTaskLabel(subject) {
			const withoutVerb = subject.replace(/^开发\s*/u, "").replace(/^\d+[-_.、\s]*/u, "");
			const head = withoutVerb.split(/[（(·：:]/u)[0]?.trim() ?? withoutVerb;
			return head.length > 18 ? `${head.slice(0, 17)}…` : head;
		}
		function taskSummary(team, t, discarded = false) {
			const completed = team.tasks.filter((task) => task.status === "completed");
			const cancelled = team.tasks.filter((task) => task.status === "cancelled");
			const running = team.tasks.filter((task) => task.state === "running");
			const blocked = team.tasks.filter((task) => task.state === "blocked");
			const ready = team.tasks.filter((task) => task.state === "open" && task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled");
			const failed = team.tasks.filter((task) => task.status === "failed");
			if (discarded) return t("task.summary.discarded", { count: team.tasks.length });
			if (team.tasks.length === 0) return t("task.summary.waitingBreakdown");
			if (team.phase === "staged") return t("task.summary.staged", { count: team.tasks.length });
			if (completed.length === team.tasks.length) return t("task.summary.allDelivered", { count: completed.length });
			if (completed.length + cancelled.length + failed.length === team.tasks.length) return t("task.summary.ended", {
				completed: completed.length,
				cancelled: cancelled.length,
				failed: failed.length
			});
			if (failed.length > 0 && running.length === 0 && ready.length === 0 && blocked.length === 0) return t("task.summary.failedSettled", { count: failed.length });
			if (blocked.length > 0 && running.length > 0) return t("task.summary.blockedAndRunning", {
				tasks: formatTaskIds(blocked.slice(0, 3).map((task) => task.id), t),
				more: blocked.length > 3 ? t("task.summary.more", { count: blocked.length - 3 }) : ""
			});
			if (running.length > 0) return t("task.summary.running", { tasks: formatTaskIds(running.map((task) => task.id), t) });
			if (ready.length > 0) return t("task.summary.ready", { tasks: formatTaskIds(ready.map((task) => task.id), t) });
			if (blocked.length > 0) return t("task.summary.blocked", { tasks: formatTaskIds(blocked.map((task) => task.id), t) });
			return t("task.summary.waitingSchedule");
		}
		function ProgressOverview({ team, t, discarded = false }) {
			const running = discarded ? 0 : team.tasks.filter((task) => task.state === "running").length;
			const queued = discarded ? 0 : team.tasks.filter((task) => task.state === "open").length;
			const blocked = discarded ? 0 : team.tasks.filter((task) => task.state === "blocked").length;
			const completed = discarded ? 0 : team.tasks.filter((task) => task.status === "completed").length;
			const settled = !discarded && team.tasks.length > 0 && team.tasks.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled");
			const summaryTone = discarded ? "discarded" : blocked > 0 || team.tasks.some((task) => task.status === "failed" || task.status === "cancelled") ? "warning" : settled ? "completed" : "running";
			const percent = team.tasks.length === 0 ? 0 : Math.round(completed / team.tasks.length * 100);
			const segmentRows = [];
			for (let index = 0; index < team.tasks.length; index += PROGRESS_SEGMENTS_PER_ROW) segmentRows.push(team.tasks.slice(index, index + PROGRESS_SEGMENTS_PER_ROW));
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.progressOverview,
				"aria-label": t("progress.aria"),
				"data-progress-summary": true,
				"data-tone": summaryTone,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.summaryHead,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.progressTitle,
								children: t("progress.title")
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.summaryFraction,
								children: [
									completed,
									"/",
									team.tasks.length
								]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.deliveryRingWrap,
								role: "img",
								"aria-label": t("progress.rate", { percent }),
								children: [(0, react_jsx_runtime.jsxs)("svg", {
									className: ActivityPanel_module_css_default.deliveryRing,
									viewBox: "0 0 40 40",
									"aria-hidden": true,
									children: [(0, react_jsx_runtime.jsx)("circle", {
										className: ActivityPanel_module_css_default.deliveryRingTrack,
										cx: "20",
										cy: "20",
										r: "16"
									}), (0, react_jsx_runtime.jsx)("circle", {
										className: ActivityPanel_module_css_default.deliveryRingValue,
										cx: "20",
										cy: "20",
										r: "16",
										pathLength: 100,
										strokeDasharray: `${percent} ${100 - percent}`
									})]
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.deliveryRingLabel,
									children: [percent, "%"]
								})]
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.summaryStats,
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								"data-state": "running",
								children: [(0, react_jsx_runtime.jsx)("b", { children: running }), t("progress.runningShort")]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								"data-state": "open",
								children: [(0, react_jsx_runtime.jsx)("b", { children: queued }), t("progress.queuedShort")]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								"data-state": "blocked",
								children: [(0, react_jsx_runtime.jsx)("b", { children: blocked }), t("progress.blockedShort")]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								"data-state": "completed",
								children: [(0, react_jsx_runtime.jsx)("b", { children: completed }), t("progress.deliveredShort")]
							})
						]
					}),
					team.tasks.length > 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.progressSegmentRows,
						"aria-hidden": true,
						children: segmentRows.map((row, index) => (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.progressSegments,
							children: row.map((task) => (0, react_jsx_runtime.jsx)("span", { "data-state": discarded ? "cancelled" : taskTone(task.state, task.status) }, task.id))
						}, index))
					}) : (0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.progressEmpty }),
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.progressSummary,
						"data-state": summaryTone,
						children: [(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.progressSummaryDot }), (0, react_jsx_runtime.jsx)("span", { children: taskSummary(team, t, discarded) })]
					})
				]
			});
		}
		function DependencyMap({ tasks, members, t, discarded = false, workspace = false, onSelectTask, teamId = "", captainSessionId = "", storageKey, filter = "all", onFilterChange, interactive = false }) {
			const [open, setOpen] = (0, react.useState)(() => storageKey === void 0 ? true : readViewFlag(`dag-open:${storageKey}`, true));
			const [hoverTaskId, setHoverTaskId] = (0, react.useState)(null);
			const [keyboardTaskId, setKeyboardTaskId] = (0, react.useState)(null);
			const [pinnedTaskId, setPinnedTaskId] = (0, react.useState)(null);
			const hoverTimer = (0, react.useRef)(null);
			const focusedTaskId = dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId);
			const nodeWidth = workspace ? 164 : 92;
			const nodeHeight = workspace ? 76 : 30;
			const layout = (0, react.useMemo)(() => compactDagLayout(tasks, workspace ? {
				nodeWidth: 164,
				nodeHeight: 76,
				columnGap: 36,
				rowGap: 16
			} : void 0), [tasks, workspace]);
			const parallel = (0, react.useMemo)(() => usesParallelTaskGrid(tasks), [tasks]);
			const related = (0, react.useMemo)(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
			const viewportRef = (0, react.useRef)(null);
			const canvasRef = (0, react.useRef)(null);
			const [zoom, setZoom] = (0, react.useState)(1);
			const [pan, setPan] = (0, react.useState)({
				x: 0,
				y: 0
			});
			const [viewportSize, setViewportSize] = (0, react.useState)({
				w: 0,
				h: 0
			});
			const panDrag = (0, react.useRef)(null);
			const zoomBy = (0, react.useCallback)((factor) => {
				const viewport = viewportRef.current;
				setZoom((current) => {
					const next = Math.min(2.5, Math.max(.35, current * factor));
					const ratio = next / current;
					const left = viewport === null ? viewportSize.w / 2 : viewport.clientWidth / 2;
					const top = viewport === null ? viewportSize.h / 2 : viewport.clientHeight / 2;
					setPan((p) => ({
						x: left - (left - p.x) * ratio,
						y: top - (top - p.y) * ratio
					}));
					return next;
				});
			}, [viewportSize]);
			const fitView = (0, react.useCallback)(() => {
				const viewport = viewportRef.current;
				const canvas = canvasRef.current;
				if (viewport === null || canvas === null) return;
				const width = canvas.offsetWidth;
				const height = canvas.offsetHeight;
				if (width <= 0 || height <= 0) return;
				const scale = Math.min(1, viewport.clientWidth / width, viewport.clientHeight / height);
				setZoom(scale);
				setPan({
					x: Math.max(0, (viewport.clientWidth - width * scale) / 2),
					y: Math.max(0, (viewport.clientHeight - height * scale) / 2)
				});
			}, []);
			const resetView = (0, react.useCallback)(() => {
				setZoom(1);
				setPan({
					x: 0,
					y: 0
				});
			}, []);
			(0, react.useEffect)(() => {
				const viewport = viewportRef.current;
				if (viewport === null || parallel || !open) return;
				const onWheel = (event) => {
					event.preventDefault();
					const rect = viewport.getBoundingClientRect();
					const factor = Math.exp(-event.deltaY * .0015);
					setZoom((current) => {
						const next = Math.min(2.5, Math.max(.35, current * factor));
						const ratio = next / current;
						const left = event.clientX - rect.left;
						const top = event.clientY - rect.top;
						setPan((p) => ({
							x: left - (left - p.x) * ratio,
							y: top - (top - p.y) * ratio
						}));
						return next;
					});
				};
				viewport.addEventListener("wheel", onWheel, { passive: false });
				return () => {
					viewport.removeEventListener("wheel", onWheel);
				};
			}, [open, parallel]);
			(0, react.useEffect)(() => {
				const viewport = viewportRef.current;
				if (viewport === null || parallel || !open) return;
				setViewportSize({
					w: viewport.clientWidth,
					h: viewport.clientHeight
				});
				if (typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(() => setViewportSize({
					w: viewport.clientWidth,
					h: viewport.clientHeight
				}));
				observer.observe(viewport);
				return () => {
					observer.disconnect();
				};
			}, [open, parallel]);
			const onViewportPointerDown = (event) => {
				if (parallel || event.target.closest("button") !== null) return;
				event.currentTarget.setPointerCapture(event.pointerId);
				panDrag.current = {
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					originX: pan.x,
					originY: pan.y
				};
			};
			const onViewportPointerMove = (event) => {
				const drag = panDrag.current;
				if (drag === null || drag.pointerId !== event.pointerId) return;
				setPan({
					x: drag.originX + (event.clientX - drag.startX),
					y: drag.originY + (event.clientY - drag.startY)
				});
			};
			const endViewportPan = (event) => {
				if (panDrag.current !== null && panDrag.current.pointerId === event.pointerId) panDrag.current = null;
			};
			const onMinimapPointer = (event) => {
				const canvas = canvasRef.current;
				const viewport = viewportRef.current;
				if (canvas === null || viewport === null || layout.width <= 0 || layout.height <= 0) return;
				const rect = event.currentTarget.getBoundingClientRect();
				const worldX = (event.clientX - rect.left) / rect.width * layout.width;
				const worldY = (event.clientY - rect.top) / rect.height * layout.height;
				setPan({
					x: viewport.clientWidth / 2 - worldX * zoom,
					y: viewport.clientHeight / 2 - worldY * zoom
				});
			};
			const [actionBusy, setActionBusy] = (0, react.useState)(false);
			const [actionError, setActionError] = (0, react.useState)("");
			const [reassignTarget, setReassignTarget] = (0, react.useState)("");
			const [historyTaskId, setHistoryTaskId] = (0, react.useState)(null);
			const [historyState, setHistoryState] = (0, react.useState)(void 0);
			const scheduleHover = (id) => {
				if (hoverTimer.current !== null) {
					clearTimeout(hoverTimer.current);
					hoverTimer.current = null;
				}
				if (id === null) {
					setHoverTaskId(null);
					return;
				}
				hoverTimer.current = setTimeout(() => {
					hoverTimer.current = null;
					setHoverTaskId(id);
				}, 180);
			};
			(0, react.useEffect)(() => () => {
				if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
			}, []);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						setPinnedTaskId(null);
						onSelectTask?.(null);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [onSelectTask]);
			(0, react.useEffect)(() => {
				if (storageKey !== void 0) storeViewFlag(`dag-open:${storageKey}`, open);
			}, [open, storageKey]);
			if (tasks.length === 0) return null;
			const fallbackTask = tasks.find((task) => task.state === "blocked") ?? tasks.find((task) => task.state === "running") ?? tasks[0];
			const detailTask = tasks.find((task) => task.id === focusedTaskId) ?? fallbackTask;
			const detailModel = taskModelLabel(detailTask, members);
			const waitingOn = detailTask.dependencies.filter((dependency) => tasks.find((task) => task.id === dependency)?.status !== "completed");
			const dependents = tasks.filter((task) => task.dependencies.includes(detailTask.id));
			const historyForTask = historyState !== void 0 && historyState.taskId === detailTask.id ? historyState.data : void 0;
			const runOp = async (op) => {
				if (teamId === "" || captainSessionId === "") return;
				setActionBusy(true);
				setActionError("");
				try {
					const response = await fetch("/plugins/deers-dsh-agent-team/task-op", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							sessionId: captainSessionId,
							teamId,
							taskId: detailTask.id,
							op,
							...op === "reassign" ? { assignee: reassignTarget } : {}
						})
					});
					const body = await response.json().catch(() => ({}));
					if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `HTTP ${response.status}`);
				} catch (error) {
					setActionError(error instanceof Error ? error.message : String(error));
				} finally {
					setActionBusy(false);
				}
			};
			const loadHistory = async () => {
				if (teamId === "" || captainSessionId === "") return;
				setHistoryState({
					taskId: detailTask.id,
					data: "loading"
				});
				try {
					const response = await fetch(`/plugins/deers-dsh-agent-team/history?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}&taskId=${encodeURIComponent(detailTask.id)}`);
					const body = await response.json().catch(() => ({}));
					if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `HTTP ${response.status}`);
					setHistoryState({
						taskId: detailTask.id,
						data: body
					});
				} catch {
					setHistoryState({
						taskId: detailTask.id,
						data: "error"
					});
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.dependencySection,
				"aria-label": t("dependency.aria"),
				"data-dependency-map": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.sectionHead,
					children: [
						(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.sectionToggleTitle,
							onClick: () => {
								setOpen((current) => !current);
							},
							"aria-expanded": open,
							children: [
								(0, react_jsx_runtime.jsx)(Chevron, { open }),
								(0, react_jsx_runtime.jsx)(IconBranchOutline16, {}),
								" ",
								t(parallel ? "dependency.parallel" : "dependency.title")
							]
						}),
						workspace && (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskFilterRow,
							role: "group",
							"aria-label": t("task.filterAria"),
							children: TASK_FILTERS.map(({ key, label }) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.taskFilterChip,
								"aria-pressed": filter === key,
								onClick: () => onFilterChange?.(key),
								children: t(label)
							}, key))
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.sectionHint,
							children: pinnedTaskId === null ? t(parallel ? "dependency.hint.parallel" : workspace ? "workspace.dependencies" : "dependency.hint.chain") : t("dependency.hint.pinned", { taskId: pinnedTaskId })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.starMapCount,
							children: t("dependency.count", { count: tasks.length })
						})
					]
				}), open && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ActivityPanel_module_css_default.dagZoomWrap,
					children: [(0, react_jsx_runtime.jsx)("div", {
						ref: viewportRef,
						className: ActivityPanel_module_css_default.dagViewport,
						"data-canvas": parallel ? "scroll" : "zoom",
						onPointerDown: onViewportPointerDown,
						onPointerMove: onViewportPointerMove,
						onPointerUp: endViewportPan,
						onPointerCancel: endViewportPan,
						children: (0, react_jsx_runtime.jsxs)("div", {
							ref: canvasRef,
							className: ActivityPanel_module_css_default.dagCanvas,
							"data-layout": parallel ? "parallel" : "dependency",
							style: parallel ? void 0 : {
								width: layout.width,
								height: layout.height,
								transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
								transformOrigin: "0 0"
							},
							children: [!parallel && (0, react_jsx_runtime.jsx)("svg", {
								className: ActivityPanel_module_css_default.dagEdges,
								width: layout.width,
								height: layout.height,
								"aria-hidden": true,
								children: layout.edges.map((edge) => {
									const active = related !== null && related.has(edge.from) && related.has(edge.to);
									return (0, react_jsx_runtime.jsx)("path", {
										d: edge.path,
										"data-active": active,
										"data-dimmed": related !== null && !active
									}, `${edge.from}:${edge.to}`);
								})
							}), layout.nodes.map(({ task, x, y }) => {
								const model = taskModelLabel(task, members);
								return (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ActivityPanel_module_css_default.dagNode,
									style: parallel ? { height: nodeHeight } : {
										left: x,
										top: y,
										width: nodeWidth,
										height: nodeHeight
									},
									"data-task-id": task.id,
									"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
									"data-task-model": model || void 0,
									"data-focused": related?.has(task.id) ?? false,
									"data-dimmed": related !== null && !related.has(task.id),
									"data-filter-out": filter !== "all" && !taskMatchesFilter(task, filter) || void 0,
									"aria-pressed": pinnedTaskId === task.id,
									title: taskTitle(task, model),
									onClick: () => {
										const next = pinnedTaskId === task.id ? null : task.id;
										setPinnedTaskId(next);
										onSelectTask?.(next);
									},
									onMouseEnter: () => {
										scheduleHover(task.id);
									},
									onMouseLeave: () => {
										scheduleHover(null);
									},
									onFocus: () => {
										setKeyboardTaskId(task.id);
									},
									onBlur: () => {
										setKeyboardTaskId(null);
									},
									children: [
										(0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.dagNodeHead,
											children: [
												(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.dagNodeDot }),
												task.id,
												workspace && (0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.dagOwner,
													children: task.assignee || t("task.assignee.unclaimed")
												})
											]
										}),
										(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.dagNodeLabel,
											children: workspace ? task.subject : compactTaskLabel(task.subject)
										}),
										task.state === "running" && (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.dagRunningState,
											"aria-label": t("task.runningAria"),
											children: (0, react_jsx_runtime.jsx)(WorkGlyph, { active: true })
										})
									]
								}, task.id);
							})]
						})
					}), !parallel && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.dagZoomControls,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => zoomBy(1 / 1.2),
								"aria-label": t("dag.zoomOut"),
								children: "−"
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: resetView,
								"aria-label": t("dag.reset"),
								children: [Math.round(zoom * 100), "%"]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => zoomBy(1.2),
								"aria-label": t("dag.zoomIn"),
								children: "+"
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: fitView,
								"aria-label": t("dag.fit"),
								children: t("dag.fit")
							})
						]
					}), (0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.dagMinimap,
						"aria-hidden": true,
						children: (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.dagMinimapCanvas,
							onPointerDown: onMinimapPointer,
							onPointerMove: onMinimapPointer,
							children: [layout.nodes.map(({ task, x, y }) => (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.dagMinimapNode,
								"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
								style: {
									left: `${layout.width <= 0 ? 0 : x / layout.width * 100}%`,
									top: `${layout.height <= 0 ? 0 : y / layout.height * 100}%`,
									width: `${layout.width <= 0 ? 0 : nodeWidth / layout.width * 100}%`,
									height: `${layout.height <= 0 ? 0 : nodeHeight / layout.height * 100}%`
								}
							}, task.id)), viewportSize.w > 0 && zoom > 0 && layout.width > 0 && layout.height > 0 && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.dagMinimapView,
								style: {
									left: `${Math.max(0, -pan.x / zoom / layout.width * 100)}%`,
									top: `${Math.max(0, -pan.y / zoom / layout.height * 100)}%`,
									width: `${Math.min(100, viewportSize.w / zoom / layout.width * 100)}%`,
									height: `${Math.min(100, viewportSize.h / zoom / layout.height * 100)}%`
								}
							})]
						})
					})] })]
				}), (0, react_jsx_runtime.jsxs)("section", {
					className: ActivityPanel_module_css_default.taskDetail,
					"data-task-detail": detailTask.id,
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDetailHead,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailId,
									children: detailTask.id
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailSubject,
									title: detailTask.subject,
									children: detailTask.subject.replace(/^开发\s*/u, "")
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskDetailBadge,
									"data-state": discarded ? "cancelled" : taskTone(detailTask.state, detailTask.status),
									children: discarded ? t("task.status.notRun") : taskStatusLabel(detailTask.status, t)
								}),
								(detailTask.attempt ?? 0) > 1 && (0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.taskDetailAttempt,
									children: [
										t("task.history"),
										" #",
										detailTask.attempt
									]
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDetailLine,
							children: [
								detailTask.assignee || t("task.assignee.unclaimed"),
								" · ",
								discarded ? t("task.detail.notRun") : detailTask.status === "completed" ? t("task.detail.completed") : detailTask.status === "cancelled" ? t("task.detail.cancelled") : detailTask.status === "failed" ? t("task.detail.failed") : detailTask.dependencies.length === 0 ? t("task.detail.noPrerequisite") : waitingOn.length === 0 ? t("task.detail.ready") : t("task.detail.waitingOn", { tasks: formatTaskIds(waitingOn, t) })
							]
						}),
						detailModel !== "" && (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskDetailModel,
							"data-task-model": detailModel,
							children: t("task.model", { model: detailModel })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskDetailMeta,
							children: dependents.length === 0 ? t("task.detail.noDownstream") : t("task.detail.unlocks", { tasks: formatTaskIds(dependents.map((task) => task.id), t) })
						}),
						interactive && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskActions,
							children: [
								detailTask.status === "pending" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("select", {
									className: ActivityPanel_module_css_default.taskActionSelect,
									value: reassignTarget,
									onChange: (event) => setReassignTarget(event.target.value),
									"aria-label": t("task.reassign"),
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t("task.reassign.pool")
										}),
										members.filter((member) => member.status !== "removed").map((member) => (0, react_jsx_runtime.jsx)("option", {
											value: member.name,
											children: member.name
										}, member.name)),
										(0, react_jsx_runtime.jsx)("option", {
											value: "captain",
											children: t("task.reassign.captain")
										})
									]
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: actionBusy || reassignTarget === detailTask.assignee,
									onClick: () => {
										runOp("reassign");
									},
									children: t("task.reassign")
								})] }),
								(detailTask.status === "claimed" || detailTask.status === "in_progress") && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: actionBusy,
									onClick: () => {
										if (window.confirm(t("task.redispatchConfirm"))) runOp("redispatch");
									},
									children: t("task.redispatch")
								}),
								(detailTask.status === "pending" || detailTask.status === "claimed" || detailTask.status === "in_progress") && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"data-danger": true,
									disabled: actionBusy,
									onClick: () => {
										if (window.confirm(t("task.cancelConfirm"))) runOp("cancel");
									},
									children: t("task.cancel")
								}),
								actionError !== "" && (0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.taskActionError,
									role: "alert",
									children: actionError
								})
							]
						}),
						interactive && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskHistoryBlock,
							children: [(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.taskHistoryToggle,
								"aria-expanded": historyTaskId === detailTask.id,
								onClick: () => {
									const next = historyTaskId !== detailTask.id;
									setHistoryTaskId(next ? detailTask.id : null);
									if (next && historyForTask === void 0) loadHistory();
								},
								children: [(0, react_jsx_runtime.jsx)(Chevron, { open: historyTaskId === detailTask.id }), t("task.history")]
							}), historyTaskId === detailTask.id && (historyForTask === void 0 || historyForTask === "loading" ? (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.taskHistoryLoading,
								children: t("workspace.loading")
							}) : historyForTask === "error" ? (0, react_jsx_runtime.jsx)("span", {
								role: "alert",
								children: t("task.historyFailed")
							}) : (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.taskHistoryBody,
								children: [
									historyForTask.revisions.length > 0 && (0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.taskHistoryGroup,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.taskHistoryGroupTitle,
											children: t("task.history.revisions")
										}), historyForTask.revisions.map((revision, index) => (0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.taskHistoryRow,
											title: revision.reason,
											children: [
												new Date(revision.at).toLocaleString(),
												" · ",
												revision.by,
												" · ",
												revision.reason
											]
										}, `${revision.at}:${index}`))]
									}),
									historyForTask.supplementalEvidence.length > 0 && (0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.taskHistoryGroup,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.taskHistoryGroupTitle,
											children: t("task.history.supplemental")
										}), historyForTask.supplementalEvidence.map((item, index) => (0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.taskHistoryRow,
											title: item.note,
											children: [
												"#",
												item.attempt,
												" · ",
												item.by,
												" · ",
												new Date(item.at).toLocaleString(),
												" · ",
												item.note
											]
										}, `${item.at}:${index}`))]
									}),
									historyForTask.output !== void 0 && (0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.taskHistoryGroup,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.taskHistoryGroupTitle,
											children: t("task.history.output")
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.taskHistoryRow,
											children: historyForTask.output
										})]
									}),
									historyForTask.revisions.length === 0 && historyForTask.supplementalEvidence.length === 0 && historyForTask.output === void 0 && (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.taskHistoryRow,
										children: t("task.historyEmpty")
									})
								]
							}))]
						})
					]
				})] })]
			});
		}
		/** Panel mailbox viewer: read one recipient's messages and (for members)
		* send a captain-authored reply that wakes the member. */
		function MemberMailModal({ teamId, captainSessionId, member, onClose, t }) {
			const [messages, setMessages] = (0, react.useState)("loading");
			const [draft, setDraft] = (0, react.useState)("");
			const [sending, setSending] = (0, react.useState)(false);
			const [sendError, setSendError] = (0, react.useState)("");
			const isCaptain = member === "captain";
			const reload = (0, react.useCallback)(() => {
				fetch(`/plugins/deers-dsh-agent-team/mail?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}&member=${encodeURIComponent(member)}`).then(async (response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const body = await response.json();
					setMessages(Array.isArray(body.messages) ? body.messages : []);
				}).catch(() => setMessages("error"));
			}, [
				captainSessionId,
				teamId,
				member
			]);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			const send = async () => {
				setSending(true);
				setSendError("");
				try {
					const response = await fetch("/plugins/deers-dsh-agent-team/message", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							sessionId: captainSessionId,
							teamId,
							to: member,
							content: draft
						})
					});
					const body = await response.json().catch(() => ({}));
					if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `HTTP ${response.status}`);
					setDraft("");
					reload();
				} catch (error) {
					setSendError(error instanceof Error ? error.message : String(error));
				} finally {
					setSending(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose,
				title: t("mail.title", { name: member }),
				closeLabel: t("plan.cancel"),
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.mailList,
					children: messages === "loading" ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.mailStatus,
						children: t("workspace.loading")
					}) : messages === "error" ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.mailStatus,
						role: "alert",
						children: t("task.historyFailed")
					}) : messages.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.mailStatus,
						children: t("mail.empty")
					}) : messages.map((message) => (0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.mailMessage,
						"data-from": message.from === "captain" ? "captain" : "member",
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.mailMeta,
							children: [
								message.from,
								" → ",
								message.to,
								" · ",
								new Date(message.ts).toLocaleString()
							]
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.mailBody,
							children: message.content
						})]
					}, message.id))
				}), !isCaptain ? (0, react_jsx_runtime.jsxs)("div", {
					className: ActivityPanel_module_css_default.mailCompose,
					children: [
						(0, react_jsx_runtime.jsx)("textarea", {
							className: ActivityPanel_module_css_default.mailInput,
							value: draft,
							rows: 3,
							placeholder: t("mail.placeholder"),
							onChange: (event) => setDraft(event.target.value)
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: sending || draft.trim() === "",
							onClick: () => {
								send();
							},
							children: t("mail.send")
						}),
						sendError !== "" && (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskActionError,
							role: "alert",
							children: sendError
						})
					]
				}) : (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.mailStatus,
					children: t("mail.readOnly")
				})]
			});
		}
		/** Derived activity timeline: durable members/tasks/mailbox records ordered
		* newest first, fetched on first expand. */
		function TeamTimeline({ teamId, captainSessionId, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [entries, setEntries] = (0, react.useState)("loading");
			(0, react.useEffect)(() => {
				if (!open) return;
				let cancelled = false;
				setEntries("loading");
				fetch(`/plugins/deers-dsh-agent-team/timeline?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`).then(async (response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const body = await response.json();
					if (!cancelled) setEntries(Array.isArray(body.entries) ? body.entries : []);
				}).catch(() => {
					if (!cancelled) setEntries("error");
				});
				return () => {
					cancelled = true;
				};
			}, [
				open,
				teamId,
				captainSessionId
			]);
			const describe = (entry) => {
				if (entry.kind === "member-joined") return t("timeline.memberJoined", { name: entry.name ?? "" });
				if (entry.kind === "task-created") return t("timeline.taskCreated", {
					taskId: entry.taskId ?? "",
					assignee: entry.assignee || t("task.assignee.unclaimed")
				});
				if (entry.kind === "task-status") return t("timeline.taskStatus", {
					taskId: entry.taskId ?? "",
					status: taskStatusLabel(entry.status ?? "", t)
				});
				if (entry.kind === "message") return t("timeline.message", {
					from: entry.from ?? "",
					to: entry.to ?? ""
				});
				return entry.kind;
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.timelineSection,
				"data-team-timeline": true,
				children: [(0, react_jsx_runtime.jsx)("header", {
					className: ActivityPanel_module_css_default.sectionHead,
					children: (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ActivityPanel_module_css_default.sectionToggleTitle,
						onClick: () => {
							setOpen((current) => !current);
						},
						"aria-expanded": open,
						children: [
							(0, react_jsx_runtime.jsx)(Chevron, { open }),
							" ",
							t("timeline.title")
						]
					})
				}), open && (entries === "loading" ? (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.timelineLoading,
					children: t("workspace.loading")
				}) : entries === "error" ? (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.timelineLoading,
					role: "alert",
					children: t("task.historyFailed")
				}) : entries.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.timelineLoading,
					children: t("timeline.empty")
				}) : (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.timelineRows,
					children: entries.map((entry, index) => (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.timelineRow,
						"data-kind": entry.kind,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.timelineTime,
							children: new Date(entry.ts).toLocaleTimeString()
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.timelineText,
							children: describe(entry)
						})]
					}, `${entry.ts}:${entry.kind}:${index}`))
				}))]
			});
		}
		/** Workspace split state: a Godot-style draggable separator between the
		* delegation tree (left) and the dependency map (right). The chosen ratio is
		* a percentage of the team section width, persisted per browser profile. */
		const WORKSPACE_SPLIT_STORAGE_KEY = "deers-agent-team.workspace-split";
		const WORKSPACE_SPLIT_DEFAULT = 38.5;
		const WORKSPACE_SPLIT_MIN = 22;
		const WORKSPACE_SPLIT_MAX = 78;
		/** Segments per progress row: beyond this the overview wraps to a new row
		* instead of squeezing every segment towards zero width. */
		const PROGRESS_SEGMENTS_PER_ROW = 30;
		const TASK_FILTERS = [
			{
				key: "all",
				label: "task.filter.all"
			},
			{
				key: "running",
				label: "task.filter.running"
			},
			{
				key: "blocked",
				label: "task.filter.blocked"
			},
			{
				key: "failed",
				label: "task.filter.failed"
			},
			{
				key: "completed",
				label: "task.filter.completed"
			}
		];
		function taskMatchesFilter(task, filter) {
			if (filter === "all") return true;
			if (filter === "running") return task.state === "running";
			if (filter === "blocked") return task.state === "blocked";
			if (filter === "failed") return task.status === "failed" || task.status === "cancelled";
			return task.status === "completed";
		}
		/** Collapsible view states persist per team so re-opening the panel restores them. */
		const VIEW_FLAG_PREFIX = "deers-agent-team.view.";
		function readViewFlag(key, fallback) {
			try {
				const raw = window.localStorage.getItem(VIEW_FLAG_PREFIX + key);
				return raw === null ? fallback : raw === "1";
			} catch {
				return fallback;
			}
		}
		function storeViewFlag(key, value) {
			try {
				window.localStorage.setItem(VIEW_FLAG_PREFIX + key, value ? "1" : "0");
			} catch {}
		}
		function clampWorkspaceSplit(value) {
			if (!Number.isFinite(value)) return WORKSPACE_SPLIT_DEFAULT;
			return Math.min(WORKSPACE_SPLIT_MAX, Math.max(WORKSPACE_SPLIT_MIN, value));
		}
		function readStoredWorkspaceSplit() {
			try {
				const raw = window.localStorage.getItem(WORKSPACE_SPLIT_STORAGE_KEY);
				return clampWorkspaceSplit(raw === null ? NaN : Number(raw));
			} catch {
				return WORKSPACE_SPLIT_DEFAULT;
			}
		}
		function storeWorkspaceSplit(value) {
			try {
				window.localStorage.setItem(WORKSPACE_SPLIT_STORAGE_KEY, String(value));
			} catch {}
		}
		function TeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic = false, workspace = false }) {
			const [selectedTaskId, setSelectedTaskId] = (0, react.useState)(null);
			const selectedAssignee = team.tasks.find((task) => task.id === selectedTaskId)?.assignee;
			const [membersOpen, setMembersOpen] = (0, react.useState)(() => readViewFlag(`members-open:${team.teamId}`, workspace));
			const [taskFilter, setTaskFilter] = (0, react.useState)("all");
			const [mailMember, setMailMember] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				storeViewFlag(`members-open:${team.teamId}`, membersOpen);
			}, [membersOpen, team.teamId]);
			const [stopOpen, setStopOpen] = (0, react.useState)(false);
			const [stopping, setStopping] = (0, react.useState)(false);
			const [stopError, setStopError] = (0, react.useState)("");
			const teamSectionRef = (0, react.useRef)(null);
			const [workspaceSplit, setWorkspaceSplit] = (0, react.useState)(readStoredWorkspaceSplit);
			const [workspaceSplitDragging, setWorkspaceSplitDragging] = (0, react.useState)(false);
			const workspaceSplitDrag = (0, react.useRef)(null);
			const workspaceSplitValue = (0, react.useRef)(workspaceSplit);
			const applyWorkspaceSplit = (0, react.useCallback)((clientX) => {
				const rect = teamSectionRef.current?.getBoundingClientRect();
				if (rect === void 0 || rect.width <= 0) return;
				const next = clampWorkspaceSplit((clientX - rect.left) / rect.width * 100);
				workspaceSplitValue.current = next;
				setWorkspaceSplit(next);
			}, []);
			const onWorkspaceSplitPointerDown = (0, react.useCallback)((event) => {
				if (!event.isPrimary) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				workspaceSplitDrag.current = event.pointerId;
				setWorkspaceSplitDragging(true);
				applyWorkspaceSplit(event.clientX);
			}, [applyWorkspaceSplit]);
			const onWorkspaceSplitPointerMove = (0, react.useCallback)((event) => {
				if (workspaceSplitDrag.current !== event.pointerId) return;
				applyWorkspaceSplit(event.clientX);
			}, [applyWorkspaceSplit]);
			const endWorkspaceSplitDrag = (0, react.useCallback)((event) => {
				if (workspaceSplitDrag.current !== event.pointerId) return;
				workspaceSplitDrag.current = null;
				setWorkspaceSplitDragging(false);
				storeWorkspaceSplit(workspaceSplitValue.current);
			}, []);
			const onWorkspaceSplitKeyDown = (0, react.useCallback)((event) => {
				const step = event.shiftKey ? 5 : 1.5;
				let next;
				if (event.key === "ArrowLeft") next = clampWorkspaceSplit(workspaceSplitValue.current - step);
				else if (event.key === "ArrowRight") next = clampWorkspaceSplit(workspaceSplitValue.current + step);
				else if (event.key === "Home") next = WORKSPACE_SPLIT_DEFAULT;
				else return;
				event.preventDefault();
				workspaceSplitValue.current = next;
				setWorkspaceSplit(next);
				storeWorkspaceSplit(next);
			}, []);
			const discarded = historic && team.phase === "staged";
			const stopped = !historic && team.halted === true;
			const busyCount = team.members.filter((member) => member.activity === "working").length;
			const assignedCount = team.tasks.filter((task) => task.assignee !== "" && task.assignee !== CAPTAIN_ASSIGNEE).length;
			const captainOwned = team.tasks.filter((task) => task.assignee === CAPTAIN_ASSIGNEE && task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled");
			const captainBusy = captainOwned.length > 0;
			const captainTaskIds = formatTaskIds(captainOwned.map((task) => task.id), t);
			const completedCount = team.tasks.filter((task) => task.status === "completed").length;
			const allCompleted = team.tasks.length > 0 && completedCount === team.tasks.length;
			const allSettled = team.tasks.length > 0 && team.tasks.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled");
			const unfinishedCount = team.tasks.filter((task) => task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled").length;
			const canStop = !historic && team.phase === "running" && team.halted !== true && teamIsActive(team);
			const stopTeam = async () => {
				if (stopping) return;
				setStopping(true);
				setStopError("");
				try {
					const response = await fetch(ACTIVITY_HALT_URL, {
						method: "POST",
						cache: "no-store",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							sessionId: team.captainSessionId,
							teamId: team.teamId
						})
					});
					if (!response.ok) {
						let message = t("team.stopRequestFailed");
						try {
							const body = await response.json();
							if (typeof body.error === "string" && body.error.trim() !== "") message = body.error;
						} catch {}
						throw new Error(message);
					}
					setStopOpen(false);
				} catch (error) {
					setStopError(t("team.stopFailed", { message: error instanceof Error ? error.message : String(error) }));
				} finally {
					setStopping(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsxs)("section", {
					ref: teamSectionRef,
					className: ActivityPanel_module_css_default.team,
					"data-team-id": team.teamId,
					"data-workspace-team": workspace || void 0,
					style: workspace ? { "--workspace-split": `${workspaceSplit}%` } : void 0,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: ActivityPanel_module_css_default.teamHead,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.teamName,
									title: team.name,
									children: team.name
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.phasePill,
									"data-phase": team.phase,
									"data-halted": stopped || void 0,
									children: t(stopped ? "team.phase.halted" : team.phase === "staged" ? "team.phase.staged" : "team.phase.running")
								}),
								historic && (0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.historicPill,
									children: t(discarded ? "team.discarded" : "team.ended")
								}),
								stopped && (0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.historicPill,
									children: t("team.stopped")
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.teamStats,
									children: [
										(0, react_jsx_runtime.jsx)("span", {
											"data-stat": "members",
											children: t("team.stats.members", { count: team.members.length })
										}),
										(0, react_jsx_runtime.jsx)("span", {
											"data-stat": "tasks",
											children: t("team.stats.completed", {
												completed: completedCount,
												total: team.tasks.length
											})
										}),
										(0, react_jsx_runtime.jsx)("span", {
											"data-stat": "messages",
											children: t("team.stats.messages", { count: team.messageCount })
										})
									]
								}),
								(0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ActivityPanel_module_css_default.teamPollButton,
									"aria-label": t("poll.open"),
									title: t("poll.open"),
									"data-poll-open": true,
									onClick: () => openPollWindow({
										teamId: team.teamId,
										captainSessionId: team.captainSessionId,
										teamName: team.name,
										readOnly: historic
									}),
									children: [(0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										children: "🗳"
									}), (0, react_jsx_runtime.jsx)("span", { children: t("poll.button") })]
								}),
								canStop && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ActivityPanel_module_css_default.teamStopButton,
									"aria-label": t("team.stop"),
									title: t("team.stop"),
									onClick: () => {
										setStopError("");
										setStopOpen(true);
									},
									children: (0, react_jsx_runtime.jsx)(IconStopFill16, {})
								})
							]
						}),
						team.phase === "staged" && !historic && modelDirectory !== void 0 && onContinuePlanning !== void 0 && onDiscarded !== void 0 && (0, react_jsx_runtime.jsx)(StagingPlanEditor, {
							team,
							modelDirectory,
							onContinuePlanning,
							onDiscarded,
							t
						}),
						(0, react_jsx_runtime.jsx)(ProgressOverview, {
							team,
							t,
							discarded
						}),
						(0, react_jsx_runtime.jsx)("section", {
							className: ActivityPanel_module_css_default.delegationSection,
							"aria-label": t("delegation.aria"),
							"data-delegation-map": true,
							children: (0, react_jsx_runtime.jsxs)("section", {
								className: ActivityPanel_module_css_default.deerMembersCard,
								"aria-label": t("members.toggle", { count: team.members.length }),
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: ActivityPanel_module_css_default.captainNode,
									children: [
										(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainAvatar,
											children: (0, react_jsx_runtime.jsx)("img", {
												className: ActivityPanel_module_css_default.leadAvatar,
												src: LEAD_ART,
												alt: "",
												"aria-hidden": true
											})
										}),
										(0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.captainInfo,
											children: [(0, react_jsx_runtime.jsxs)("span", {
												className: ActivityPanel_module_css_default.captainLine,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.captainName,
													children: t("captain.name")
												}), (0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.captainRole,
													children: t("captain.role")
												})]
											}), (0, react_jsx_runtime.jsx)("span", {
												className: ActivityPanel_module_css_default.captainSummary,
												children: discarded ? t("captain.summary.discarded", {
													tasks: team.tasks.length,
													members: team.members.length
												}) : captainBusy ? t("captain.summary.withTakeover", {
													tasks: assignedCount,
													captainTasks: captainTaskIds
												}) : team.phase === "staged" ? t(team.planReviewState === "awaiting_feedback" ? "captain.summary.awaitingFeedback" : "captain.summary.staged", {
													tasks: team.tasks.length,
													members: team.members.length
												}) : t("captain.summary", {
													tasks: assignedCount,
													members: team.members.length
												})
											})]
										}),
										(0, react_jsx_runtime.jsxs)("span", {
											className: ActivityPanel_module_css_default.captainState,
											"data-busy": captainBusy || busyCount > 0,
											children: [(0, react_jsx_runtime.jsx)(WorkGlyph, { active: captainBusy || busyCount > 0 }), discarded ? t("captain.state.discarded") : captainBusy ? t("captain.state.takeover", { tasks: captainTaskIds }) : team.phase === "staged" ? t(team.planReviewState === "awaiting_feedback" ? "captain.state.awaitingFeedback" : "captain.state.staged") : busyCount > 0 ? t("captain.state.working", { count: busyCount }) : t(allCompleted ? "captain.state.collected" : allSettled ? "captain.state.settled" : "captain.state.waiting")]
										}),
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ActivityPanel_module_css_default.memberMailButton,
											"aria-label": t("mail.openAria", { name: t("captain.name") }),
											title: t("mail.openAria", { name: t("captain.name") }),
											onClick: () => setMailMember("captain"),
											children: "✉"
										})
									]
								}), (() => {
									const orderedMembers = orderDelegationMembers(team.members, team.tasks);
									const runningMembers = orderedMembers.filter((member) => member.activity === "working" || member.status === "working" || team.tasks.some((task) => task.assignee === member.name && (task.status === "pending" || task.status === "claimed" || task.status === "in_progress")));
									const visibleMembers = membersOpen ? orderedMembers : runningMembers;
									const hiddenFinishedCount = orderedMembers.length - visibleMembers.length;
									const expandLabel = membersOpen ? t("members.collapse") : hiddenFinishedCount > 0 ? t("members.expandFinished", { count: hiddenFinishedCount }) : t("members.expand");
									return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: ActivityPanel_module_css_default.membersToggle,
										onClick: () => {
											setMembersOpen((current) => !current);
										},
										"aria-expanded": membersOpen,
										"data-members-toggle": true,
										children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)(Chevron, { open: membersOpen }), t("members.toggle", { count: team.members.length })] }), (0, react_jsx_runtime.jsx)("span", { children: expandLabel })]
									}), (membersOpen || visibleMembers.length > 0) && (0, react_jsx_runtime.jsxs)("div", {
										className: ActivityPanel_module_css_default.delegationTree,
										children: [team.members.length === 0 && (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.emptyHint,
											children: t("members.empty")
										}), visibleMembers.map((member) => {
											const owned = team.tasks.filter((task) => task.assignee === member.name);
											const memberModel = memberRouteLabel(member);
											return (0, react_jsx_runtime.jsxs)("div", {
												className: ActivityPanel_module_css_default.memberBlock,
												"data-activity": member.activity,
												"data-filter-out": workspace && taskFilter !== "all" && !owned.some((task) => taskMatchesFilter(task, taskFilter)) || void 0,
												"data-selected-member": workspace && selectedAssignee === member.name || void 0,
												children: [
													(0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.memberBranch,
														"aria-hidden": true,
														children: (0, react_jsx_runtime.jsx)("span", {})
													}),
													(0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: ActivityPanel_module_css_default.memberRow,
														"data-activity": member.activity,
														onClick: () => {
															if (member.id !== "") onNavigate(team.captainSessionId, member.id);
														},
														children: [
															(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberAvatar,
																"data-unread": member.unread > 0,
																children: [(0, react_jsx_runtime.jsx)("img", {
																	className: ActivityPanel_module_css_default.memberArt,
																	src: memberArtUrl(member.name, member.role),
																	alt: "",
																	"aria-hidden": true
																}), (0, react_jsx_runtime.jsx)("span", {
																	className: ActivityPanel_module_css_default.memberActivityDot,
																	"data-activity": member.activity,
																	"aria-hidden": true
																})]
															}),
															(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberInfo,
																children: [(0, react_jsx_runtime.jsxs)("span", {
																	className: ActivityPanel_module_css_default.memberLine,
																	children: [
																		(0, react_jsx_runtime.jsx)("span", {
																			className: ActivityPanel_module_css_default.memberName,
																			children: member.name
																		}),
																		member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
																			className: ActivityPanel_module_css_default.memberRole,
																			children: member.role
																		}),
																		memberModel !== "" && (0, react_jsx_runtime.jsx)("span", {
																			className: ActivityPanel_module_css_default.memberModel,
																			role: "img",
																			"data-member-model": memberModel,
																			title: memberModel,
																			"aria-label": memberModel,
																			children: compactModelLabel(memberModel)
																		}),
																		(0, react_jsx_runtime.jsxs)("span", {
																			className: ActivityPanel_module_css_default.memberState,
																			"data-activity": member.activity,
																			children: [(0, react_jsx_runtime.jsx)(WorkGlyph, { active: member.activity === "working" }), discarded ? t("member.state.notCreated") : stopped ? t("member.state.stopped") : team.phase === "staged" ? t("member.state.staged") : memberStateLabel(member, team.tasks, historic, t)]
																		})
																	]
																}), (0, react_jsx_runtime.jsx)("span", {
																	className: ActivityPanel_module_css_default.memberStatusLine,
																	children: discarded ? t("member.status.discarded") : stopped ? t("member.status.stopped") : team.phase === "staged" ? t("member.status.staged") : historic && owned.length > 0 && owned.every((task) => task.status === "completed" || task.status === "failed" || task.status === "cancelled") ? t("member.status.settled") : memberStatusText(member, team.tasks, t)
																})]
															}),
															(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberCount,
																children: [
																	member.done,
																	"/",
																	member.total
																]
															})
														]
													}),
													(0, react_jsx_runtime.jsxs)("div", {
														className: ActivityPanel_module_css_default.assignmentLine,
														children: [
															(0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.assignmentLabel,
																children: t(discarded ? "assignment.discarded" : team.phase === "staged" ? "assignment.staged" : "assignment.label")
															}),
															(0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.assignmentTasks,
																children: owned.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
																	className: ActivityPanel_module_css_default.taskEmpty,
																	children: t("assignment.empty")
																}) : owned.map((task) => {
																	const model = taskModelLabel(task, team.members);
																	const shortModel = compactModelLabel(model);
																	return (0, react_jsx_runtime.jsx)("span", {
																		className: ActivityPanel_module_css_default.assignmentChip,
																		"data-state": discarded ? "cancelled" : taskTone(task.state, task.status),
																		"data-task-model": model || void 0,
																		title: taskTitle(task, model),
																		children: task.state === "running" && shortModel !== "" ? `${task.id} · ${shortModel}` : task.id
																	}, task.id);
																})
															}),
															(0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: ActivityPanel_module_css_default.memberMailButton,
																"aria-label": t("mail.openAria", { name: member.name }),
																title: t("mail.openAria", { name: member.name }),
																onClick: () => setMailMember(member.name),
																children: "✉"
															})
														]
													})
												]
											}, member.id || member.name);
										})]
									})] });
								})()]
							})
						}),
						workspace && !historic && (0, react_jsx_runtime.jsx)("div", {
							role: "separator",
							"aria-orientation": "vertical",
							tabIndex: 0,
							className: ActivityPanel_module_css_default.workspaceSplit,
							"data-dragging": workspaceSplitDragging || void 0,
							"aria-label": t("workspace.splitLabel"),
							title: t("workspace.splitLabel"),
							onPointerDown: onWorkspaceSplitPointerDown,
							onPointerMove: onWorkspaceSplitPointerMove,
							onPointerUp: endWorkspaceSplitDrag,
							onPointerCancel: endWorkspaceSplitDrag,
							onKeyDown: onWorkspaceSplitKeyDown
						}),
						(0, react_jsx_runtime.jsx)(DependencyMap, {
							tasks: team.tasks,
							members: team.members,
							t,
							discarded,
							workspace,
							onSelectTask: setSelectedTaskId,
							teamId: team.teamId,
							captainSessionId: team.captainSessionId,
							storageKey: team.teamId,
							filter: taskFilter,
							onFilterChange: setTaskFilter,
							interactive: workspace && !historic
						}),
						workspace && !historic && (0, react_jsx_runtime.jsx)(TeamTimeline, {
							teamId: team.teamId,
							captainSessionId: team.captainSessionId,
							t
						}),
						(0, react_jsx_runtime.jsx)(BlackboardPanel, {
							teamId: team.teamId,
							captainSessionId: team.captainSessionId,
							t,
							readOnly: historic
						})
					]
				}),
				(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
					open: stopOpen,
					onClose: () => {
						if (!stopping) setStopOpen(false);
					},
					title: t("team.stopTitle", { team: team.name }),
					closeLabel: t("plan.cancel"),
					description: t("team.stopDescription", {
						tasks: unfinishedCount,
						members: busyCount
					}),
					footer: (0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.stopModalActions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: stopping,
							onClick: () => {
								setStopOpen(false);
							},
							children: t("team.stopCancel")
						}), (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							"data-danger": true,
							disabled: stopping,
							onClick: () => {
								stopTeam();
							},
							children: [(0, react_jsx_runtime.jsx)(IconStopFill16, {}), stopping ? t("team.stopping") : t("team.stopConfirm")]
						})]
					}),
					children: stopError !== "" && (0, react_jsx_runtime.jsxs)("p", {
						className: ActivityPanel_module_css_default.stopModalError,
						role: "alert",
						children: [(0, react_jsx_runtime.jsx)(IconWarningOutline16, {}), stopError]
					})
				}),
				mailMember !== null && (0, react_jsx_runtime.jsx)(MemberMailModal, {
					teamId: team.teamId,
					captainSessionId: team.captainSessionId,
					member: mailMember,
					onClose: () => setMailMember(null),
					t
				})
			] });
		}
		/** Legacy conversation cards may outlive their host archive. Project their
		* durable roster through the same rebuilt panel instead of a second UI. */
		function historicCardTeam(data, owner) {
			return {
				workspace: "",
				teamId: data.teamId,
				name: data.teamName,
				captainSessionId: data.captainSessionId || owner,
				phase: "running",
				members: data.members.map((member) => ({
					...member,
					status: "removed",
					activity: "idle",
					progress: 0,
					done: 0,
					total: 0,
					currentTask: "",
					unread: 0
				})),
				tasks: [],
				messageCount: 0,
				captainInbox: []
			};
		}
		function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible = true }) {
			const navigateToSession = (parentId, childId) => {
				setOpen(false);
				setWasActive(false);
				openMember(parentId, childId);
			};
			const [open, setOpen] = (0, react.useState)(false);
			const [openOwner, setOpenOwner] = (0, react.useState)();
			const [autoOpened, setAutoOpened] = (0, react.useState)(false);
			const [wasActive, setWasActive] = (0, react.useState)(false);
			const [historic, setHistoric] = (0, react.useState)(/* @__PURE__ */ new Map());
			const [layout, setLayout] = (0, react.useState)(initialPanelLayout);
			const [bounds, setBounds] = (0, react.useState)(initialPanelBounds);
			const [interaction, setInteraction] = (0, react.useState)(null);
			const panelRef = (0, react.useRef)(null);
			const boundsRef = (0, react.useRef)(bounds);
			const gestureRef = (0, react.useRef)(null);
			const frameRef = (0, react.useRef)(null);
			const pendingLayoutRef = (0, react.useRef)(null);
			const current = currentSessionId((0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot));
			const autoOpenTrackerRef = (0, react.useRef)({
				sessionId: current,
				restoreComplete: false,
				liveTeamIds: /* @__PURE__ */ new Set()
			});
			const monitorTargets = (0, react.useSyncExternalStore)(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
			const returnToComposer = () => {
				setOpen(false);
				setOpenOwner(void 0);
				window.requestAnimationFrame(() => {
					document.querySelector("[data-composer-card] [contenteditable=\"true\"][role=\"textbox\"], [data-composer-card] textarea")?.focus();
				});
			};
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const currentTargets = (0, react.useMemo)(() => current === void 0 ? [] : monitorTargets.filter((target) => target.sessionId === current), [current, monitorTargets]);
			const currentRef = (0, react.useRef)(current);
			(0, react.useEffect)(() => {
				currentRef.current = current;
			}, [current]);
			const mountedAtRef = (0, react.useRef)(performance.now());
			const expanded = conversationVisible && activityPanelExpandedForSession(open, openOwner, current);
			const geometry = (0, react.useMemo)(() => resolvePanelGeometry(layout, bounds), [layout, bounds]);
			const compact = compactPanelForBounds(bounds);
			const commitLayout = (0, react.useCallback)((next) => {
				setLayout(next);
			}, []);
			(0, react.useEffect)(() => {
				window.localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
			}, [layout]);
			(0, react.useLayoutEffect)(() => {
				const overlay = document.querySelector("[data-shell-overlay]");
				if (overlay === null) return;
				const conversation = document.querySelector("[data-phase='active']");
				let frame = null;
				const measure = () => {
					frame = null;
					const overlayRect = overlay.getBoundingClientRect();
					const conversationRect = conversation?.getBoundingClientRect();
					const next = {
						width: overlayRect.width,
						height: overlayRect.height,
						anchorRight: conversationRect === void 0 ? overlayRect.width : Math.min(Math.max(conversationRect.right - overlayRect.left, 0), overlayRect.width)
					};
					const previous = boundsRef.current;
					if (previous.width === next.width && previous.height === next.height && previous.anchorRight === next.anchorRight) return;
					boundsRef.current = next;
					setBounds(next);
				};
				const scheduleMeasure = () => {
					frame ??= requestAnimationFrame(measure);
				};
				measure();
				const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
				observer?.observe(overlay);
				if (conversation !== null) observer?.observe(conversation);
				window.addEventListener("resize", scheduleMeasure);
				return () => {
					if (frame !== null) cancelAnimationFrame(frame);
					observer?.disconnect();
					window.removeEventListener("resize", scheduleMeasure);
				};
			}, [current]);
			(0, react.useLayoutEffect)(() => {
				const tracker = autoOpenTrackerRef.current;
				if (tracker.sessionId !== current) {
					tracker.sessionId = current;
					tracker.restoreComplete = false;
					tracker.liveTeamIds = /* @__PURE__ */ new Set();
					setWasActive(false);
					setAutoOpened(false);
				}
				if (openOwner === void 0 || openOwner === current) return;
				setOpen(false);
				setOpenOwner(void 0);
			}, [current, openOwner]);
			(0, react.useLayoutEffect)(() => {
				const root = document.documentElement;
				if (expanded && geometry.mode === "docked" && !compact) {
					root.setAttribute(PANEL_OPEN_ATTRIBUTE, "");
					root.style.setProperty(PANEL_SHIFT_PROPERTY, `${geometry.width + PANEL_CONVERSATION_GAP + 18}px`);
				} else {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
					root.style.removeProperty(PANEL_SHIFT_PROPERTY);
				}
				return () => {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
					root.style.removeProperty(PANEL_SHIFT_PROPERTY);
				};
			}, [
				compact,
				expanded,
				geometry.mode,
				geometry.width
			]);
			(0, react.useEffect)(() => {
				if (current === void 0) return;
				const controller = startActivityPolling(currentTargets, { discoverySessionId: current });
				let active = true;
				const tracker = autoOpenTrackerRef.current;
				if (tracker.sessionId === current && !tracker.restoreComplete) controller.firstTick.then(() => {
					const latest = autoOpenTrackerRef.current;
					if (!active || latest.sessionId !== current || latest.restoreComplete) return;
					latest.liveTeamIds = new Set(getActivitySnapshotsSnapshot().teams.filter((team) => team.captainSessionId === current).map((team) => team.teamId));
					latest.restoreComplete = true;
				});
				return () => {
					active = false;
					controller.stop();
				};
			}, [current, currentTargets]);
			(0, react.useEffect)(() => {
				const onOpenPanel = (event) => {
					const activeSession = currentRef.current;
					if (activeSession === void 0) return;
					setOpenOwner(activeSession);
					setOpen(true);
					const detail = event.detail;
					if (detail?.teamId !== void 0) {
						const owner = detail.captainSessionId !== "" ? detail.captainSessionId : currentRef.current ?? "";
						const teamKey = `${owner}:${detail.teamId}`;
						setHistoric((previous) => {
							const next = new Map(previous);
							next.set(teamKey, {
								data: detail,
								owner
							});
							return next;
						});
					}
				};
				window.addEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				};
			}, []);
			const visibleTeams = (0, react.useMemo)(() => current === void 0 ? [] : teams.filter((team) => team.captainSessionId === current), [teams, current]);
			const visibleHistoric = (0, react.useMemo)(() => current === void 0 ? [] : [...historic.values()].filter(({ data, owner }) => owner === current && !teams.some((live) => live.captainSessionId === current && live.teamId === data.teamId) && !archivedTeams.some((archived) => archived.captainSessionId === current && archived.teamId === data.teamId)), [
				historic,
				current,
				teams,
				archivedTeams
			]);
			const visibleArchived = (0, react.useMemo)(() => current === void 0 ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId)), [
				archivedTeams,
				current,
				teams
			]);
			const visibleCount = visibleTeams.length + visibleArchived.length + visibleHistoric.length;
			const visibleLiveTeamIds = (0, react.useMemo)(() => visibleTeams.map((team) => team.teamId).sort(), [visibleTeams]);
			(0, react.useEffect)(() => {
				const tracker = autoOpenTrackerRef.current;
				const settled = performance.now() - mountedAtRef.current >= AUTO_OPEN_SETTLE_MS;
				const shouldAutoExpand = tracker.sessionId === current && activityPanelShouldAutoExpand({
					alreadyAutoOpened: autoOpened,
					pageSettled: settled,
					restoreComplete: tracker.restoreComplete,
					previousLiveTeamIds: tracker.liveTeamIds,
					currentLiveTeamIds: visibleLiveTeamIds
				});
				if (tracker.sessionId === current && tracker.restoreComplete) tracker.liveTeamIds = new Set(visibleLiveTeamIds);
				if (visibleCount > 0) {
					setWasActive(true);
					if (shouldAutoExpand) {
						setOpenOwner(current);
						setOpen(true);
						setAutoOpened(true);
					}
					return;
				}
				if (!wasActive) return;
				const timer = setTimeout(() => {
					setOpen(false);
					setOpenOwner(void 0);
					setWasActive(false);
					setAutoOpened(false);
				}, AUTOCLOSE_GRACE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [
				visibleCount,
				visibleLiveTeamIds.join("\0"),
				autoOpened,
				wasActive,
				current
			]);
			const busy = (0, react.useMemo)(() => visibleTeams.some((team) => team.members.some((member) => member.activity === "working")), [visibleTeams]);
			const hasTeams = visibleCount > 0;
			const panelGeometryForGesture = (0, react.useCallback)(() => {
				const measuredHeight = panelRef.current?.getBoundingClientRect().height;
				if (measuredHeight === void 0 || measuredHeight <= 0) return geometry;
				return {
					...geometry,
					height: measuredHeight
				};
			}, [geometry]);
			const flushScheduledLayout = (0, react.useCallback)(() => {
				if (frameRef.current !== null) {
					cancelAnimationFrame(frameRef.current);
					frameRef.current = null;
				}
				const pending = pendingLayoutRef.current;
				pendingLayoutRef.current = null;
				if (pending !== null) commitLayout(pending);
			}, [commitLayout]);
			const scheduleLayout = (0, react.useCallback)((next) => {
				pendingLayoutRef.current = next;
				frameRef.current ??= requestAnimationFrame(() => {
					frameRef.current = null;
					const pending = pendingLayoutRef.current;
					pendingLayoutRef.current = null;
					if (pending !== null) commitLayout(pending);
				});
			}, [commitLayout]);
			(0, react.useEffect)(() => () => {
				if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
			}, []);
			const beginMove = (0, react.useCallback)((event) => {
				if (compact || event.button !== 0 || event.target.closest("button") !== null) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				gestureRef.current = {
					kind: "move",
					pointerId: event.pointerId,
					originX: event.clientX,
					originY: event.clientY,
					start: panelGeometryForGesture(),
					activated: false
				};
			}, [compact, panelGeometryForGesture]);
			const beginResize = (0, react.useCallback)((edge, event) => {
				if (compact || event.button !== 0 || geometry.mode === "docked" && edge !== "left") return;
				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.setPointerCapture(event.pointerId);
				gestureRef.current = {
					kind: "resize",
					edge,
					pointerId: event.pointerId,
					originX: event.clientX,
					originY: event.clientY,
					start: panelGeometryForGesture(),
					activated: true
				};
				setInteraction("resizing");
			}, [
				compact,
				geometry.mode,
				panelGeometryForGesture
			]);
			const updateGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
				const dx = event.clientX - gesture.originX;
				const dy = event.clientY - gesture.originY;
				const activeBounds = boundsRef.current;
				if (gesture.kind === "move") {
					if (!gesture.activated && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
					if (!gesture.activated) {
						gesture.activated = true;
						setInteraction("dragging");
					}
					scheduleLayout(movePanelLayout(floatPanelLayout(gesture.start, activeBounds), dx, dy, activeBounds));
					return;
				}
				scheduleLayout(resizePanelLayout(gesture.start, gesture.edge ?? "left", dx, dy, activeBounds));
			}, [scheduleLayout]);
			const endGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId) return;
				updateGesture(event);
				flushScheduledLayout();
				if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
				gestureRef.current = null;
				setInteraction(null);
			}, [flushScheduledLayout, updateGesture]);
			const cancelGesture = (0, react.useCallback)((event) => {
				const gesture = gestureRef.current;
				if (gesture === null || gesture.pointerId !== event.pointerId) return;
				flushScheduledLayout();
				gestureRef.current = null;
				setInteraction(null);
			}, [flushScheduledLayout]);
			const toggleDock = (0, react.useCallback)(() => {
				const liveGeometry = panelGeometryForGesture();
				commitLayout(liveGeometry.mode === "docked" ? floatPanelLayout(liveGeometry, boundsRef.current) : dockPanelLayout(liveGeometry, boundsRef.current));
			}, [commitLayout, panelGeometryForGesture]);
			const autoHeight = panelUsesAutoHeight(geometry, bounds);
			const panelStyle = {
				width: geometry.width,
				height: autoHeight ? "auto" : geometry.height,
				maxHeight: panelMaximumHeight(geometry, bounds),
				transform: `translate3d(${geometry.x}px, ${geometry.y}px, 0)`
			};
			if (!conversationVisible || !hasTeams && !expanded) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!expanded && (0, react_jsx_runtime.jsx)(CollapsedBadge, {
				count: visibleCount,
				busy,
				t,
				onClick: () => {
					if (current === void 0) return;
					setOpenOwner(current);
					setOpen(true);
				}
			}), expanded && (0, react_jsx_runtime.jsxs)("aside", {
				ref: panelRef,
				className: ActivityPanel_module_css_default.panel,
				style: panelStyle,
				"data-deers-agent-team-activity": true,
				"data-panel-mode": geometry.mode,
				"data-height-mode": autoHeight ? "auto" : "manual",
				"data-compact": compact || void 0,
				"data-dragging": interaction === "dragging" || void 0,
				"data-resizing": interaction === "resizing" || void 0,
				"aria-label": t("activity.panelAria"),
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.panelHead,
						onPointerDown: beginMove,
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"data-drag-handle": !compact || void 0,
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.panelTitle,
							children: [t("activity.title"), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.panelDot,
								"data-busy": busy,
								"aria-hidden": true
							})]
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.panelControls,
							children: [!compact && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.iconButton,
								"data-control": "dock",
								"data-mode": geometry.mode,
								onClick: toggleDock,
								"aria-label": t(geometry.mode === "docked" ? "activity.float" : "activity.dockRight"),
								title: t(geometry.mode === "docked" ? "activity.float" : "activity.dockRight"),
								children: (0, react_jsx_runtime.jsx)(IconPanelLeftOutline16, {})
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ActivityPanel_module_css_default.iconButton,
								"data-control": "collapse",
								onClick: () => {
									setOpen(false);
									setOpenOwner(void 0);
								},
								"aria-label": t("activity.collapse"),
								title: t("activity.collapse"),
								children: (0, react_jsx_runtime.jsx)(IconChevronDownOutline14, {})
							})]
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.teams,
						children: visibleCount === 0 ? (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.emptyHint,
							children: t("activity.empty")
						}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(TeamSection, {
								team,
								modelDirectory: team.phase === "staged" ? modelDirectories.directoryFor(team.captainSessionId) : void 0,
								onContinuePlanning: returnToComposer,
								onDiscarded: returnToComposer,
								onNavigate: navigateToSession,
								t
							}, team.teamId)),
							visibleArchived.map((team) => (0, react_jsx_runtime.jsxs)("div", {
								"data-team-id": team.teamId,
								"data-historic": true,
								className: ActivityPanel_module_css_default.archivedWrap,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.archiveLabel,
									children: t(team.phase === "staged" ? "archive.discardedLabel" : "archive.label")
								}), (0, react_jsx_runtime.jsx)(TeamSection, {
									team,
									onNavigate: navigateToSession,
									t,
									historic: true
								})]
							}, `${team.captainSessionId}:${team.teamId}`)),
							visibleHistoric.map(({ data: team, owner }) => {
								const teamKey = `${owner}:${team.teamId}`;
								return (0, react_jsx_runtime.jsx)(TeamSection, {
									team: historicCardTeam(team, owner),
									onNavigate: navigateToSession,
									t,
									historic: true
								}, teamKey);
							})
						] })
					}),
					!compact && (0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "left",
						onPointerDown: (event) => {
							beginResize("left", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					}),
					!compact && geometry.mode === "floating" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "bottom",
						onPointerDown: (event) => {
							beginResize("bottom", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					}), (0, react_jsx_runtime.jsx)("div", {
						className: ActivityPanel_module_css_default.resizeHandle,
						"data-resize-edge": "corner",
						onPointerDown: (event) => {
							beginResize("corner", event);
						},
						onPointerMove: updateGesture,
						onPointerUp: endGesture,
						onPointerCancel: cancelGesture,
						"aria-hidden": true
					})] })
				]
			})] });
		}
		//#endregion
		//#region lib/client/workspace-state.js
		function createWorkspaceState() {
			let snapshot = {
				statuses: /* @__PURE__ */ new Map(),
				history: /* @__PURE__ */ new Map(),
				selected: /* @__PURE__ */ new Map()
			};
			const listeners = /* @__PURE__ */ new Set();
			const publish = (next) => {
				snapshot = next;
				for (const listener of listeners) listener();
			};
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				status(session, status) {
					if (snapshot.statuses.get(session) === status) return;
					publish({
						...snapshot,
						statuses: new Map(snapshot.statuses).set(session, status)
					});
				},
				select(session, team) {
					if (snapshot.selected.get(session) === team) return;
					publish({
						...snapshot,
						selected: new Map(snapshot.selected).set(session, team)
					});
				},
				remember(session, data) {
					const owner = data.captainSessionId || session;
					if (owner !== session) return;
					publish({
						...snapshot,
						history: new Map(snapshot.history).set(`${owner}:${data.teamId}`, {
							...data,
							captainSessionId: owner
						}),
						selected: new Map(snapshot.selected).set(owner, data.teamId)
					});
				}
			};
		}
		/** Records restored at mount never reopen a closed tab; new teams are announced once. */
		function createTeamDiscovery() {
			let restored = false;
			let known = /* @__PURE__ */ new Set();
			return (teams) => {
				const added = restored ? teams.find((team) => !known.has(team.teamId))?.teamId : void 0;
				known = new Set(teams.map((team) => team.teamId));
				restored = true;
				return added;
			};
		}
		//#endregion
		//#region \0dsh-css:C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\src\client\WorkspaceActivity.module.css.mjs
		const css$1 = ".CwJ8jW_root{--deers-font-boost:2px;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);font-family:inherit;overflow:auto;container:CwJ8jW_team-workspace/inline-size}.CwJ8jW_content{margin:0;padding:12px 20px 28px}.CwJ8jW_selector{flex-wrap:wrap;gap:6px;margin-bottom:24px;display:flex}.CwJ8jW_selector button{border:1px solid var(--dsw-alias-border-l2);text-align:left;overflow-wrap:anywhere;border-radius:8px;align-items:center;gap:12px;max-width:100%;padding:8px 10px;display:flex}.CwJ8jW_selector span{font-size:calc(10px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-tertiary);white-space:nowrap}.CwJ8jW_selector button[aria-pressed=true]{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-alias-label-tertiary)}.CwJ8jW_root button{color:inherit;cursor:pointer;font-family:inherit}.CwJ8jW_root button:active{transform:scale(.98)}.CwJ8jW_root button:focus-visible{outline:2px solid var(--dsw-alias-label-secondary);outline-offset:3px}.CwJ8jW_empty{max-width:42ch;padding:36px 0}.CwJ8jW_emptyMark{font-size:calc(32px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-tertiary)}.CwJ8jW_empty h3{font-size:calc(16px + var(--deers-font-boost,0px));margin:16px 0 10px;font-weight:550}.CwJ8jW_empty p{color:var(--dsw-alias-label-secondary);font-size:calc(13px + var(--deers-font-boost,0px));line-height:1.8}.CwJ8jW_empty button,.CwJ8jW_error button{background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);font-size:calc(12px + var(--deers-font-boost,0px));border-radius:8px;padding:8px 12px}.CwJ8jW_error{border:1px solid var(--dsw-alias-border-l2);font-size:calc(12px + var(--deers-font-boost,0px));border-radius:8px;align-items:start;gap:12px;margin-bottom:20px;padding:12px;line-height:1.65;display:flex}.CwJ8jW_error button{flex:none}.CwJ8jW_skeleton{gap:16px;padding-top:20px;display:grid}.CwJ8jW_skeleton i{background:var(--dsw-alias-bg-module-platform);border-radius:8px;height:66px;animation:1.8s ease-in-out infinite alternate CwJ8jW_breathe}.CwJ8jW_skeleton i:first-child{width:70%;height:36px}.CwJ8jW_skeleton i:last-child{animation-delay:.3s}@keyframes CwJ8jW_breathe{to{opacity:.45}}@container (width>=720px){.CwJ8jW_content{padding:20px 28px 32px}}@media (prefers-reduced-motion:reduce){.CwJ8jW_skeleton i{animation:none}}.CwJ8jW_selectorSelect option,.CwJ8jW_selectorSelect optgroup{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}";
		const tagId$1 = "deers-dsh-agent-team/WorkspaceActivity.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deers-dsh-agent-team";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var WorkspaceActivity_module_css_default = {
			"breathe": "CwJ8jW_breathe",
			"content": "CwJ8jW_content",
			"empty": "CwJ8jW_empty",
			"emptyMark": "CwJ8jW_emptyMark",
			"error": "CwJ8jW_error",
			"root": "CwJ8jW_root",
			"selector": "CwJ8jW_selector",
			"selectorSelect": "CwJ8jW_selectorSelect",
			"skeleton": "CwJ8jW_skeleton",
			"team-workspace": "CwJ8jW_team-workspace"
		};
		//#endregion
		//#region lib/client/WorkspaceActivity.js
		/** Native workspace content; discovery remains mounted independently of tab lifetime. */
		const TEAM_TAB_KIND = "deers-agent-team";
		const TEAM_TAB_ID = "deers-dsh-agent-team/activity";
		/** Optional host integration is observable so installing/removing it also switches the fallback. */
		function createWorkspaceBridge() {
			let sidebar;
			const listeners = /* @__PURE__ */ new Set();
			return {
				getSnapshot: () => sidebar,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set(value) {
					sidebar = value;
					for (const listener of listeners) listener();
				}
			};
		}
		function ActivitySurface({ bridge, state, ...props }) {
			const sidebar = (0, react.useSyncExternalStore)(bridge.subscribe, bridge.getSnapshot);
			return sidebar === void 0 ? (0, react_jsx_runtime.jsx)(ActivityPanel, { ...props }) : (0, react_jsx_runtime.jsx)(WorkspaceMonitor, {
				...props,
				sidebar,
				state
			});
		}
		function WorkspaceMonitor({ sessionsList, sidebar, state }) {
			const current = currentSessionId((0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot));
			const targets = (0, react.useSyncExternalStore)(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
			const currentTargets = (0, react.useMemo)(() => targets.filter((target) => target.sessionId === current), [targets, current]);
			const discover = (0, react.useMemo)(() => createTeamDiscovery(), [current]);
			(0, react.useEffect)(() => {
				if (current === void 0) return;
				state.status(current, "loading");
				const controller = startActivityPolling(currentTargets, {
					discoverySessionId: current,
					onStatus(status) {
						state.status(current, status);
					},
					publishSnapshots(update) {
						updateActivitySnapshots(update);
						if (update.teams === void 0) return;
						const added = discover(update.teams.filter((team) => team.captainSessionId === current));
						if (added !== void 0 && sidebar.mounted.getSnapshot() === current && !sidebar.isExpanded()) {
							state.select(current, added);
							sidebar.openTab(TEAM_TAB_KIND);
						}
					}
				});
				return () => {
					controller.stop();
				};
			}, [
				current,
				currentTargets,
				discover,
				sidebar,
				state
			]);
			(0, react.useEffect)(() => {
				const open = (event) => {
					if (current === void 0 || sidebar.mounted.getSnapshot() !== current) return;
					const data = event.detail;
					if (data?.captainSessionId && data.captainSessionId !== current) return;
					if (data?.teamId) state.remember(current, data);
					sidebar.openTab(TEAM_TAB_KIND);
				};
				window.addEventListener(OPEN_PANEL_EVENT, open);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, open);
				};
			}, [
				current,
				sidebar,
				state
			]);
			return null;
		}
		function WorkspaceActivity({ sessionId, useTabInfo, t, state, modelDirectories, openMember }) {
			const { tab } = useTabInfo();
			const snapshots = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const local = (0, react.useSyncExternalStore)(state.subscribe, state.getSnapshot);
			const [retry, setRetry] = (0, react.useState)(0);
			const live = snapshots.teams.filter((team) => team.captainSessionId === sessionId);
			const archived = snapshots.archivedTeams.filter((team) => team.captainSessionId === sessionId && !live.some((item) => item.teamId === team.teamId));
			const historic = [...local.history.values()].filter((team) => team.captainSessionId === sessionId && !live.some((item) => item.teamId === team.teamId) && !archived.some((item) => item.teamId === team.teamId)).map((team) => historicCardTeam(team, sessionId));
			const records = [
				...live,
				...archived,
				...historic
			];
			const selected = records.find((team) => team.teamId === local.selected.get(sessionId)) ?? records[0];
			const history = selected !== void 0 && !live.includes(selected);
			const status = local.statuses.get(sessionId) ?? "loading";
			(0, react.useEffect)(() => {
				if (retry === 0 || !tab.visible) return;
				const controller = startActivityPolling([], {
					discoverySessionId: sessionId,
					onStatus: (value) => state.status(sessionId, value)
				});
				controller.firstTick.finally(() => {
					controller.stop();
				});
				return () => {
					controller.stop();
				};
			}, [
				retry,
				sessionId,
				state,
				tab.visible
			]);
			const backToChat = () => {
				tab.actions.close();
				requestAnimationFrame(() => document.querySelector("[data-composer-card] [contenteditable=\"true\"][role=\"textbox\"], [data-composer-card] textarea")?.focus());
			};
			return (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceActivity_module_css_default.root,
				"data-deers-agent-team-workspace": true,
				"data-session-id": sessionId,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: WorkspaceActivity_module_css_default.content,
					children: [
						status === "error" && (0, react_jsx_runtime.jsxs)("div", {
							className: WorkspaceActivity_module_css_default.error,
							role: "alert",
							children: [(0, react_jsx_runtime.jsx)("span", { children: t("workspace.error") }), (0, react_jsx_runtime.jsx)("button", {
								onClick: () => setRetry((value) => value + 1),
								children: t("workspace.retry")
							})]
						}),
						records.length > 1 && (0, react_jsx_runtime.jsx)("nav", {
							className: WorkspaceActivity_module_css_default.selector,
							"aria-label": t("workspace.title"),
							children: records.length > 4 ? (0, react_jsx_runtime.jsxs)("select", {
								className: WorkspaceActivity_module_css_default.selectorSelect,
								value: selected?.teamId ?? "",
								"aria-label": t("workspace.title"),
								onChange: (event) => {
									const id = event.target.value;
									if (id !== "") state.select(sessionId, id);
								},
								children: [(0, react_jsx_runtime.jsx)("optgroup", {
									label: t("workspace.groupLive"),
									children: live.map((team) => (0, react_jsx_runtime.jsx)("option", {
										value: team.teamId,
										children: team.name
									}, team.teamId))
								}), (0, react_jsx_runtime.jsx)("optgroup", {
									label: t("workspace.groupArchived"),
									children: [...archived, ...historic].map((team) => (0, react_jsx_runtime.jsx)("option", {
										value: team.teamId,
										children: team.name
									}, team.teamId))
								})]
							}) : records.map((team) => (0, react_jsx_runtime.jsxs)("button", {
								"aria-pressed": selected?.teamId === team.teamId,
								onClick: () => state.select(sessionId, team.teamId),
								children: [team.name, (0, react_jsx_runtime.jsx)("span", { children: t(live.includes(team) ? "workspace.current" : "workspace.history") })]
							}, team.teamId))
						}),
						selected === void 0 ? status === "loading" ? (0, react_jsx_runtime.jsxs)("div", {
							className: WorkspaceActivity_module_css_default.skeleton,
							role: "status",
							"aria-label": t("workspace.loading"),
							children: [
								(0, react_jsx_runtime.jsx)("i", {}),
								(0, react_jsx_runtime.jsx)("i", {}),
								(0, react_jsx_runtime.jsx)("i", {})
							]
						}) : (0, react_jsx_runtime.jsxs)("section", {
							className: WorkspaceActivity_module_css_default.empty,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: WorkspaceActivity_module_css_default.emptyMark,
									"aria-hidden": true,
									children: "↳"
								}),
								(0, react_jsx_runtime.jsx)("h3", { children: t("workspace.emptyTitle") }),
								(0, react_jsx_runtime.jsx)("p", { children: t("workspace.emptyBody") }),
								(0, react_jsx_runtime.jsx)("button", {
									onClick: backToChat,
									children: t("workspace.back")
								})
							]
						}) : (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: (0, react_jsx_runtime.jsx)(TeamSection, {
							team: selected,
							workspace: true,
							historic: history,
							modelDirectory: selected.phase === "staged" ? modelDirectories.directoryFor(sessionId) : void 0,
							onContinuePlanning: backToChat,
							onDiscarded: backToChat,
							onNavigate: openMember,
							t
						}, `${sessionId}:${selected.teamId}`) })
					]
				})
			});
		}
		//#endregion
		//#region lib/client/deers-agent-team-card-definition.js
		/**
		* AgentTeams conversation card: a lightweight in-conversation summary shown
		* when a team is created — the captain's name, the member roster with character
		* avatars, and an entry point that re-activates the top-right activity
		* panel (useful after the floater was closed, or when re-opening an old
		* session for review).
		*
		* The fold anchors to the Harness's durable `tool/call` + `tool/result`
		* records for `deers_team_create`. Those are first-party session events, so
		* the card survives restarts without writing an out-of-repo event type.
		* @module deers-dsh-agent-team/client/card
		*/
		/** Parse the only create-call fields the historic card owns. */
		function parseAgentTeamsCreateArgs(value) {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null || !("name" in parsed) || typeof parsed.name !== "string") return;
				const name = parsed.name.trim();
				if (name === "") return void 0;
				const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
				return {
					teamId: cleaned === "" ? "team" : cleaned,
					name
				};
			} catch {
				return;
			}
		}
		/** Durable first-party tool events folded into one keyed Chat node. */
		const agentTeamsCardDefinition = {
			kind: "deers-agent-team",
			target: "chat",
			match: (event) => {
				if (event.type === "tool/call" && event.data.name === "deers_team_create") return parseAgentTeamsCreateArgs(event.data.arguments) === void 0 ? null : {
					id: String(event.data.callId),
					role: "start"
				};
				if (event.type === "tool/result" && event.data.message.source.kind === "tool") return {
					id: String(event.data.message.source.callId),
					role: "update"
				};
				return null;
			},
			start: (_context, match) => {
				if (match.event.type !== "tool/call") throw new Error("deers-agent-team card start requires deers_team_create tool/call");
				const parsed = parseAgentTeamsCreateArgs(match.event.data.arguments);
				if (parsed === void 0) throw new Error("deers-agent-team card start requires valid create arguments");
				return {
					...parsed,
					accepted: false
				};
			},
			update: (context, match) => {
				if (match.event.type !== "tool/result") return context.state;
				if (match.event.data.error !== void 0 || toolResultFailed(match.event.data.message)) return context.state;
				return {
					...context.state,
					accepted: true
				};
			},
			buildViewNode: (context) => {
				if (context.start === void 0) return null;
				const state = context.state;
				if (!state.accepted) return null;
				return {
					key: context.key,
					kind: "deers-agent-team",
					id: context.id,
					target: "chat",
					anchorSeq: context.start.event.seq,
					location: context.start.location,
					visibility: "visible",
					data: {
						teamId: state.teamId,
						captainSessionId: "",
						teamName: state.name,
						members: []
					}
				};
			}
		};
		/** V4 tool-role results carry isError directly; older logs nest tool-result blocks. */
		function toolResultFailed(message) {
			return message.isError === true || message.content.some((block) => typeof block === "object" && block !== null && "type" in block && block.type === "tool-result" && "isError" in block && block.isError === true);
		}
		/** Keep summaries tied to the create turn, including multiple teams in one turn. */
		function teamCardsForTurn(nodes, turn) {
			return [...nodes].filter((node) => node.kind === "deers-agent-team" && (node.location.kind === "turn" || node.location.kind === "step") && node.location.turn.turn === turn);
		}
		//#endregion
		//#region lib/client/TeamChatEntry.js
		/** Session-owned entry points: a persistent title action and a durable turn card. */
		function TeamChatEntry({ sessionId, t }) {
			const { teams, archivedTeams } = (0, react.useSyncExternalStore)(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
			const team = [...teams, ...archivedTeams].find((team) => team.captainSessionId === sessionId);
			if (!team) return null;
			return (0, react_jsx_runtime.jsxs)("button", {
				className: AgentTeamsCard_module_css_default.chatEntry,
				"data-team-chat-entry": true,
				type: "button",
				title: t("workspace.focus"),
				onClick: () => openActivityPanel({
					teamId: team.teamId,
					captainSessionId: sessionId,
					teamName: team.name,
					members: team.members
				}),
				children: [(0, react_jsx_runtime.jsx)("img", {
					src: LEAD_STICKER,
					alt: "",
					"aria-hidden": true
				}), t("workspace.focus")]
			});
		}
		function TeamTurnCard({ sessionId, turn, useChat, t, openMember }) {
			const cards = teamCardsForTurn(useChat((snapshot) => snapshot.nodes).values(), turn.turn);
			if (turn.status !== "closed" || cards.length === 0) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: AgentTeamsCard_module_css_default.turnCards,
				"data-team-turn-cards": true,
				children: cards.map((node) => (0, react_jsx_runtime.jsx)(AgentTeamsSummary, {
					data: node.data,
					sessionId,
					t,
					openMember
				}, node.key))
			});
		}
		//#endregion
		//#region lib/client/locales.js
		/** `agentTeams` namespace dictionaries for every plugin-owned Web surface. */
		/** Dictionary namespace owned by the AgentTeams client plugin. */
		const AGENT_TEAMS_LOCALE_NAMESPACE = "agentTeams";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"workspace.dependencies": "从左到右：完成前置后解锁 · 点击查看详情",
			"workspace.title": "团队协作",
			"workspace.guide": "查看成员分工、任务依赖与执行进度",
			"workspace.eyebrow": "AGENT TEAMS",
			"workspace.description": "队长统筹分工，成员按任务依赖并行协作。",
			"workspace.relationships": "队长协调成员分工；任务连线表示前置依赖。点击任务可定位负责成员。",
			"workspace.emptyTitle": "当前会话还没有团队",
			"workspace.emptyBody": "在聊天中使用 /deers-agent-team 描述目标，确认计划后即可在这里查看协作进度。",
			"workspace.loading": "正在读取团队状态",
			"workspace.error": "暂时无法连接团队服务，正在自动重试。已加载的状态可能不是最新。",
			"workspace.retry": "重新连接",
			"workspace.groupLive": "运行中的团队",
			"workspace.groupArchived": "历史归档",
			"workspace.splitLabel": "拖动调整左右分栏宽度（←/→ 微调，Shift 加速，Home 复位）",
			"workspace.current": "当前团队",
			"workspace.history": "历史记录",
			"workspace.back": "返回对话",
			"workspace.tasks": "项任务",
			"workspace.members": "名成员",
			"workspace.completed": "已完成",
			"workspace.focus": "查看团队",
			"workspace.noTasks": "等待队长拆解任务",
			"task.filter.all": "全部",
			"task.filter.running": "运行中",
			"task.filter.blocked": "阻塞",
			"task.filter.failed": "失败/取消",
			"task.filter.completed": "已完成",
			"task.filterAria": "按状态过滤任务",
			"task.cancel": "取消任务",
			"task.cancelConfirm": "确定取消该任务？进行中的成员会被停止。",
			"task.redispatch": "重新派发",
			"task.redispatchConfirm": "确定撤销当前尝试并重新派发？",
			"task.reassign": "改派",
			"task.reassign.pool": "共享池（未指派）",
			"task.reassign.captain": "队长亲自执行",
			"task.history": "历史与证据",
			"task.historyEmpty": "该任务还没有修订或补充证据记录。",
			"task.historyFailed": "历史记录读取失败。",
			"task.history.revisions": "契约修订",
			"task.history.supplemental": "补充证据",
			"task.history.output": "最终结果",
			"mail.title": "成员邮箱：{name}",
			"mail.empty": "暂无消息。",
			"mail.placeholder": "以队长身份给该成员留言…",
			"mail.send": "发送",
			"mail.readOnly": "历史归档只读。",
			"mail.openAria": "查看 {name} 的邮箱",
			"timeline.title": "活动时间线",
			"timeline.empty": "暂无活动记录。",
			"timeline.memberJoined": "成员 {name} 加入",
			"timeline.taskCreated": "任务 {taskId} 创建（{assignee}）",
			"timeline.taskStatus": "任务 {taskId} → {status}",
			"timeline.message": "{from} → {to}",
			"dag.zoomIn": "放大",
			"dag.zoomOut": "缩小",
			"dag.reset": "重置视图",
			"dag.fit": "适应",
			"dag.minimap": "小地图",
			"card.memberCount": "{count} 名成员",
			"action.openActivityPanel": "打开活动面板",
			"activity.panelButton": "活动面板",
			"activity.badgeAria": "AgentTeams 活动与历史，{count} 条团队记录",
			"activity.panelAria": "AgentTeams 活动面板",
			"activity.title": "AgentTeams 活动",
			"activity.float": "切换为浮动面板",
			"activity.dockRight": "停靠到右侧",
			"activity.collapse": "收起活动面板",
			"activity.empty": "暂无团队活动",
			"team.stop": "停止团队",
			"team.stopped": "已停止",
			"team.phase.running": "进行中",
			"team.phase.staged": "规划中",
			"team.phase.halted": "已暂停",
			"team.stopTitle": "确认停止“{team}”？",
			"team.stopDescription": "将取消 {tasks} 项未完成任务，并停止 {members} 名正在工作的成员。已完成的结果会保留。",
			"team.stopCancel": "继续运行",
			"team.stopConfirm": "确认停止",
			"team.stopping": "正在停止…",
			"team.stopFailed": "停止失败：{message}",
			"team.stopRequestFailed": "服务器未能停止团队，请重试",
			"team.discarded": "已放弃",
			"format.listSeparator": "、",
			"task.status.pending": "待领取",
			"task.status.claimed": "已认领",
			"task.status.inProgress": "进行中",
			"task.status.completed": "已完成",
			"task.status.failed": "失败",
			"task.status.cancelled": "已取消",
			"task.status.notRun": "未执行",
			"member.state.working": "工作中",
			"member.state.failed": "有失败",
			"member.state.waiting": "等待",
			"member.state.delivered": "已交付",
			"member.state.left": "已离队",
			"member.state.removed": "已移除",
			"member.state.pending": "待执行",
			"member.state.unassigned": "待派工",
			"member.state.staged": "待创建",
			"member.state.notCreated": "未创建",
			"member.state.stopped": "已停止",
			"member.status.executing": "正在执行 {taskId}",
			"member.status.executingModel": "正在执行 {taskId} · {model}",
			"member.status.working": "正在处理已派任务",
			"member.status.waitingOn": "等待 {taskId} · {assignee}",
			"member.status.waitingPrerequisite": "等待前置任务",
			"member.status.waitingAssignment": "等待队长派工",
			"member.status.delivered": "任务已交付",
			"member.status.idle": "待继续执行",
			"member.status.unknown": "状态未知",
			"member.status.staged": "确认后创建并启动",
			"member.status.settled": "任务均已终结",
			"member.status.discarded": "计划已放弃，未创建",
			"member.status.stopped": "团队已停止，需显式恢复",
			"task.assignee.unclaimed": "待认领",
			"task.summary.waitingBreakdown": "等待队长拆解任务",
			"task.summary.staged": "{count} 项计划等待确认",
			"task.summary.discarded": "{count} 项计划已放弃，均未执行",
			"task.summary.allDelivered": "全部 {count} 项任务已交付",
			"task.summary.ended": "终态：{completed} 已交付 · {cancelled} 已取消 · {failed} 失败",
			"task.summary.blockedAndRunning": "{tasks}{more} 等待前置，其余已开工",
			"task.summary.more": " 等 {count} 项",
			"task.summary.running": "{tasks} 正在执行",
			"task.summary.ready": "{tasks} 已就绪待开工",
			"task.summary.blocked": "{tasks} 等待前置",
			"task.summary.failedSettled": "{count} 项已失败，自动循环已停止",
			"task.summary.waitingSchedule": "等待下一轮调度",
			"progress.aria": "团队总进度",
			"progress.title": "团队总进度",
			"progress.rate": "交付率 {percent}%",
			"progress.runningShort": "进行中",
			"progress.queuedShort": "排队中",
			"progress.blockedShort": "等待依赖",
			"progress.deliveredShort": "已交付",
			"dependency.aria": "任务依赖链",
			"dependency.parallel": "并行任务星图",
			"dependency.title": "任务星图",
			"dependency.count": "{count} 个任务",
			"dependency.hint.parallel": "无前后依赖 · 点击查看详情",
			"dependency.hint.chain": "悬停高亮依赖链 · 点击固定",
			"dependency.hint.pinned": "{taskId} 已固定 · Esc 取消",
			"task.runningAria": "运行中",
			"task.model": "{model}",
			"task.detail.cancelled": "任务已取消，不会继续执行",
			"task.detail.failed": "任务失败，等待明确重试",
			"task.detail.completed": "已完成并交付",
			"task.detail.noPrerequisite": "无前置，可立即开工",
			"task.detail.ready": "前置已就绪，可开工",
			"task.detail.waitingOn": "等待 {tasks}",
			"task.detail.notRun": "计划已放弃，任务未执行",
			"task.detail.noDownstream": "无下游任务",
			"task.detail.unlocks": "完成后解锁 {tasks}",
			"team.ended": "已结束",
			"plan.badge": "待确认",
			"plan.title": "执行前计划审查",
			"plan.description": "成员尚未创建、任务尚未调度。可直接调整计划，也可返回对话告诉队长哪里需要修改。",
			"plan.member.role": "角色",
			"plan.member.provider": "Provider",
			"plan.member.model": "模型",
			"plan.member.reasoning": "推理等级",
			"plan.member.reasoningHint": "留空使用默认值；可用 low、medium、high、xhigh 等",
			"plan.model.choose": "选择模型",
			"plan.model.currentUnavailable": "{provider}/{model}（当前目录不可用）",
			"plan.model.route": "路由：{provider}/{model}",
			"plan.model.defaultReasoning": "默认推理等级",
			"plan.model.providerDefault": "Provider 默认值",
			"plan.model.modelDefault": "模型默认值（{effort}）",
			"plan.model.triggerAria": "选择成员模型，当前 {model}，推理等级 {effort}",
			"plan.model.back": "返回",
			"plan.model.loading": "正在加载模型…",
			"plan.model.empty": "暂无可用模型",
			"plan.model.partialFailure": "{count} 个 Provider 的模型目录加载失败",
			"plan.model.retry": "重试",
			"plan.member.prompt": "角色提示词",
			"plan.member.roleFallback": "未设置角色",
			"plan.task.subject": "任务名称",
			"plan.task.description": "任务说明",
			"plan.task.assignee": "负责人",
			"plan.task.dependencies": "依赖任务 ID（逗号分隔）",
			"plan.task.dependenciesHint": "例如 task-1, task-2；不得形成循环依赖",
			"plan.task.unassigned": "共享任务池",
			"plan.unsaved": "未保存",
			"plan.save": "保存",
			"plan.saving": "保存中…",
			"plan.remove": "删除",
			"plan.removed": "任务已删除",
			"plan.removeConfirm": "确认删除",
			"plan.removeWarning": "删除 {task} 后将重新计算依赖关系。",
			"plan.cancel": "取消",
			"plan.addTask": "添加任务",
			"plan.adding": "添加中…",
			"plan.taskAdded": "任务已添加",
			"plan.newTask": "新任务名称",
			"plan.newTaskLabel": "新增计划任务",
			"plan.readySummary": "{members} 名成员 · {tasks} 项任务 · {links} 条依赖",
			"plan.flow.aria": "团队启动流程",
			"plan.flow.review": "审查计划",
			"plan.flow.spawn": "创建成员",
			"plan.flow.run": "开始执行",
			"plan.members.title": "成员与模型路由",
			"plan.members.count": "{count} 名成员",
			"plan.members.empty": "尚未规划成员",
			"plan.tasks.title": "任务与依赖",
			"plan.tasks.count": "{count} 项任务 · {links} 条依赖",
			"plan.tasks.empty": "尚未规划任务",
			"plan.dependencies.none": "无依赖",
			"plan.dependencies.count": "{count} 条依赖",
			"plan.approve": "确认并启动团队",
			"plan.approving": "正在创建成员…",
			"plan.approveTitle": "计划检查完毕？",
			"plan.approveHint": "确认后将创建 {members} 名成员并调度 {tasks} 项任务。",
			"plan.approveConfirmTitle": "确认启动此团队",
			"plan.approveWarning": "启动后不能再在此处编辑成员和依赖。",
			"plan.approveConfirm": "确认启动",
			"plan.continue": "返回对话修改",
			"plan.returnToChat": "回到对话",
			"plan.feedbackTitle": "正在等你说明修改方向",
			"plan.feedbackHint": "队长会在对话中追问；收到你的回复后，只修改这份草案并再次等待确认。",
			"plan.discard": "放弃本次计划",
			"plan.discardConfirmTitle": "放弃本次计划？",
			"plan.discardWarning": "该计划会结束并归档；尚未创建任何成员，也不会执行任务。",
			"plan.discardConfirm": "确认放弃",
			"plan.discarding": "正在放弃…",
			"plan.pendingEdits": "请先保存当前修改，再启动团队。",
			"plan.saved": "计划已保存",
			"plan.failed": "操作失败：{message}",
			"team.stats.members": "{count} 名成员",
			"team.stats.completed": "{completed}/{total} 完成",
			"team.stats.messages": "{count} 条消息",
			"delegation.aria": "队长派工关系",
			"captain.name": "队长",
			"captain.role": "拆解 · 派发 · 汇总",
			"captain.summary": "已派发 {tasks} 项任务给 {members} 名成员",
			"captain.summary.staged": "已规划 {tasks} 项任务与 {members} 名成员，等待确认",
			"captain.summary.awaitingFeedback": "草案已保留，等待你在对话中说明修改方向",
			"captain.summary.discarded": "计划已放弃：{members} 名成员未创建，{tasks} 项任务未执行",
			"captain.summary.withTakeover": "已派发 {tasks} 项给成员 · 队长接管 {captainTasks}",
			"captain.state.working": "{count} 人执行中",
			"captain.state.takeover": "正在执行 {tasks}",
			"captain.state.collected": "已收齐",
			"captain.state.waiting": "等待回报",
			"captain.state.staged": "待确认",
			"captain.state.awaitingFeedback": "待反馈",
			"captain.state.discarded": "已放弃",
			"captain.state.settled": "已终结",
			"members.toggle": "{count} 名成员",
			"members.collapse": "收起",
			"members.expand": "展开",
			"members.expandFinished": "展开已结束（{count}）",
			"members.empty": "暂无成员，等待队长组建团队",
			"assignment.label": "队长派发",
			"assignment.staged": "计划任务",
			"assignment.discarded": "未执行的计划",
			"assignment.empty": "暂无任务",
			"archive.label": "已结束 · 历史归档",
			"archive.discardedLabel": "计划已放弃 · 历史归档",
			"board.title": "共享黑板",
			"board.toggle": "共享黑板（{count}）",
			"board.loading": "正在读取黑板…",
			"board.empty": "黑板还是空的：写下第一个点子。",
			"board.placeholder": "写下想法、提案或会议记录…",
			"board.post": "发布",
			"board.posting": "发布中…",
			"board.refresh": "刷新",
			"board.kind": "类型",
			"board.kind.note": "便签",
			"board.kind.idea": "点子",
			"board.kind.proposal": "提案",
			"board.kind.decision": "决策",
			"board.error": "黑板加载失败：{message}",
			"board.postFailed": "发布失败：{message}",
			"board.voteFailed": "投票失败：{message}",
			"board.pinned": "置顶",
			"board.up": "赞成",
			"board.down": "反对",
			"board.readOnly": "历史归档只读。",
			"board.author.captain": "队长",
			"board.captainHint": "你以队长身份发布，所有成员都能看到。",
			"board.filter.searchPlaceholder": "搜索内容或作者…",
			"board.filter.searchAria": "搜索黑板",
			"board.filter.authorAria": "按作者筛选",
			"board.filter.kindAria": "按类型筛选",
			"board.filter.groupAria": "黑板分组方式",
			"board.filter.allAuthors": "全部作者",
			"board.filter.allKinds": "全部",
			"board.filter.empty": "没有匹配的黑板内容。",
			"board.group.none": "不分组",
			"board.group.kind": "按类型分组",
			"board.group.author": "按成员分组",
			"board.cleanupNow": "清理过期",
			"board.cleaning": "清理中…",
			"board.cleanupDone": "已清理 {removed} 条旧内容。",
			"board.cleanupFailed": "清理失败：{message}",
			"board.cleanupPolicy": "自动清理：保留 {days} 天 · 最近 {latest} 条 · 置顶/决策保留{disabled}",
			"board.cleanupDisabledSuffix": "（自动清理已关闭）",
			"board.lastCleanup": "上次清理：{time}",
			"poll.title": "投票",
			"poll.toggle": "投票（{open} 进行中 / {total}）",
			"poll.empty": "还没有投票：由队长发起一个吧。",
			"poll.loading": "正在读取投票…",
			"poll.createTitle": "发起投票",
			"poll.titleLabel": "问题",
			"poll.titlePlaceholder": "要投票的问题…",
			"poll.optionsLabel": "选项（每行一个）",
			"poll.optionsPlaceholder": "选项 A\n选项 B",
			"poll.multi": "允许多选",
			"poll.maxSelections": "最多选几项",
			"poll.duration": "持续（分钟，0 = 不自动关闭）",
			"poll.submit": "发起",
			"poll.submitting": "发起中…",
			"poll.cast": "提交",
			"poll.clear": "清除我的票",
			"poll.close": "结束投票",
			"poll.closed": "已结束",
			"poll.expired": "已过期",
			"poll.single": "单选",
			"poll.multiLabel": "多选",
			"poll.voters": "{count} 人已投",
			"poll.youVoted": "你的选择：{value}",
			"poll.error": "读取投票失败：{message}",
			"poll.createFailed": "发起失败：{message}",
			"poll.voteFailed": "投票失败：{message}",
			"poll.closeFailed": "结束失败：{message}",
			"poll.readOnly": "历史归档只读。",
			"poll.captainHint": "你以队长身份发起和投票，所有成员都能参与。",
			"poll.noOptions": "至少填写两个选项。",
			"poll.selectFirst": "先选择选项。",
			"poll.refresh": "刷新",
			"poll.thresholdRule": "采纳规则",
			"poll.threshold.majority": "过半数",
			"poll.threshold.gt": "票数超过",
			"poll.threshold.percent": "得票率 ≥",
			"poll.thresholdValue": "阈值",
			"poll.quorum": "法定人数",
			"poll.quorumShort": "法定 {quorum}",
			"poll.anonymous": "匿名展示",
			"poll.anonymousBadge": "匿名",
			"poll.decision.adopted": "采纳：{value}",
			"poll.decision.none": "没有选项达到采纳规则",
			"poll.decision.quorum": "未达法定人数",
			"poll.revision": "第 {revision} 次改票",
			"poll.filter.all": "全部",
			"poll.filter.open": "进行中",
			"poll.filter.closed": "已结束",
			"poll.filterAria": "按状态筛选投票",
			"poll.filterEmpty": "这个筛选下没有投票。",
			"poll.compose": "发起投票",
			"poll.composeClose": "收起表单",
			"poll.button": "投票",
			"poll.open": "打开投票面板",
			"poll.windowTitle": "投票记录 · {team}",
			"poll.windowClose": "关闭投票面板"
		};
		/** English dictionary, checked complete against the Chinese source key set. */
		const en = {
			"workspace.dependencies": "Left to right: prerequisites unlock tasks · Select for details",
			"workspace.title": "Team workspace",
			"workspace.guide": "Members, task dependencies, and execution progress",
			"workspace.eyebrow": "AGENT TEAMS",
			"workspace.description": "The captain coordinates. Members work in parallel as dependencies clear.",
			"workspace.relationships": "The captain coordinates members. Connections show task prerequisites. Select a task to locate its owner.",
			"workspace.emptyTitle": "No team in this conversation yet",
			"workspace.emptyBody": "Use /deers-agent-team in chat to describe your goal. Review the plan, then follow the team here.",
			"workspace.loading": "Loading team activity",
			"workspace.error": "The team service is unavailable. Retrying automatically; loaded activity may be out of date.",
			"workspace.groupLive": "Live teams",
			"workspace.groupArchived": "Archived",
			"workspace.splitLabel": "Drag to resize the columns (←/→ to nudge, Shift for bigger steps, Home to reset)",
			"workspace.retry": "Reconnect",
			"workspace.current": "Current team",
			"workspace.history": "History",
			"workspace.back": "Back to conversation",
			"workspace.tasks": "tasks",
			"workspace.members": "members",
			"workspace.completed": "completed",
			"workspace.focus": "View team",
			"workspace.noTasks": "Waiting for the captain to define tasks",
			"task.filter.all": "All",
			"task.filter.running": "Running",
			"task.filter.blocked": "Blocked",
			"task.filter.failed": "Failed/gone",
			"task.filter.completed": "Completed",
			"task.filterAria": "Filter tasks by state",
			"task.cancel": "Cancel task",
			"task.cancelConfirm": "Cancel this task? A working member will be stopped.",
			"task.redispatch": "Redispatch",
			"task.redispatchConfirm": "Revoke the current attempt and dispatch again?",
			"task.reassign": "Reassign",
			"task.reassign.pool": "Shared pool (unassigned)",
			"task.reassign.captain": "Captain takes over",
			"task.history": "History & evidence",
			"task.historyEmpty": "No revisions or supplemental evidence recorded yet.",
			"task.historyFailed": "Failed to load the history.",
			"task.history.revisions": "Contract revisions",
			"task.history.supplemental": "Supplemental evidence",
			"task.history.output": "Final output",
			"mail.title": "Member mailbox: {name}",
			"mail.empty": "No messages yet.",
			"mail.placeholder": "Message this member as the captain…",
			"mail.send": "Send",
			"mail.readOnly": "Archives are read-only.",
			"mail.openAria": "Open {name}'s mailbox",
			"timeline.title": "Activity timeline",
			"timeline.empty": "No activity recorded yet.",
			"timeline.memberJoined": "Member {name} joined",
			"timeline.taskCreated": "Task {taskId} created ({assignee})",
			"timeline.taskStatus": "Task {taskId} → {status}",
			"timeline.message": "{from} → {to}",
			"dag.zoomIn": "Zoom in",
			"dag.zoomOut": "Zoom out",
			"dag.reset": "Reset view",
			"dag.fit": "Fit",
			"dag.minimap": "Minimap",
			"card.memberCount": "{count} members",
			"action.openActivityPanel": "Open activity panel",
			"activity.panelButton": "Activity panel",
			"activity.badgeAria": "AgentTeams activity and history, {count} team records",
			"activity.panelAria": "AgentTeams activity panel",
			"activity.title": "AgentTeams activity",
			"activity.float": "Switch to floating panel",
			"activity.dockRight": "Dock to the right",
			"activity.collapse": "Collapse activity panel",
			"activity.empty": "No team activity",
			"team.stop": "Stop team",
			"team.stopped": "Stopped",
			"team.phase.running": "Running",
			"team.phase.staged": "Planning",
			"team.phase.halted": "Paused",
			"team.stopTitle": "Stop “{team}”?",
			"team.stopDescription": "This cancels {tasks} unfinished tasks and stops {members} working members. Completed results are kept.",
			"team.stopCancel": "Keep running",
			"team.stopConfirm": "Stop team",
			"team.stopping": "Stopping…",
			"team.stopFailed": "Could not stop team: {message}",
			"team.stopRequestFailed": "The server could not stop this team. Try again.",
			"team.discarded": "Discarded",
			"format.listSeparator": ", ",
			"task.status.pending": "Unclaimed",
			"task.status.claimed": "Claimed",
			"task.status.inProgress": "In progress",
			"task.status.completed": "Completed",
			"task.status.failed": "Failed",
			"task.status.cancelled": "Cancelled",
			"task.status.notRun": "Not run",
			"member.state.working": "Working",
			"member.state.failed": "Has failures",
			"member.state.waiting": "Waiting",
			"member.state.delivered": "Delivered",
			"member.state.left": "Left team",
			"member.state.removed": "Removed",
			"member.state.pending": "Pending",
			"member.state.unassigned": "Awaiting assignment",
			"member.state.staged": "Not spawned",
			"member.state.notCreated": "Not created",
			"member.state.stopped": "Stopped",
			"member.status.executing": "Working on {taskId}",
			"member.status.executingModel": "Working on {taskId} · {model}",
			"member.status.working": "Working on assigned tasks",
			"member.status.waitingOn": "Waiting for {taskId} · {assignee}",
			"member.status.waitingPrerequisite": "Waiting for prerequisites",
			"member.status.waitingAssignment": "Waiting for the captain to assign work",
			"member.status.delivered": "Tasks delivered",
			"member.status.idle": "Ready to continue",
			"member.status.unknown": "Status unknown",
			"member.status.staged": "Will be spawned after approval",
			"member.status.settled": "All assigned work is settled",
			"member.status.discarded": "Plan discarded; member was not created",
			"member.status.stopped": "Team stopped; explicit resume required",
			"task.assignee.unclaimed": "Unclaimed",
			"task.summary.waitingBreakdown": "Waiting for the captain to break down the work",
			"task.summary.staged": "{count} planned tasks awaiting approval",
			"task.summary.discarded": "{count} planned tasks discarded; none ran",
			"task.summary.allDelivered": "All {count} tasks delivered",
			"task.summary.ended": "Final: {completed} delivered · {cancelled} cancelled · {failed} failed",
			"task.summary.blockedAndRunning": "{tasks}{more} waiting on prerequisites; other work has started",
			"task.summary.more": " and {count} more",
			"task.summary.running": "{tasks} in progress",
			"task.summary.ready": "{tasks} ready to start",
			"task.summary.blocked": "{tasks} waiting on prerequisites",
			"task.summary.failedSettled": "{count} failed; the automatic loop has stopped",
			"task.summary.waitingSchedule": "Waiting for the next scheduling round",
			"progress.aria": "Overall team progress",
			"progress.title": "Team progress",
			"progress.rate": "Delivery rate {percent}%",
			"progress.runningShort": "In progress",
			"progress.queuedShort": "Queued",
			"progress.blockedShort": "Waiting",
			"progress.deliveredShort": "Delivered",
			"dependency.aria": "Task dependency chain",
			"dependency.parallel": "Parallel star map",
			"dependency.title": "Task star map",
			"dependency.count": "{count} tasks",
			"dependency.hint.parallel": "No dependencies · Click for details",
			"dependency.hint.chain": "Hover to highlight dependencies · Click to pin",
			"dependency.hint.pinned": "{taskId} pinned · Esc to clear",
			"task.runningAria": "Running",
			"task.model": "{model}",
			"task.detail.cancelled": "Cancelled; execution will not continue",
			"task.detail.failed": "Failed; awaiting an explicit retry",
			"task.detail.completed": "Completed and delivered",
			"task.detail.noPrerequisite": "No prerequisites; ready to start",
			"task.detail.ready": "Prerequisites ready; can start",
			"task.detail.waitingOn": "Waiting for {tasks}",
			"task.detail.notRun": "Plan discarded; task was not run",
			"task.detail.noDownstream": "No downstream tasks",
			"task.detail.unlocks": "Unlocks {tasks} when complete",
			"team.ended": "Ended",
			"plan.badge": "Awaiting approval",
			"plan.title": "Pre-run plan review",
			"plan.description": "Members have not been spawned and tasks have not been scheduled. Edit the draft here, or return to chat and tell the Captain what should change.",
			"plan.member.role": "Role",
			"plan.member.provider": "Provider",
			"plan.member.model": "Model",
			"plan.member.reasoning": "Reasoning effort",
			"plan.member.reasoningHint": "Leave blank for default; accepts low, medium, high, xhigh, and more",
			"plan.model.choose": "Choose a model",
			"plan.model.currentUnavailable": "{provider}/{model} (not in the current catalog)",
			"plan.model.route": "Route: {provider}/{model}",
			"plan.model.defaultReasoning": "Default reasoning effort",
			"plan.model.providerDefault": "Provider default",
			"plan.model.modelDefault": "Model default ({effort})",
			"plan.model.triggerAria": "Choose member model, currently {model}, reasoning effort {effort}",
			"plan.model.back": "Back",
			"plan.model.loading": "Loading models…",
			"plan.model.empty": "No models available",
			"plan.model.partialFailure": "{count} provider catalogs could not be loaded",
			"plan.model.retry": "Retry",
			"plan.member.prompt": "Role prompt",
			"plan.member.roleFallback": "Role not set",
			"plan.task.subject": "Task subject",
			"plan.task.description": "Task description",
			"plan.task.assignee": "Assignee",
			"plan.task.dependencies": "Dependency task IDs (comma-separated)",
			"plan.task.dependenciesHint": "For example task-1, task-2; cycles are rejected",
			"plan.task.unassigned": "Shared task pool",
			"plan.unsaved": "Unsaved",
			"plan.save": "Save",
			"plan.saving": "Saving…",
			"plan.remove": "Remove",
			"plan.removed": "Task removed",
			"plan.removeConfirm": "Confirm remove",
			"plan.removeWarning": "Removing {task} will recalculate downstream dependencies.",
			"plan.cancel": "Cancel",
			"plan.addTask": "Add task",
			"plan.adding": "Adding…",
			"plan.taskAdded": "Task added",
			"plan.newTask": "New task subject",
			"plan.newTaskLabel": "Add a planned task",
			"plan.readySummary": "{members} members · {tasks} tasks · {links} dependencies",
			"plan.flow.aria": "Team launch flow",
			"plan.flow.review": "Review plan",
			"plan.flow.spawn": "Create members",
			"plan.flow.run": "Start work",
			"plan.members.title": "Members & model routes",
			"plan.members.count": "{count} members",
			"plan.members.empty": "No members planned yet",
			"plan.tasks.title": "Tasks & dependencies",
			"plan.tasks.count": "{count} tasks · {links} dependencies",
			"plan.tasks.empty": "No tasks planned yet",
			"plan.dependencies.none": "No dependencies",
			"plan.dependencies.count": "{count} dependencies",
			"plan.approve": "Approve & Run",
			"plan.approving": "Creating members…",
			"plan.approveTitle": "Plan ready?",
			"plan.approveHint": "Approval creates {members} members and schedules {tasks} tasks.",
			"plan.approveConfirmTitle": "Confirm team launch",
			"plan.approveWarning": "Member routes and dependencies cannot be edited here after launch.",
			"plan.approveConfirm": "Confirm launch",
			"plan.continue": "Return to chat & revise",
			"plan.returnToChat": "Return to chat",
			"plan.feedbackTitle": "Waiting for your revision direction",
			"plan.feedbackHint": "The Captain will ask in chat. After your reply, it will revise this draft and wait for approval again.",
			"plan.discard": "Discard this plan",
			"plan.discardConfirmTitle": "Discard this plan?",
			"plan.discardWarning": "The plan will end and be archived. No members have been spawned and no tasks will run.",
			"plan.discardConfirm": "Discard plan",
			"plan.discarding": "Discarding…",
			"plan.pendingEdits": "Save the current edits before launching the team.",
			"plan.saved": "Plan saved",
			"plan.failed": "Operation failed: {message}",
			"team.stats.members": "{count} members",
			"team.stats.completed": "{completed}/{total} completed",
			"team.stats.messages": "{count} messages",
			"delegation.aria": "Captain delegation map",
			"captain.name": "Captain",
			"captain.role": "Break down · Delegate · Synthesize",
			"captain.summary": "Assigned {tasks} tasks to {members} members",
			"captain.summary.staged": "Planned {tasks} tasks and {members} members; awaiting approval",
			"captain.summary.awaitingFeedback": "Draft preserved; waiting for your revision direction in chat",
			"captain.summary.discarded": "Plan discarded: {members} members were not created and {tasks} tasks did not run",
			"captain.summary.withTakeover": "Assigned {tasks} to members · Captain owns {captainTasks}",
			"captain.state.working": "{count} active",
			"captain.state.takeover": "Working on {tasks}",
			"captain.state.collected": "All reports received",
			"captain.state.waiting": "Waiting for reports",
			"captain.state.staged": "Awaiting approval",
			"captain.state.awaitingFeedback": "Awaiting feedback",
			"captain.state.discarded": "Discarded",
			"captain.state.settled": "Settled",
			"members.toggle": "Members {count}",
			"members.collapse": "Collapse",
			"members.expand": "Expand",
			"members.expandFinished": "Show finished ({count})",
			"members.empty": "No members yet; waiting for the captain to assemble the team",
			"assignment.label": "Captain assigned",
			"assignment.staged": "Planned task",
			"assignment.discarded": "Plan not run",
			"assignment.empty": "No tasks",
			"archive.label": "Ended · Archived history",
			"archive.discardedLabel": "Plan discarded · Archived history",
			"board.title": "Shared blackboard",
			"board.toggle": "Shared blackboard ({count})",
			"board.loading": "Loading the blackboard…",
			"board.empty": "The blackboard is empty. Write the first idea.",
			"board.placeholder": "Write an idea, proposal or meeting note…",
			"board.post": "Post",
			"board.posting": "Posting…",
			"board.refresh": "Refresh",
			"board.kind": "Kind",
			"board.kind.note": "Note",
			"board.kind.idea": "Idea",
			"board.kind.proposal": "Proposal",
			"board.kind.decision": "Decision",
			"board.error": "Failed to load the blackboard: {message}",
			"board.postFailed": "Failed to post: {message}",
			"board.voteFailed": "Failed to vote: {message}",
			"board.pinned": "Pinned",
			"board.up": "Support",
			"board.down": "Oppose",
			"board.readOnly": "Archives are read-only.",
			"board.author.captain": "Captain",
			"board.captainHint": "You post as the captain; every member can read it.",
			"board.filter.searchPlaceholder": "Search content or author…",
			"board.filter.searchAria": "Search the blackboard",
			"board.filter.authorAria": "Filter by author",
			"board.filter.kindAria": "Filter by kind",
			"board.filter.groupAria": "Group entries",
			"board.filter.allAuthors": "All authors",
			"board.filter.allKinds": "All",
			"board.filter.empty": "No entries match these filters.",
			"board.group.none": "No grouping",
			"board.group.kind": "Group by kind",
			"board.group.author": "Group by member",
			"board.cleanupNow": "Clean up",
			"board.cleaning": "Cleaning…",
			"board.cleanupDone": "Removed {removed} stale entries.",
			"board.cleanupFailed": "Cleanup failed: {message}",
			"board.cleanupPolicy": "Auto-cleanup: keep {days} days · latest {latest} · pinned/decisions protected{disabled}",
			"board.cleanupDisabledSuffix": " (auto-cleanup disabled)",
			"board.lastCleanup": "Last cleanup: {time}",
			"poll.title": "Polls",
			"poll.toggle": "Polls ({open} open / {total})",
			"poll.empty": "No polls yet. The captain can start one.",
			"poll.loading": "Loading polls…",
			"poll.createTitle": "Start a poll",
			"poll.titleLabel": "Question",
			"poll.titlePlaceholder": "What should the team vote on?",
			"poll.optionsLabel": "Options (one per line)",
			"poll.optionsPlaceholder": "Option A\nOption B",
			"poll.multi": "Allow multiple selections",
			"poll.maxSelections": "Max selections",
			"poll.duration": "Duration (minutes, 0 = no auto-close)",
			"poll.submit": "Start",
			"poll.submitting": "Starting…",
			"poll.cast": "Submit",
			"poll.clear": "Clear my vote",
			"poll.close": "Close poll",
			"poll.closed": "Closed",
			"poll.expired": "Expired",
			"poll.single": "Single choice",
			"poll.multiLabel": "Multiple choice",
			"poll.voters": "{count} voters",
			"poll.youVoted": "Your vote: {value}",
			"poll.error": "Failed to load polls: {message}",
			"poll.createFailed": "Failed to start: {message}",
			"poll.voteFailed": "Failed to vote: {message}",
			"poll.closeFailed": "Failed to close: {message}",
			"poll.readOnly": "Archives are read-only.",
			"poll.captainHint": "You create and vote as the captain; every member can join.",
			"poll.noOptions": "Provide at least two options.",
			"poll.selectFirst": "Select an option first.",
			"poll.refresh": "Refresh",
			"poll.thresholdRule": "Adoption rule",
			"poll.threshold.majority": "Majority",
			"poll.threshold.gt": "More than",
			"poll.threshold.percent": "Vote share ≥",
			"poll.thresholdValue": "Threshold",
			"poll.quorum": "Quorum",
			"poll.quorumShort": "quorum {quorum}",
			"poll.anonymous": "Anonymous display",
			"poll.anonymousBadge": "anonymous",
			"poll.decision.adopted": "Adopted: {value}",
			"poll.decision.none": "No option reached the rule",
			"poll.decision.quorum": "Quorum not met",
			"poll.revision": "Ballot revision {revision}",
			"poll.filter.all": "All",
			"poll.filter.open": "Open",
			"poll.filter.closed": "Closed",
			"poll.filterAria": "Filter polls by status",
			"poll.filterEmpty": "No polls match this filter.",
			"poll.compose": "Start a poll",
			"poll.composeClose": "Hide the form",
			"poll.button": "Polls",
			"poll.open": "Open the poll panel",
			"poll.windowTitle": "Poll records · {team}",
			"poll.windowClose": "Close the poll panel"
		};
		//#endregion
		//#region \0dsh-css:C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\src\client\PollPanel.module.css.mjs
		const css = "._5rOZ-W_polls{border-top:1px solid var(--dsw-alias-border-l2);margin:10px 0 2px;padding-top:8px}._5rOZ-W_polls[data-embedded]{border-top:none;margin:0;padding-top:0}._5rOZ-W_toggle{width:100%;color:var(--dsw-alias-label-primary);font:inherit;font-size:calc(13px + var(--deers-font-boost,0px));cursor:pointer;text-align:left;background:0 0;border:none;justify-content:space-between;align-items:center;gap:8px;padding:4px 2px;display:flex}._5rOZ-W_toggle:hover{color:var(--dsw-alias-state-business-primary)}._5rOZ-W_chevron{color:var(--dsw-alias-label-secondary);font-size:11px}._5rOZ-W_panel{flex-direction:column;gap:8px;padding:8px 0 4px;display:flex}._5rOZ-W_toolbar{justify-content:space-between;align-items:baseline;gap:8px;display:flex}._5rOZ-W_hint{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));margin:0;line-height:1.5}._5rOZ-W_linkButton{color:var(--dsw-alias-state-business-primary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border:none;padding:0}._5rOZ-W_linkButton:disabled{opacity:.5;cursor:default}._5rOZ-W_error{color:var(--dsw-alias-state-error-primary,#f87171);font-size:calc(11px + var(--deers-font-boost,0px));align-items:center;gap:6px;margin:0;display:flex}._5rOZ-W_filters{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;align-self:flex-start;gap:4px;padding:2px;display:inline-flex}._5rOZ-W_filterButton{color:var(--dsw-alias-label-secondary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border:none;border-radius:6px;padding:3px 10px}._5rOZ-W_filterButton:hover{color:var(--dsw-alias-label-primary)}._5rOZ-W_filterButton[data-active]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);color:var(--dsw-alias-state-business-primary)}._5rOZ-W_composeToggle{border:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-state-business-primary);font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;background:0 0;border-radius:8px;align-self:flex-start;padding:5px 12px}._5rOZ-W_composeToggle:hover{border-color:var(--dsw-alias-state-business-primary)}._5rOZ-W_list{flex-direction:column;gap:8px;max-height:360px;display:flex;overflow-y:auto}._5rOZ-W_card{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 97%, transparent);border-radius:8px;padding:8px 10px}._5rOZ-W_cardHead{flex-wrap:wrap;align-items:baseline;gap:6px;display:flex}._5rOZ-W_pollTitle{font-weight:600;font-size:calc(12px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary)}._5rOZ-W_status,._5rOZ-W_mode,._5rOZ-W_voters{font-size:calc(10px + var(--deers-font-boost,0px));background:var(--dsw-alias-bg-layer-2,#7f7f7f29);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:0 6px}._5rOZ-W_status[data-status=open]{color:var(--dsw-alias-state-business-primary)}._5rOZ-W_status[data-status=closed]{color:var(--dsw-alias-label-secondary)}._5rOZ-W_status[data-status=expired]{color:var(--dsw-alias-state-warning-primary,#fbbf24)}._5rOZ-W_cardHead ._5rOZ-W_linkButton{margin-left:auto}._5rOZ-W_description{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));white-space:pre-wrap;margin:4px 0 0;line-height:1.5}._5rOZ-W_options{flex-direction:column;gap:4px;margin-top:6px;display:flex}._5rOZ-W_option,._5rOZ-W_optionStatic{border:1px solid var(--dsw-alias-border-l2);width:100%;color:var(--dsw-alias-label-primary);font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));text-align:left;background:0 0;border-radius:6px;justify-content:space-between;align-items:center;gap:8px;padding:5px 8px;display:flex}._5rOZ-W_option{cursor:pointer}._5rOZ-W_option:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary)}._5rOZ-W_option:disabled{opacity:.6;cursor:default}._5rOZ-W_option[data-chosen],._5rOZ-W_optionStatic[data-chosen]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent)}._5rOZ-W_count{font-size:calc(10px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2,#7f7f7f29);border-radius:999px;flex:none;padding:0 6px}._5rOZ-W_actions{gap:8px;margin-top:6px;display:flex}._5rOZ-W_submit,._5rOZ-W_clear{font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));cursor:pointer;border-radius:8px;padding:4px 12px}._5rOZ-W_submit{color:var(--dsw-alias-label-on-primary,#fff);background:var(--dsw-alias-state-business-primary);border:none}._5rOZ-W_clear{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}._5rOZ-W_submit:disabled,._5rOZ-W_clear:disabled{opacity:.5;cursor:default}._5rOZ-W_composer{border-top:1px dashed var(--dsw-alias-border-l2);flex-direction:column;gap:6px;padding-top:6px;display:flex}._5rOZ-W_createTitle{font-weight:600;font-size:calc(12px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary)}._5rOZ-W_input,._5rOZ-W_textarea,._5rOZ-W_smallInput{border:1px solid var(--dsw-alias-border-l2);color:inherit;font:inherit;font-size:calc(12px + var(--deers-font-boost,0px));background:0 0;border-radius:6px;padding:6px 8px}._5rOZ-W_textarea{resize:vertical}._5rOZ-W_input:focus,._5rOZ-W_textarea:focus,._5rOZ-W_smallInput:focus{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._5rOZ-W_composerRow{flex-wrap:wrap;align-items:center;gap:10px;display:flex}._5rOZ-W_checkbox,._5rOZ-W_inline{color:var(--dsw-alias-label-secondary);font-size:calc(11px + var(--deers-font-boost,0px));align-items:center;gap:5px;display:inline-flex}._5rOZ-W_smallInput{width:64px;padding:3px 6px}._5rOZ-W_select{border:1px solid var(--dsw-alias-border-l2);color:inherit;font:inherit;font-size:calc(11px + var(--deers-font-boost,0px));background:0 0;border-radius:6px;padding:3px 6px}._5rOZ-W_decision{border-left:3px solid var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent);color:var(--dsw-alias-label-primary);font-size:calc(12px + var(--deers-font-boost,0px));border-radius:6px;flex-direction:column;gap:2px;margin:6px 0 0;padding:5px 8px;display:flex}._5rOZ-W_decision[data-quorum]{border-left-color:var(--dsw-alias-state-warning-primary,#fbbf24);background:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#fbbf24) 8%, transparent)}._5rOZ-W_decisionSummary{color:var(--dsw-alias-label-secondary);font-size:calc(10px + var(--deers-font-boost,0px));line-height:1.4}._5rOZ-W_window{z-index:60;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 96%, transparent);width:min(420px,92vw);max-height:min(72vh,760px);box-shadow:0 18px 44px color-mix(in srgb, var(--dsw-alias-bg-mask-3) 30%, transparent);border-radius:12px;flex-direction:column;display:flex;position:fixed;bottom:20px;right:20px}._5rOZ-W_windowHead{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;display:flex}._5rOZ-W_windowTitle{font-weight:600;font-size:calc(13px + var(--deers-font-boost,0px));color:var(--dsw-alias-label-primary)}._5rOZ-W_windowClose{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:2px 6px;font-size:18px;line-height:1}._5rOZ-W_windowClose:hover{color:var(--dsw-alias-label-primary)}._5rOZ-W_windowBody{padding:12px;overflow-y:auto}._5rOZ-W_teamPollButton{border:1px solid var(--dsw-alias-border-l2);width:26px;height:26px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:7px;flex:none;place-items:center;padding:0;font-size:13px;transition:border-color .15s,background .15s,color .15s;display:grid}._5rOZ-W_teamPollButton:hover{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 42%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, transparent);color:var(--dsw-alias-state-business-primary)}._5rOZ-W_teamPollButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}._5rOZ-W_select option,._5rOZ-W_select optgroup{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}";
		const tagId = "deers-dsh-agent-team/PollPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deers-dsh-agent-team";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PollPanel_module_css_default = {
			"actions": "_5rOZ-W_actions",
			"card": "_5rOZ-W_card",
			"cardHead": "_5rOZ-W_cardHead",
			"checkbox": "_5rOZ-W_checkbox",
			"chevron": "_5rOZ-W_chevron",
			"clear": "_5rOZ-W_clear",
			"composeToggle": "_5rOZ-W_composeToggle",
			"composer": "_5rOZ-W_composer",
			"composerRow": "_5rOZ-W_composerRow",
			"count": "_5rOZ-W_count",
			"createTitle": "_5rOZ-W_createTitle",
			"decision": "_5rOZ-W_decision",
			"decisionSummary": "_5rOZ-W_decisionSummary",
			"description": "_5rOZ-W_description",
			"error": "_5rOZ-W_error",
			"filterButton": "_5rOZ-W_filterButton",
			"filters": "_5rOZ-W_filters",
			"hint": "_5rOZ-W_hint",
			"inline": "_5rOZ-W_inline",
			"input": "_5rOZ-W_input",
			"linkButton": "_5rOZ-W_linkButton",
			"list": "_5rOZ-W_list",
			"mode": "_5rOZ-W_mode",
			"option": "_5rOZ-W_option",
			"optionStatic": "_5rOZ-W_optionStatic",
			"options": "_5rOZ-W_options",
			"panel": "_5rOZ-W_panel",
			"pollTitle": "_5rOZ-W_pollTitle",
			"polls": "_5rOZ-W_polls",
			"select": "_5rOZ-W_select",
			"smallInput": "_5rOZ-W_smallInput",
			"status": "_5rOZ-W_status",
			"submit": "_5rOZ-W_submit",
			"teamPollButton": "_5rOZ-W_teamPollButton",
			"textarea": "_5rOZ-W_textarea",
			"toggle": "_5rOZ-W_toggle",
			"toolbar": "_5rOZ-W_toolbar",
			"voters": "_5rOZ-W_voters",
			"window": "_5rOZ-W_window",
			"windowBody": "_5rOZ-W_windowBody",
			"windowClose": "_5rOZ-W_windowClose",
			"windowHead": "_5rOZ-W_windowHead",
			"windowTitle": "_5rOZ-W_windowTitle"
		};
		//#endregion
		//#region lib/client/PollPanel.js
		/**
		* Poll panel: team-wide single/multi-choice votes the human can create and
		* join. The browser acts as the captain (same authority as the captain
		* helpers), while members vote through `deers_team_vote_cast`.
		* @module deers-dsh-agent-team/client/PollPanel
		*/
		const ENDPOINT = "/plugins/deers-dsh-agent-team/polls";
		function decisionOf(raw) {
			if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
			const record = raw;
			const rule = record["thresholdRule"] === "gt" || record["thresholdRule"] === "percent" ? record["thresholdRule"] : "majority";
			return {
				adoptedOptionIds: Array.isArray(record["adoptedOptionIds"]) ? record["adoptedOptionIds"].filter((item) => typeof item === "string") : [],
				insufficientQuorum: record["insufficientQuorum"] === true,
				quorum: typeof record["quorum"] === "number" ? record["quorum"] : 1,
				totalVoters: typeof record["totalVoters"] === "number" ? record["totalVoters"] : 0,
				thresholdRule: rule,
				...typeof record["thresholdValue"] === "number" ? { thresholdValue: record["thresholdValue"] } : {},
				summary: typeof record["summary"] === "string" ? record["summary"] : "",
				decidedAt: typeof record["decidedAt"] === "number" ? record["decidedAt"] : 0,
				decidedBy: typeof record["decidedBy"] === "string" ? record["decidedBy"] : "captain"
			};
		}
		function optionOf(raw) {
			if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
			const record = raw;
			const id = typeof record["id"] === "string" ? record["id"] : "";
			const label = typeof record["label"] === "string" ? record["label"] : "";
			if (id === "" || label === "") return void 0;
			return {
				id,
				label,
				votes: typeof record["votes"] === "number" ? record["votes"] : 0,
				voters: Array.isArray(record["voters"]) ? record["voters"].filter((item) => typeof item === "string") : []
			};
		}
		function pollOf(raw) {
			if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
			const record = raw;
			const id = typeof record["id"] === "string" ? record["id"] : "";
			const title = typeof record["title"] === "string" ? record["title"] : "";
			if (id === "" || title === "") return void 0;
			const status = record["status"] === "closed" || record["status"] === "expired" ? record["status"] : "open";
			return {
				id,
				title,
				...typeof record["description"] === "string" && record["description"] !== "" ? { description: record["description"] } : {},
				multiSelect: record["multiSelect"] === true,
				...typeof record["maxSelections"] === "number" ? { maxSelections: record["maxSelections"] } : {},
				thresholdRule: record["thresholdRule"] === "gt" || record["thresholdRule"] === "percent" ? record["thresholdRule"] : "majority",
				...typeof record["thresholdValue"] === "number" ? { thresholdValue: record["thresholdValue"] } : {},
				quorum: typeof record["quorum"] === "number" ? record["quorum"] : 1,
				anonymous: record["anonymous"] === true,
				createdBy: typeof record["createdBy"] === "string" ? record["createdBy"] : "captain",
				createdAt: typeof record["createdAt"] === "number" ? record["createdAt"] : 0,
				...typeof record["closesAt"] === "number" ? { closesAt: record["closesAt"] } : {},
				...typeof record["closedAt"] === "number" ? { closedAt: record["closedAt"] } : {},
				...typeof record["closedBy"] === "string" ? { closedBy: record["closedBy"] } : {},
				status,
				options: Array.isArray(record["options"]) ? record["options"].map(optionOf).filter((option) => option !== void 0) : [],
				totalVoters: typeof record["totalVoters"] === "number" ? record["totalVoters"] : 0,
				myVotes: Array.isArray(record["myVotes"]) ? record["myVotes"].filter((item) => typeof item === "string") : [],
				...typeof record["myRevision"] === "number" ? { myRevision: record["myRevision"] } : {},
				...record["myVoterType"] === "captain" || record["myVoterType"] === "member" ? { myVoterType: record["myVoterType"] } : {},
				...decisionOf(record["decision"]) !== void 0 ? { decision: decisionOf(record["decision"]) } : {}
			};
		}
		/** One team's polls; collapsed until opened. */
		function PollPanel({ teamId, captainSessionId, t, readOnly = false, embedded = false }) {
			const [open, setOpen] = (0, react.useState)(embedded);
			const [polls, setPolls] = (0, react.useState)([]);
			const [total, setTotal] = (0, react.useState)(0);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [drafts, setDrafts] = (0, react.useState)({});
			const [title, setTitle] = (0, react.useState)("");
			const [optionsText, setOptionsText] = (0, react.useState)("");
			const [multi, setMulti] = (0, react.useState)(false);
			const [maxSelections, setMaxSelections] = (0, react.useState)("");
			const [thresholdRule, setThresholdRule] = (0, react.useState)("majority");
			const [thresholdValue, setThresholdValue] = (0, react.useState)("");
			const [quorum, setQuorum] = (0, react.useState)("1");
			const [anonymous, setAnonymous] = (0, react.useState)(false);
			const [duration, setDuration] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [busyPoll, setBusyPoll] = (0, react.useState)("");
			const [filter, setFilter] = (0, react.useState)("all");
			const [composerOpen, setComposerOpen] = (0, react.useState)(false);
			const refresh = (0, react.useCallback)(async () => {
				setLoading(true);
				try {
					const response = await fetch(`${ENDPOINT}?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`, { cache: "no-store" });
					if (!response.ok) {
						let message = `HTTP ${response.status}`;
						try {
							const body = await response.json();
							if (typeof body.error === "string" && body.error !== "") message = body.error;
						} catch {}
						throw new Error(message);
					}
					const body = await response.json();
					const rows = Array.isArray(body.polls) ? body.polls.map(pollOf).filter((poll) => poll !== void 0) : [];
					setPolls(rows);
					setTotal(typeof body.total === "number" ? body.total : rows.length);
					setError("");
				} catch (failure) {
					setError(t("poll.error", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setLoading(false);
				}
			}, [
				captainSessionId,
				t,
				teamId
			]);
			(0, react.useEffect)(() => {
				if (open) refresh();
			}, [open, refresh]);
			const send = (0, react.useCallback)(async (payload) => {
				const response = await fetch(ENDPOINT, {
					method: "POST",
					cache: "no-store",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionId: captainSessionId,
						teamId,
						...payload
					})
				});
				if (!response.ok) {
					let message = `HTTP ${response.status}`;
					try {
						const body = await response.json();
						if (typeof body.error === "string" && body.error !== "") message = body.error;
					} catch {}
					throw new Error(message);
				}
			}, [captainSessionId, teamId]);
			const create = (0, react.useCallback)(async () => {
				if (creating) return;
				const options = optionsText.split("\n").map((line) => line.trim()).filter((line) => line !== "");
				if (title.trim() === "" || options.length < 2) {
					setError(t("poll.noOptions"));
					return;
				}
				setCreating(true);
				try {
					await send({
						action: "create",
						title: title.trim(),
						options,
						multiSelect: multi,
						...multi && maxSelections.trim() !== "" ? { maxSelections: Number(maxSelections) } : {},
						thresholdRule,
						...thresholdRule !== "majority" && thresholdValue.trim() !== "" ? { thresholdValue: Number(thresholdValue) } : {},
						...quorum.trim() !== "" ? { quorum: Number(quorum) } : {},
						anonymous,
						...duration.trim() !== "" && Number(duration) > 0 ? { durationMinutes: Number(duration) } : {}
					});
					setTitle("");
					setOptionsText("");
					setMulti(false);
					setMaxSelections("");
					setThresholdRule("majority");
					setThresholdValue("");
					setQuorum("1");
					setAnonymous(false);
					setDuration("");
					await refresh();
				} catch (failure) {
					setError(t("poll.createFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setCreating(false);
				}
			}, [
				anonymous,
				creating,
				duration,
				maxSelections,
				multi,
				optionsText,
				quorum,
				refresh,
				send,
				t,
				thresholdRule,
				thresholdValue,
				title
			]);
			const vote = (0, react.useCallback)(async (pollId, optionIds) => {
				setBusyPoll(pollId);
				try {
					await send({
						action: "vote",
						pollId,
						optionIds: [...optionIds]
					});
					await refresh();
				} catch (failure) {
					setError(t("poll.voteFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setBusyPoll("");
				}
			}, [
				refresh,
				send,
				t
			]);
			const closePoll = (0, react.useCallback)(async (pollId) => {
				setBusyPoll(pollId);
				try {
					await send({
						action: "close",
						pollId
					});
					await refresh();
				} catch (failure) {
					setError(t("poll.closeFailed", { message: failure instanceof Error ? failure.message : String(failure) }));
				} finally {
					setBusyPoll("");
				}
			}, [
				refresh,
				send,
				t
			]);
			const openCount = polls.filter((poll) => poll.status === "open").length;
			const visiblePolls = polls.filter((poll) => filter === "all" ? true : filter === "open" ? poll.status === "open" : poll.status !== "open");
			const draftOf = (poll) => drafts[poll.id] ?? [...poll.myVotes];
			const toggleDraft = (poll, optionId) => {
				const current = draftOf(poll);
				const cap = poll.maxSelections ?? poll.options.length;
				let next;
				if (current.includes(optionId)) next = current.filter((id) => id !== optionId);
				else {
					if (current.length >= cap) return;
					next = [...current, optionId];
				}
				setDrafts((previous) => ({
					...previous,
					[poll.id]: next
				}));
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: PollPanel_module_css_default.polls,
				"data-polls": true,
				"data-embedded": embedded || void 0,
				children: [!embedded && (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: PollPanel_module_css_default.toggle,
					onClick: () => setOpen((value) => !value),
					"aria-expanded": open,
					"data-polls-toggle": true,
					children: [(0, react_jsx_runtime.jsx)("span", { children: t("poll.toggle", {
						open: openCount,
						total
					}) }), (0, react_jsx_runtime.jsx)("span", {
						className: PollPanel_module_css_default.chevron,
						"aria-hidden": true,
						children: open ? "▾" : "▸"
					})]
				}), (embedded || open) && (0, react_jsx_runtime.jsxs)("div", {
					className: PollPanel_module_css_default.panel,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: PollPanel_module_css_default.toolbar,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: PollPanel_module_css_default.hint,
								children: t("poll.captainHint")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PollPanel_module_css_default.linkButton,
								onClick: () => {
									refresh();
								},
								disabled: loading,
								children: t("poll.refresh")
							})]
						}),
						error !== "" && (0, react_jsx_runtime.jsxs)("p", {
							role: "alert",
							className: PollPanel_module_css_default.error,
							children: [(0, react_jsx_runtime.jsx)(IconWarningOutline16, {}), error]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: PollPanel_module_css_default.filters,
							role: "group",
							"aria-label": t("poll.filterAria"),
							children: [
								"all",
								"open",
								"closed"
							].map((key) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PollPanel_module_css_default.filterButton,
								"data-active": filter === key || void 0,
								onClick: () => setFilter(key),
								children: t(`poll.filter.${key}`)
							}, key))
						}),
						loading && polls.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: PollPanel_module_css_default.hint,
							children: t("poll.loading")
						}),
						!loading && polls.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: PollPanel_module_css_default.hint,
							children: t("poll.empty")
						}),
						!loading && polls.length > 0 && visiblePolls.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: PollPanel_module_css_default.hint,
							children: t("poll.filterEmpty")
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: PollPanel_module_css_default.list,
							children: visiblePolls.map((poll) => {
								const draft = draftOf(poll);
								const selectedLabel = poll.options.filter((option) => poll.myVotes.includes(option.id)).map((option) => option.label);
								const statusLabel = poll.status === "open" ? t("poll.open") : poll.status === "closed" ? t("poll.closed") : t("poll.expired");
								const ruleLabel = poll.thresholdRule === "majority" ? t("poll.threshold.majority") : poll.thresholdRule === "gt" ? `> ${poll.thresholdValue ?? 1}` : `≥ ${poll.thresholdValue ?? 50}%`;
								const adopted = poll.decision?.adoptedOptionIds ?? [];
								const adoptedLabels = poll.options.filter((option) => adopted.includes(option.id)).map((option) => option.label);
								return (0, react_jsx_runtime.jsxs)("article", {
									className: PollPanel_module_css_default.card,
									"data-poll-status": poll.status,
									children: [
										(0, react_jsx_runtime.jsxs)("header", {
											className: PollPanel_module_css_default.cardHead,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.pollTitle,
													children: poll.title
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.status,
													"data-status": poll.status,
													children: statusLabel
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.mode,
													children: poll.multiSelect ? t("poll.multiLabel") : t("poll.single")
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.mode,
													title: t("poll.thresholdRule"),
													children: ruleLabel
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.mode,
													title: t("poll.quorum"),
													children: t("poll.quorumShort", { quorum: poll.quorum })
												}),
												poll.anonymous && (0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.mode,
													children: t("poll.anonymousBadge")
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: PollPanel_module_css_default.voters,
													children: t("poll.voters", { count: poll.totalVoters })
												}),
												poll.status === "open" && !readOnly && (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: PollPanel_module_css_default.linkButton,
													disabled: busyPoll === poll.id,
													onClick: () => {
														closePoll(poll.id);
													},
													children: t("poll.close")
												})
											]
										}),
										poll.description !== void 0 && (0, react_jsx_runtime.jsx)("p", {
											className: PollPanel_module_css_default.description,
											children: poll.description
										}),
										(0, react_jsx_runtime.jsx)("div", {
											className: PollPanel_module_css_default.options,
											children: poll.options.map((option) => {
												const chosen = poll.multiSelect ? draft.includes(option.id) : poll.myVotes.includes(option.id);
												if (!readOnly && poll.status === "open") return (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: PollPanel_module_css_default.option,
													"data-chosen": chosen || void 0,
													disabled: busyPoll === poll.id,
													onClick: () => {
														if (poll.multiSelect) toggleDraft(poll, option.id);
														else vote(poll.id, chosen ? [] : [option.id]);
													},
													children: [(0, react_jsx_runtime.jsx)("span", { children: option.label }), (0, react_jsx_runtime.jsx)("span", {
														className: PollPanel_module_css_default.count,
														children: option.votes
													})]
												}, option.id);
												return (0, react_jsx_runtime.jsxs)("div", {
													className: PollPanel_module_css_default.optionStatic,
													"data-chosen": chosen || void 0,
													children: [(0, react_jsx_runtime.jsx)("span", { children: option.label }), (0, react_jsx_runtime.jsx)("span", {
														className: PollPanel_module_css_default.count,
														children: option.votes
													})]
												}, option.id);
											})
										}),
										!readOnly && poll.status === "open" && poll.multiSelect && (0, react_jsx_runtime.jsxs)("div", {
											className: PollPanel_module_css_default.actions,
											children: [(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: PollPanel_module_css_default.submit,
												disabled: busyPoll === poll.id,
												onClick: () => {
													vote(poll.id, draft);
												},
												children: t("poll.cast")
											}), (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: PollPanel_module_css_default.clear,
												disabled: busyPoll === poll.id,
												onClick: () => {
													setDrafts((previous) => ({
														...previous,
														[poll.id]: []
													}));
													vote(poll.id, []);
												},
												children: t("poll.clear")
											})]
										}),
										poll.decision !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
											className: PollPanel_module_css_default.decision,
											"data-quorum": poll.decision.insufficientQuorum || void 0,
											children: [poll.decision.insufficientQuorum ? t("poll.decision.quorum") : adoptedLabels.length === 0 ? t("poll.decision.none") : t("poll.decision.adopted", { value: adoptedLabels.join("、") }), (0, react_jsx_runtime.jsx)("span", {
												className: PollPanel_module_css_default.decisionSummary,
												children: poll.decision.summary
											})]
										}),
										selectedLabel.length > 0 && (0, react_jsx_runtime.jsxs)("p", {
											className: PollPanel_module_css_default.hint,
											children: [t("poll.youVoted", { value: selectedLabel.join("、") }), poll.myRevision === void 0 ? "" : ` · ${t("poll.revision", { revision: poll.myRevision })}`]
										})
									]
								}, poll.id);
							})
						}),
						!readOnly && (composerOpen ? (0, react_jsx_runtime.jsxs)("div", {
							className: PollPanel_module_css_default.composer,
							children: [
								(0, react_jsx_runtime.jsx)("div", {
									className: PollPanel_module_css_default.createTitle,
									children: t("poll.createTitle")
								}),
								(0, react_jsx_runtime.jsx)("input", {
									className: PollPanel_module_css_default.input,
									value: title,
									placeholder: t("poll.titlePlaceholder"),
									onChange: (event) => setTitle(event.target.value),
									"aria-label": t("poll.titleLabel")
								}),
								(0, react_jsx_runtime.jsx)("textarea", {
									className: PollPanel_module_css_default.textarea,
									rows: 3,
									value: optionsText,
									placeholder: t("poll.optionsPlaceholder"),
									onChange: (event) => setOptionsText(event.target.value),
									"aria-label": t("poll.optionsLabel")
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: PollPanel_module_css_default.composerRow,
									children: [
										(0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.inline,
											children: [t("poll.thresholdRule"), (0, react_jsx_runtime.jsxs)("select", {
												className: PollPanel_module_css_default.select,
												value: thresholdRule,
												onChange: (event) => setThresholdRule(event.target.value),
												children: [
													(0, react_jsx_runtime.jsx)("option", {
														value: "majority",
														children: t("poll.threshold.majority")
													}),
													(0, react_jsx_runtime.jsx)("option", {
														value: "gt",
														children: t("poll.threshold.gt")
													}),
													(0, react_jsx_runtime.jsx)("option", {
														value: "percent",
														children: t("poll.threshold.percent")
													})
												]
											})]
										}),
										thresholdRule !== "majority" && (0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.inline,
											children: [t("poll.thresholdValue"), (0, react_jsx_runtime.jsx)("input", {
												className: PollPanel_module_css_default.smallInput,
												type: "number",
												min: 1,
												max: thresholdRule === "percent" ? 100 : void 0,
												value: thresholdValue,
												onChange: (event) => setThresholdValue(event.target.value)
											})]
										}),
										(0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.inline,
											children: [t("poll.quorum"), (0, react_jsx_runtime.jsx)("input", {
												className: PollPanel_module_css_default.smallInput,
												type: "number",
												min: 1,
												value: quorum,
												onChange: (event) => setQuorum(event.target.value)
											})]
										}),
										(0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.checkbox,
											children: [(0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: anonymous,
												onChange: (event) => setAnonymous(event.target.checked)
											}), t("poll.anonymous")]
										})
									]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: PollPanel_module_css_default.composerRow,
									children: [
										(0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.checkbox,
											children: [(0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: multi,
												onChange: (event) => setMulti(event.target.checked)
											}), t("poll.multi")]
										}),
										multi && (0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.inline,
											children: [t("poll.maxSelections"), (0, react_jsx_runtime.jsx)("input", {
												className: PollPanel_module_css_default.smallInput,
												type: "number",
												min: 2,
												value: maxSelections,
												onChange: (event) => setMaxSelections(event.target.value)
											})]
										}),
										(0, react_jsx_runtime.jsxs)("label", {
											className: PollPanel_module_css_default.inline,
											children: [t("poll.duration"), (0, react_jsx_runtime.jsx)("input", {
												className: PollPanel_module_css_default.smallInput,
												type: "number",
												min: 0,
												value: duration,
												onChange: (event) => setDuration(event.target.value)
											})]
										}),
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: PollPanel_module_css_default.submit,
											disabled: creating,
											onClick: () => {
												create();
											},
											children: creating ? t("poll.submitting") : t("poll.submit")
										}),
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: PollPanel_module_css_default.clear,
											onClick: () => setComposerOpen(false),
											children: t("poll.composeClose")
										})
									]
								})
							]
						}) : (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: PollPanel_module_css_default.composeToggle,
							onClick: () => setComposerOpen(true),
							children: ["+ ", t("poll.compose")]
						})),
						readOnly && (0, react_jsx_runtime.jsx)("p", {
							className: PollPanel_module_css_default.hint,
							children: t("poll.readOnly")
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/client/PollFloater.js
		/**
		* Dedicated poll floating window.
		*
		* Opened from the team section's vote button, rendered in the shell overlay so
		* it stays usable while the activity panel is folded or the conversation
		* scrolls. The body is the same PollPanel used inline, in embedded mode.
		* @module deers-dsh-agent-team/client/PollFloater
		*/
		/** Floating poll window; renders nothing until a team is targeted. */
		function PollFloater({ t }) {
			const target = (0, react.useSyncExternalStore)(subscribePollWindow, getPollWindow);
			if (target === null) return null;
			return (0, react_jsx_runtime.jsxs)("aside", {
				className: PollPanel_module_css_default.window,
				"data-poll-window": true,
				role: "dialog",
				"aria-label": t("poll.windowTitle", { team: target.teamName }),
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: PollPanel_module_css_default.windowHead,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: PollPanel_module_css_default.windowTitle,
						children: t("poll.windowTitle", { team: target.teamName })
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: PollPanel_module_css_default.windowClose,
						onClick: closePollWindow,
						"aria-label": t("poll.windowClose"),
						title: t("poll.windowClose"),
						children: "×"
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: PollPanel_module_css_default.windowBody,
					children: (0, react_jsx_runtime.jsx)(PollPanel, {
						teamId: target.teamId,
						captainSessionId: target.captainSessionId,
						t,
						readOnly: target.readOnly === true,
						embedded: true
					})
				})]
			});
		}
		//#endregion
		//#region lib/client/index.js
		/** Required services: conversation nodes, slots, sessions navigation, and locale. */
		const inject = [
			"uiConversation",
			"slots",
			"sessions",
			"locale",
			"modelDirectories",
			"layout",
			"uiWorkspace"
		];
		const useLegacyPanelInfo = (select) => select({ activePanelId: null });
		/** The replayed user message is the canonical transcript entry. */
		function HiddenAgentTeamsCommand() {
			return null;
		}
		/**
		* Register the activity monitor in the shell's additive overlay and the
		* in-conversation team card. The card's activity button re-opens a folded
		* monitor via a window event — the recovery path for an old session.
		*/
		function apply(ctx) {
			const bridge = createWorkspaceBridge();
			const state = createWorkspaceState();
			ctx.effect(() => ctx.locale.register(AGENT_TEAMS_LOCALE_NAMESPACE, {
				zh,
				en
			}), "deers-agent-team: dictionaries");
			const openMember = (parentId, childId) => {
				openAgentTeamMember(ctx.sessions, parentId, childId, ctx.layout, ctx.uiWorkspace).catch((error) => {
					console.warn(`deers-agent-team: failed to open member transcript ${childId}: ${String(error)}`);
				});
			};
			const Panel = ({ t, usePanelInfo }) => {
				const conversationVisible = (usePanelInfo ?? useLegacyPanelInfo)((panel) => panel.activePanelId === null);
				return (0, react_jsx_runtime.jsx)(ActivitySurface, {
					bridge,
					state,
					conversationVisible,
					sessionsList: ctx.sessions.list,
					modelDirectories: ctx.modelDirectories,
					openMember,
					t
				});
			};
			ctx.inject(["sidebarRight", "sidebarRightTabs"], (native) => {
				const t = native.locale.bind(AGENT_TEAMS_LOCALE_NAMESPACE);
				native.effect(() => native.sidebarRightTabs.register({
					id: TEAM_TAB_ID,
					kind: TEAM_TAB_KIND,
					title: () => t("workspace.title")
				}));
				native.slots.inject("conversation.session.header.actions", () => native.slots.register({
					name: "conversation.session.header.actions",
					id: "deers-agent-team-entry",
					order: 50,
					locale: AGENT_TEAMS_LOCALE_NAMESPACE
				}, TeamChatEntry));
				native.slots.inject("conversation.chat.turnTail", () => native.slots.register({
					name: "conversation.chat.turnTail",
					id: "deers-agent-team-summary",
					order: 50,
					locale: AGENT_TEAMS_LOCALE_NAMESPACE,
					inject: () => ({ openMember })
				}, TeamTurnCard));
				native.slots.inject("sidebar.right.pane.tab", () => {
					const dispose = native.slots.register({
						name: "sidebar.right.pane.tab",
						key: TEAM_TAB_ID,
						locale: AGENT_TEAMS_LOCALE_NAMESPACE,
						inject: () => ({
							state,
							modelDirectories: native.modelDirectories,
							openMember
						})
					}, WorkspaceActivity);
					bridge.set(native.sidebarRight);
					return () => {
						bridge.set(void 0);
						dispose();
					};
				});
			});
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "deers-agent-team-activity",
				order: 80,
				label: "AgentTeams activity",
				locale: AGENT_TEAMS_LOCALE_NAMESPACE
			}, Panel));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "deers-agent-team-polls",
				order: 81,
				label: "AgentTeams polls",
				locale: AGENT_TEAMS_LOCALE_NAMESPACE
			}, PollFloater));
			ctx.slots.inject("conversation.chat.commandview", () => ctx.slots.register({
				name: "conversation.chat.commandview",
				key: "deers-agent-team"
			}, HiddenAgentTeamsCommand));
			ctx.uiConversation.events.register(agentTeamsCardDefinition);
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "deers-agent-team",
				locale: AGENT_TEAMS_LOCALE_NAMESPACE,
				inject: () => ({
					openMember,
					workspaceBridge: bridge
				})
			}, AgentTeamsCard));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map