screen MerchantDashboard "A merchant's home: recent payment requests and balance"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings"
  row
    card "Available balance | NGN 128,400 | across all currencies"
    card "Pending requests | 6 | awaiting payment"
    card "Paid today | 12 | transactions"
  row
    heading "Recent payment requests"
    right
    button "New payment request" primary -> CreatePaymentRequest
  table "Description | Amount | Status | Created"
    row "Order #1042 | NGN 8,500 | Paid | 2h ago"
    row "Order #1041 | KES 2,200 | Pending | 5h ago"
    row "Order #1040 | ZAR 450 | Expired | 1d ago"

screen CreatePaymentRequest "A merchant creates a new payment request to share"
  navbar "Merchant Payments"
  heading "New payment request"
  input "Amount"
  select "Currency (NGN, KES, ZAR)"
  textarea "Description"
  row
    right
    button "Cancel" -> MerchantDashboard
    button "Create request" primary -> PaymentRequestDetail

screen PaymentRequestDetail "The shareable link and live status of one payment request"
  navbar "Merchant Payments"
  heading "Order #1042"
  card "Status | Pending"
  text "Shareable link"
  input "https://pay.example.com/l/ab12cd"
  row
    button "Copy link"
    button "Send via SMS"
    button "Send via Email"
  row
    right
    button "Back to dashboard" -> MerchantDashboard

screen PaymentRequestsList "Every payment request the merchant has created"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings"
  row
    heading "Payment requests"
    right
    search "Search by description"
    select "Status: All"
    button "New payment request" primary -> CreatePaymentRequest
  table "Description | Amount | Status | Created | " -> PaymentRequestDetail
    row "Order #1042 | NGN 8,500 | Paid | 2h ago |"
    row "Order #1041 | KES 2,200 | Pending | 5h ago |"

screen TransactionsList "Every transaction that has settled against the merchant's payment requests"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings"
  heading "Transactions"
  table "Order | Method | Amount | Status | Paid at | " -> TransactionDetail
    row "Order #1042 | Card | NGN 8,500 | Succeeded | 2h ago |"
    row "Order #1039 | Mobile Money | KES 900 | Succeeded | 1d ago |"

screen TransactionDetail "One transaction, with the option to refund it"
  navbar "Merchant Payments"
  heading "Transaction for Order #1042"
  card "Amount | NGN 8,500"
  card "Status | Succeeded"
  text "Provider reference: pv-9928172"
  row
    right
    button "Refund" danger -> RefundConfirm

screen RefundConfirm "Confirming a refund of a completed transaction"
  navbar "Merchant Payments"
  heading "Refund this transaction?"
  text "NGN 8,500 will be refunded to the customer. This cannot be undone."
  row
    right
    button "Cancel" -> TransactionDetail
    button "Confirm refund" danger -> TransactionsList

screen BankAccountSettings "The merchant's payout bank account"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings | Business Profile -> MerchantProfileSettings"
  heading "Payout bank account"
  input "Bank name"
  input "Account number"
  input "Account name"
  row
    right
    button "Save" primary

screen MerchantProfileSettings "The merchant's own business profile"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings | Business Profile -> MerchantProfileSettings"
  heading "Business profile"
  input "Business name"
  input "Email"
  input "Phone"
  select "Country (Nigeria, Kenya, South Africa)"
  row
    right
    button "Save" primary

screen PayoutsHome "The merchant's balance and payout history, with a way to cash out"
  navbar "Merchant Payments"
  sidebar "Dashboard -> MerchantDashboard | Payment Requests -> PaymentRequestsList | Transactions -> TransactionsList | Payouts -> PayoutsHome | Bank Account -> BankAccountSettings"
  row
    card "Available balance | NGN 128,400"
    right
    button "Trigger payout" primary -> PayoutConfirm
  heading "Payout history"
  table "Amount | Status | Requested | Settled"
    row "NGN 50,000 | Settled | 3d ago | 2d ago"
    row "NGN 20,000 | Pending | 6h ago | -"

screen PayoutConfirm "Confirming a payout of the available balance"
  navbar "Merchant Payments"
  heading "Pay out NGN 128,400?"
  text "This will be transferred to your configured bank account."
  row
    right
    button "Cancel" -> PayoutsHome
    button "Confirm payout" primary -> PayoutsHome

screen AdminMerchantsList "Every merchant registered on the platform"
  navbar "Merchant Payments"
  sidebar "Merchants -> AdminMerchantsList | All Transactions -> AdminTransactionsList | All Payouts -> AdminPayoutsList"
  row
    heading "Merchants"
    right
    search "Search by business name"
  table "Business | Country | Currency | Joined | " -> AdminMerchantDetail
    row "Acme Traders | NG | NGN | 2 months ago |"
    row "Nairobi Foods | KE | KES | 1 month ago |"

screen AdminMerchantDetail "One merchant's profile and recent activity, for admin monitoring"
  navbar "Merchant Payments"
  heading "Acme Traders"
  card "Country | Nigeria"
  card "Currency | NGN"
  heading "Recent transactions"
  table "Order | Amount | Status | Paid at"
    row "Order #1042 | NGN 8,500 | Succeeded | 2h ago"

screen AdminTransactionsList "Every transaction on the platform, for admin monitoring"
  navbar "Merchant Payments"
  sidebar "Merchants -> AdminMerchantsList | All Transactions -> AdminTransactionsList | All Payouts -> AdminPayoutsList"
  heading "All transactions"
  table "Merchant | Order | Amount | Status | Paid at"
    row "Acme Traders | Order #1042 | NGN 8,500 | Succeeded | 2h ago"
    row "Nairobi Foods | Order #900 | KES 1,200 | Succeeded | 1d ago"

screen AdminPayoutsList "Every payout on the platform, for admin monitoring"
  navbar "Merchant Payments"
  sidebar "Merchants -> AdminMerchantsList | All Transactions -> AdminTransactionsList | All Payouts -> AdminPayoutsList"
  heading "All payouts"
  table "Merchant | Amount | Status | Requested | Settled"
    row "Acme Traders | NGN 50,000 | Settled | 3d ago | 2d ago"
    row "Nairobi Foods | KES 20,000 | Pending | 6h ago | -"

flow "Collect and manage payments"
  role "Merchant"
  description "A merchant creates payment requests, tracks transactions, and cashes out"
  MerchantDashboard
  CreatePaymentRequest
  PaymentRequestDetail
  PaymentRequestsList
  TransactionsList
  TransactionDetail
  RefundConfirm
  BankAccountSettings
  MerchantProfileSettings
  PayoutsHome
  PayoutConfirm

flow "Monitor the platform"
  role "Platform Admin"
  description "An admin reviews every merchant and their transaction and payout activity"
  AdminMerchantsList
  AdminMerchantDetail
  AdminTransactionsList
  AdminPayoutsList
