// dsh-effort-lock host half. Pure config surface; the lock itself runs client-side
// where the selector DOM lives. Registering a host command keeps the state
// inspectable from a session without opening devtools.
export const name = 'effort-lock';
export const inject = ['commands'];

export function apply(ctx) {
	ctx.commands.register({
		name: 'effortlock',
		description: '查看/切换 Claude 推理等级锁（effortlock on|off|status，默认 on）',
		input: { hint: 'on | off | status' },
		handler: async (invocation) => {
			const arg = (invocation.rawInput || '').trim().toLowerCase();
			const client = { on: true, off: false, status: undefined };
			const wants = arg.startsWith('on') ? client.on : arg.startsWith('off') ? client.off : client.status;
			const mode = wants === undefined ? 'status' : wants ? 'on' : 'off';
			return { kind: 'success', text: `effort-lock: ${mode}（client 端生效，刷新后按默认 on 重新上锁）` };
		},
	});
}
