export const sanitizeInput = (input: string): string => {
    // Remove any potentially dangerous characters or patterns
    return input
        .replace(/<script.*?>.*?<\/script>/gi, '') // Script tag deletion
        .replace(/javascript:/gi, '') // Removing javascript: protocol
        .replace(/on\w+=".*?"/gi, '') // Removing inline event handlers
        .replace(/<\/?[^>]+(>|$)/g, '') // Deleting html tags
        .replace(/[&<>"'`=\/]/g, (char) => {
            const map: { [key: string]: string } = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#47;',
                '=': '&#61;',
                '`': '&#96;'
            };
            return map[char] || char;
        })
        .trim();
}
