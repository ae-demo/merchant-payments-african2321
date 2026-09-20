import ballerina/http;

// ---- Wire schemas, matching specs/design/components/payments-api/openapi.yaml exactly ----

public type Error record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type Merchant record {|
    string id;
    string businessName;
    string email;
    string phone?;
    string country;
    string currency;
    string createdAt?;
|};

public type MerchantOk record {|
    *http:Ok;
    Merchant body;
|};

public type MerchantBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type PaymentRequestStatus "pending"|"paid"|"failed"|"expired";

public type PaymentRequest record {|
    string id;
    decimal amount;
    string currency;
    string description;
    PaymentRequestStatus status;
    string linkToken?;
    string expiresAt?;
    string createdAt?;
|};

public type PaymentRequestCreate record {|
    decimal amount;
    string currency;
    string description;
|};

public type PaymentRequestCreated record {|
    *http:Created;
    PaymentRequest body;
|};

public type PaymentLinkDetails record {|
    string merchantName;
    decimal amount;
    string currency;
    string description;
    PaymentRequestStatus status;
|};

public type PaymentMethod "mobile-money"|"card";

public type PaymentSubmission record {|
    PaymentMethod method;
    string phoneNumber?;
    string cardToken?;
|};

public type TransactionStatus "pending"|"succeeded"|"failed"|"refunded";

public type Transaction record {|
    string id;
    string paymentRequestId;
    PaymentMethod method;
    decimal amount;
    string currency;
    TransactionStatus status;
    string providerReference?;
    string paidAt?;
|};

public type TransactionOk record {|
    *http:Ok;
    Transaction body;
|};

public type BankAccount record {|
    string bankName;
    string accountNumber;
    string accountName;
|};

public type BankAccountOk record {|
    *http:Ok;
    BankAccount body;
|};

public type PayoutStatus "pending"|"settled"|"failed";

public type Payout record {|
    string id;
    decimal amount;
    string currency;
    PayoutStatus status;
    string requestedAt?;
    string settledAt?;
|};

public type PayoutCreated record {|
    *http:Created;
    Payout body;
|};

public type Balance record {|
    decimal available;
    string currency;
|};

public type MerchantPage record {|
    int count;
    string? next;
    string? previous;
    Merchant[] data;
|};

public type PaymentRequestPage record {|
    int count;
    string? next;
    string? previous;
    PaymentRequest[] data;
|};

public type TransactionPage record {|
    int count;
    string? next;
    string? previous;
    Transaction[] data;
|};

public type PayoutPage record {|
    int count;
    string? next;
    string? previous;
    Payout[] data;
|};

// ---- Internal row shapes, as read back from Postgres ----

public type MerchantRow record {|
    string id;
    string businessName;
    string email;
    string? phone;
    string country;
    string currency;
    string createdAt;
|};

public type PaymentRequestRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string description;
    string status;
    string linkToken;
    string? expiresAt;
    string createdAt;
|};

public type PaymentLinkRow record {|
    string id;
    string merchantId;
    string merchantName;
    decimal amount;
    string currency;
    string description;
    string status;
    string? expiresAt;
|};

public type TransactionRow record {|
    string id;
    string paymentRequestId;
    string merchantId;
    string method;
    decimal amount;
    string currency;
    string status;
    string? providerReference;
    string? paidAt;
|};

public type BankAccountRow record {|
    string merchantId;
    string bankName;
    string accountNumber;
    string accountName;
|};

public type PayoutRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string status;
    string requestedAt;
    string? settledAt;
|};
