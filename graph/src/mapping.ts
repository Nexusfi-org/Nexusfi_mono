import { near, JSONValue, TypedMap, BigInt, json } from "@graphprotocol/graph-ts"
import { Subcontract, Creator, AllocationTarget } from "../generated/schema"

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  
  // Early return if no actions
  if (actions.length == 0) return
  
  // Iterate through logs
  for (let logIndex = 0; logIndex < receipt.outcome.logs.length; logIndex++) {
    const outcomeLog = receipt.outcome.logs[logIndex];
    
    // Check if this is an EVENT_JSON log
    if (!outcomeLog.startsWith('EVENT_JSON:')) continue;
    
    // Parse the event JSON
    const eventJSON = outcomeLog.replace('EVENT_JSON:', '');
    const parsed = json.try_fromString(eventJSON);
    if (parsed.isError) continue;
    
    const eventData = parsed.value.toObject();
    
    // Only handle subcontract deployment events
    if (!eventData.get('subaccount_id')) continue;
    
    handleSubcontractDeployment(receipt, eventData);
  }
}

function handleSubcontractDeployment(receipt: near.ReceiptWithOutcome, eventData: TypedMap<string, JSONValue>): void {
  const subaccountId = eventData.get('subaccount_id')!.toString();
  const creatorId = eventData.get('creator')!.toString();
  const name = eventData.get('name')!.toString();
  
  // Load or create creator
  let creator = Creator.load(creatorId);
  if (!creator) {
    creator = new Creator(creatorId);
    creator.totalDeployments = 0;
  }
  creator.totalDeployments += 1;
  creator.save();
  
  // Create new subcontract
  const subcontract = new Subcontract(subaccountId);
  subcontract.name = name;
  subcontract.creator = creatorId;
  subcontract.deployedAt = BigInt.fromU64(receipt.block.header.timestampNanosec);
  subcontract.save();
  
  // Create allocation targets
  const targets = eventData.get('allocation_targets')!.toArray();
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i].toObject();
    const allocationTarget = new AllocationTarget(subaccountId + '-' + i.toString());
    allocationTarget.address = target.get('address')!.toString();
    allocationTarget.ratio = target.get('ratio')!.toBigInt().toI32();
    allocationTarget.subcontract = subaccountId;
    allocationTarget.save();
  }
}