# Domain Model

The platform tracks merchants, the payment requests they issue, the
transactions those requests settle into, and the payouts that move a
merchant's balance to their bank account.

```mermaid
erDiagram
    MERCHANT ||--o{ PAYMENT_REQUEST : creates
    MERCHANT ||--o| BANK_ACCOUNT : configures
    MERCHANT ||--o{ PAYOUT : requests
    PAYMENT_REQUEST ||--o| TRANSACTION : settles_into
    TRANSACTION ||--o{ REFUND : refunded_by

    MERCHANT {
        string id
        string businessName
        string email
        string phone
        string country
        string currency
        datetime createdAt
    }
    PAYMENT_REQUEST {
        string id
        string merchantId
        decimal amount
        string currency
        string description
        string status
        string linkToken
        datetime expiresAt
        datetime createdAt
    }
    TRANSACTION {
        string id
        string paymentRequestId
        string method
        decimal amount
        string currency
        string status
        string providerReference
        datetime paidAt
    }
    REFUND {
        string id
        string transactionId
        decimal amount
        string status
        datetime createdAt
    }
    BANK_ACCOUNT {
        string id
        string merchantId
        string bankName
        string accountNumber
        string accountName
    }
    PAYOUT {
        string id
        string merchantId
        decimal amount
        string currency
        string status
        datetime requestedAt
        datetime settledAt
    }
```

- **PAYMENT\_REQUEST** is what a merchant creates and shares as a link
(`linkToken`); it moves through `pending → paid/failed/expired`.
- **TRANSACTION** is the actual mobile-money or card charge a customer makes
against a payment request, processed by the internal payments API.
- **PAYOUT** moves a merchant's settled balance to their `BANK_ACCOUNT`, and is
always merchant-triggered.
- A **REFUND** reverses a completed transaction, at the merchant's request.

