// dsh-effort-lock — lock the reasoning-effort popover while a Claude session is
// live. A mid-conversation effort switch makes Magpie re-bill the whole history
// (the effort value is part of its session key), so the slider is disabled in
// place with an explanatory note once the current model is anthropic/Claude and
// the conversation has at least one turn. New conversations and non-Claude
// models stay free to switch.
window.__ModuleLoader__.load({
	id: "@huakirax/dsh-effort-lock",
	factory: () => {
		const CLAUDE_RE = /(^|\/)(claude|fable|sonnet|opus|haiku)[\w.-]*$/i;
		const MODEL_HOST_FLAG = "data-dsh-claude-model-host";
		const POPOVER = ".dsh-claude-effort-popover";
		const NOTE_CLS = "dsh-effort-lock-note";
		const HB = "data-dsh-effort-lock-applied";
		const STATE = "data-dsh-effort-lock-state";
		const ZH = /^zh/i.test(navigator.language || "");
		const NOTE_TEXT = ZH
			? "Claude 会话进行中不允许切换推理等级（切换会重付整段历史缓存）"
			: "Effort is locked for live Claude sessions (switching re-bills the whole history)";
		const TURN_START = "turn/start";
		const observed = new WeakSet();

		function debug(state) {
			try { document.documentElement.setAttribute(STATE, state); } catch { /* noop */ }
		}

		function currentModel() {
			const btn = document.querySelector('[aria-label^="Select model, currently"]');
			const m = btn && (btn.getAttribute("aria-label") || "").match(/currently ([\w./-]+)/);
			return m ? m[1] : null;
		}
		function isClaude(model) {
			return !!model && CLAUDE_RE.test(model);
		}
		function turnsStarted() {
			const log = document.querySelector('[data-slot="conversation.messages"], main [class*="messages"]');
			return log ? log.querySelectorAll("img, p, [class*='message']").length > 0 : false;
		}
		function shouldLock() {
			const model = currentModel();
			const claude = isClaude(model);
			let turns = null;
			try { turns = turnsStarted(); } catch { turns = false; }
			let evOk = true;
			try {
				const snap = window.__DSH_SESSION_EVENTS__;
				evOk = snap ? snap.includes(TURN_START) : true;
			} catch { evOk = true; }
			const lock = claude && turns && evOk;
			debug(JSON.stringify({ model: model ?? null, claude, turns, evOk, lock }));
			return lock;
		}

		function applyLock() {
			const card = document.querySelector(POPOVER);
			if (!card) return;
			const lock = shouldLock();
			if (lock) {
				if (!card.hasAttribute("data-dsh-effort-locked")) {
					card.setAttribute("data-dsh-effort-locked", "");
					card.style.pointerEvents = "none";
					card.style.opacity = "0.55";
					if (!card.querySelector("." + NOTE_CLS)) {
						const note = document.createElement("div");
						note.className = NOTE_CLS;
						note.textContent = NOTE_TEXT;
						card.appendChild(note);
					}
				}
			} else if (card.hasAttribute("data-dsh-effort-locked")) {
				card.removeAttribute("data-dsh-effort-locked");
				card.style.pointerEvents = "";
				card.style.opacity = "";
				card.querySelector("." + NOTE_CLS)?.remove();
			}
		}

		function observePopover() {
			const card = document.querySelector(POPOVER);
			if (!card || observed.has(card)) return;
			observed.add(card);
			new MutationObserver(applyLock).observe(card, { attributes: true, childList: true, subtree: true });
			applyLock();
		}

		function attach(mo) {
			const host = document.body ?? document.documentElement;
			mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "class"] });
			scan();
		}

		function scan() {
			if (!document.querySelector(`[${MODEL_HOST_FLAG}]`)) {
				debug(JSON.stringify({ model: currentModel() ?? null, reason: "no-claude-host" }));
				return; // only the Claude-style picker has this popover
			}
			observePopover();
			applyLock();
		}

		function apply(ctx) {
			try { document.documentElement.setAttribute(HB, "1"); } catch { /* noop */ }
			const mo = new MutationObserver(scan);
			try {
				if (document.body) {
					attach(mo);
				} else {
					// Head-time boot: wait for <body> before observing.
					const w = new MutationObserver(() => {
						if (document.body) { w.disconnect(); attach(mo); }
					});
					w.observe(document.documentElement, { childList: true });
				}
			} catch (e) {
				debug(JSON.stringify({ fatal: String(e && e.message || e) }));
			}
			if (typeof ctx.effect === "function") ctx.effect(() => () => mo.disconnect(), "effort-lock: observer");
		}

		return { inject: ["slots", "locale"], apply };
	}
});
