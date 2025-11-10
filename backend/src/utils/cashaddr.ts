import bs58check from 'bs58check';
import config from '../config';

const cashaddr = require('cashaddrjs');

type CashaddrType = 'P2PKH' | 'P2SH';

function getCashaddrPrefix(): string {
  return config.MEMPOOL.NETWORK === 'bitcoincashtestnet' ? 'bchtest' : 'bitcoincash';
}

function decodeCashaddr(address: string): { prefix: string, type: CashaddrType, hash: Uint8Array } | null {
  try {
    const prefix = getCashaddrPrefix();
    const normalized = address.includes(':') ? address : `${prefix}:${address}`;
    const decoded = cashaddr.decode(normalized);
    if (decoded && decoded.hash) {
      return {
        prefix: decoded.prefix,
        type: decoded.type,
        hash: decoded.hash,
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getTypeFromVersion(version: number): CashaddrType | null {
  switch (version) {
    case 0x00:
    case 0x6f:
      return 'P2PKH';
    case 0x05:
    case 0xc4:
      return 'P2SH';
    default:
      return null;
  }
}

function getLegacyVersion(type: CashaddrType): number | null {
  const isTestnet = config.MEMPOOL.NETWORK === 'bitcoincashtestnet';
  if (type === 'P2PKH') {
    return isTestnet ? 0x6f : 0x00;
  }
  if (type === 'P2SH') {
    return isTestnet ? 0xc4 : 0x05;
  }
  return null;
}

function toUint8Array(data: Buffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array && !(data instanceof Buffer)) {
    return data;
  }
  return new Uint8Array(data);
}

export function toCashAddress(address?: string | null): string | undefined {
  if (!address) {
    return undefined;
  }

  const normalized = address.trim();
  const prefix = getCashaddrPrefix();

  const decoded = decodeCashaddr(normalized);
  if (decoded) {
    try {
      const encoded = cashaddr.encode(prefix, decoded.type, decoded.hash).toLowerCase();
      return encoded.includes(':') ? encoded.split(':')[1] : encoded;
    } catch (e) {
      return normalized.toLowerCase();
    }
  }

  try {
    const payload = bs58check.decode(normalized);
    const version = payload[0];
    const type = getTypeFromVersion(version);
    if (!type) {
      return normalized;
    }
    const hash = toUint8Array(payload.slice(1));
      const encoded = cashaddr.encode(prefix, type, hash).toLowerCase();
      return encoded.includes(':') ? encoded.split(':')[1] : encoded;
  } catch (e) {
    return normalized;
  }
}

export function toLegacyAddress(address: string): string | null {
  const normalized = address.trim();

  // Already base58 legacy address
  try {
    bs58check.decode(normalized);
    return normalized;
  } catch (e) {
    // continue
  }

  const decoded = decodeCashaddr(normalized);
  if (!decoded) {
    return null;
  }

  const type = decoded.type;
  const version = getLegacyVersion(type);
  if (version === null) {
    return null;
  }

  const payload = Buffer.concat([Buffer.from([version]), Buffer.from(decoded.hash)]);
  return bs58check.encode(payload);
}

export function normalizePrefix(address: string): string {
  const decoded = decodeCashaddr(address);
  if (!decoded) {
    return address;
  }
  const encoded = cashaddr.encode(getCashaddrPrefix(), decoded.type, decoded.hash).toLowerCase();
  return encoded.includes(':') ? encoded.split(':')[1] : encoded;
}

export function isCashAddress(address: string): boolean {
  return decodeCashaddr(address) !== null;
}

