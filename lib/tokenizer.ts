
export function getTokenCount(text: string): number {
    return Math.ceil(text.length / 4); // Estimate: 1 token ≈ 4 chars
}

export function truncateText(text: string, maxTokens: number): string {
const maxChars = maxTokens * 4;
if (text.length <= maxChars) return text;
return text.slice(0, maxChars);
}