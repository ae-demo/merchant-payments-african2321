import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;

function createTransactionRow(string paymentRequestId, PaymentMethod method, decimal amount,
        string currency, TransactionStatus status, string? providerReference, string? paidAt)
        returns TransactionRow|error {
    postgresql:Client dbClient = check activeDbClient();
    string id = uuid:createType4AsString();
    _ = check dbClient->execute(`
        INSERT INTO transactions (id, payment_request_id, method, amount, currency, status,
                                   provider_reference, paid_at)
        VALUES (${id}, ${paymentRequestId}, ${method}, ${amount}, ${currency}, ${status},
                ${providerReference}, ${paidAt})
    `);
    return findTransactionById(id);
}

function findTransactionById(string id) returns TransactionRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT t.id, t.payment_request_id AS "paymentRequestId", pr.merchant_id AS "merchantId",
               t.method, t.amount, t.currency, t.status,
               t.provider_reference AS "providerReference", t.paid_at AS "paidAt"
        FROM transactions t JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE t.id = ${id}
    `);
}

function findTransactionForMerchant(string merchantId, string id) returns TransactionRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT t.id, t.payment_request_id AS "paymentRequestId", pr.merchant_id AS "merchantId",
               t.method, t.amount, t.currency, t.status,
               t.provider_reference AS "providerReference", t.paid_at AS "paidAt"
        FROM transactions t JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE t.id = ${id} AND pr.merchant_id = ${merchantId}
    `);
}

function listTransactionsForMerchant(string merchantId, int 'limit, int offset) returns [TransactionRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    stream<TransactionRow, sql:Error?> rows = dbClient->query(`
        SELECT t.id, t.payment_request_id AS "paymentRequestId", pr.merchant_id AS "merchantId",
               t.method, t.amount, t.currency, t.status,
               t.provider_reference AS "providerReference", t.paid_at AS "paidAt"
        FROM transactions t JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId}
        ORDER BY t.paid_at DESC NULLS LAST LIMIT ${'limit} OFFSET ${offset}
    `);
    TransactionRow[] items = [];
    check from TransactionRow row in rows
        do {
            items.push(row);
        };
    int total = check dbClient->queryRow(`
        SELECT COUNT(*) FROM transactions t JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId}
    `);
    return [items, total];
}

function listAllTransactions(int 'limit, int offset) returns [TransactionRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    stream<TransactionRow, sql:Error?> rows = dbClient->query(`
        SELECT t.id, t.payment_request_id AS "paymentRequestId", pr.merchant_id AS "merchantId",
               t.method, t.amount, t.currency, t.status,
               t.provider_reference AS "providerReference", t.paid_at AS "paidAt"
        FROM transactions t JOIN payment_requests pr ON pr.id = t.payment_request_id
        ORDER BY t.paid_at DESC NULLS LAST LIMIT ${'limit} OFFSET ${offset}
    `);
    TransactionRow[] items = [];
    check from TransactionRow row in rows
        do {
            items.push(row);
        };
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM transactions`);
    return [items, total];
}

function markTransactionRefunded(string transactionId, decimal amount) returns error? {
    postgresql:Client dbClient = check activeDbClient();
    string id = uuid:createType4AsString();
    string createdAt = time:utcToString(time:utcNow());
    _ = check dbClient->execute(`INSERT INTO refunds (id, transaction_id, amount, status, created_at)
        VALUES (${id}, ${transactionId}, ${amount}, 'completed', ${createdAt})`);
    _ = check dbClient->execute(`UPDATE transactions SET status = 'refunded' WHERE id = ${transactionId}`);
}

function transactionRowToApi(TransactionRow row) returns Transaction => {
    id: row.id,
    paymentRequestId: row.paymentRequestId,
    method: <PaymentMethod>row.method,
    amount: row.amount,
    currency: row.currency,
    status: <TransactionStatus>row.status,
    providerReference: row.providerReference,
    paidAt: row.paidAt
};
