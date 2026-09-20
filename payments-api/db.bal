import ballerina/log;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// The component contract requires this service to start with no required
// environment variables, so an unset or unreachable payments-db must never
// stop the listener coming up -- it degrades to every DB-backed operation
// failing at request time instead of the whole service failing at boot.
final postgresql:Client? dbClientOrNil = initDbClientOrNil();

final () dbSetup = initDbSchema();

function initDbClientOrNil() returns postgresql:Client? {
    int|error port = int:fromString(dbPort);
    if port is error {
        log:printWarn("PAYMENTS_DB_PORT is not a valid port; payments-db features are unavailable until it is set");
        return ();
    }
    postgresql:Client|error result = new (
        host = dbHost,
        port = port,
        database = dbName,
        username = dbUser,
        password = dbPassword
    );
    if result is error {
        log:printWarn("could not connect to payments-db at startup; database features are unavailable until it is reachable",
            'error = result);
        return ();
    }
    return result;
}

// Every repository function calls this rather than touching dbClientOrNil
// directly, so an unreachable database is a clean error at query time.
function activeDbClient() returns postgresql:Client|error {
    postgresql:Client? clientOrNil = dbClientOrNil;
    if clientOrNil is () {
        return error("payments-db is not reachable");
    }
    return clientOrNil;
}

function initDbSchema() {
    postgresql:Client|error dbClient = activeDbClient();
    if dbClient is error {
        return;
    }
    error? result = createTables(dbClient);
    if result is error {
        log:printWarn("failed to initialize payments-db schema", 'error = result);
    }
}

function createTables(postgresql:Client dbClient) returns error? {
    // Timestamps are stored as RFC3339 TEXT (application-supplied), not
    // TIMESTAMPTZ: the OpenAPI contract never filters or sorts on them, and
    // this sidesteps the sql:TimestampValue(string) pitfall entirely.
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS merchants (
            id TEXT PRIMARY KEY,
            business_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            country TEXT NOT NULL,
            currency TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payment_requests (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            link_token TEXT NOT NULL UNIQUE,
            expires_at TEXT,
            created_at TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            payment_request_id TEXT NOT NULL REFERENCES payment_requests(id),
            method TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            provider_reference TEXT,
            paid_at TEXT
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS refunds (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL REFERENCES transactions(id),
            amount NUMERIC NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
            merchant_id TEXT PRIMARY KEY REFERENCES merchants(id),
            bank_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            account_name TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            requested_at TEXT NOT NULL,
            settled_at TEXT
        )
    `);
    return;
}
