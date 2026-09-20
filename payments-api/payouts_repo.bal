import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;

function findBankAccount(string merchantId) returns BankAccountRow|sql:NoRowsError|error {
    postgresql:Client dbClient = check activeDbClient();
    return dbClient->queryRow(`
        SELECT merchant_id AS "merchantId", bank_name AS "bankName", account_number AS "accountNumber",
               account_name AS "accountName"
        FROM bank_accounts WHERE merchant_id = ${merchantId}
    `);
}

function saveBankAccount(string merchantId, BankAccount payload) returns BankAccountRow|error {
    postgresql:Client dbClient = check activeDbClient();
    _ = check dbClient->execute(`
        INSERT INTO bank_accounts (merchant_id, bank_name, account_number, account_name)
        VALUES (${merchantId}, ${payload.bankName}, ${payload.accountNumber}, ${payload.accountName})
        ON CONFLICT (merchant_id) DO UPDATE SET
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            account_name = EXCLUDED.account_name
    `);
    return findBankAccount(merchantId);
}

function bankAccountRowToApi(BankAccountRow row) returns BankAccount => {
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountName: row.accountName
};

// Available balance = succeeded charges, minus what has already been refunded,
// minus payouts already requested (pending or settled) so a payout cannot be
// triggered twice against the same funds.
function computeAvailableBalance(string merchantId) returns decimal|error {
    postgresql:Client dbClient = check activeDbClient();
    decimal charged = check dbClient->queryRow(`
        SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
        JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId} AND t.status = 'succeeded'
    `);
    decimal refunded = check dbClient->queryRow(`
        SELECT COALESCE(SUM(r.amount), 0) FROM refunds r
        JOIN transactions t ON t.id = r.transaction_id
        JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId} AND r.status = 'completed'
    `);
    decimal paidOut = check dbClient->queryRow(`
        SELECT COALESCE(SUM(amount), 0) FROM payouts
        WHERE merchant_id = ${merchantId} AND status IN ('pending', 'settled')
    `);
    return charged - refunded - paidOut;
}

function createPayoutRow(string merchantId, decimal amount, string currency, PayoutStatus status)
        returns PayoutRow|error {
    postgresql:Client dbClient = check activeDbClient();
    string id = uuid:createType4AsString();
    string requestedAt = time:utcToString(time:utcNow());
    string? settledAt = status == "settled" ? requestedAt : ();
    _ = check dbClient->execute(`
        INSERT INTO payouts (id, merchant_id, amount, currency, status, requested_at, settled_at)
        VALUES (${id}, ${merchantId}, ${amount}, ${currency}, ${status}, ${requestedAt}, ${settledAt})
    `);
    return dbClient->queryRow(`
        SELECT id, merchant_id AS "merchantId", amount, currency, status,
               requested_at AS "requestedAt", settled_at AS "settledAt"
        FROM payouts WHERE id = ${id}
    `);
}

function listPayoutsForMerchant(string merchantId, int 'limit, int offset) returns [PayoutRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    stream<PayoutRow, sql:Error?> rows = dbClient->query(`
        SELECT id, merchant_id AS "merchantId", amount, currency, status,
               requested_at AS "requestedAt", settled_at AS "settledAt"
        FROM payouts WHERE merchant_id = ${merchantId}
        ORDER BY requested_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PayoutRow[] items = [];
    check from PayoutRow row in rows
        do {
            items.push(row);
        };
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM payouts WHERE merchant_id = ${merchantId}`);
    return [items, total];
}

function listAllPayouts(int 'limit, int offset) returns [PayoutRow[], int]|error {
    postgresql:Client dbClient = check activeDbClient();
    stream<PayoutRow, sql:Error?> rows = dbClient->query(`
        SELECT id, merchant_id AS "merchantId", amount, currency, status,
               requested_at AS "requestedAt", settled_at AS "settledAt"
        FROM payouts
        ORDER BY requested_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PayoutRow[] items = [];
    check from PayoutRow row in rows
        do {
            items.push(row);
        };
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM payouts`);
    return [items, total];
}

function payoutRowToApi(PayoutRow row) returns Payout => {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: <PayoutStatus>row.status,
    requestedAt: row.requestedAt,
    settledAt: row.settledAt
};
