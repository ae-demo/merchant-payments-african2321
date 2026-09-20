import aep/payments_api.internal_payments;

import ballerina/log;

public type ChargeOutcome record {|
    TransactionStatus status;
    string? providerReference;
|};

// Charges a customer for a payment request via internal-payments-api. This
// service never talks to a mobile-money or card network directly.
//
// NOTE: internal-payments-api's contract (specs/design/dependencies/internal-payments-api/openapi.yaml)
// only models amounts as integers; the payments-api contract carries `decimal`.
// Amounts are rounded to the nearest whole currency unit for the upstream call
// since no minor-unit (cents) convention is pinned in either contract.
function chargeViaInternalApi(string merchantId, decimal amount, string currency, PaymentMethod method,
        string reference) returns ChargeOutcome|error {
    internal_payments:Channel channel = method == "mobile-money" ? "mobile" : "web";
    internal_payments:CreatePaymentRequest chargeRequest = {
        merchantId,
        amount: <int>amount.round(),
        currency,
        channel,
        reference
    };
    internal_payments:Payment|error result = internalPaymentsClient->/payments.post(chargeRequest);
    if result is error {
        log:printError("internal-payments-api charge failed", 'error = result, reference = reference);
        return { status: "failed", providerReference: () };
    }
    return {
        status: chargeStatusToTransactionStatus(result.status),
        providerReference: result.paymentId
    };
}

function chargeStatusToTransactionStatus(internal_payments:PaymentStatus status) returns TransactionStatus {
    if status == "authorized" {
        return "succeeded";
    }
    if status == "declined" {
        return "failed";
    }
    return "pending";
}

public type PayoutOutcome record {|
    PayoutStatus status;
    string? providerReference;
|};

// Pays a merchant's settled balance out via internal-payments-api.
//
// NOTE: internal-payments-api's CreatePayoutRequest requires a `bankCode`,
// which the payments-api BankAccount schema does not collect (it has
// bankName/accountNumber/accountName only) -- the bank name is passed through
// as the code since the contract has no dedicated field for it.
function requestPayoutViaInternalApi(string merchantId, decimal amount, string currency, BankAccountRow bankAccount,
        string reference) returns PayoutOutcome|error {
    internal_payments:CreatePayoutRequest payoutRequest = {
        merchantId,
        amount: <int>amount.round(),
        currency,
        bankAccount: {
            accountNumber: bankAccount.accountNumber,
            bankCode: bankAccount.bankName
        },
        reference
    };
    internal_payments:Payout|error result = internalPaymentsClient->/payouts.post(payoutRequest);
    if result is error {
        log:printError("internal-payments-api payout failed", 'error = result, reference = reference);
        return { status: "failed", providerReference: () };
    }
    return {
        status: payoutStatusToApiStatus(result.status),
        providerReference: result.payoutId
    };
}

function payoutStatusToApiStatus(internal_payments:PayoutStatus status) returns PayoutStatus {
    if status == "paid" {
        return "settled";
    }
    if status == "failed" {
        return "failed";
    }
    return "pending";
}
