import {
  Assign,
  PunkTransfer,
  PunkBought,
} from '../generated/BinanceBunkMarket/BinanceBunkMarket';

import { log, Address } from '@graphprotocol/graph-ts';

import { BinanceBunk } from '../generated/schema';

let addressZero = Address.fromString(
  '0x0000000000000000000000000000000000000000'
);

export function handleAssign(event: Assign): void {
  log.warning('Assign Punk ID {} to {}', [
    event.params.punkIndex.toString(),
    event.params.to.toHex(),
  ]);

  let entity = new BinanceBunk(event.params.punkIndex.toString());
  entity.punkIndex = event.params.punkIndex;
  entity.punkHolder = event.params.to;
  entity.isBurned = false;
  entity.save();
}

export function handlePunkTransfer(event: PunkTransfer): void {
  log.warning('Transfer Punk ID {} from {} to {}', [
    event.params.punkIndex.toString(),
    event.params.from.toHex(),
    event.params.to.toHex(),
  ]);

  let entity = BinanceBunk.load(event.params.punkIndex.toString());

  if (entity == null) {
    entity = new BinanceBunk(event.params.punkIndex.toString());
  }

  entity.punkIndex = event.params.punkIndex;
  entity.punkHolder = event.params.to;

  if (
    event.params.to.toHex() ==
    Address.fromString('0x0000000000000000000000000000000000000000').toHex()
  ) {
    entity.isBurned = true;
    entity.punkHolder = event.params.from;
  } else {
    entity.isBurned = false;
  }

  entity.save();
}

export function handlePunkBought(event: PunkBought): void {
  log.warning('Buy Punk ID {} from {}', [
    event.params.punkIndex.toString(),
    event.params.fromAddress.toHex(),
    event.params.toAddress.toHex(),
  ]);

  let entity = BinanceBunk.load(event.params.punkIndex.toString());

  if (entity == null) {
    entity = new BinanceBunk(event.params.punkIndex.toString());
  }

  entity.punkIndex = event.params.punkIndex;
  entity.punkHolder = event.params.toAddress;

  if (
    event.params.toAddress.toHex() ==
    Address.fromString('0x0000000000000000000000000000000000000000').toHex()
  ) {
    entity.isBurned = true;
    entity.punkHolder = event.params.fromAddress;
  } else {
    entity.isBurned = false;
  }

  entity.save();
}
