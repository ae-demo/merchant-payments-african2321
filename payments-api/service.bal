import ballerina/http;
import ballerina/sql;
import ballerina/time;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {

    public function createInterceptors() returns AssertionInterceptor => new;

    // ---- Liveness ----

    resource function get health() returns http:Ok {
        return http:OK;
    }

    // ---- Merchant profile ----

    resource function get me/merchant(http:RequestContext ctx) returns Merchant|ErrorNotFound|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        MerchantRow|sql:NoRowsError|error row = findMerchant(caller.userId);
        if row is sql:NoRowsError {
            return <ErrorNotFound>{body: {code: 404, message: "no merchant profile yet"}};
        }
        if row is error {
            return <ErrorNotFound>{body: {code: 404, message: "no merchant profile yet"}};
        }
        return merchantRowToApi(row);
    }

    resource function put me/merchant(http:RequestContext ctx, @http:Payload Merchant payload)
            returns Merchant|ErrorBadRequest|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        if payload.businessName.trim() == "" || payload.email.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "businessName and email are required"}};
        }
        MerchantRow|error saved = saveMerchant(caller.userId, payload);
        if saved is error {
            return <ErrorBadRequest>{body: {code: 400, message: "could not save merchant profile"}};
        }
        return merchantRowToApi(saved);
    }

    resource function get merchants(int 'limit = 20, int offset = 0) returns MerchantPage|error {
        var [rows, total] = check listAllMerchants('limit, offset);
        return {
            count: total,
            next: nextUri("/merchants", 'limit, offset, total),
            previous: previousUri("/merchants", 'limit, offset),
            data: from MerchantRow row in rows select merchantRowToApi(row)
        };
    }

    // ---- Payment requests ----

    resource function get me/payment\-requests(http:RequestContext ctx,
            "pending"|"paid"|"failed"|"expired"? status, int 'limit = 20, int offset = 0)
            returns PaymentRequestPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        var [rows, total] =
            check listPaymentRequestsForMerchant(caller.userId, 'limit, offset, status);
        return {
            count: total,
            next: nextUri("/me/payment-requests", 'limit, offset, total),
            previous: previousUri("/me/payment-requests", 'limit, offset),
            data: from PaymentRequestRow row in rows select paymentRequestRowToApi(row)
        };
    }

    resource function post me/payment\-requests(http:RequestContext ctx, @http:Payload PaymentRequestCreate payload)
            returns PaymentRequestCreated|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        if payload.amount <= 0d {
            return <ErrorBadRequest>{body: {code: 400, message: "amount must be positive"}};
        }
        MerchantRow|sql:NoRowsError|error merchantRow = findMerchant(caller.userId);
        if merchantRow !is MerchantRow {
            return <ErrorBadRequest>{body: {code: 400, message: "create a merchant profile before creating payment requests"}};
        }
        PaymentRequestRow|error created = createPaymentRequestRow(caller.userId, payload);
        if created is error {
            return <ErrorBadRequest>{body: {code: 400, message: "could not create payment request"}};
        }
        Merchant merchant = merchantRowToApi(merchantRow);
        notifyPaymentLinkShared(merchant, created);
        return <PaymentRequestCreated>{body: paymentRequestRowToApi(created)};
    }

    resource function get me/payment\-requests/[string id](http:RequestContext ctx)
            returns PaymentRequest|ErrorNotFound|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        PaymentRequestRow|sql:NoRowsError|error row = findPaymentRequestForMerchant(caller.userId, id);
        if row !is PaymentRequestRow {
            return <ErrorNotFound>{body: {code: 404, message: "payment request not found"}};
        }
        return paymentRequestRowToApi(row);
    }

    // ---- Guest checkout (public) ----

    resource function get payment\-links/[string linkToken]() returns PaymentLinkDetails|ErrorNotFound|error {
        PaymentLinkRow|sql:NoRowsError|error row = findPaymentLinkByToken(linkToken);
        if row !is PaymentLinkRow {
            return <ErrorNotFound>{body: {code: 404, message: "no payment request for this link"}};
        }
        return {
            merchantName: row.merchantName,
            amount: row.amount,
            currency: row.currency,
            description: row.description,
            status: <PaymentRequestStatus>row.status
        };
    }

    resource function post payment\-links/[string linkToken]/pay(@http:Payload PaymentSubmission payload)
            returns TransactionOk|ErrorBadRequest|ErrorNotFound|error {
        PaymentLinkRow|sql:NoRowsError|error link = findPaymentLinkByToken(linkToken);
        if link !is PaymentLinkRow {
            return <ErrorNotFound>{body: {code: 404, message: "no payment request for this link"}};
        }
        if link.status != "pending" {
            return <ErrorBadRequest>{body: {code: 400, message: "this payment link is no longer payable"}};
        }
        ChargeOutcome|error outcome = chargeViaInternalApi(link.merchantId, link.amount, link.currency,
            payload.method, link.id);
        if outcome is error {
            return <ErrorBadRequest>{body: {code: 400, message: "the charge could not be processed"}};
        }
        TransactionRow|error txn = createTransactionRow(link.id, payload.method, link.amount,
            link.currency, outcome.status, outcome.providerReference,
            outcome.status == "succeeded" ? time:utcToString(time:utcNow()) : ());
        if txn is error {
            return <ErrorBadRequest>{body: {code: 400, message: "the charge could not be recorded"}};
        }
        // "pending" (the charge is still settling upstream) leaves the payment
        // request's own status untouched -- only a final succeeded/failed
        // outcome updates it, per PaymentRequestStatus's enum (no "pending" ->
        // "failed" collapse).
        if outcome.status == "succeeded" {
            _ = check updatePaymentRequestStatus(link.id, "paid");
            MerchantRow|sql:NoRowsError|error merchantRow = findMerchant(link.merchantId);
            if merchantRow is MerchantRow {
                PaymentRequestRow requestRow = {
                    id: link.id,
                    merchantId: link.merchantId,
                    amount: link.amount,
                    currency: link.currency,
                    description: link.description,
                    status: "paid",
                    linkToken,
                    expiresAt: link.expiresAt,
                    createdAt: ""
                };
                notifyPaymentSucceeded(merchantRowToApi(merchantRow), requestRow, payload);
            }
        } else if outcome.status == "failed" {
            _ = check updatePaymentRequestStatus(link.id, "failed");
            return <ErrorBadRequest>{body: {code: 400, message: "the charge was declined"}};
        }
        return <TransactionOk>{body: transactionRowToApi(txn)};
    }

    // ---- Transactions ----

    resource function get me/transactions(http:RequestContext ctx, int 'limit = 20, int offset = 0)
            returns TransactionPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        var [rows, total] = check listTransactionsForMerchant(caller.userId, 'limit, offset);
        return {
            count: total,
            next: nextUri("/me/transactions", 'limit, offset, total),
            previous: previousUri("/me/transactions", 'limit, offset),
            data: from TransactionRow row in rows select transactionRowToApi(row)
        };
    }

    resource function get transactions(int 'limit = 20, int offset = 0) returns TransactionPage|error {
        var [rows, total] = check listAllTransactions('limit, offset);
        return {
            count: total,
            next: nextUri("/transactions", 'limit, offset, total),
            previous: previousUri("/transactions", 'limit, offset),
            data: from TransactionRow row in rows select transactionRowToApi(row)
        };
    }

    resource function post me/transactions/[string id]/refund(http:RequestContext ctx)
            returns TransactionOk|ErrorBadRequest|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        TransactionRow|sql:NoRowsError|error row = findTransactionForMerchant(caller.userId, id);
        if row !is TransactionRow {
            return <ErrorNotFound>{body: {code: 404, message: "transaction not found"}};
        }
        if row.status != "succeeded" {
            return <ErrorBadRequest>{body: {code: 400, message: "only completed transactions can be refunded"}};
        }
        _ = check markTransactionRefunded(row.id, row.amount);
        TransactionRow refunded = check findTransactionForMerchant(caller.userId, id);
        return <TransactionOk>{body: transactionRowToApi(refunded)};
    }

    // ---- Bank account ----

    resource function get me/bank\-account(http:RequestContext ctx)
            returns BankAccount|ErrorNotFound|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        BankAccountRow|sql:NoRowsError|error row = findBankAccount(caller.userId);
        if row !is BankAccountRow {
            return <ErrorNotFound>{body: {code: 404, message: "no bank account configured yet"}};
        }
        return bankAccountRowToApi(row);
    }

    resource function put me/bank\-account(http:RequestContext ctx, @http:Payload BankAccount payload)
            returns BankAccount|ErrorBadRequest|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        if payload.bankName.trim() == "" || payload.accountNumber.trim() == "" || payload.accountName.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "bankName, accountNumber and accountName are required"}};
        }
        BankAccountRow|error saved = saveBankAccount(caller.userId, payload);
        if saved is error {
            return <ErrorBadRequest>{body: {code: 400, message: "could not save bank account"}};
        }
        return bankAccountRowToApi(saved);
    }

    // ---- Balance and payouts ----

    resource function get me/balance(http:RequestContext ctx) returns Balance|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        decimal available = check computeAvailableBalance(caller.userId);
        MerchantRow|sql:NoRowsError|error merchantRow = findMerchant(caller.userId);
        string currency = "USD";
        if merchantRow is MerchantRow {
            currency = merchantRow.currency;
        }
        return {available, currency};
    }

    resource function get me/payouts(http:RequestContext ctx, int 'limit = 20, int offset = 0)
            returns PayoutPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        var [rows, total] = check listPayoutsForMerchant(caller.userId, 'limit, offset);
        return {
            count: total,
            next: nextUri("/me/payouts", 'limit, offset, total),
            previous: previousUri("/me/payouts", 'limit, offset),
            data: from PayoutRow row in rows select payoutRowToApi(row)
        };
    }

    resource function post me/payouts(http:RequestContext ctx)
            returns PayoutCreated|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller !is GatewayCaller {
            return caller;
        }
        BankAccountRow|sql:NoRowsError|error bankAccount = findBankAccount(caller.userId);
        if bankAccount !is BankAccountRow {
            return <ErrorBadRequest>{body: {code: 400, message: "no bank account configured"}};
        }
        decimal available = check computeAvailableBalance(caller.userId);
        if available <= 0d {
            return <ErrorBadRequest>{body: {code: 400, message: "no available balance"}};
        }
        MerchantRow|sql:NoRowsError|error merchantRow = findMerchant(caller.userId);
        string currency = "USD";
        if merchantRow is MerchantRow {
            currency = merchantRow.currency;
        }
        PayoutOutcome|error outcome = requestPayoutViaInternalApi(caller.userId, available, currency, bankAccount,
            caller.userId);
        PayoutStatus initialStatus = "pending";
        if outcome is PayoutOutcome {
            initialStatus = outcome.status;
        }
        PayoutRow|error created = createPayoutRow(caller.userId, available, currency, initialStatus);
        if created is error {
            return <ErrorBadRequest>{body: {code: 400, message: "could not create payout"}};
        }
        Payout payout = payoutRowToApi(created);
        if merchantRow is MerchantRow {
            notifyPayoutRequested(merchantRowToApi(merchantRow), payout);
        }
        return <PayoutCreated>{body: payout};
    }

    resource function get payouts(int 'limit = 20, int offset = 0) returns PayoutPage|error {
        var [rows, total] = check listAllPayouts('limit, offset);
        return {
            count: total,
            next: nextUri("/payouts", 'limit, offset, total),
            previous: previousUri("/payouts", 'limit, offset),
            data: from PayoutRow row in rows select payoutRowToApi(row)
        };
    }
}
