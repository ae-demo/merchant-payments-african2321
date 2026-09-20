import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

function findMerchant(string merchantId) returns MerchantRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT id, business_name AS "businessName", email, phone, country, currency,
               created_at AS "createdAt"
        FROM merchants WHERE id = ${merchantId}
    `);
}

function saveMerchant(string merchantId, Merchant payload) returns MerchantRow|error {
    postgresql:Client dbClient = check activeDbClient();
    MerchantRow|sql:NoRowsError|error existing = findMerchant(merchantId);
    string createdAt = time:utcToString(time:utcNow());
    if existing is MerchantRow {
        createdAt = existing.createdAt;
    }
    _ = check dbClient->execute(`
        INSERT INTO merchants (id, business_name, email, phone, country, currency, created_at)
        VALUES (${merchantId}, ${payload.businessName}, ${payload.email}, ${payload?.phone},
                ${payload.country}, ${payload.currency}, ${createdAt})
        ON CONFLICT (id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            country = EXCLUDED.country,
            currency = EXCLUDED.currency
    `);
    MerchantRow saved = check findMerchant(merchantId);
    return saved;
}

function listAllMerchants(int 'limit, int offset) returns [MerchantRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    stream<MerchantRow, sql:Error?> rows = dbClient->query(`
        SELECT id, business_name AS "businessName", email, phone, country, currency,
               created_at AS "createdAt"
        FROM merchants ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    MerchantRow[] merchants = [];
    check from MerchantRow row in rows
        do {
            merchants.push(row);
        };
    int total = check dbClient->queryRow(`SELECT COUNT(*) AS count FROM merchants`);
    return [merchants, total];
}

function merchantRowToApi(MerchantRow row) returns Merchant => {
    id: row.id,
    businessName: row.businessName,
    email: row.email,
    phone: row.phone,
    country: row.country,
    currency: row.currency,
    createdAt: row.createdAt
};
