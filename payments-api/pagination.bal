// Builds the `next`/`previous` relative URIs a collection envelope carries,
// from the page window and the total row count.

function nextUri(string path, int 'limit, int offset, int total) returns string? {
    int nextOffset = offset + 'limit;
    if nextOffset >= total {
        return ();
    }
    return string `${path}?limit=${'limit}&offset=${nextOffset}`;
}

function previousUri(string path, int 'limit, int offset) returns string? {
    if offset <= 0 {
        return ();
    }
    int previousOffset = offset - 'limit;
    if previousOffset < 0 {
        previousOffset = 0;
    }
    return string `${path}?limit=${'limit}&offset=${previousOffset}`;
}
