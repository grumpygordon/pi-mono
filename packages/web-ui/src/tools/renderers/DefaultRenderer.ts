import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { html } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { Code } from "lucide";
import { i18n } from "../../utils/i18n.js";
import { renderCollapsibleHeader, renderHeader } from "../renderer-registry.js";
import type { ToolRenderer, ToolRenderResult } from "../types.js";

export class DefaultRenderer implements ToolRenderer {
	render(
		params: any | undefined,
		result: ToolResultMessage | undefined,
		isStreaming?: boolean,
		toolName?: string,
	): ToolRenderResult {
		const state = result
			? result.isError || result.details?.isError
				? "error"
				: "complete"
			: isStreaming
				? "inprogress"
				: "complete";

		// Extract description from params if available
		let parsedParams: any = null;
		if (params) {
			try {
				parsedParams = typeof params === "string" ? JSON.parse(params) : params;
			} catch {
				// ignore parse errors
			}
		}
		const paramDescription = parsedParams?.description;
		const displayName = paramDescription ? `${toolName}: ${paramDescription}` : toolName || "Tool Call";

		// Format params as JSON
		let paramsJson = "";
		if (params) {
			try {
				paramsJson = JSON.stringify(JSON.parse(params), null, 2);
			} catch {
				try {
					paramsJson = JSON.stringify(params, null, 2);
				} catch {
					paramsJson = String(params);
				}
			}
		}

		// Create refs for collapsible section
		const contentRef = createRef<HTMLDivElement>();
		const chevronRef = createRef<HTMLSpanElement>();

		// With result: show header + params + result
		if (result) {
			let outputJson =
				result.content
					?.filter((c) => c.type === "text")
					.map((c: any) => c.text)
					.join("\n") || i18n("(no output)");
			let outputLanguage = "text";

			// Try to parse and pretty-print if it's valid JSON
			try {
				const parsed = JSON.parse(outputJson);
				outputJson = JSON.stringify(parsed, null, 2);
				outputLanguage = "json";
			} catch {
				// Not valid JSON, leave as-is and use text highlighting
			}

			return {
				content: html`
					<div>
						${renderCollapsibleHeader(state, Code, displayName, contentRef, chevronRef, false)}
						<div ${ref(contentRef)} class="max-h-0 overflow-hidden transition-all duration-300 space-y-3">
							${
								paramsJson
									? html`<div>
								<div class="text-xs font-medium mb-1 text-muted-foreground">${i18n("Input")}</div>
								<code-block .code=${paramsJson} language="json"></code-block>
							</div>`
									: ""
							}
							<div>
								<div class="text-xs font-medium mb-1 text-muted-foreground">${i18n("Output")}</div>
								<code-block .code=${outputJson} language="${outputLanguage}"></code-block>
							</div>
						</div>
					</div>
				`,
				isCustom: false,
			};
		}

		// Just params (streaming or waiting for result)
		if (params) {
			if (isStreaming && (!paramsJson || paramsJson === "{}" || paramsJson === "null")) {
				return {
					content: html`
						<div>
							${renderHeader(state, Code, i18n("Preparing tool parameters..."))}
						</div>
					`,
					isCustom: false,
				};
			}

			return {
				content: html`
					<div>
						${renderCollapsibleHeader(state, Code, displayName, contentRef, chevronRef, false)}
						<div ${ref(contentRef)} class="max-h-0 overflow-hidden transition-all duration-300">
							<div>
								<div class="text-xs font-medium mb-1 text-muted-foreground">${i18n("Input")}</div>
								<code-block .code=${paramsJson} language="json"></code-block>
							</div>
						</div>
					</div>
				`,
				isCustom: false,
			};
		}

		// No params or result yet
		return {
			content: html`
				<div>
					${renderHeader(state, Code, i18n("Preparing tool..."))}
				</div>
			`,
			isCustom: false,
		};
	}
}
