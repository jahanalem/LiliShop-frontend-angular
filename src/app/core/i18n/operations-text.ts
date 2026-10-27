import { TranslationService } from './translation.service';



// Runtime catalog values win. Missing translations use honest English fallback, including in RTL.

export const operationsFallback: Record<string,string> = {

  Title:'Purchase operations', Intro:'Follow saved purchases, payment verification and order processing. These views show local records; opening them does not contact the payment provider.',

  checkouts:'Checkouts', inbox:'Payment inbox', processing:'Order processing', mail:'Invoice email', controls:'Controls', audit:'Activity history',

  CheckoutsIntro:'Saved purchase agreements, including checkouts without an order. Unverified does not mean payment failed.',

  InboxIntro:'Recorded payment receipts. Delivery, verification and order processing are separate facts.',

  ProcessingIntro:'Track purchased lines and invoice progress. Processing complete does not mean physically shipped.',

  MailIntro:'Find invoice email independently of processing state. Provider acceptance does not confirm inbox delivery.',

  AuditIntro:'Recorded control changes and recovery requests, including global worker changes. This is not a complete payment timeline.',

  GlobalScope:'All authorised records', FilterScope:'Matching current filters', Snapshot:'Snapshot', Refresh:'Refresh', Updated:'Last updated', UTC:'All times UTC',

  Search:'Search by identifier', SearchHint:'Use a checkout, attempt, processing, order or invoice ID where applicable. Inbox search accepts receipt or event IDs.',

  State:'State', ProcessingState:'Processing state', MailState:'Email state', Timing:'Work timing', Verification:'Verification', Mode:'Provider mode', Scope:'History scope',

  Sort:'Sort by', Direction:'Direction', created:'Created / received', expires:'Expiry', state:'State', updated:'Updated', attempts:'Attempts', revision:'Revision', asc:'Oldest / ascending', desc:'Newest / descending',

  All:'All', Due:'Due now', Scheduled:'Scheduled for later', LeaseExpired:'Claim expired', InProgress:'In progress', None:'No scheduled work',

  verified:'Verification recorded', unverified:'Unverified attempt', missing:'No attempt recorded', test:'Test mode', live:'Live mode',

  Preparing:'Preparing', Ready:'Ready for confirmation', PaymentVerified:'Payment verified', ReviewRequired:'Needs review', Review:'Needs review', Expired:'Expired', Cancelled:'Cancelled',

  Pending:'Pending', Processing:'Processing', Retry:'Retry scheduled', Completed:'Receipt completed', Ignored:'Ignored', Complete:'Processing complete', NotInitialized:'Awaiting processing record',

  Sending:'Sending', Accepted:'Provider accepted', UnknownDelivery:'Email outcome uncertain',

  Stage:'Stage', Inventory:'Inventory', Handoff:'Processing record', Line:'Saved line', Matched:'Matching evidence',

  Record:'Record', Context:'Status and context', Evidence:'Saved evidence', Time:'Recorded time', Details:'Open details', Order:'Order', Invoice:'Invoice', Checkout:'Checkout', Attempt:'Payment attempt',

  ProviderAmount:'Provider amount', MinorUnits:'minor units', Currency:'Saved currency', Unavailable:'Unavailable', NotRecorded:'Not recorded', Unresolved:'Unresolved', UnresolvedAssociation:'Unresolved association',

  MatchedSavedIdentity:'Matched saved identity', AssociationHelp:'A matched identity is not itself payment verification. Unmatched, malformed or conflicting receipts do not receive guessed purchase links.',

  ReceiptProof:'Verification recorded using this receipt', Yes:'Yes', No:'No', Reason:'Recorded reason', Event:'Provider event', EventType:'Event type', Version:'Event API version',

  Received:'Received', Expires:'Expires', Created:'Created', CompletedAt:'Completed', NextAttempt:'Stored next-attempt time', SendStarted:'Send started', AcceptedAt:'Provider accepted at',

  Attempts:'Total attempts', CycleAttempts:'Attempts in current cycle', Back:'Back to results', Copy:'Copy identifier', Copied:'Identifier copied', CopyFailed:'Copy unavailable',

  Loading:'Loading operational records...', Empty:'No records yet', NoMatches:'No matching records', EmptyHelp:'Records appear here after the corresponding workflow has saved them.',

  NoMatchesHelp:'Change or clear the filters to broaden the results.', Clear:'Clear filters', Forbidden:'You do not have permission to view these records.',

  MissingRecord:'This record is unavailable or does not exist.', Temporary:'Records are temporarily unavailable. Please refresh.', InvalidFilters:'Some filters are invalid. Clear them and try again.',

  ActionConflict:'The record changed or the action is no longer eligible. Refresh the current state before trying again.', ActionFailed:'The action was not applied. Check the current record and your permissions.',

  Payment:'Payment verification', VerifiedAt:'Verified at', NoOrder:'No order recorded', NoInvoice:'No invoice recorded', ProcessingBacklog:'Processing backlog', InboxBacklog:'Receipt backlog',

  CheckoutReviews:'Checkout reviews', InboxReviews:'Receipt reviews', ProcessingReviews:'Processing reviews', MailBacklog:'Email backlog', MailReviews:'Email reviews', MailUnknown:'Uncertain email outcomes',

  BacklogHelp:'Counts cover all authorised records, independent of the table filters. Backlog excludes review and terminal outcomes.',

  DueHelp:'Due means an eligible scheduled time has arrived; it is not a claim of a service outage. Future retries are shown separately.',

  SnapshotState:'Money snapshot', Captured:'Captured at purchase', RecoveredFromInvoice:'Recovered from invoice', UnresolvedMoney:'Historical money is unresolved. Missing totals are not replaced with current prices or zero.',

  Subtotal:'Saved subtotal', Shipping:'Saved shipping', Total:'Saved total', RecordedAt:'Snapshot recorded', EvidenceInvoice:'Snapshot invoice evidence', EvidenceUnavailable:'The recorded invoice reference cannot be confirmed as matching evidence.',

  Lines:'Purchased lines', Product:'Product', Variant:'Variant', SKU:'Saved SKU', Quantity:'Purchased quantity', UnitPrice:'Saved unit price', LineState:'Line progress', Done:'Completion recorded', Remaining:'No completion record', Conflict:'Conflicting completion evidence',

  Reservation:'Reservation reference', Deduction:'Stock deduction reference', StockHelp:'References are saved processing evidence. Use the product variant stock history to investigate inventory movements.',

  OpenProduct:'Open product and stock history', HistoricalLabel:'Historical handoff label', HistoricalHelp:'This immutable label records how work was created. Current processing state is shown separately.',

  PendingExecution:'No execution has been recorded. This read does not create one.', EmailAcceptedHelp:'The provider accepted the invoice email. Recipient delivery is not recorded by this application.',

  UnknownPolicy:'The message may already have been accepted. Automatic resend is disabled to avoid duplicates. Investigate this operation; use the invoice independently.',

  OperatorActions:'Guarded recovery actions', OperatorReason:'Reason for retry or worker change', RetryProcessing:'Retry processing', RetryEmail:'Retry known email failure',

  Worker:'Processing worker', Enable:'Enable worker', Disable:'Pause worker', Enabled:'Enabled', Disabled:'Disabled', Paused:'Paused', Open:'Open',

  ControlsHelp:'These are local recorded flags, not proof of provider, environment or production readiness. This view adds no checkout activation action.',

  CheckoutEnabled:'New checkout flow', StartsPaused:'Checkout admission paused', Revision:'Revision', ChangedBy:'Changed by', ChangedAt:'Recorded change',

  WorkerTimestampHelp:'The worker control has no change timestamp. Consult its recorded audit entries.', ManageWorker:'Open existing worker controls',

  Actor:'Operator', Action:'Recorded action', PreviousRevision:'Previous revision', CheckoutControlChanged:'Checkout control changed', EnableWorker:'Worker enabled', DisableWorker:'Worker disabled',

  RetryProcessingAction:'Processing retry requested', RetryEmailAction:'Email retry requested', checkout:'Checkout controls', fulfillment:'Processing and email',

  ContextUnavailable:'Summary or worker control could not be read. Refresh before using the related controls.', ReadOnly:'Read-only evidence', NoAssociation:'No validated purchase association', TotalLines:'Completion records / purchased lines', ViewHistory:'View recorded history',

};

export function operationsText(service: TranslationService, key: string): string {

  const full = `Operations.${key}`; const value = service.translate(full);

  return value === full ? operationsFallback[key] ?? key : value;

}

