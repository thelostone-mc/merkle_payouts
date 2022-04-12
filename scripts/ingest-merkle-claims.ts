import axios from "axios";
import APIClient from "../utils/api-client";
import fs from "fs";
import path from "path";
import { confirmContinue } from "../utils/scripts-utils";

async function main() {
  const apiBaseURL = process.env.API_BASE_URL + '/grants/v1/api/ingest_merkle_claim_to_clr_match';
  const apiToken = process.env.TOKEN;
  const grantPayoutPk = process.env.GRANT_PAYOUT_PK;

  const rawData = fs.readFileSync(path.join(__dirname, "./output.json"));
  const claims = JSON.parse(rawData.toString());

  await confirmContinue({
    url: apiBaseURL,
    token: apiToken,
    grantPayoutPk: grantPayoutPk,
    claimsCount: claims.length,
  });

  const c = new APIClient(axios, apiBaseURL!, apiToken!);
  const resp = await c.ingestMerkleClaims({
    grant_payout_pk: grantPayoutPk,
    claims,
  });

  console.log(resp);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
