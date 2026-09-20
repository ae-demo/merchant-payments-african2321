// Joins a path suffix onto a base URL that may or may not carry a trailing
// slash, so an injected address ending in "/" never doubles up.
function joinUrl(string base, string suffix) returns string {
    string trimmedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    string normalizedSuffix = suffix.startsWith("/") ? suffix : "/" + suffix;
    return trimmedBase + normalizedSuffix;
}
