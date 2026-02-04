import type { ToolResultMessage } from "@mariozechner/pi-ai";
import "./javascript-repl.js"; // Auto-registers the renderer
import "./extract-document.js"; // Auto-registers the renderer
import { getToolRenderer, registerToolRenderer } from "./renderer-registry.js";
import { BashRenderer } from "./renderers/BashRenderer.js";
import { DefaultRenderer } from "./renderers/DefaultRenderer.js";
import type { ToolRenderer, ToolRenderResult } from "./types.js";

// Register all built-in tool renderers
registerToolRenderer("bash", new BashRenderer());

let defaultRenderer: ToolRenderer = new DefaultRenderer();

/**
 * Set a custom default renderer for tools without a registered renderer
 */
export function setDefaultRenderer(renderer: ToolRenderer): void {
	defaultRenderer = renderer;
}

// Global flag to force default JSON rendering for all tools
let showJsonMode = false;

/**
 * Enable or disable show JSON mode
 * When enabled, all tool renderers will use the default JSON renderer
 */
export function setShowJsonMode(enabled: boolean): void {
	showJsonMode = enabled;
}

/**
 * Render tool - unified function that handles params, result, and streaming state
 */
export function renderTool(
	toolName: string,
	params: any | undefined,
	result: ToolResultMessage | undefined,
	isStreaming?: boolean,
): ToolRenderResult {
	// If showJsonMode is enabled, always use the default renderer
	if (showJsonMode) {
		return defaultRenderer.render(params, result, isStreaming, toolName);
	}

	const renderer = getToolRenderer(toolName);
	if (renderer) {
		return renderer.render(params, result, isStreaming, toolName);
	}
	return defaultRenderer.render(params, result, isStreaming, toolName);
}

export { getToolRenderer, registerToolRenderer };
