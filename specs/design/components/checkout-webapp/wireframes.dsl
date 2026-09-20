screen PaymentDetails "A customer opens a merchant's payment link and sees what they owe"
  navbar "Pay"
  card "Acme Traders" 
  heading "NGN 8,500"
  text "Order #1042 — 2 ceramic mugs"
  row
    right
    button "Pay now" primary -> PayMethod

screen PayMethod "The customer chooses mobile money or card and pays"
  navbar "Pay"
  heading "NGN 8,500 to Acme Traders"
  tabs "Mobile Money | Card"
  input "Phone number"
  row
    right
    button "Cancel" -> PaymentDetails
    button "Pay NGN 8,500" primary -> PaymentResult

screen PaymentResult "The outcome of the payment attempt"
  navbar "Pay"
  badge "Payment successful" success
  heading "NGN 8,500 paid to Acme Traders"
  text "A confirmation has been sent to you by SMS and email."

flow "Pay a merchant"
  description "A customer opens a payment link and pays as a guest"
  PaymentDetails
  PayMethod
  PaymentResult
