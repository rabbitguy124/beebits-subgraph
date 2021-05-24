import { log, Address, BigInt } from '@graphprotocol/graph-ts';
import {
  Mint,
  BeebitBought,
  BeebitListed,
  BeebitDelisted,
  BeebitBidPlaced,
  BeebitBidWithdrawn,
  Beebits,
} from '../generated/Beebits/Beebits';
import {
  Beebit,
  TransactionHistory,
  BinanceBunk,
  Listing,
  Bid,
} from '../generated/schema';

let zeroAddress = Address.fromString(
  '0x0000000000000000000000000000000000000000'
);

export function handleBeebitMint(event: Mint): void {
  log.warning('Beebit Minted of Token ID {} for {}', [
    event.params.index.toString(),
    event.params.minter.toHex(),
  ]);

  let bunkIndex = event.params.createdVia.minus(BigInt.fromI32(1));

  let beebit = new Beebit(event.params.index.toString());
  let transactionHistory = new TransactionHistory(
    event.transaction.hash.toHex()
  );

  transactionHistory.txHash = event.transaction.hash;
  transactionHistory.from = zeroAddress;

  transactionHistory.to = event.params.minter;
  transactionHistory.claimedAt = event.block.timestamp;

  transactionHistory.save();

  beebit.holder = event.params.minter;
  beebit.tokenId = event.params.index;
  beebit.bunkIndex = bunkIndex;
  beebit.mintedAt = event.block.timestamp;
  beebit.metadata =
    'https://beebits.xyz/beebits/' + event.params.index.toString();

  beebit.transactionHistory = [];
  let transactionHistories = beebit.transactionHistory;
  transactionHistories.push(transactionHistory.id);
  beebit.transactionHistory = transactionHistories;
  beebit.save();

  let bunk = BinanceBunk.load(bunkIndex.toString());
  bunk.isBeebitClaimed = true;

  bunk.save();
}

export function handleBeebitBought(event: BeebitBought): void {
  log.warning('Beebit of id {} bought from {} to {}', [
    event.params.tokenId.toString(),
    event.params.seller.toHex(),
    event.params.buyer.toHex(),
  ]);

  let beebitId = event.params.tokenId.toString();

  let beebit = Beebit.load(beebitId);
  if (beebit == null) {
    beebit = new Beebit(beebitId);
  }

  if (event.params.isBoughtFromBid) {
    let bid = Bid.load(
      event.params.tokenId.toString() + '-' + event.params.tokenId.toString()
    );
    if (bid != null) {
      bid.isBidding = false;
      bid.listing = null;
      bid.beebit = null;
      bid.bidder = zeroAddress;
      bid.bidValue = BigInt.fromI32(0);

      bid.save();
    }
  }

  beebit.holder = event.params.buyer;

  let transactionHistory = new TransactionHistory(
    event.transaction.hash.toHex()
  );

  transactionHistory.txHash = event.transaction.hash;
  transactionHistory.from = event.params.seller;
  transactionHistory.to = event.params.buyer;
  transactionHistory.claimedAt = event.block.timestamp;
  transactionHistory.save();

  let transactionHistories = beebit.transactionHistory;
  transactionHistories.push(transactionHistory.id);
  beebit.transactionHistory = transactionHistories;

  beebit.save();
}

export function handleBeebitListing(event: BeebitListed): void {
  log.warning('Listing asked by {} for beebit {}', [
    event.params.seller.toHex(),
    event.params.tokenId.toString(),
  ]);

  let listingId = event.params.tokenId.toString();
  let listing = new Listing(listingId);
  listing.seller = event.params.seller;
  listing.beebit = event.params.tokenId.toString();
  listing.createdAt = event.block.timestamp;
  listing.sellingPrice = event.params.askingPrice;
  listing.isSelling = true;

  listing.save();
}

export function handleBeebitDeListing(event: BeebitDelisted): void {
  log.warning('Delisting asked by {} for beebit {}', [
    event.transaction.from.toHex(),
    event.params.tokenId.toString(),
  ]);

  let beebitsContract = Beebits.bind(event.address);
  let listing = Listing.load(event.params.tokenId.toString());
  listing.seller = beebitsContract.beebitsListings(event.params.tokenId).value2;
  listing.isSelling = false;
  listing.sellingPrice = BigInt.fromI32(0);

  let isBidding = beebitsContract.beebitsBids(event.params.tokenId).value0;

  if (!isBidding) {
    log.warning('Removing bid for listing', []);
    listing.bid = null;
  }

  listing.save();
}

export function handleBeebitBid(event: BeebitBidPlaced): void {
  let listing = Listing.load(event.params.tokenId.toString());
  let bidId =
    event.params.tokenId.toString() + '-' + event.params.tokenId.toString();

  let bid = Bid.load(bidId);
  if (bid == null) {
    bid = new Bid(bidId);
  }
  bid.beebit = event.params.tokenId.toString();
  bid.listing = listing.id;
  bid.isBidding = true;
  bid.bidder = event.transaction.from;
  bid.bidValue = event.params.bidValue;

  bid.save();
  listing.save();
}

export function handleBeebitBidWithdraw(event: BeebitBidWithdrawn): void {
  let bid = Bid.load(
    event.params.tokenId.toString() + '-' + event.params.tokenId.toString()
  );

  if (bid != null) {
    bid.isBidding = false;
    bid.bidder = zeroAddress;
    bid.bidValue = BigInt.fromI32(0);
    bid.listing = null;
    bid.beebit = null;

    bid.save();
  }
}
