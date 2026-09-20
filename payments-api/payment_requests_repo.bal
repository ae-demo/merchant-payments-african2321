import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;

function createPaymentRequestRow(string merchantId, PaymentRequestCreate payload) returns PaymentRequestRow|error {
    postgresql:Client dbClient = check activeDbClient();
    string id = uuid:createType4AsString();
    string linkToken = uuid:createType4AsString();
    string createdAt = time:utcToString(time:utcNow());
    string? expiresAt = ();
    _ = check dbClient->execute(`
        INSERT INTO payment_requests
            (id, merchant_id, amount, currency, description, status, link_token, expires_at, created_at)
        VALUES
            (${id}, ${merchantId}, ${payload.amount}, ${payload.currency}, ${payload.description},
             'pending', ${linkToken}, ${expiresAt}, ${createdAt})
    `);
    return findPaymentRequestForMerchant(merchantId, id);
}

function findPaymentRequestForMerchant(string merchantId, string id) returns PaymentRequestRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT id, merchant_id AS "merchantId", amount, currency, description, status,
               link_token AS "linkToken", expires_at AS "expiresAt", created_at AS "createdAt"
        FROM payment_requests WHERE id = ${id} AND merchant_id = ${merchantId}
    `);
}

function findPaymentRequestById(string id) returns PaymentRequestRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT id, merchant_id AS "merchantId", amount, currency, description, status,
               link_token AS "linkToken", expires_at AS "expiresAt", created_at AS "createdAt"
        FROM payment_requests WHERE id = ${id}
    `);
}

function findPaymentLinkByToken(string linkToken) returns PaymentLinkRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT pr.id, pr.merchant_id AS "merchantId", m.business_name AS "merchantName",
               pr.amount, pr.currency, pr.description, pr.status, pr.expires_at AS "expiresAt"
        FROM payment_requests pr JOIN merchants m ON m.id = pr.merchant_id
        WHERE pr.link_token = ${linkToken}
    `);
}

function listPaymentRequestsForMerchant(string merchantId, int 'limit, int offset, PaymentRequestStatus? status)
        returns [PaymentRequestRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    sql:ParameterizedQuery filter = ``;
    if status is PaymentRequestStatus {
        filter = sql:queryConcat(` AND status = `, `${status}`);
    }
    stream<PaymentRequestRow, sql:Error?> rows = dbClient->query(sql:queryConcat(`
        SELECT id, merchant_id AS "merchantId", amount, currency, description, status,
               link_token AS "linkToken", expires_at AS "expiresAt", created_at AS "createdAt"
        FROM payment_requests WHERE merchant_id = `, `${merchantId}`, filter,
        ` ORDER BY created_at DESC LIMIT `, `${'limit}`, ` OFFSET `, `${offset}`));
    PaymentRequestRow[] items = [];
    check from PaymentRequestRow row in rows
        do {
            items.push(row);
        };
    int total = check dbClient->queryRow(sql:queryConcat(
        `SELECT COUNT(*) FROM payment_requests WHERE merchant_id = `, `${merchantId}`, filter));
    return [items, total];
}

function updatePaymentRequestStatus(string id, PaymentRequestStatus status) returns error? {
    postgresql:Client dbClient = check activeDbClient();
    _ = check dbClient->execute(`UPDATE payment_requests SET status = ${status} WHERE id = ${id}`);
}

function paymentRequestRowToApi(PaymentRequestRow row) returns PaymentRequest => {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    status: <PaymentRequestStatus>row.status,
    linkToken: row.linkToken,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt
};
