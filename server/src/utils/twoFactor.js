const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const ISSUER = "Mr Book Worm";
const RECOVERY_CODE_COUNT = 8;

function generateSecret(email) {
  const { base32, otpauth_url: otpauthUrl } = speakeasy.generateSecret({
    name: `${ISSUER} (${email})`,
    issuer: ISSUER,
    length: 20,
  });
  return { secret: base32, otpauthUrl };
}

async function buildSetupPayload(secret, otpauthUrl) {
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, otpauthUrl, qrCodeDataUrl };
}

function verifyToken(token, secret) {
  if (!token || !secret) return false;
  return speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 });
}

// Recovery codes are shown to the user exactly once at generation time —
// only their bcrypt hashes are persisted, same treatment as a password,
// since each one is a full authentication bypass if leaked.
async function generateRecoveryCodes() {
  const plainCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    crypto.randomBytes(5).toString("hex")
  );
  const hashedCodes = await Promise.all(plainCodes.map((code) => bcrypt.hash(code, 10)));
  return { plainCodes, hashedCodes };
}

async function consumeRecoveryCode(inputCode, hashedCodesJson) {
  const hashedCodes = JSON.parse(hashedCodesJson || "[]");
  for (let i = 0; i < hashedCodes.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(inputCode, hashedCodes[i])) {
      hashedCodes.splice(i, 1);
      return { valid: true, remaining: JSON.stringify(hashedCodes) };
    }
  }
  return { valid: false, remaining: hashedCodesJson };
}

module.exports = {
  generateSecret,
  buildSetupPayload,
  verifyToken,
  generateRecoveryCodes,
  consumeRecoveryCode,
};
