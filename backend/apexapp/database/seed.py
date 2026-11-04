"""Generated seed data + a default admin user (capability 10)."""
import datetime, uuid

from .. import auth
from . import connection as db

SEED = { 'merchantapplication': [ { 'merchant_name': 'Harbor Light Books',
                             'business_type': 'Retail - Books & Media',
                             'country': 'United States',
                             'monthly_volume_estimate': 42000,
                             'documents_complete': True,
                             'kyc_result': 'pass',
                             'aml_result': 'pass',
                             'credit_result': 'pass',
                             'risk_tier': 'low',
                             'reasoning': 'Established 9-year business with verified ownership, '
                                          'clean sanctions screening and strong credit file. No '
                                          'adverse media found.',
                             'recommendation': 'Approve with standard terms',
                             'status': 'Approved',
                             'received_at': '2025-06-11T09:12:00Z'},
                           { 'merchant_name': 'Summit Peak Fitness',
                             'business_type': 'Fitness Studio (subscriptions)',
                             'country': 'United States',
                             'monthly_volume_estimate': 68000,
                             'documents_complete': True,
                             'kyc_result': 'pass',
                             'aml_result': 'pass',
                             'credit_result': 'pass',
                             'risk_tier': 'low',
                             'reasoning': 'All owners verified against government ID. No watchlist '
                                          'or sanctions hits. Credit score 742 with no recent '
                                          'delinquencies. Recurring billing model carries low '
                                          'chargeback history in this category.',
                             'recommendation': 'Approve with standard terms',
                             'status': 'Pending Review',
                             'received_at': '2025-06-12T07:48:00Z'},
                           { 'merchant_name': 'Blue Fern Coffee',
                             'business_type': 'Food & Beverage - Cafe & Online Roastery',
                             'country': 'Canada',
                             'monthly_volume_estimate': 31500,
                             'documents_complete': True,
                             'kyc_result': 'pass',
                             'aml_result': 'pass',
                             'credit_result': 'warn',
                             'risk_tier': 'medium',
                             'reasoning': 'Identity and AML checks are clean. Rated medium because '
                                          "the business is under 18 months old and the owner's "
                                          'credit file shows a recent late payment on a equipment '
                                          'loan. Online roastery adds card-not-present exposure.',
                             'recommendation': 'Approve with 10% reserve',
                             'status': 'Pending Review',
                             'received_at': '2025-06-12T08:05:00Z'},
                           { 'merchant_name': 'Orion Digital Goods Ltd',
                             'business_type': 'Digital Goods - Software Keys & Gift Cards',
                             'country': 'Cyprus',
                             'monthly_volume_estimate': 250000,
                             'documents_complete': True,
                             'kyc_result': 'warn',
                             'aml_result': 'fail',
                             'credit_result': 'fail',
                             'risk_tier': 'high',
                             'reasoning': 'Beneficial owner is linked to a company named in a '
                                          'regulatory warning. AML screening returned a partial '
                                          'match on a politically exposed person. Projected volume '
                                          'is 8x the stated business size and credit file shows '
                                          'two unpaid judgments.',
                             'recommendation': 'Reject',
                             'status': 'Pending Review',
                             'received_at': '2025-06-12T08:31:00Z'},
                           { 'merchant_name': 'Meridian Home Renovations',
                             'business_type': 'Construction - Home Improvement',
                             'country': 'United Kingdom',
                             'monthly_volume_estimate': 54000,
                             'documents_complete': False,
                             'kyc_result': 'warn',
                             'aml_result': 'pass',
                             'credit_result': 'pass',
                             'risk_tier': 'medium',
                             'reasoning': 'Checks that could run came back clean, but proof of '
                                          "business address and the second director's ID were not "
                                          'uploaded, so KYC is incomplete. Deposits taken in '
                                          'advance of work add moderate refund risk.',
                             'recommendation': 'Request more info: proof of business address and '
                                               'second director ID',
                             'status': 'Pending Review',
                             'received_at': '2025-06-12T09:02:00Z'},
                           { 'merchant_name': 'Nova Vape Supply',
                             'business_type': 'E-commerce - Vaping Products',
                             'country': 'United States',
                             'monthly_volume_estimate': 120000,
                             'documents_complete': True,
                             'kyc_result': 'pass',
                             'aml_result': 'warn',
                             'credit_result': 'fail',
                             'risk_tier': 'high',
                             'reasoning': 'Restricted product category with no evidence of '
                                          'required age-verification controls or state licences. '
                                          'Credit file shows heavy utilisation and a prior '
                                          'processor termination.',
                             'recommendation': 'Reject',
                             'status': 'Rejected',
                             'received_at': '2025-06-11T14:20:00Z'}],
  'reconexception': [ { 'transaction_id': 'TXN-8836',
                        'amount': 98.0,
                        'variance_amount': 98.0,
                        'currency': 'USD',
                        'source': 'ledger',
                        'reason_code': 'Missing record',
                        'processor_record': 'Capture TXN-8836 for $98.00 settled 2025-06-09',
                        'bank_record': 'Deposit of $98.00 received 2025-06-10 (batch '
                                       'BK-20250610-02)',
                        'ledger_record': 'No entry found',
                        'explanation': 'Processor and bank agree, but no ledger entry was created. '
                                       'The sync job logged a timeout for this transaction on '
                                       '2025-06-09.',
                        'proposed_fix': 'Post missing revenue entry of $98.00 to the sales account',
                        'status': 'Investigating',
                        'opened_at': '2025-06-09T22:10:00Z'},
                      { 'transaction_id': 'TXN-8837',
                        'amount': 760.25,
                        'variance_amount': 760.25,
                        'currency': 'USD',
                        'source': 'processor',
                        'reason_code': 'Timing difference',
                        'processor_record': 'Capture TXN-8837 for $760.25 on 2025-06-11 23:52 UTC',
                        'bank_record': 'Not yet received (expected in 2025-06-13 settlement)',
                        'ledger_record': 'Receivable of $760.25 booked 2025-06-11',
                        'explanation': 'Capture occurred just before the daily cut-off, so funds '
                                       'fall into the next settlement batch. Expected to match '
                                       'within 1 business day.',
                        'proposed_fix': 'Mark as timing difference and auto-match on next '
                                        'settlement',
                        'status': 'Open',
                        'opened_at': '2025-06-12T00:15:00Z'},
                      { 'transaction_id': 'TXN-8838',
                        'amount': 1320.0,
                        'variance_amount': 1320.0,
                        'currency': 'USD',
                        'source': 'bank',
                        'reason_code': 'Timing difference',
                        'processor_record': 'Settled $1,320.00 on 2025-06-10',
                        'bank_record': 'Deposit of $1,320.00 posted 2025-06-11',
                        'ledger_record': 'Cash entry of $1,320.00 dated 2025-06-10',
                        'explanation': 'Bank posted the deposit one day after the processor '
                                       'settlement date. Amounts are identical and the dates fall '
                                       'within the normal 1-day window.',
                        'proposed_fix': 'Match records and mark timing difference as resolved',
                        'status': 'Resolved',
                        'opened_at': '2025-06-11T01:05:00Z'},
                      { 'transaction_id': 'TXN-8839',
                        'amount': 425.0,
                        'variance_amount': 12.4,
                        'currency': 'USD',
                        'source': 'processor',
                        'reason_code': 'Fee mismatch',
                        'processor_record': 'Gross $425.00, fee $24.80, net $400.20',
                        'bank_record': 'Deposit net $400.20',
                        'ledger_record': 'Gross $425.00, fee $12.40, net $412.60',
                        'explanation': 'Processor charged $24.80 in fees because an international '
                                       'card surcharge was applied. The ledger booked only the '
                                       'standard fee of $12.40, leaving a $12.40 gap against the '
                                       'bank deposit.',
                        'proposed_fix': 'Post adjustment entry of $12.40 to the fees account',
                        'status': 'Open',
                        'opened_at': '2025-06-11T20:40:00Z'},
                      { 'transaction_id': 'TXN-8840',
                        'amount': 86.5,
                        'variance_amount': 86.5,
                        'currency': 'USD',
                        'source': 'processor',
                        'reason_code': 'Duplicate',
                        'processor_record': 'Two captures of $86.50 for order ORD-55120, 41 '
                                            'seconds apart',
                        'bank_record': 'Two deposits of $86.50 received (included in batch '
                                       'BK-20250612-01)',
                        'ledger_record': 'One sale entry of $86.50 for order ORD-55120',
                        'explanation': 'The customer was charged twice for the same order, likely '
                                       'from a double-click on the pay button. The second capture '
                                       'has no matching sale in the ledger.',
                        'proposed_fix': 'Refund duplicate charge of $86.50 and book it against the '
                                        'refunds account',
                        'status': 'Open',
                        'opened_at': '2025-06-12T06:30:00Z'},
                      { 'transaction_id': 'TXN-8841',
                        'amount': 249.0,
                        'variance_amount': 249.0,
                        'currency': 'USD',
                        'source': 'bank',
                        'reason_code': 'Missing record',
                        'processor_record': 'Settled $249.00 on 2025-06-10',
                        'bank_record': 'No matching deposit found within 3 business days',
                        'ledger_record': 'Cash entry of $249.00 booked 2025-06-10',
                        'explanation': 'The processor shows funds as settled and the ledger booked '
                                       'cash, but the bank statement has no matching deposit. The '
                                       'settlement may have been combined into a different batch '
                                       'or delayed by the bank.',
                        'proposed_fix': 'Flag for investigation and request a settlement trace '
                                        'from the processor',
                        'status': 'Open',
                        'opened_at': '2025-06-10T21:55:00Z'}],
  'flaggedtransaction': [ { 'transaction_id': 'TXN-5521',
                            'merchant_name': 'Vela Gift Cards',
                            'amount': 3200.0,
                            'currency': 'USD',
                            'risk_score': 93,
                            'signals': 'Velocity spike (6 gift card purchases in 9 minutes); '
                                       'High-risk product category; Card issued in a different '
                                       'country than the shipping address',
                            'customer_history': 'Account created 2 days ago. No prior successful '
                                                'orders. 3 previous cards declined in the last '
                                                'hour.',
                            'verdict': 'Hold',
                            'confidence': 0.9,
                            'status': 'Held',
                            'flagged_at': '2025-06-12T03:14:00Z'},
                          { 'transaction_id': 'TXN-5524',
                            'merchant_name': 'Bayside Pet Supply',
                            'amount': 189.99,
                            'currency': 'USD',
                            'risk_score': 52,
                            'signals': 'Order value 3x customer average; New shipping address',
                            'customer_history': 'Customer for 4 years, 31 prior orders, no '
                                                'chargebacks. Recently moved, which explains the '
                                                'new address.',
                            'verdict': 'Clear',
                            'confidence': 0.86,
                            'status': 'Cleared',
                            'flagged_at': '2025-06-12T05:02:00Z'},
                          { 'transaction_id': 'TXN-5526',
                            'merchant_name': 'Pine & Pearl Jewelers',
                            'amount': 1840.0,
                            'currency': 'USD',
                            'risk_score': 58,
                            'signals': 'Mismatched geo (purchase from Lisbon, billing address in '
                                       'Denver); High-value item',
                            'customer_history': 'Returning customer for 2 years with 9 prior '
                                                'orders. Travel notice was filed with the card '
                                                'issuer last week.',
                            'verdict': 'Clear',
                            'confidence': 0.74,
                            'status': 'Open',
                            'flagged_at': '2025-06-12T08:20:00Z'},
                          { 'transaction_id': 'TXN-5527',
                            'merchant_name': 'Kestrel Electronics',
                            'amount': 960.0,
                            'currency': 'USD',
                            'risk_score': 77,
                            'signals': 'New device; Shipping to freight forwarder address; Second '
                                       'flagged transaction for this merchant today',
                            'customer_history': 'Guest checkout with no history. Email address '
                                                'created 5 hours ago.',
                            'verdict': 'Hold',
                            'confidence': 0.79,
                            'status': 'Open',
                            'flagged_at': '2025-06-12T09:41:00Z'},
                          { 'transaction_id': 'TXN-5529',
                            'merchant_name': 'Vela Gift Cards',
                            'amount': 1150.0,
                            'currency': 'USD',
                            'risk_score': 84,
                            'signals': 'Velocity spike (4 purchases in 12 minutes from one IP); '
                                       'Repeated flags for this merchant; Mismatched geo',
                            'customer_history': 'Account created yesterday. One prior order, which '
                                                'was refunded after a dispute.',
                            'verdict': 'Hold',
                            'confidence': 0.81,
                            'status': 'Open',
                            'flagged_at': '2025-06-12T10:05:00Z'},
                          { 'transaction_id': 'TXN-5530',
                            'merchant_name': 'Kestrel Electronics',
                            'amount': 2480.0,
                            'currency': 'USD',
                            'risk_score': 91,
                            'signals': 'Velocity spike (8 transactions in 6 minutes); New device; '
                                       'Mismatched geo (IP in Vietnam, billing in Ohio); Card '
                                       'tested with small amounts first',
                            'customer_history': 'No history. Same card used on 3 other merchants '
                                                'in the last hour, per network intelligence feed.',
                            'verdict': 'Escalate',
                            'confidence': 0.88,
                            'status': 'Open',
                            'flagged_at': '2025-06-12T10:22:00Z'}],
  'decision': [ { 'agent': 'Onboarding',
                  'item_type': 'MerchantApplication',
                  'item_id': 'APP-1040',
                  'action': 'Approve',
                  'reason': 'All checks passed; standard terms applied.',
                  'decided_by': 'Priya Nair',
                  'decided_at': '2025-06-11T11:30:00Z'},
                { 'agent': 'Onboarding',
                  'item_type': 'MerchantApplication',
                  'item_id': 'APP-1046',
                  'action': 'Reject',
                  'reason': 'Restricted category without age-verification controls or state '
                            'licences; prior processor termination.',
                  'decided_by': 'Priya Nair',
                  'decided_at': '2025-06-11T16:05:00Z'},
                { 'agent': 'Reconciliation',
                  'item_type': 'ReconException',
                  'item_id': 'EXC-8838',
                  'action': 'Approve adjustment',
                  'reason': 'Bank posted one day after settlement; amounts identical. Matched as '
                            'timing difference.',
                  'decided_by': 'Marcus Lee',
                  'decided_at': '2025-06-11T09:15:00Z'},
                { 'agent': 'Fraud',
                  'item_type': 'FlaggedTransaction',
                  'item_id': 'FLG-5524',
                  'action': 'Clear',
                  'reason': 'Long-standing customer who recently moved; false positive.',
                  'decided_by': 'Dana Whitfield',
                  'decided_at': '2025-06-12T05:40:00Z'},
                { 'agent': 'Fraud',
                  'item_type': 'FlaggedTransaction',
                  'item_id': 'FLG-5521',
                  'action': 'Hold transaction',
                  'reason': 'Classic gift card velocity pattern on a brand-new account; holding '
                            'pending case review.',
                  'decided_by': 'Dana Whitfield',
                  'decided_at': '2025-06-12T03:30:00Z'},
                { 'agent': 'Reconciliation',
                  'item_type': 'ReconException',
                  'item_id': 'EXC-8836',
                  'action': 'Flag for investigation',
                  'reason': 'Ledger sync timeout suspected; engineering to confirm before posting '
                            'a manual entry.',
                  'decided_by': 'Marcus Lee',
                  'decided_at': '2025-06-10T08:50:00Z'}],
  'chatmessage': [ {'agent': 'Onboarding', 'role': 'user', 'content': 'Review application #1042'},
                   { 'agent': 'Onboarding',
                     'role': 'agent',
                     'content': 'Summit Peak Fitness (#1042) passed KYC, AML and credit checks and '
                                'is low risk. I recommend approving with standard terms. Open in '
                                'review card.',
                     'linked_item_id': 'APP-1042'},
                   { 'agent': 'Reconciliation',
                     'role': 'user',
                     'content': 'Why is transaction 8841 unmatched?'},
                   { 'agent': 'Reconciliation',
                     'role': 'agent',
                     'content': 'TXN-8841 ($249.00) was settled by the processor and booked in the '
                                'ledger, but no matching bank deposit exists after 3 business '
                                'days. I suggest flagging it for a settlement trace. Open in '
                                'review card.',
                     'linked_item_id': 'EXC-8841'},
                   {'agent': 'Fraud', 'role': 'user', 'content': 'Review flagged transaction 5530'},
                   { 'agent': 'Fraud',
                     'role': 'agent',
                     'content': 'TXN-5530 scored 91/100: 8 transactions in 6 minutes, a new device '
                                'and a mismatched location. I recommend escalating to a case (88% '
                                'confidence). Open in review card.',
                     'linked_item_id': 'FLG-5530'}],
  'activitylogentry': [ { 'agent': 'Onboarding',
                          'timestamp': '2025-06-12T09:08:00Z',
                          'actor': 'Onboarding Agent',
                          'actor_type': 'Agent',
                          'action': 'verify_kyc',
                          'target': 'APP-1042'},
                        { 'agent': 'Onboarding',
                          'timestamp': '2025-06-11T11:30:00Z',
                          'actor': 'Priya Nair',
                          'actor_type': 'Human',
                          'action': 'Approved application',
                          'target': 'APP-1040',
                          'decision_id': 'DEC-9001'},
                        { 'agent': 'Reconciliation',
                          'timestamp': '2025-06-12T09:17:00Z',
                          'actor': 'Reconciliation Agent',
                          'actor_type': 'Agent',
                          'action': 'get_transaction',
                          'target': 'EXC-8841'},
                        { 'agent': 'Reconciliation',
                          'timestamp': '2025-06-11T09:15:00Z',
                          'actor': 'Marcus Lee',
                          'actor_type': 'Human',
                          'action': 'Approved adjustment',
                          'target': 'EXC-8838',
                          'decision_id': 'DEC-9003'},
                        { 'agent': 'Fraud',
                          'timestamp': '2025-06-12T10:29:00Z',
                          'actor': 'Fraud Agent',
                          'actor_type': 'Agent',
                          'action': 'score_transaction',
                          'target': 'FLG-5530'},
                        { 'agent': 'Fraud',
                          'timestamp': '2025-06-12T03:30:00Z',
                          'actor': 'Dana Whitfield',
                          'actor_type': 'Human',
                          'action': 'Held transaction',
                          'target': 'FLG-5521',
                          'decision_id': 'DEC-9005'}]}

DEFAULT_USERS = [{"email": "admin@demo.app", "password": "admin", "role": "admin"}]


def run_seed():
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with db._lock, db.connect() as conn:
        if conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"] == 0:
            for u in DEFAULT_USERS:
                conn.execute(
                    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?,?,?,?,?)",
                    (uuid.uuid4().hex, u["email"], auth.hash_password(u["password"]), u["role"], now),
                )
        for table, rows in SEED.items():
            if conn.execute('SELECT COUNT(*) AS n FROM "%s"' % table).fetchone()["n"] > 0:
                continue
            for row in rows:
                cols = list(row.keys())
                keys = ["id", "created_at"] + cols
                ph = ", ".join("?" for _ in keys)
                colsql = ", ".join('"%s"' % k for k in keys)
                conn.execute(
                    'INSERT INTO "%s" (%s) VALUES (%s)' % (table, colsql, ph),
                    [uuid.uuid4().hex, now] + [row[c] for c in cols],
                )
